const Collaboration = require('../models/Collaboration');
const Design = require('../models/Design');

function buildChatId(clientId, engineerId, designId) {
  return `${clientId}_${engineerId}_${designId}`;
}

async function findOrCreateCollaboration({ clientId, engineerId, designId, actorId }) {
  const chatId = buildChatId(clientId, engineerId, designId);
  let collaboration = await Collaboration.findOne({ client: clientId, engineer: engineerId, design: designId });
  if (collaboration) return { collaboration, created: false };

  const design = await Design.findById(designId).select('engineer title');
  if (!design) throw new Error('Design not found');

  try {
    collaboration = await Collaboration.create({
      client: clientId,
      engineer: engineerId,
      design: designId,
      chatId,
      status: 'Active',
      startedAt: new Date(),
      lastActivity: new Date(),
      timeline: [{
        event: 'conversation_started',
        description: 'Client started the conversation about this design.',
        actor: actorId || clientId,
        createdAt: new Date()
      }],
      activityLog: [{
        action: 'collaboration_created',
        actor: actorId || clientId,
        details: `Collaboration started for design ${design.title || designId}`,
        createdAt: new Date()
      }]
    });
    return { collaboration, created: true };
  } catch (err) {
    if (err && err.code === 11000) {
      collaboration = await Collaboration.findOne({ client: clientId, engineer: engineerId, design: designId });
      if (collaboration) return { collaboration, created: false };
    }
    throw err;
  }
}

async function appendTimeline(collaboration, event, description, actorId) {
  collaboration.timeline.push({ event, description, actor: actorId, createdAt: new Date() });
  collaboration.activityLog.push({ action: event, actor: actorId, details: description, createdAt: new Date() });
  collaboration.lastActivity = new Date();
  await collaboration.save();
  return collaboration;
}

async function syncOntoExisting(collaboration, message, senderRole, justCreated = false) {
  const senderId = message.sender._id || message.sender;
  const hasAttachment = Boolean(message.attachmentUrl);

  if (!justCreated) {
    let event; let description;
    if (senderRole === 'client') {
      event = 'client_message';
      description = hasAttachment ? 'Client sent a message with an attachment.' : 'Client sent a message.';
    } else if (senderRole === 'engineer') {
      const hasEngineerReply = collaboration.timeline.some(t => t.event === 'engineer_replied' || t.event === 'engineer_message');
      if (!hasEngineerReply) {
        event = 'engineer_replied';
        description = 'Engineer replied to the conversation.';
      } else {
        event = 'engineer_message';
        description = hasAttachment ? 'Engineer sent a message with an attachment.' : 'Engineer sent a message.';
      }
    } else {
      event = 'client_message';
      description = 'A message was sent.';
    }
    collaboration.timeline.push({ event, description, actor: senderId, createdAt: message.createdAt || new Date() });
  }

  if (hasAttachment) {
    const fileType = message.attachmentType || 'file';
    const isRevision = fileType === '3d';
    const fileName = (message.attachmentUrl || '').split('/').pop() || 'attachment';
    collaboration.files.push({
      fileName, fileType, fileUrl: message.attachmentUrl, uploadedBy: senderId,
      uploadedAt: message.createdAt || new Date(), messageId: message._id
    });
    collaboration.timeline.push({
      event: isRevision ? 'design_revision_shared' : 'file_uploaded',
      description: isRevision ? `Design revision shared: ${fileName}` : `File uploaded: ${fileName}`,
      actor: senderId,
      createdAt: message.createdAt || new Date()
    });
    collaboration.activityLog.push({
      action: isRevision ? 'design_revision_shared' : 'file_uploaded',
      actor: senderId, details: fileName, createdAt: new Date()
    });
  }

  collaboration.lastActivity = new Date();
  await collaboration.save();
  return collaboration;
}

async function syncMessageToCollaboration(message, senderRole) {
  try {
    const senderId = message.sender._id || message.sender;
    const receiverId = message.receiver._id || message.receiver;
    let designId = message.designId?._id || message.designId || null;
    let clientId; let engineerId;

    if (senderRole === 'client') { clientId = senderId; engineerId = receiverId; }
    else if (senderRole === 'engineer') { engineerId = senderId; clientId = receiverId; }
    else return null;

    if (!designId) {
      const existing = await Collaboration.findOne({ client: clientId, engineer: engineerId, status: 'Active' }).sort({ lastActivity: -1 });
      if (!existing) return null;
      return syncOntoExisting(existing, message, senderRole, false);
    }

    const { collaboration, created } = await findOrCreateCollaboration({
      clientId, engineerId, designId, actorId: senderId
    });
    return syncOntoExisting(collaboration, message, senderRole, created);
  } catch (err) {
    console.error('Collaboration sync error:', err.message);
    return null;
  }
}

module.exports = { buildChatId, findOrCreateCollaboration, appendTimeline, syncMessageToCollaboration };
