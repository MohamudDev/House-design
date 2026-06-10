const User = require('../models/User');
const Design = require('../models/Design');
const Transaction = require('../models/Transaction');

// @desc    Get detailed reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getAdminReports = async (req, res) => {
  try {
    // 1. Monthly Registration Growth (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 2. Monthly Design Uploads (Last 6 months)
    const designGrowth = await Design.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 3. User Roles Distribution
    const roleStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    // 4. Design Status Distribution
    const statusStats = await Design.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // 5. Recent Activity
    const recentUsers = await User.find().sort('-createdAt').limit(5).select('name email role createdAt');
    const recentDesigns = await Design.find().sort('-createdAt').limit(5).populate('engineer', 'name');

    res.status(200).json({
      success: true,
      data: {
        userGrowth,
        designGrowth,
        roleStats,
        statusStats,
        recentUsers,
        recentDesigns
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

    const transactions = await Transaction.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { 
          _id: null, 
          totalCommission: { $sum: "$commissionAmount" },
          totalSales: { $sum: "$amountPaid" },
          totalTransactions: { $sum: 1 }
        } 
      }
    ]);
    
    const totalCommission = transactions.length > 0 ? transactions[0].totalCommission : 0;
    const totalSales = transactions.length > 0 ? transactions[0].totalSales : 0;
    const totalTransactions = transactions.length > 0 ? transactions[0].totalTransactions : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers: usersCount,
        totalEngineers: engineersCount,
        totalClients: clientsCount,
        designsPending: pendingDesigns,
        designsApproved: approvedDesigns,
        designsRejected: rejectedDesigns,
        totalCommission,
        totalSales,
        totalTransactions
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

// @desc    Update Admin Profile / Settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
exports.updateAdminSettings = async (req, res) => {
  try {
    const { name, email, password, currentPassword } = req.body;
    
    // We only want to update the current admin's settings
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Please provide your current password to set a new password' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      user.password = password; // Will be hashed by pre-save hook
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
