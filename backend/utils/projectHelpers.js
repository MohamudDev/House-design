const ProjectTimeline = require('../models/ProjectTimeline');
const Notification = require('../models/Notification');

async function appendTimeline({ projectId, status, progressPercentage, action, note, actor, actorRole }) {
  return ProjectTimeline.create({
    project: projectId,
    status,
    progressPercentage: progressPercentage ?? 0,
    action,
    note: note || '',
    actor,
    actorRole: actorRole || 'system'
  });
}

async function createNotification({ recipient, sender, project, type, title, message, io }) {
  const notification = await Notification.create({
    recipient,
    sender: sender || null,
    project: project || null,
    type: type || 'general',
    title,
    message
  });

  if (io && recipient) {
    io.to(recipient.toString()).emit('notification', notification);
  }

  return notification;
}

module.exports = { appendTimeline, createNotification };
