const mongoose = require('mongoose');

const PROJECT_STATUSES = [
  'Pending Payment',
  'Paid',
  'In Progress',
  'Revision Requested',
  'Completed - Waiting for Client Confirmation',
  'Delivered',
  'Cancelled'
];

const projectSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  engineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  design: { type: mongoose.Schema.Types.ObjectId, ref: 'Design', required: true },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  projectStatus: {
    type: String,
    enum: PROJECT_STATUSES,
    default: 'Pending Payment'
  },
  progressPercentage: {
    type: Number,
    enum: [0, 25, 50, 75, 100],
    default: 0
  },
  expectedStartDate: { type: Date, default: null },
  expectedCompletionDate: { type: Date, default: null },
  actualCompletionDate: { type: Date, default: null },
  notes: { type: String, default: '' },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  clientComments: [{
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  revisionCount: { type: Number, default: 0 },
  isReadOnly: { type: Boolean, default: false }
}, { timestamps: true });

projectSchema.index({ client: 1, projectStatus: 1 });
projectSchema.index({ engineer: 1, projectStatus: 1 });
projectSchema.index({ design: 1, client: 1 });

module.exports = mongoose.model('Project', projectSchema);
module.exports.PROJECT_STATUSES = PROJECT_STATUSES;
