const User = require('../models/User');
const Design = require('../models/Design');
const Transaction = require('../models/Transaction');
const Complaint = require('../models/Complaint');
const Withdrawal = require('../models/Withdrawal');
const Message = require('../models/Message');

// @desc    Get detailed reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getAdminReports = async (req, res) => {
  try {
    // 1. Monthly Registration Growth (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      userGrowth,
      designGrowth,
      roleStats,
      statusStats,
      recentUsers,
      recentDesigns,
      totalClients,
      totalEngineers,
      totalAdmins,
      totalDesigns,
      soldDesignsArray,
      pendingWithdrawals,
      pendingComplaints,
      transactions,
      // Enhanced reports details
      allUsers,
      allDesigns,
      allComplaints,
      allTransactions,
      allMessages
    ] = await Promise.all([
      // 1. Monthly Registration Growth
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { "_id": 1 } }
      ]),
      // 2. Monthly Design Uploads
      Design.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { "_id": 1 } }
      ]),
      // 3. User Roles Distribution
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      // 4. Design Status Distribution
      Design.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      // 5. Recent Activity
      User.find().sort('-createdAt').limit(5).select('name email role createdAt'),
      Design.find().sort('-createdAt').limit(5).populate('engineer', 'name'),
      // 6. Full Stats (Clients, Engineers, Admins, Financials)
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'engineer' }),
      User.countDocuments({ role: { $in: ['admin', 'superadmin'] } }),
      Design.countDocuments(),
      Transaction.distinct('design', { paymentStatus: 'completed' }),
      Withdrawal.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'Pending' }),
      Transaction.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, totalCommission: { $sum: "$commissionAmount" }, totalSales: { $sum: "$amountPaid" } } }
      ]),
      // All Collections for advanced search, filter, and exports
      User.find({}).select('-password').sort('-createdAt'),
      Design.find({}).populate('engineer', 'name email').sort('-createdAt'),
      Complaint.find({}).populate('sender', 'name email').sort('-createdAt'),
      Transaction.find({}).populate('buyer', 'name email').populate('design', 'title price').sort('-createdAt'),
      Message.find({}).populate('sender', 'name email').populate('receiver', 'name email').sort('-createdAt')
    ]);

    // Calculate derived stats
    const totalSoldDesigns = soldDesignsArray.length;
    const totalUnsoldDesigns = Math.max(0, totalDesigns - totalSoldDesigns);
    const totalCommission = transactions.length > 0 ? transactions[0].totalCommission : 0;
    const totalSales = transactions.length > 0 ? transactions[0].totalSales : 0;

    res.status(200).json({
      success: true,
      data: {
        userGrowth,
        designGrowth,
        roleStats,
        statusStats,
        recentUsers,
        recentDesigns,
        allUsers,
        allDesigns,
        allComplaints,
        allTransactions,
        allMessages,
        fullStats: {
          totalClients,
          totalEngineers,
          totalAdmins,
          totalDesigns,
          totalSoldDesigns,
          totalUnsoldDesigns,
          pendingWithdrawals,
          pendingComplaints,
          totalCommission,
          totalSales
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.password = password;
    await user.save();
    res.status(200).json({ success: true, message: 'Password reset successfully' });
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
    const { isApproved, verificationStatus } = req.body;
    
    let updateFields = { isApproved };
    if (verificationStatus) {
      updateFields.verificationStatus = verificationStatus;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
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
    const designs = await Design.find({})
      .populate('engineer', 'name email')
      .populate('ratings.user', 'name')
      .sort('-createdAt');
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

// @desc    Create a new user (Client or Engineer)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    if (role !== 'client' && role !== 'engineer') {
      return res.status(400).json({ message: 'Role must be client or engineer' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role,
      isApproved: role === 'engineer' ? true : undefined,
      verificationStatus: role === 'engineer' ? 'verified' : undefined,
      acceptedTerms: role === 'engineer' ? true : undefined
    });
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new Admin
// @route   POST /api/admin/admins
// @access  Private/SuperAdmin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    
    const admin = await User.create({
      name, email, password, role: 'admin', isApproved: true
    });
    res.status(201).json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Admin
// @route   PUT /api/admin/admins/:id
// @access  Private/SuperAdmin
exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    if (admin.role === 'superadmin') return res.status(403).json({ message: 'Cannot modify Super Admin' });
    
    if (name) admin.name = name;
    if (email) admin.email = email;
    if (password) admin.password = password;
    
    await admin.save();
    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Admin
// @route   DELETE /api/admin/admins/:id
// @access  Private/SuperAdmin
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    if (admin.role === 'superadmin') return res.status(403).json({ message: 'Cannot delete Super Admin' });
    
    await User.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'Admin removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Suspend User
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'superadmin') return res.status(403).json({ message: 'Cannot suspend Super Admin' });
    
    user.isSuspended = true;
    await user.save();
    
    if (user.role === 'engineer') {
      await Design.updateMany({ engineer: user._id }, { isHidden: true });
    }
    
    res.status(200).json({ success: true, message: 'User suspended successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Activate User
// @route   PUT /api/admin/users/:id/activate
// @access  Private/Admin
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isSuspended = false;
    await user.save();
    
    if (user.role === 'engineer') {
      await Design.updateMany({ engineer: user._id }, { isHidden: false });
    }
    
    res.status(200).json({ success: true, message: 'User activated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Hide Design
// @route   PUT /api/admin/designs/:id/hide
// @access  Private/Admin
exports.hideDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);
    if (!design) return res.status(404).json({ message: 'Design not found' });
    
    design.isHidden = !design.isHidden;
    await design.save();
    
    res.status(200).json({ success: true, message: design.isHidden ? 'Design hidden' : 'Design restored', isHidden: design.isHidden });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
