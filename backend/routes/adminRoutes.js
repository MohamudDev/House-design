const express = require('express');
const router = express.Router();
const { 
  getAdminStats, 
  getUsers, 
  createUser,
  updateUserStatus, 
  deleteUser, 
  getDesigns, 
  updateDesignStatus,
  hideDesign,
  getAdminReports,
  updateAdminSettings,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  suspendUser,
  activateUser,
  resetUserPassword
} = require('../controllers/adminController');
const { getAllWithdrawals, updateWithdrawalStatus } = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply protection and specific role authorization to all routes in this file
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// Stats & Reports Routes
router.get('/stats', getAdminStats);
router.get('/reports', getAdminReports);
router.put('/settings', updateAdminSettings);

// User Management Routes
router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id/status')
  .put(updateUserStatus);

router.route('/users/:id')
  .delete(deleteUser);

router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/activate', activateUser);
router.put('/users/:id/reset-password', resetUserPassword);

// Superadmin ONLY routes
router.post('/admins', authorize('superadmin'), createAdmin);
router.put('/admins/:id', authorize('superadmin'), updateAdmin);
router.delete('/admins/:id', authorize('superadmin'), deleteAdmin);

// Design Management Routes
router.route('/designs')
  .get(getDesigns);

router.route('/designs/:id/status')
  .put(updateDesignStatus);

router.put('/designs/:id/hide', hideDesign);

// Withdrawal Routes
router.route('/withdrawals')
  .get(getAllWithdrawals);
router.route('/withdrawals/:id/status')
  .put(updateWithdrawalStatus);

module.exports = router;
