const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject']
  },
  category: {
    type: String,
    enum: ['Engineer', 'Property', 'Payment', 'System', 'Other'],
    required: [true, 'Please select a category']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  attachment: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  adminReply: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
