const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  designId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design',
    default: null
  },
  content: {
    type: String,
    trim: true,
    default: ''
  },
  attachmentUrl: {
    type: String,
    default: null
  },
  attachmentType: {
    type: String,
    enum: ['image', 'video', '3d', 'voice', null],
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  messageType: {
    type: String,
    enum: ['text', 'payment_request'],
    default: 'text'
  },
  payment: {
    customizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomizationRequest',
      default: null
    },
    amount: { type: Number, default: null },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending'
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
