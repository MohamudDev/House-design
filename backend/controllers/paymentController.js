const Transaction = require('../models/Transaction');
const Design = require('../models/Design');
const User = require('../models/User');
const axios = require('axios');

// @desc    Process WaafiPay checkout
// @route   POST /api/client/checkout/:designId
// @access  Private/Client
exports.checkout = async (req, res) => {
  try {
    const designId = req.params.designId;
    const buyerId = req.user.id;
    const { accountNo } = req.body;

    if (!accountNo) {
      return res.status(400).json({ success: false, message: 'Mobile Money Account Number is required' });
    }

    const design = await Design.findById(designId).populate('engineer');
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    // Check if the user is buying their own design
    if (design.engineer._id.toString() === buyerId) {
      return res.status(400).json({ success: false, message: 'You cannot buy your own design' });
    }

    // Check if already purchased
    const existingTransaction = await Transaction.findOne({ buyer: buyerId, design: designId, paymentStatus: 'completed' });
    if (existingTransaction) {
      return res.status(400).json({ success: false, message: 'You have already purchased this design' });
    }

    const amountPaid = design.price || 100;
    
    // Call WaafiPay API
    const waafiPayload = {
      schemaVersion: "1.0",
      requestId: Date.now().toString(),
      timestamp: new Date().getTime().toString(),
      channelName: "WEB",
      serviceName: "API_PURCHASE",
      serviceParams: {
        merchantUid: process.env.WAAFI_MERCHANT_UID || "M0910291",
        apiUserId: process.env.WAAFI_API_USER_ID || "1000416",
        apiKey: process.env.WAAFI_API_KEY || "API-675418888AHX",
        paymentMethod: "mwallet_account",
        payerInfo: {
          accountNo: accountNo
        },
        transactionInfo: {
          referenceId: `REF-${Date.now()}`,
          invoiceId: `INV-${Date.now()}`,
          amount: amountPaid,
          currency: "USD",
          description: `Purchase of 3D Design: ${design.title}`
        }
      }
    };

    const waafiResponse = await axios.post('https://api.waafipay.net/asm', waafiPayload);
    
    // Verify Payment Success
    if (waafiResponse.data && waafiResponse.data.responseCode === "2001") {
      const commissionAmount = amountPaid * 0.10;
      const engineerAmount = amountPaid - commissionAmount;

      // Save Transaction
      const transaction = await Transaction.create({
        buyer: buyerId,
        engineer: design.engineer._id,
        design: designId,
        amountPaid,
        commissionAmount,
        engineerAmount,
        paymentStatus: 'completed',
        transactionId: waafiResponse.data.params?.transactionId || `WAAFI-${Date.now()}`
      });

      // Add earnings to Engineer Wallet
      await User.findByIdAndUpdate(design.engineer._id, {
        $inc: { walletBalance: engineerAmount }
      });

      return res.status(201).json({
        success: true,
        data: transaction,
        message: 'Payment Successful via WaafiPay'
      });
    } else {
      // Payment Failed
      return res.status(400).json({ 
        success: false, 
        message: waafiResponse.data.responseMsg || 'Payment failed via WaafiPay' 
      });
    }

  } catch (error) {
    console.error('WaafiPay Error:', error.response?.data || error.message);
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
