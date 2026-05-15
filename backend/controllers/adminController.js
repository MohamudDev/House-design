const User = require('../models/User');
const Design = require('../models/Design');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const engineersCount = await User.countDocuments({ role: 'engineer' });
    const clientsCount = await User.countDocuments({ role: 'client' });
    
    const pendingDesigns = await Design.countDocuments({ status: 'pending' });
    const approvedDesigns = await Design.countDocuments({ status: 'approved' });
    const rejectedDesigns = await Design.countDocuments({ status: 'rejected' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers: usersCount,
        totalEngineers: engineersCount,
        totalClients: clientsCount,
        designsPending: pendingDesigns,
        designsApproved: approvedDesigns,
        designsRejected: rejectedDesigns
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort('-createdAt');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user status (Approve/Reject)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async function(req, res, next) {
  try {
    const { isApproved } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Controller Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.deleteOne({ _id: req.params.id });

    // Optionally delete their designs too
    if (user.role === 'engineer') {
      await Design.deleteMany({ engineer: user._id });
    }

    res.status(200).json({ success: true, message: 'User removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all designs
// @route   GET /api/admin/designs
// @access  Private/Admin
exports.getDesigns = async (req, res) => {
  try {
    const designs = await Design.find({}).populate('engineer', 'name email').sort('-createdAt');
    res.status(200).json({ success: true, data: designs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update design status (Approve/Reject)
// @route   PUT /api/admin/designs/:id/status
// @access  Private/Admin
exports.updateDesignStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const result = await Design.updateOne(
      { _id: req.params.id },
      { status }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    res.status(200).json({ success: true, message: 'Design status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
