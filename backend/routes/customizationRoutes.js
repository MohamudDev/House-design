const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createCustomization,
  getMyCustomizations,
  getEngineerCustomizations,
  getCustomization,
  respondCustomization,
  cancelCustomization
} = require('../controllers/customizationController');

router.use(protect);

router.post('/', authorize('client'), createCustomization);
router.get('/mine', authorize('client'), getMyCustomizations);
router.get('/engineer', authorize('engineer'), getEngineerCustomizations);
router.get('/:id', getCustomization);
router.put('/:id/respond', authorize('engineer'), respondCustomization);
router.put('/:id/cancel', authorize('client'), cancelCustomization);

module.exports = router;
