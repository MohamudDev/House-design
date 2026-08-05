const mongoose = require('mongoose');

const projectTimelineSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  status: { type: String, required: true },
  progressPercentage: { type: Number, default: 0 },
  action: { type: String, required: true },
  note: { type: String, default: '' },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole: { type: String, enum: ['client', 'engineer', 'admin', 'superadmin', 'system'], default: 'system' }
}, { timestamps: true });

module.exports = mongoose.model('ProjectTimeline', projectTimelineSchema);
