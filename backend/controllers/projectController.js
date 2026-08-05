const Project = require('../models/Project');
const ProgressUpdate = require('../models/ProgressUpdate');
const ProjectTimeline = require('../models/ProjectTimeline');
const Notification = require('../models/Notification');
const Design = require('../models/Design');
const { getFileUrl } = require('../middleware/uploadMiddleware');
const { appendTimeline, createNotification } = require('../utils/projectHelpers');

const populateProject = [
  { path: 'client', select: 'name email role' },
  { path: 'engineer', select: 'name email role' },
  { path: 'design', select: 'title houseType images price rooms' },
  { path: 'transaction', select: 'amountPaid totalPrice amountRemaining paymentPlan remainingStatus paymentStatus transactionId createdAt' },
  { path: 'attachments.uploadedBy', select: 'name role' }
];

function assertNotReadOnly(project) {
  if (project.isReadOnly || project.projectStatus === 'Delivered') {
    const err = new Error('This project is delivered and read-only');
    err.statusCode = 403;
    throw err;
  }
}

/** Parse YYYY-MM-DD strictly (rejects invalid day/month/year and JS date rollover). */
function parseStrictYmd(value, label = 'Date') {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const err = new Error(`${label} is not correct. Use a valid day, month, and year.`);
    err.statusCode = 400;
    throw err;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    const err = new Error(`${label} is not correct. Day, month, or year is invalid.`);
    err.statusCode = 400;
    throw err;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    const err = new Error(`${label} is not correct. That day does not exist in this month/year.`);
    err.statusCode = 400;
    throw err;
  }

  const currentYear = startOfToday().getFullYear();
  if (year < currentYear || year > currentYear + 10) {
    const err = new Error(`${label} is not correct. Year must be between ${currentYear} and ${currentYear + 10}.`);
    err.statusCode = 400;
    throw err;
  }

  return date;
}

function startOfToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function validateScheduleDates(expectedStartDate, expectedCompletionDate) {
  if (!expectedStartDate || !expectedCompletionDate) {
    const err = new Error('Expected start and completion dates are required');
    err.statusCode = 400;
    throw err;
  }

  const start = parseStrictYmd(expectedStartDate, 'Start Date');
  const end = parseStrictYmd(expectedCompletionDate, 'Completion Date');
  const today = startOfToday();
  const startYmd = String(expectedStartDate).trim();
  const endYmd = String(expectedCompletionDate).trim();
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  // Past Start Date is never allowed — including schedule edits
  if (startYmd < todayStr) {
    const err = new Error('Start Date cannot be in the past.');
    err.statusCode = 400;
    throw err;
  }
  // Completion must be strictly after Start Date (same day not allowed)
  if (endYmd <= startYmd) {
    const err = new Error('Completion Date must be after the Start Date.');
    err.statusCode = 400;
    throw err;
  }

  return { start, end };
}

async function createPaidProjectFromTransaction({ transaction, design, io, isHalfPayment = false }) {
  let project = await Project.findOne({ transaction: transaction._id });
  if (project) return project;

  project = await Project.findOne({
    client: transaction.buyer,
    engineer: transaction.engineer,
    design: transaction.design,
    projectStatus: { $nin: ['Delivered', 'Cancelled'] }
  });

  if (project) {
    project.transaction = transaction._id;
    project.paymentStatus = 'completed';
    project.projectStatus = 'Paid';
    await project.save();
  } else {
    project = await Project.create({
      client: transaction.buyer,
      engineer: transaction.engineer,
      design: transaction.design,
      transaction: transaction._id,
      paymentStatus: 'completed',
      projectStatus: 'Paid',
      progressPercentage: 0
    });
  }

  await appendTimeline({
    projectId: project._id,
    status: 'Paid',
    progressPercentage: 0,
    action: isHalfPayment ? 'Half payment received (Tahy)' : 'Payment received',
    note: isHalfPayment
      ? `Client paid 50%. Remaining $${Number(transaction.amountRemaining || 0).toFixed(2)} marked as Tahy.`
      : 'Client completed payment. Project is ready to start.',
    actor: transaction.buyer,
    actorRole: 'client'
  });

  await createNotification({
    recipient: transaction.engineer,
    sender: transaction.buyer,
    project: project._id,
    type: 'payment_received',
    title: isHalfPayment ? 'Half payment (Tahy) received' : 'New paid project',
    message: isHalfPayment
      ? `A client paid half for "${design?.title || 'a design'}". Remaining balance is Tahy.`
      : `A client paid for "${design?.title || 'a design'}". Open Projects to start work.`,
    io
  });

  return project;
}

