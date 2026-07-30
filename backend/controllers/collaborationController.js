const Collaboration = require('../models/Collaboration');
const Message = require('../models/Message');
const { findOrCreateCollaboration, appendTimeline } = require('../utils/collaborationSync');

const populateFields = [
  { path: 'client', select: 'name email role' },
  { path: 'engineer', select: 'name email role' },
  { path: 'design', select: 'title houseType images rooms budgetEstimate' },
  { path: 'timeline.actor', select: 'name role' },
  { path: 'files.uploadedBy', select: 'name role' },
  { path: 'activityLog.actor', select: 'name role' }
];

function stripNotesForRole(collab, role) {
  const obj = collab.toObject ? collab.toObject() : { ...collab };
  if (role === 'client') {
    delete obj.engineerNotes;
    delete obj.activityLog;
  } else if (role === 'engineer') {
    delete obj.clientNotes;
  }
  return obj;
}

exports.ensureCollaboration = async (req, res) => {
  try {
    const { designId, engineerId } = req.body;
    if (!designId || !engineerId) {
      return res.status(400).json({ message: 'designId and engineerId are required' });
    }
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can start a collaboration from a design' });
    }
    const { collaboration, created } = await findOrCreateCollaboration({
      clientId: req.user._id, engineerId, designId, actorId: req.user._id
    });
    const populated = await Collaboration.findById(collaboration._id).populate(populateFields);
    res.status(created ? 201 : 200).json({ success: true, created, data: stripNotesForRole(populated, 'client') });
  } catch (error) {
    console.error('Ensure collaboration error:', error);
    res.status(500).json({ message: error.message || 'Failed to ensure collaboration' });
  }
};

exports.listCollaborations = async (req, res) => {
  try {
    const { status, search, client, engineer, design, from, to } = req.query;
    const role = req.user.role;
    const filter = {};
    if (role === 'client') filter.client = req.user._id;
    else if (role === 'engineer') filter.engineer = req.user._id;
    else if (role !== 'admin' && role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (status && status !== 'all') filter.status = status;
    if (role === 'admin' || role === 'superadmin') {
      if (client) filter.client = client;
      if (engineer) filter.engineer = engineer;
      if (design) filter.design = design;
    }
    if (from || to) {
      filter.startedAt = {};
      if (from) filter.startedAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.startedAt.$lte = end;
      }
    }
    let collaborations = await Collaboration.find(filter).populate(populateFields).sort({ lastActivity: -1 });
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      collaborations = collaborations.filter((c) =>
        (c.client?.name || '').toLowerCase().includes(q) ||
        (c.engineer?.name || '').toLowerCase().includes(q) ||
        (c.design?.title || '').toLowerCase().includes(q) ||
        (c.chatId || '').toLowerCase().includes(q) ||
        c._id.toString().toLowerCase().includes(q)
      );
    }
    res.json({ success: true, count: collaborations.length, data: collaborations.map((c) => stripNotesForRole(c, role)) });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to list collaborations' });
  }
};

exports.getCollaboration = async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id).populate(populateFields);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });
    const role = req.user.role;
    const uid = req.user._id.toString();
    const isParticipant = collaboration.client._id.toString() === uid || collaboration.engineer._id.toString() === uid;
    const isAdmin = role === 'admin' || role === 'superadmin';
    if (!isParticipant && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const designRef = collaboration.design._id || collaboration.design;
    const clientRef = collaboration.client._id || collaboration.client;
    const engineerRef = collaboration.engineer._id || collaboration.engineer;
    const messages = await Message.find({
      $and: [
        { $or: [{ sender: clientRef, receiver: engineerRef }, { sender: engineerRef, receiver: clientRef }] },
        { $or: [{ designId: designRef }, { designId: null, createdAt: { $gte: collaboration.startedAt } }] }
      ]
    }).populate('sender', 'name email role').populate('receiver', 'name email role').sort({ createdAt: 1 });

    res.json({ success: true, data: stripNotesForRole(collaboration, role), chatHistory: messages });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to get collaboration' });
  }
};

