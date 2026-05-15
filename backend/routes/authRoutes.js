const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { getProfile, updateProfile } = require('../controllers/engineerController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Moved from engineer routes for troubleshooting
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
