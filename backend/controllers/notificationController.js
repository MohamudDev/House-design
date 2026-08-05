const Notification = require('../models/Notification');

// @desc    List my notifications
// @route   GET /api/notifications
exports.listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'name role')
      .populate('project', 'projectStatus progressPercentage')
      .sort({ createdAt: -1 })
      .limit(100);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ success: true, unreadCount, data: notifications });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load notifications' });
  }
};

// @desc    Mark one notification read
// @route   PUT /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update notification' });
  }
};

// @desc    Mark all read
// @route   PUT /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update notifications' });
  }
};
