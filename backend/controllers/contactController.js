const Contact = require('../models/Contact');

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const newContact = await Contact.create({
      user: req.user.id,
      name,
      email,
      subject: subject || 'General Inquiry',
      message
    });

    res.status(201).json({ success: true, data: newContact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().populate('user', 'name email').sort('-createdAt');
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's contact messages
// @route   GET /api/contact/my
// @access  Private
exports.getMyContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread replies for user
// @route   GET /api/contact/my/unread
// @access  Private
exports.getUnreadReplies = async (req, res) => {
  try {
    const contacts = await Contact.find({ 
      user: req.user.id, 
      reply: { $ne: null },
      userReadReply: false
    }).sort('-repliedAt');
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a reply as read by user
// @route   PUT /api/contact/my/read/:id
// @access  Private
exports.markReplyRead = async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    contact.userReadReply = true;
    await contact.save();

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread contacts for Admin
// @route   GET /api/contact/unread
// @access  Private/Admin
exports.getUnreadContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ isRead: false }).sort('-createdAt');
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark contact message as read
// @route   PUT /api/contact/:id/read
// @access  Private/Admin
exports.markAsRead = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    contact.isRead = true;
    await contact.save();

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to a contact message
// @route   PUT /api/contact/:id/reply
// @access  Private/Admin
exports.replyContact = async (req, res) => {
  try {
    const { reply } = req.body;
    
    if (!reply) {
      return res.status(400).json({ success: false, message: 'Please provide a reply message' });
    }

    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    contact.reply = reply;
    contact.repliedAt = Date.now();
    contact.isRead = true; // Auto mark as read when replying
    
    await contact.save();

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    await contact.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
