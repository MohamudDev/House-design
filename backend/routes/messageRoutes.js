const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getInbox,
  getConversation,
  getUnreadCount,
  getClientDesigns,
  editMessage,
  deleteMessage
} = require('../controllers/messageController');
const upload = require('../middleware/uploadMiddleware');

// All message routes require authentication
router.use(protect);

router.post('/', upload.single('attachment'), sendMessage);
router.get('/inbox', getInbox);
router.get('/unread-count', getUnreadCount);
router.get('/client-designs', getClientDesigns);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.get('/:userId', getConversation);

module.exports = router;
