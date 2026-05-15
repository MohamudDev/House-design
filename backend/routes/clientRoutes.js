const express = require('express');
const router = express.Router();
const { getApprovedDesigns, getDesignById } = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All client routes are protected
router.use(protect);
router.use(authorize('client'));

router.get('/designs', getApprovedDesigns);
router.get('/designs/:id', getDesignById);

module.exports = router;
