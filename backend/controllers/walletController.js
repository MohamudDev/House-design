const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Request a withdrawal
// @route   POST /api/engineer/withdraw
// @access  Private/Engineer
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const engineer = await User.findById(req.user.id);

    if (engineer.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Deduct from wallet immediately
    engineer.walletBalance -= amount;
    await engineer.save();

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      engineerId: engineer._id,
      amount: amount,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: withdrawal,
      message: 'Withdrawal requested successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get engineer's withdrawal requests
// @route   GET /api/engineer/withdrawals
// @access  Private/Engineer
exports.getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ engineerId: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, data: withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all pending withdrawals for Admin
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().populate('engineerId', 'name email').sort('-createdAt');
    res.status(200).json({ success: true, data: withdrawals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update withdrawal status
// @route   PUT /api/admin/withdrawals/:id/status
// @access  Private/Admin
exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    // If admin rejects it, refund the engineer's wallet
    if (status === 'rejected' && withdrawal.status === 'pending') {
      await User.findByIdAndUpdate(withdrawal.engineerId, {
        $inc: { walletBalance: withdrawal.amount }
      });
    }

    withdrawal.status = status;
    await withdrawal.save();

    res.status(200).json({ success: true, data: withdrawal, message: `Withdrawal marked as ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
