const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set Storage Engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate unique filename: fieldname-timestamp-originalext
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Check File Type (optional, but good practice)
function checkFileType(file, cb) {
  // We'll accept common image types for images/plans and standard formats for 3D models
  const filetypes = /jpeg|jpg|png|gif|pdf|dwg|dxf|obj|stl|gltf|glb|fbx/;
  
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype.includes('image') || file.mimetype.includes('application') || file.mimetype.includes('model');

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

module.exports = upload;
