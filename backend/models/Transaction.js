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
  /** Full design price (before split) */
  totalPrice: {
    type: Number,
    required: true
  },
  /** Amount charged in this ledger entry / paid so far */
  amountPaid: { 
    type: Number, 
    required: true 
  },
  /** Remaining balance (tahy) still owed */
  amountRemaining: {
    type: Number,
    default: 0
  },
  paymentPlan: {
    type: String,
    enum: ['full', 'half'],
    default: 'full'
  },
  /** Whether the tahy/remaining balance has been settled */
  remainingStatus: {
    type: String,
    enum: ['n/a', 'pending', 'paid'],
    default: 'n/a'
  },
  remainingTransactionId: {
    type: String,
    default: null
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
