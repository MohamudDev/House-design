const express = require('express');
const router = express.Router();
const { getApprovedDesigns, getDesignById, getFavorites, toggleFavorite, rateEngineer, rateDesign } = require('../controllers/clientController');
const { checkout, getPurchases } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All client routes are protected
router.use(protect);

router.get('/designs/:id', getDesignById);

router.use(authorize('client'));

router.get('/designs', getApprovedDesigns);
router.get('/favorites', getFavorites);
router.post('/favorites/:id', toggleFavorite);
router.post('/designs/:id/rate', rateDesign);
router.post('/engineers/:id/rate', rateEngineer);
router.post('/checkout/:designId', checkout);
router.get('/purchases', getPurchases);

module.exports = router;
