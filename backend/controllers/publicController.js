const Design = require('../models/Design');

// @desc    Get all approved designs (Public)
// @route   GET /api/public/designs
// @access  Public
exports.getPublicDesigns = async (req, res) => {
  try {
    const designs = await Design.find({ status: 'approved' })
      .populate('engineer', 'name email bio specialization isAvailable workingHours')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: designs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
