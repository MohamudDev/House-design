const Complaint = require('../models/Complaint');

// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Private (Client/Engineer)
exports.submitComplaint = async (req, res) => {
  try {
    const { subject, category, description } = req.body;
    
    let attachment = null;
    if (req.file) {
      attachment = `/uploads/${req.file.filename}`;
    }

    const complaint = await Complaint.create({
      sender: req.user.id,
      subject,
      category,
      description,
      attachment
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in user's complaints
// @route   GET /api/complaints/my
// @access  Private (Client/Engineer)
exports.getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ sender: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private/Admin
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('sender', 'name role email').sort('-createdAt');
    res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private/Admin
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('sender', 'name role email');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Emit socket event if user is connected (can be added later)

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to complaint
// @route   PUT /api/complaints/:id/reply
// @access  Private/Admin
exports.replyToComplaint = async (req, res) => {
  try {
    const { adminReply } = req.body;
    
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { adminReply },
      { new: true, runValidators: true }
    ).populate('sender', 'name role email');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
