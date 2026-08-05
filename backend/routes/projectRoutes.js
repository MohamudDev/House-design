const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  listProjects,
  getProjectStats,
  getProject,
  startWork,
  updateSchedule,
  updateProgress,
  markCompleted,
  confirmDelivery,
  requestRevision,
  addClientComment
} = require('../controllers/projectController');

router.use(protect);

router.get('/', listProjects);
router.get('/stats', getProjectStats);
router.get('/:id', getProject);

router.post('/:id/start', authorize('engineer'), startWork);
router.put('/:id/schedule', authorize('engineer'), updateSchedule);
router.post(
  '/:id/progress',
  authorize('engineer'),
  upload.array('files', 8),
  updateProgress
);
router.post('/:id/complete', authorize('engineer'), markCompleted);

router.post('/:id/confirm-delivery', authorize('client'), confirmDelivery);
router.post('/:id/request-revision', authorize('client'), requestRevision);
router.post('/:id/comments', authorize('client'), addClientComment);

module.exports = router;