exports.addEngineerNote = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Note content is required' });
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });
    const isEngineer = collaboration.engineer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isEngineer && !isAdmin) return res.status(403).json({ message: 'Not authorized' });
    collaboration.engineerNotes.push({ content: content.trim(), createdAt: new Date(), updatedAt: new Date() });
    await appendTimeline(collaboration, 'note_added', 'Engineer added a private note.', req.user._id);
    const populated = await Collaboration.findById(collaboration._id).populate(populateFields);
    res.status(201).json({ success: true, data: stripNotesForRole(populated, req.user.role) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addClientNote = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Note content is required' });
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });
    if (collaboration.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the client can add client notes' });
    }
    collaboration.clientNotes.push({ content: content.trim(), createdAt: new Date(), updatedAt: new Date() });
    collaboration.lastActivity = new Date();
    collaboration.activityLog.push({ action: 'client_note_added', actor: req.user._id, details: 'Client added a personal note.', createdAt: new Date() });
    await collaboration.save();
    const populated = await Collaboration.findById(collaboration._id).populate(populateFields);
    res.status(201).json({ success: true, data: stripNotesForRole(populated, 'client') });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markComplete = async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });
    if (collaboration.status === 'Closed') return res.status(400).json({ message: 'Collaboration is closed' });
    const uid = req.user._id.toString();
    const isClient = collaboration.client.toString() === uid;
    const isEngineer = collaboration.engineer.toString() === uid;
    if (!isClient && !isEngineer) return res.status(403).json({ message: 'Not a participant' });
    if (isClient) collaboration.clientMarkedComplete = true;
    if (isEngineer) collaboration.engineerMarkedComplete = true;
    collaboration.activityLog.push({ action: 'mark_complete', actor: req.user._id, details: `${req.user.role} marked complete.`, createdAt: new Date() });
    if (collaboration.clientMarkedComplete && collaboration.engineerMarkedComplete) {
      collaboration.status = 'Completed';
      collaboration.endedAt = new Date();
      collaboration.timeline.push({ event: 'project_completed', description: 'Project completed — both parties agreed.', actor: req.user._id, createdAt: new Date() });
    }
    collaboration.lastActivity = new Date();
    await collaboration.save();
    const populated = await Collaboration.findById(collaboration._id).populate(populateFields);
    res.json({
      success: true,
      data: stripNotesForRole(populated, req.user.role),
      bothAgreed: collaboration.clientMarkedComplete && collaboration.engineerMarkedComplete
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.closeCollaboration = async (req, res) => {
  try {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });
    const uid = req.user._id.toString();
    const isParticipant = collaboration.client.toString() === uid || collaboration.engineer.toString() === uid;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isParticipant && !isAdmin) return res.status(403).json({ message: 'Not authorized' });
    collaboration.status = 'Closed';
    collaboration.endedAt = new Date();
    collaboration.lastActivity = new Date();
    collaboration.timeline.push({ event: 'conversation_closed', description: 'Conversation closed.', actor: req.user._id, createdAt: new Date() });
    collaboration.activityLog.push({ action: 'conversation_closed', actor: req.user._id, details: 'Collaboration closed.', createdAt: new Date() });
    await collaboration.save();
    const populated = await Collaboration.findById(collaboration._id).populate(populateFields);
    res.json({ success: true, data: stripNotesForRole(populated, req.user.role) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportPdf = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const collaboration = await Collaboration.findById(req.params.id).populate(populateFields);
    if (!collaboration) return res.status(404).json({ message: 'Collaboration not found' });
    const role = req.user.role;
    const uid = req.user._id.toString();
    const isParticipant = collaboration.client._id.toString() === uid || collaboration.engineer._id.toString() === uid;
    const isAdmin = role === 'admin' || role === 'superadmin';
    if (!isParticipant && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const designRef = collaboration.design._id || collaboration.design;
    const clientRef = collaboration.client._id || collaboration.client;
    const engineerRef = collaboration.engineer._id || collaboration.engineer;
    const messages = await Message.find({
      $and: [
        { $or: [{ sender: clientRef, receiver: engineerRef }, { sender: engineerRef, receiver: clientRef }] },
        { $or: [{ designId: designRef }, { designId: null, createdAt: { $gte: collaboration.startedAt } }] }
      ]
    }).populate('sender', 'name role').sort({ createdAt: 1 });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="collaboration-${collaboration._id}.pdf"`);
    doc.pipe(res);
    doc.fontSize(18).text('Collaboration Documentation', { underline: true });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`ID: ${collaboration._id}`);
    doc.text(`Status: ${collaboration.status}`);
    doc.text(`Client: ${collaboration.client?.name || 'N/A'}`);
    doc.text(`Engineer: ${collaboration.engineer?.name || 'N/A'}`);
    doc.text(`Design: ${collaboration.design?.title || 'N/A'}`);
    doc.moveDown().fontSize(14).text('Timeline', { underline: true }).fontSize(10);
    (collaboration.timeline || []).forEach((t) => doc.text(`• [${new Date(t.createdAt).toLocaleString()}] ${t.event}: ${t.description}`));
    doc.moveDown().fontSize(14).text('Chat History', { underline: true }).fontSize(10);
    messages.forEach((m) => doc.text(`[${new Date(m.createdAt).toLocaleString()}] ${m.sender?.name}: ${m.content || '[attachment]'}`));
    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) res.status(500).json({ message: error.message || 'Failed to export PDF' });
  }
};

exports.getFilterMeta = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const collabs = await Collaboration.find({})
      .populate('client', 'name email').populate('engineer', 'name email').populate('design', 'title')
      .select('client engineer design');
    const clientsMap = new Map(); const engineersMap = new Map(); const designsMap = new Map();
    collabs.forEach((c) => {
      if (c.client) clientsMap.set(c.client._id.toString(), c.client);
      if (c.engineer) engineersMap.set(c.engineer._id.toString(), c.engineer);
      if (c.design) designsMap.set(c.design._id.toString(), c.design);
    });
    res.json({
      success: true,
      clients: Array.from(clientsMap.values()),
      engineers: Array.from(engineersMap.values()),
      designs: Array.from(designsMap.values())
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
