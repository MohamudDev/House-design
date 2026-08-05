const Transaction = require('../models/Transaction');
const Design = require('../models/Design');
const User = require('../models/User');
const axios = require('axios');
const { createPaidProjectFromTransaction } = require('./projectController');

const round2 = (n) => Math.round(Number(n) * 100) / 100;

async function chargeWaafi({ accountNo, amount, description }) {
  const waafiPayload = {
    schemaVersion: '1.0',
    requestId: Date.now().toString(),
    timestamp: new Date().getTime().toString(),
    channelName: 'WEB',
    serviceName: 'API_PURCHASE',
    serviceParams: {
      merchantUid: process.env.WAAFI_MERCHANT_UID || 'M0910291',
      apiUserId: process.env.WAAFI_API_USER_ID || '1000416',
      apiKey: process.env.WAAFI_API_KEY || 'API-675418888AHX',
      paymentMethod: 'mwallet_account',
      payerInfo: {
        accountNo
      },
      transactionInfo: {
        referenceId: `REF-${Date.now()}`,
        invoiceId: `INV-${Date.now()}`,
        amount,
        currency: 'USD',
        description
      }
    }
  };

  const waafiResponse = await axios.post('https://api.waafipay.net/asm', waafiPayload);
  return waafiResponse.data;
}

// @desc    Process WaafiPay checkout (full or half / tahy)
// @route   POST /api/client/checkout/:designId
// @access  Private/Client
exports.checkout = async (req, res) => {
  try {
    const designId = req.params.designId;
    const buyerId = req.user.id;
    const { accountNo, paymentPlan: planRaw } = req.body;
    const paymentPlan = planRaw === 'half' ? 'half' : 'full';

    if (!accountNo) {
      return res.status(400).json({ success: false, message: 'Mobile Money Account Number is required' });
    }

    const design = await Design.findById(designId).populate('engineer');
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    if (design.engineer._id.toString() === buyerId) {
      return res.status(400).json({ success: false, message: 'You cannot buy your own design' });
    }

    const existingTransaction = await Transaction.findOne({
      buyer: buyerId,
      design: designId,
      paymentStatus: 'completed'
    });
    if (existingTransaction) {
      if (existingTransaction.remainingStatus === 'pending' && existingTransaction.amountRemaining > 0) {
        return res.status(400).json({
          success: false,
          message: 'Half payment already made. Please pay the remaining Tahy balance.',
          transactionId: existingTransaction._id,
          amountRemaining: existingTransaction.amountRemaining
        });
      }
      return res.status(400).json({ success: false, message: 'You have already purchased this design' });
    }

    const totalPrice = round2(design.price || 100);
    const amountPaid = paymentPlan === 'half' ? round2(totalPrice / 2) : totalPrice;
    const amountRemaining = paymentPlan === 'half' ? round2(totalPrice - amountPaid) : 0;

    const waafiData = await chargeWaafi({
      accountNo,
      amount: amountPaid,
      description:
        paymentPlan === 'half'
          ? `Half payment (Tahy) for 3D Design: ${design.title}`
          : `Purchase of 3D Design: ${design.title}`
    });

    if (waafiData && waafiData.responseCode === '2001') {
      const commissionAmount = round2(amountPaid * 0.1);
      const engineerAmount = round2(amountPaid - commissionAmount);

      const transaction = await Transaction.create({
        buyer: buyerId,
        engineer: design.engineer._id,
        design: designId,
        totalPrice,
        amountPaid,
        amountRemaining,
        paymentPlan,
        remainingStatus: paymentPlan === 'half' ? 'pending' : 'n/a',
        commissionAmount,
        engineerAmount,
        paymentStatus: 'completed',
        transactionId: waafiData.params?.transactionId || `WAAFI-${Date.now()}`
      });

      await User.findByIdAndUpdate(design.engineer._id, {
        $inc: { walletBalance: engineerAmount }
      });

      await Design.findByIdAndUpdate(designId, { $inc: { salesCount: 1 } });

      try {
        await createPaidProjectFromTransaction({
          transaction,
          design,
          io: req.io,
          isHalfPayment: paymentPlan === 'half'
        });
      } catch (projectErr) {
        console.error('Project auto-create failed:', projectErr.message);
      }

      return res.status(201).json({
        success: true,
        data: transaction,
        message:
          paymentPlan === 'half'
            ? 'Half payment successful. Remaining balance is marked as Tahy.'
            : 'Payment Successful via WaafiPay'
      });
    }

    return res.status(400).json({
      success: false,
      message: waafiData.responseMsg || 'Payment failed via WaafiPay'
    });
  } catch (error) {
    console.error('WaafiPay Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Server error during payment processing' });
  }
};

// @desc    Pay remaining Tahy balance after half payment
// @route   POST /api/client/pay-remaining/:transactionId
// @access  Private/Client
exports.payRemaining = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { accountNo } = req.body;

    if (!accountNo) {
      return res.status(400).json({ success: false, message: 'Mobile Money Account Number is required' });
    }

    const transaction = await Transaction.findById(req.params.transactionId).populate('design');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if (transaction.buyer.toString() !== buyerId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (transaction.paymentStatus !== 'completed' || transaction.remainingStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'No Tahy balance due on this purchase' });
    }

    const amountDue = round2(transaction.amountRemaining);
    if (amountDue <= 0) {
      return res.status(400).json({ success: false, message: 'No remaining balance' });
    }

    const designTitle = transaction.design?.title || 'design';
    const waafiData = await chargeWaafi({
      accountNo,
      amount: amountDue,
      description: `Tahy (remaining) payment for 3D Design: ${designTitle}`
    });

    if (!(waafiData && waafiData.responseCode === '2001')) {
      return res.status(400).json({
        success: false,
        message: waafiData.responseMsg || 'Payment failed via WaafiPay'
      });
    }

    const commissionAmount = round2(amountDue * 0.1);
    const engineerAmount = round2(amountDue - commissionAmount);

    transaction.amountPaid = round2(transaction.amountPaid + amountDue);
    transaction.amountRemaining = 0;
    transaction.remainingStatus = 'paid';
    transaction.remainingTransactionId = waafiData.params?.transactionId || `WAAFI-TAHY-${Date.now()}`;
    transaction.commissionAmount = round2(transaction.commissionAmount + commissionAmount);
    transaction.engineerAmount = round2(transaction.engineerAmount + engineerAmount);
    await transaction.save();

    await User.findByIdAndUpdate(transaction.engineer, {
      $inc: { walletBalance: engineerAmount }
    });

    return res.status(200).json({
      success: true,
      data: transaction,
      message: 'Tahy balance paid successfully'
    });
  } catch (error) {
    console.error('Pay remaining error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Server error during payment processing' });
  }
};

// @desc    Get client's purchased designs
// @route   GET /api/client/purchases
// @access  Private/Client
exports.getPurchases = async (req, res) => {
  try {
    const transactions = await Transaction.find({ buyer: req.user.id, paymentStatus: 'completed' })
      .populate({
        path: 'design',
        populate: {
          path: 'engineer',
          select: 'name email'
        }
      })
      .sort('-createdAt');

    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
