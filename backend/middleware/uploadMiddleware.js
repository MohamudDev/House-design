const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Uploaded files need to live somewhere that survives every backend redeploy.
// We support a few permanent cloud options (checked in this order) and fall
// back to the local disk only for local development:
//   1. Supabase Storage — free tier, no credit card required at all.
//   2. Firebase Storage (Google) — now requires the paid Blaze plan.
//   3. Cloudinary — free tier, but sign-up is blocked in some countries.
const supabaseConfigured = Boolean(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_KEY
);

const firebaseConfigured = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_STORAGE_BUCKET
);

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const VIDEO_EXTS = ['mp4', 'webm', 'mov'];

let storage;
let activeBackend = 'local-disk';

if (supabaseConfigured) {
  activeBackend = 'supabase';
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const bucketName = process.env.SUPABASE_BUCKET || 'house-design';

  // Minimal multer StorageEngine that buffers the incoming file and uploads
  // it to a Supabase Storage bucket, then resolves the bucket's public URL.
  class SupabaseStorageEngine {
    _handleFile(req, file, cb) {
      const chunks = [];
      file.stream.on('data', (chunk) => chunks.push(chunk));
      file.stream.on('error', (err) => cb(err));
      file.stream.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const ext = path.extname(file.originalname);
          const destPath = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

          const { error } = await supabase.storage.from(bucketName).upload(destPath, buffer, {
            contentType: file.mimetype,
            upsert: false,
          });
          if (error) return cb(error);

          const { data } = supabase.storage.from(bucketName).getPublicUrl(destPath);
          cb(null, { path: data.publicUrl, filename: destPath });
        } catch (err) {
          cb(err);
        }
      });
    }

    _removeFile(req, file, cb) {
      supabase.storage.from(bucketName).remove([file.filename]).then(() => cb(null)).catch(() => cb(null));
    }
  }

  storage = new SupabaseStorageEngine();
} else if (firebaseConfigured) {
  activeBackend = 'firebase';
  const admin = require('firebase-admin');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Env vars can't hold real newlines, so private keys are stored with
        // literal "\n" sequences that need to be converted back.
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  const bucket = admin.storage().bucket();

  // Minimal multer StorageEngine that streams the incoming file straight
  // into the Firebase Storage bucket and resolves a long-lived signed URL
  // (works regardless of the bucket's ACL/uniform-access settings).
  class FirebaseStorageEngine {
    _handleFile(req, file, cb) {
      const ext = path.extname(file.originalname);
      const destPath = `house-design/${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const bucketFile = bucket.file(destPath);
      const writeStream = bucketFile.createWriteStream({
        metadata: { contentType: file.mimetype },
        resumable: false,
      });

      file.stream.pipe(writeStream)
        .on('error', (err) => cb(err))
        .on('finish', async () => {
          try {
            const [url] = await bucketFile.getSignedUrl({ action: 'read', expires: '01-01-2100' });
            cb(null, { path: url, filename: destPath });
          } catch (err) {
            cb(err);
          }
        });
    }

    _removeFile(req, file, cb) {
      bucket.file(file.filename).delete().then(() => cb(null)).catch(() => cb(null));
    }
  }

  storage = new FirebaseStorageEngine();
} else if (cloudinaryConfigured) {
  activeBackend = 'cloudinary';
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: (req, file) => {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      let resource_type = 'raw'; // 3D models (glb/gltf/obj/stl/fbx), pdf, dwg, dxf, voice notes, etc.
      if (IMAGE_EXTS.includes(ext)) resource_type = 'image';
      else if (VIDEO_EXTS.includes(ext)) resource_type = 'video';

      return {
        folder: 'house-design',
        resource_type,
        public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        format: ext || undefined,
      };
    },
  });
} else {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });
}

// Check File Type (optional, but good practice)
function checkFileType(file, cb) {
  // We'll accept common image types for images/plans, standard formats for 3D models, and videos
  const filetypes = /jpeg|jpg|png|gif|pdf|dwg|dxf|obj|stl|gltf|glb|fbx|mp4|webm|mov/;

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype.includes('image') || file.mimetype.includes('application') || file.mimetype.includes('model') || file.mimetype.includes('video');

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: File type not supported!');
  }
}

// Init Upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit per file
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Returns the public URL for an uploaded file regardless of which storage
// backend handled it. Use this everywhere instead of manually building
// `/uploads/${file.filename}`, so the app keeps working the same way whether
// files are on Firebase/Cloudinary (file.path is already a full https URL)
// or on the local disk fallback (file.filename is the name saved under /uploads).
function getFileUrl(file) {
  if (!file) return null;
  if (file.path && /^https?:\/\//.test(file.path)) {
    return file.path;
  }
  return `/uploads/${file.filename}`;
}

module.exports = upload;
module.exports.getFileUrl = getFileUrl;
module.exports.activeBackend = activeBackend;
