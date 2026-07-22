const Design = require('../models/Design');
const User = require('../models/User');
const Message = require('../models/Message');

// @desc    Get all approved designs for clients
// @route   GET /api/client/designs
// @access  Private/Client
exports.getApprovedDesigns = async (req, res) => {
  try {
    console.log('DEBUG: getApprovedDesigns called by user:', req.user.id);
    const designs = await Design.find({ status: 'approved', isHidden: { $ne: true } })
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
    const design = await Design.findOne({ _id: req.params.id, status: 'approved', isHidden: { $ne: true } })
      .populate('engineer', 'name email bio specialization isAvailable workingHours')
      .populate('ratings.user', 'name');

    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found or not approved' });
    }

    res.status(200).json({ success: true, data: design });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Get user's favorite designs
// @route   GET /api/client/favorites
// @access  Private/Client
exports.getFavorites = async (req, res) => {
  try {
    const user = await req.user.populate({
      path: 'favorites',
      match: { status: 'approved', isHidden: { $ne: true } },
      populate: {
        path: 'engineer',
        select: 'name email bio specialization isAvailable workingHours'
      }
    });

    res.status(200).json({
      success: true,
      count: user.favorites.length,
      data: user.favorites
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle a design in favorites
// @route   POST /api/client/favorites/:id
// @access  Private/Client
exports.toggleFavorite = async (req, res) => {
  try {
    const designId = req.params.id;
    const user = req.user;

    const isFavorited = user.favorites.includes(designId);

    if (isFavorited) {
      // Remove from favorites
      user.favorites = user.favorites.filter(id => id.toString() !== designId.toString());
    } else {
      // Add to favorites
      user.favorites.push(designId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      isFavorited: !isFavorited,
      favorites: user.favorites
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rate an engineer
// @route   POST /api/client/engineers/:id/rate
// @access  Private/Client
exports.rateEngineer = async (req, res) => {
  try {
    const engineerId = req.params.id;
    const clientId = req.user._id;
    const { isSatisfied, comment } = req.body;

    // Check if engineer exists
    const engineer = await User.findById(engineerId);
    if (!engineer || engineer.role !== 'engineer') {
      return res.status(404).json({ success: false, message: 'Engineer not found' });
    }

    // Verify they have communicated
    const hasCommunicated = await Message.findOne({
      $or: [
        { sender: clientId, receiver: engineerId },
        { sender: engineerId, receiver: clientId }
      ]
    });

    if (!hasCommunicated) {
      return res.status(400).json({ success: false, message: 'You can only rate engineers you have communicated with.' });
    }

    // Check if client already rated
    const existingRatingIndex = engineer.ratings.findIndex(r => r.client.toString() === clientId.toString());

    if (existingRatingIndex !== -1) {
      // Update existing
      engineer.ratings[existingRatingIndex].isSatisfied = isSatisfied;
      engineer.ratings[existingRatingIndex].comment = comment || '';
    } else {
      // Add new
      engineer.ratings.push({
        client: clientId,
        isSatisfied,
        comment: comment || ''
      });
    }

    await engineer.save();

    // Send feedback to Admin as a Contact message
    const Contact = require('../models/Contact');
    const contactMessage = new Contact({
      user: clientId,
      name: req.user.name,
      email: req.user.email,
      subject: `Client Feedback for Engineer: ${engineer.name}`,
      message: `Client ${req.user.name} left feedback for Engineer ${engineer.name}.\n\nSatisfied: ${isSatisfied ? 'Yes' : 'No'}\n\nComment: ${comment || 'No comment provided.'}`
    });
    await contactMessage.save();

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      ratings: engineer.ratings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Rate a design
// @route   POST /api/client/designs/:id/rate
// @access  Private/Client
exports.rateDesign = async (req, res) => {
  try {
    const designId = req.params.id;
    const userId = req.user._id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    if (!comment) {
      return res.status(400).json({ success: false, message: 'Please provide a comment' });
    }

    const design = await Design.findById(designId);
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    // Check if user already rated this design
    const existingRatingIndex = design.ratings.findIndex(r => r.user.toString() === userId.toString());

    if (existingRatingIndex !== -1) {
      // Update existing
      design.ratings[existingRatingIndex].rating = Number(rating);
      design.ratings[existingRatingIndex].comment = comment;
      design.ratings[existingRatingIndex].createdAt = Date.now();
    } else {
      // Add new
      design.ratings.push({
        user: userId,
        rating: Number(rating),
        comment
      });
    }

    await design.save();

    // Populate user name and return updated ratings
    const updatedDesign = await Design.findById(designId).populate('ratings.user', 'name');

    res.status(200).json({
      success: true,
      message: 'Design rated successfully',
      ratings: updatedDesign.ratings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
