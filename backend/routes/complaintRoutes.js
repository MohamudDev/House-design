const express = require('express');
const router = express.Router();
const {
  submitComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
  replyToComplaint
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// User routes (Client & Engineer)
router.post('/', protect, upload.single('attachment'), submitComplaint);
router.get('/my', protect, getMyComplaints);

// Admin routes
router.get('/', protect, authorize('admin'), getAllComplaints);
router.put('/:id/status', protect, authorize('admin'), updateComplaintStatus);
router.put('/:id/reply', protect, authorize('admin'), replyToComplaint);

module.exports = router;
