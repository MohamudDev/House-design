const express = require('express');
const router = express.Router();
const { 
  submitContact, 
  getContacts, 
  getMyContacts,
  getUnreadReplies,
  markReplyRead,
  getUnreadContacts,
  markAsRead, 
  replyContact,
  deleteContact 
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

router.post('/', submitContact);
router.get('/my', getMyContacts);
router.get('/my/unread', getUnreadReplies);
router.put('/my/read/:id', markReplyRead);

// Protected routes for Admin
router.use(authorize('admin'));

router.get('/', getContacts);
router.get('/unread', getUnreadContacts);
router.put('/:id/read', markAsRead);
router.put('/:id/reply', replyContact);
router.delete('/:id', deleteContact);

module.exports = router;
