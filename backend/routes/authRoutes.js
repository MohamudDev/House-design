const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { getProfile, updateProfile } = require('../controllers/engineerController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const registerUpload = upload.fields([
  { name: 'nationalId', maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]);

router.post('/register', registerUpload, register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Moved from engineer routes for troubleshooting
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
