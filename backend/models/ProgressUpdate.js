const mongoose = require('mongoose');

const progressUpdateSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  progressPercentage: { type: Number, enum: [0, 25, 50, 75, 100], required: true },
  note: { type: String, default: '' },
  files: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('ProgressUpdate', progressUpdateSchema);