// @desc    List projects for current user (role-aware)
// @route   GET /api/projects
exports.listProjects = async (req, res) => {
  try {
    const role = req.user.role;
    const filter = {};
    if (role === 'client') filter.client = req.user._id;
    else if (role === 'engineer') filter.engineer = req.user._id;
    // admin / superadmin see all

    if (req.query.status) filter.projectStatus = req.query.status;

    const projects = await Project.find(filter)
      .populate(populateProject)
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to list projects' });
  }
};

// @desc    Engineer/client/admin dashboard widgets
// @route   GET /api/projects/stats
exports.getProjectStats = async (req, res) => {
  try {
    const role = req.user.role;
    const base = role === 'client'
      ? { client: req.user._id }
      : role === 'engineer'
        ? { engineer: req.user._id }
        : {};

    const projects = await Project.find(base).select('projectStatus progressPercentage expectedCompletionDate updatedAt');

    const active = projects.filter((p) => ['Paid', 'In Progress', 'Revision Requested', 'Completed - Waiting for Client Confirmation'].includes(p.projectStatus));
    const completed = projects.filter((p) => p.projectStatus === 'Delivered');
    const revisions = projects.filter((p) => p.projectStatus === 'Revision Requested');
    const waitingConfirmation = projects.filter((p) => p.projectStatus === 'Completed - Waiting for Client Confirmation');
    const upcomingDeadlines = projects
      .filter((p) => p.expectedCompletionDate && ['In Progress', 'Revision Requested', 'Paid'].includes(p.projectStatus))
      .sort((a, b) => new Date(a.expectedCompletionDate) - new Date(b.expectedCompletionDate))
      .slice(0, 5);

    const unreadNotifications = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    res.json({
      success: true,
      data: {
        total: projects.length,
        active: active.length,
        completed: completed.length,
        revisionRequests: revisions.length,
        waitingConfirmation: waitingConfirmation.length,
        averageProgress: projects.length
          ? Math.round(projects.reduce((s, p) => s + (p.progressPercentage || 0), 0) / projects.length)
          : 0,
        upcomingDeadlines,
        unreadNotifications
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load project stats' });
  }
};

// @desc    Get single project with timeline + progress history
// @route   GET /api/projects/:id
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(populateProject);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const role = req.user.role;
    const uid = req.user._id.toString();
    const isParty = project.client._id.toString() === uid || project.engineer._id.toString() === uid;
    const isAdmin = role === 'admin' || role === 'superadmin';
    if (!isParty && !isAdmin) return res.status(403).json({ message: 'Not authorized to view this project' });

    const [timeline, progressUpdates] = await Promise.all([
      ProjectTimeline.find({ project: project._id }).populate('actor', 'name role').sort({ createdAt: -1 }),
      ProgressUpdate.find({ project: project._id }).populate('updatedBy', 'name role').sort({ createdAt: -1 })
    ]);

    res.json({ success: true, data: project, timeline, progressUpdates });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load project' });
  }
};

// @desc    Engineer starts work
// @route   POST /api/projects/:id/start
exports.startWork = async (req, res) => {
  try {
    const { expectedStartDate, expectedCompletionDate } = req.body;
    const { start, end } = validateScheduleDates(expectedStartDate, expectedCompletionDate);

    const project = await Project.findById(req.params.id).populate('design', 'title');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.engineer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned engineer can start work' });
    }
    assertNotReadOnly(project);
    if (project.projectStatus !== 'Paid') {
      return res.status(400).json({ message: `Cannot start work from status "${project.projectStatus}"` });
    }

    project.expectedStartDate = start;
    project.expectedCompletionDate = end;
    project.projectStatus = 'In Progress';
    if (project.progressPercentage === 0) project.progressPercentage = 0;
    await project.save();

    await appendTimeline({
      projectId: project._id,
      status: 'In Progress',
      progressPercentage: project.progressPercentage,
      action: 'Work started',
      note: `Expected ${start.toLocaleDateString()} → ${end.toLocaleDateString()}`,
      actor: req.user._id,
      actorRole: 'engineer'
    });

    await createNotification({
      recipient: project.client,
      sender: req.user._id,
      project: project._id,
      type: 'work_started',
      title: 'Work started',
      message: `Engineer started work on "${project.design?.title || 'your project'}".`,
      io: req.io
    });

    const data = await Project.findById(project._id).populate(populateProject);
    res.json({ success: true, data, message: 'Project started' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to start work' });
  }
};

// @desc    Engineer edits expected start/completion dates after starting
// @route   PUT /api/projects/:id/schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { expectedStartDate, expectedCompletionDate } = req.body;

    const project = await Project.findById(req.params.id).populate('design', 'title');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.engineer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned engineer can edit the schedule' });
    }
    assertNotReadOnly(project);
    if (!['In Progress', 'Revision Requested'].includes(project.projectStatus)) {
      return res.status(400).json({ message: 'Schedule can only be edited while work is in progress' });
    }

    const { start, end } = validateScheduleDates(expectedStartDate, expectedCompletionDate);

    project.expectedStartDate = start;
    project.expectedCompletionDate = end;
    await project.save();

    await appendTimeline({
      projectId: project._id,
      status: project.projectStatus,
      progressPercentage: project.progressPercentage,
      action: 'Schedule updated',
      note: `Expected ${start.toLocaleDateString()} → ${end.toLocaleDateString()}`,
      actor: req.user._id,
      actorRole: 'engineer'
    });

    await createNotification({
      recipient: project.client,
      sender: req.user._id,
      project: project._id,
      type: 'schedule_updated',
      title: 'Project schedule updated',
      message: `Engineer updated dates for "${project.design?.title || 'your project'}".`,
      io: req.io
    });

    const data = await Project.findById(project._id).populate(populateProject);
    res.json({ success: true, data, message: 'Schedule updated' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to update schedule' });
  }
};

// @desc    Engineer updates progress
// @route   POST /api/projects/:id/progress
exports.updateProgress = async (req, res) => {
  try {
    const percentage = Number(req.body.progressPercentage);
    const note = (req.body.note || '').trim();
    if (![0, 25, 50, 75, 100].includes(percentage)) {
      return res.status(400).json({ message: 'Progress must be 0, 25, 50, 75, or 100' });
    }

    const project = await Project.findById(req.params.id).populate('design', 'title');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.engineer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned engineer can update progress' });
    }
    assertNotReadOnly(project);
    if (!['In Progress', 'Revision Requested'].includes(project.projectStatus)) {
      return res.status(400).json({ message: 'Progress can only be updated while In Progress or Revision Requested' });
    }

    const files = [];
    const uploaded = req.files || [];
    for (const file of uploaded) {
      files.push({
        fileName: file.originalname || file.filename,
        fileUrl: getFileUrl(file),
        fileType: file.mimetype || 'file'
      });
      project.attachments.push({
        fileName: file.originalname || file.filename,
        fileUrl: getFileUrl(file),
        fileType: file.mimetype || 'file',
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      });
    }

    project.progressPercentage = percentage;
    if (project.projectStatus === 'Revision Requested') {
      project.projectStatus = 'In Progress';
    }
    if (note) project.notes = note;
    await project.save();

    const progressUpdate = await ProgressUpdate.create({
      project: project._id,
      progressPercentage: percentage,
      note,
      files,
      updatedBy: req.user._id
    });

    await appendTimeline({
      projectId: project._id,
      status: project.projectStatus,
      progressPercentage: percentage,
      action: 'Progress updated',
      note: note || `Progress set to ${percentage}%`,
      actor: req.user._id,
      actorRole: 'engineer'
    });

    await createNotification({
      recipient: project.client,
      sender: req.user._id,
      project: project._id,
      type: 'progress_updated',
      title: 'Progress updated',
      message: `"${project.design?.title || 'Your project'}" is now ${percentage}% complete.`,
      io: req.io
    });

    const data = await Project.findById(project._id).populate(populateProject);
    res.json({ success: true, data, progressUpdate, message: 'Progress saved' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to update progress' });
  }
};

// @desc    Engineer marks completed (waiting client confirmation)
// @route   POST /api/projects/:id/complete
exports.markCompleted = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('design', 'title');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.engineer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned engineer can mark completed' });
    }
    assertNotReadOnly(project);

    if (project.progressPercentage < 100) {
      return res.status(400).json({ message: 'Progress must be 100% before marking completed' });
    }
    if (!['In Progress', 'Revision Requested'].includes(project.projectStatus)) {
      return res.status(400).json({ message: 'Project cannot be marked completed from current status' });
    }

    project.projectStatus = 'Completed - Waiting for Client Confirmation';
    project.progressPercentage = 100;
    await project.save();

    await appendTimeline({
      projectId: project._id,
      status: project.projectStatus,
      progressPercentage: 100,
      action: 'Marked as completed',
      note: req.body.note || 'Waiting for client confirmation',
      actor: req.user._id,
      actorRole: 'engineer'
    });

    await createNotification({
      recipient: project.client,
      sender: req.user._id,
      project: project._id,
      type: 'project_completed',
      title: 'Project completed',
      message: `"${project.design?.title || 'Your project'}" is complete. Please confirm delivery or request revisions.`,
      io: req.io
    });

    const data = await Project.findById(project._id).populate(populateProject);
    res.json({ success: true, data, message: 'Marked completed — waiting for client confirmation' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to complete project' });
  }
};

// @desc    Client confirms delivery
// @route   POST /api/projects/:id/confirm-delivery
exports.confirmDelivery = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('design', 'title');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can confirm delivery' });
    }
    assertNotReadOnly(project);
    if (project.projectStatus !== 'Completed - Waiting for Client Confirmation') {
      return res.status(400).json({ message: 'Project is not awaiting confirmation' });
    }

    project.projectStatus = 'Delivered';
    project.actualCompletionDate = new Date();
    project.isReadOnly = true;
    await project.save();

    await appendTimeline({
      projectId: project._id,
      status: 'Delivered',
      progressPercentage: 100,
      action: 'Delivery confirmed',
      note: req.body.note || 'Client confirmed delivery',
      actor: req.user._id,
      actorRole: 'client'
    });

    await createNotification({
      recipient: project.engineer,
      sender: req.user._id,
      project: project._id,
      type: 'delivery_confirmed',
      title: 'Delivery confirmed',
      message: `Client confirmed delivery for "${project.design?.title || 'the project'}".`,
      io: req.io
    });

    const data = await Project.findById(project._id).populate(populateProject);
    res.json({ success: true, data, message: 'Delivery confirmed' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to confirm delivery' });
  }
};

