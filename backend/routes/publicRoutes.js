const express = require('express');
const router = express.Router();
const { getPublicDesigns } = require('../controllers/publicController');

router.get('/designs', getPublicDesigns);

module.exports = router;
