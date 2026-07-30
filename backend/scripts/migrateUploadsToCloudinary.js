/**
 * One-time migration: upload local backend/uploads files to Cloudinary
 * and rewrite relative /uploads/... paths in MongoDB to HTTPS Cloudinary URLs.
 *
 * Usage (from backend/):
 *   railway run node scripts/migrateUploadsToCloudinary.js
 * or with local .env that has MONGO_URI + CLOUDINARY_*
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov']);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing CLOUDINARY_* env vars');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI');
  process.exit(1);
}

const uploadsDir = path.join(__dirname, '..', 'uploads');
const urlCache = new Map(); // relativePath -> cloudinaryUrl

function isRelativeUpload(value) {
  return typeof value === 'string' && value.startsWith('/uploads/');
}

function localPathFor(relativeUrl) {
  const filename = relativeUrl.replace(/^\/uploads\//, '');
  return path.join(uploadsDir, filename);
}

function resourceTypeFor(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (VIDEO_EXTS.has(ext)) return 'video';
  return 'raw';
}

async function ensureCloudinaryUrl(relativeUrl) {
  if (urlCache.has(relativeUrl)) return urlCache.get(relativeUrl);

  const filePath = localPathFor(relativeUrl);
  if (!fs.existsSync(filePath)) {
    console.warn(`  SKIP missing file: ${relativeUrl}`);
    urlCache.set(relativeUrl, relativeUrl);
    return relativeUrl;
  }

  const filename = path.basename(filePath);
  const resource_type = resourceTypeFor(filename);
  const public_id = `house-design/migrated/${path.parse(filename).name}`;

  console.log(`  Uploading ${filename} (${resource_type})...`);
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type,
      public_id,
      overwrite: true,
      folder: undefined,
    });
    const url = result.secure_url;
    urlCache.set(relativeUrl, url);
    console.log(`  -> ${url}`);
    return url;
  } catch (err) {
    console.warn(`  FAIL ${filename}: ${err.message || err}`);
    urlCache.set(relativeUrl, relativeUrl);
    return relativeUrl;
  }
}

async function rewriteStringField(doc, field) {
  const value = doc[field];
  if (!isRelativeUpload(value)) return false;
  doc[field] = await ensureCloudinaryUrl(value);
  return doc[field] !== value;
}

async function rewriteStringArray(doc, field) {
  const arr = doc[field];
  if (!Array.isArray(arr) || arr.length === 0) return false;
  let changed = false;
  const next = [];
  for (const item of arr) {
    if (isRelativeUpload(item)) {
      const url = await ensureCloudinaryUrl(item);
      next.push(url);
      if (url !== item) changed = true;
    } else {
      next.push(item);
    }
  }
  if (changed) doc[field] = next;
  return changed;
}

async function migrateDesigns(db) {
  const col = db.collection('designs');
  const docs = await col.find({
    $or: [
      { images: { $regex: '^/uploads/' } },
      { plan2D: { $regex: '^/uploads/' } },
      { model3D: { $regex: '^/uploads/' } },
      { 'interiorGallery.image': { $regex: '^/uploads/' } },
    ],
  }).toArray();

  console.log(`\nDesigns to migrate: ${docs.length}`);
  for (const doc of docs) {
    console.log(`\nDesign ${doc._id} (${doc.title || 'untitled'})`);
    let changed = false;

    if (Array.isArray(doc.images)) {
      const images = [];
      for (const img of doc.images) {
        if (isRelativeUpload(img)) {
          const url = await ensureCloudinaryUrl(img);
          images.push(url);
          if (url !== img) changed = true;
        } else images.push(img);
      }
      doc.images = images;
    }

    if (isRelativeUpload(doc.plan2D)) {
      const url = await ensureCloudinaryUrl(doc.plan2D);
      if (url !== doc.plan2D) { doc.plan2D = url; changed = true; }
    }
    if (isRelativeUpload(doc.model3D)) {
      const url = await ensureCloudinaryUrl(doc.model3D);
      if (url !== doc.model3D) { doc.model3D = url; changed = true; }
    }

    if (Array.isArray(doc.interiorGallery)) {
      for (const room of doc.interiorGallery) {
        if (room && isRelativeUpload(room.image)) {
          const url = await ensureCloudinaryUrl(room.image);
          if (url !== room.image) { room.image = url; changed = true; }
        }
      }
    }

    if (changed) {
      await col.updateOne(
        { _id: doc._id },
        {
          $set: {
            images: doc.images,
            plan2D: doc.plan2D,
            model3D: doc.model3D,
            interiorGallery: doc.interiorGallery,
          },
        }
      );
      console.log('  saved');
    }
  }
}

async function migrateUsers(db) {
  const col = db.collection('users');
  const docs = await col.find({
    $or: [
      { nationalIdUrl: { $regex: '^/uploads/' } },
      { certificateUrl: { $regex: '^/uploads/' } },
      { selfieUrl: { $regex: '^/uploads/' } },
    ],
  }).toArray();

  console.log(`\nUsers with docs to migrate: ${docs.length}`);
  for (const doc of docs) {
    console.log(`\nUser ${doc._id} (${doc.email || doc.name})`);
    const $set = {};
    for (const field of ['nationalIdUrl', 'certificateUrl', 'selfieUrl']) {
      if (isRelativeUpload(doc[field])) {
        $set[field] = await ensureCloudinaryUrl(doc[field]);
      }
    }
    if (Object.keys($set).length) {
      await col.updateOne({ _id: doc._id }, { $set });
      console.log('  saved');
    }
  }
}

async function migrateMessages(db) {
  const col = db.collection('messages');
  const docs = await col.find({ attachmentUrl: { $regex: '^/uploads/' } }).toArray();
  console.log(`\nMessages with attachments: ${docs.length}`);
  for (const doc of docs) {
    const url = await ensureCloudinaryUrl(doc.attachmentUrl);
    if (url !== doc.attachmentUrl) {
      await col.updateOne({ _id: doc._id }, { $set: { attachmentUrl: url } });
    }
  }
}

async function migrateComplaints(db) {
  const col = db.collection('complaints');
  const docs = await col.find({ attachment: { $regex: '^/uploads/' } }).toArray();
  console.log(`\nComplaints with attachments: ${docs.length}`);
  for (const doc of docs) {
    const url = await ensureCloudinaryUrl(doc.attachment);
    if (url !== doc.attachment) {
      await col.updateOne({ _id: doc._id }, { $set: { attachment: url } });
    }
  }
}

async function migrateCollaborations(db) {
  const col = db.collection('collaborations');
  const docs = await col.find({ 'files.fileUrl': { $regex: '^/uploads/' } }).toArray();
  console.log(`\nCollaborations with files: ${docs.length}`);
  for (const doc of docs) {
    let changed = false;
    const files = (doc.files || []).map((f) => {
      if (f && isRelativeUpload(f.fileUrl)) {
        changed = true;
        return { ...f };
      }
      return f;
    });
    for (let i = 0; i < files.length; i++) {
      if (files[i] && isRelativeUpload(doc.files[i].fileUrl)) {
        files[i] = { ...doc.files[i], fileUrl: await ensureCloudinaryUrl(doc.files[i].fileUrl) };
        changed = true;
      }
    }
    if (changed) await col.updateOne({ _id: doc._id }, { $set: { files } });
  }
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  await migrateDesigns(db);
  await migrateUsers(db);
  await migrateMessages(db);
  await migrateComplaints(db);
  await migrateCollaborations(db);

  console.log(`\nDone. Uploaded ${[...urlCache.values()].filter((u) => /^https?:\/\//.test(u)).length} files to Cloudinary.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
