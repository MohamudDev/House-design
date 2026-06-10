const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  buyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  engineer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  design: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Design', 
    required: true 
  },
  amountPaid: { 
    type: Number, 
    required: true 
  },
  commissionAmount: { 
    type: Number, 
    required: true 
  },
  engineerAmount: { 
    type: Number, 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'],
    default: 'pending' 
  },
  transactionId: {
    type: String, // WaafiPay transaction id
    unique: true,
    sparse: true
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Transaction', transactionSchema);
