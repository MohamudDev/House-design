const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  event: {
    type: String,
    required: true,
    enum: [
      'conversation_started', 'engineer_replied', 'client_message', 'engineer_message',
      'file_uploaded', 'design_revision_shared', 'conversation_closed', 'project_completed',
      'note_added', 'status_changed'
    ]
  },
  description: { type: String, default: '' },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const fileHistorySchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, default: 'file' },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null }
}, { _id: true });

const noteSchema = new mongoose.Schema({
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const collaborationSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  engineer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  design: { type: mongoose.Schema.Types.ObjectId, ref: 'Design', required: true },
  chatId: { type: String, required: true, index: true },
  status: { type: String, enum: ['Active', 'Completed', 'Closed'], default: 'Active' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  lastActivity: { type: Date, default: Date.now },
  timeline: [timelineEventSchema],
  files: [fileHistorySchema],
  engineerNotes: [noteSchema],
  clientNotes: [noteSchema],
  activityLog: [activityLogSchema],
  clientMarkedComplete: { type: Boolean, default: false },
  engineerMarkedComplete: { type: Boolean, default: false }
}, { timestamps: true });

collaborationSchema.index({ client: 1, engineer: 1, design: 1 }, { unique: true });
collaborationSchema.index({ status: 1, lastActivity: -1 });

module.exports = mongoose.model('Collaboration', collaborationSchema);
