const Design = require('../models/Design');

// @desc    Get all approved designs for clients
// @route   GET /api/client/designs
// @access  Private/Client
exports.getApprovedDesigns = async (req, res) => {
  try {
    console.log('DEBUG: getApprovedDesigns called by user:', req.user.id);
    const designs = await Design.find({ status: 'approved' })
      .populate('engineer', 'name email bio specialization isAvailable workingHours')
      .sort('-createdAt');

    if (designs.length > 0) {
      console.log('DEBUG: Sending bio to client:', designs[0].engineer?.bio);
    }
    res.status(200).json({
      success: true,
      count: designs.length,
      data: designs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single design details
// @route   GET /api/client/designs/:id
// @access  Private/Client
exports.getDesignById = async (req, res) => {
  try {
    const design = await Design.findOne({ _id: req.params.id, status: 'approved' })
      .populate('engineer', 'name email bio specialization isAvailable workingHours');

    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found or not approved' });
    }

    res.status(200).json({ success: true, data: design });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
