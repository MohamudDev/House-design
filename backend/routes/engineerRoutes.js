const express = require('express');
const router = express.Router();
const { 
  uploadDesign, 
  getMyDesigns, 
  getEngineerStats,
  getProfile,
  updateProfile
} = require('../controllers/engineerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Configure multer fields for the upload route
const cpUpload = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'plan2D', maxCount: 1 },
  { name: 'model3D', maxCount: 1 }
]);

// Apply protection and specific role authorization to all routes in this file
router.use(protect);
router.use(authorize('engineer'));

router.post('/designs', cpUpload, uploadDesign);
router.get('/designs', getMyDesigns);
router.get('/stats', getEngineerStats);
router.get('/ping', (req, res) => res.json({ success: true, message: 'Engineer API is reachable' }));
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
