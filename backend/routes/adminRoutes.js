const express = require('express');
const router = express.Router();
const { 
  getAdminStats, 
  getUsers, 
  updateUserStatus, 
  deleteUser, 
  getDesigns, 
  updateDesignStatus 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply protection and specific role authorization to all routes in this file
router.use(protect);
router.use(authorize('admin'));

// Stats Route
router.get('/stats', getAdminStats);

// User Management Routes
router.route('/users')
  .get(getUsers);

router.route('/users/:id/status')
  .put(updateUserStatus);

router.route('/users/:id')
  .delete(deleteUser);

// Design Management Routes
router.route('/designs')
  .get(getDesigns);

router.route('/designs/:id/status')
  .put(updateDesignStatus);

module.exports = router;
