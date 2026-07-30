const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  ensureCollaboration, listCollaborations, getCollaboration,
  addEngineerNote, addClientNote, markComplete, closeCollaboration,
  exportPdf, getFilterMeta
} = require('../controllers/collaborationController');

router.use(protect);
router.get('/meta/filters', authorize('admin', 'superadmin'), getFilterMeta);
router.post('/ensure', ensureCollaboration);
router.get('/', listCollaborations);
router.get('/:id/export/pdf', exportPdf);
router.get('/:id', getCollaboration);
router.post('/:id/engineer-notes', addEngineerNote);
router.post('/:id/client-notes', addClientNote);
router.put('/:id/complete', markComplete);
router.put('/:id/close', closeCollaboration);

module.exports = router;
