const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, designId } = req.body;

    // We need either content OR an attachment
    if (!receiverId || (!content && !req.file)) {
      return res.status(400).json({ message: 'Receiver and either content or attachment are required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Prevent sending messages to pending/unapproved engineers
    if (receiver.role === 'engineer' && !receiver.isApproved) {
      return res.status(400).json({ message: 'Engineer is no longer available' });
    }

    let attachmentUrl = null;
    let attachmentType = null;

    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith('video/')) {
        attachmentType = 'video';
      } else if (req.file.mimetype.startsWith('image/')) {
        attachmentType = 'image';
      } else if (req.file.filename.match(/\.(glb|gltf|obj|stl|fbx)$/i) || req.file.mimetype.includes('model') || req.file.mimetype.includes('octet-stream')) {
        attachmentType = '3d';
      }
    }

    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      designId: designId || null,
      content: content || '',
      attachmentUrl,
      attachmentType
    });

    // Populate sender and receiver info before sending back
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .populate('designId', 'title');

    // If socket.io is attached to req, emit event
    if (req.io) {
      req.io.to(receiverId.toString()).emit('new message', populatedMessage);
    }

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
};

// @desc    Get all conversations for the logged in user (Inbox view)
// @route   GET /api/messages/inbox
// @access  Private
const getInbox = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all messages where the user is either sender or receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .populate('designId', 'title image')
      .sort({ createdAt: -1 });

    // Group messages by conversation partner
    const conversationsMap = new Map();

    messages.forEach((msg) => {
      // Determine the OTHER person in the conversation
      const partnerId = msg.sender._id.toString() === userId.toString() 
        ? msg.receiver._id.toString() 
        : msg.sender._id.toString();
      
      const partner = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;

      // Only keep the latest message for the inbox preview
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partner,
          latestMessage: msg,
          unreadCount: (msg.receiver._id.toString() === userId.toString() && !msg.isRead) ? 1 : 0
        });
      } else {
        // If we already have this conversation, just increment unread count if applicable
        if (msg.receiver._id.toString() === userId.toString() && !msg.isRead) {
          const convo = conversationsMap.get(partnerId);
          convo.unreadCount += 1;
          conversationsMap.set(partnerId, convo);
        }
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    console.error('Get Inbox Error:', error);
    res.status(500).json({ message: 'Server error fetching inbox' });
  }
};

// @desc    Get full chat history with a specific user
// @route   GET /api/messages/:userId
// @access  Private
const getConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const partnerId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId }
      ]
    })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .populate('designId', 'title image')
      .sort({ createdAt: 1 }); // Oldest to newest for chat view

    // Mark messages from partner as read
    const unreadMessages = messages.filter(msg => msg.receiver._id.toString() === userId.toString() && !msg.isRead);
    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map(m => m._id) } },
        { $set: { isRead: true } }
      );
    }

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Get Conversation Error:', error);
    res.status(500).json({ message: 'Server error fetching conversation' });
  }
};

// @desc    Get total unread messages count for the logged in user
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({ message: 'Server error fetching unread count' });
  }
};

// @desc    Get 3D models sent to the client via messages
// @route   GET /api/messages/client-designs
// @access  Private
const getClientDesigns = async (req, res) => {
  try {
    const userId = req.user._id;
    const designs = await Message.find({
      receiver: userId,
      attachmentType: '3d'
    })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, designs });
  } catch (error) {
    console.error('Get Client Designs Error:', error);
    res.status(500).json({ message: 'Server error fetching client designs' });
  }
};

module.exports = {
  sendMessage,
  getInbox,
  getConversation,
  getUnreadCount,
  getClientDesigns
};