// @desc    Client requests revisions
// @route   POST /api/projects/:id/request-revision
exports.requestRevision = async (req, res) => {
  try {
    const note = (req.body.note || '').trim();
    if (!note) return res.status(400).json({ message: 'Please describe the revisions needed' });

    const project = await Project.findById(req.params.id).populate('design', 'title');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can request revisions' });
    }
    assertNotReadOnly(project);
    if (project.projectStatus !== 'Completed - Waiting for Client Confirmation') {
      return res.status(400).json({ message: 'Revisions can only be requested while waiting for confirmation' });
    }

    project.projectStatus = 'Revision Requested';
    project.revisionCount += 1;
    project.clientComments.push({ content: note, createdAt: new Date() });
    await project.save();

    await appendTimeline({
      projectId: project._id,
      status: 'Revision Requested',
      progressPercentage: project.progressPercentage,
      action: 'Revision requested',
      note,
      actor: req.user._id,
      actorRole: 'client'
    });

    await createNotification({
      recipient: project.engineer,
      sender: req.user._id,
      project: project._id,
      type: 'revision_requested',
      title: 'Revision requested',
      message: `Client requested revisions on "${project.design?.title || 'the project'}".`,
      io: req.io
    });

    const data = await Project.findById(project._id).populate(populateProject);
    res.json({ success: true, data, message: 'Revision requested' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to request revision' });
  }
};

// @desc    Client sends a comment
// @route   POST /api/projects/:id/comments
exports.addClientComment = async (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Comment is required' });

    const project = await Project.findById(req.params.id).populate('design', 'title');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can comment' });
    }
    if (project.projectStatus === 'Delivered' || project.isReadOnly) {
      return res.status(403).json({ message: 'Delivered projects are read-only' });
    }

    project.clientComments.push({ content, createdAt: new Date() });
    await project.save();

    await appendTimeline({
      projectId: project._id,
      status: project.projectStatus,
      progressPercentage: project.progressPercentage,
      action: 'Client comment',
      note: content,
      actor: req.user._id,
      actorRole: 'client'
    });

    await createNotification({
      recipient: project.engineer,
      sender: req.user._id,
      project: project._id,
      type: 'client_comment',
      title: 'New client comment',
      message: content.slice(0, 120),
      io: req.io
    });

    const data = await Project.findById(project._id).populate(populateProject);
    res.json({ success: true, data, message: 'Comment sent' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to add comment' });
  }
};

exports.createPaidProjectFromTransaction = createPaidProjectFromTransaction;
