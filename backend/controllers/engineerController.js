const Design = require('../models/Design');
const User = require('../models/User');

// @desc    Upload new design
// @route   POST /api/engineer/designs
// @access  Private/Engineer
exports.uploadDesign = async (req, res) => {
  try {
    const { title, houseType, rooms, budgetEstimate, description } = req.body;

    // Process files
    const images = req.files['images'] ? req.files['images'].map(file => `/uploads/${file.filename}`) : [];
    const plan2D = req.files['plan2D'] ? `/uploads/${req.files['plan2D'][0].filename}` : null;
    const model3D = req.files['model3D'] ? `/uploads/${req.files['model3D'][0].filename}` : null;

    const design = await Design.create({
      title,
      houseType,
      rooms,
      budgetEstimate,
      description,
      images,
      plan2D,
      model3D,
      engineer: req.user.id,
      status: 'pending' // Default status
    });

    res.status(201).json({
      success: true,
      data: design
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get engineer's designs
// @route   GET /api/engineer/designs
// @access  Private/Engineer
exports.getMyDesigns = async (req, res) => {
  try {
    const designs = await Design.find({ engineer: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, data: designs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get engineer dashboard stats
// @route   GET /api/engineer/stats
// @access  Private/Engineer
exports.getEngineerStats = async (req, res) => {
  try {
    const designs = await Design.find({ engineer: req.user.id });
    
    const totalDesigns = designs.length;
    const pendingDesigns = designs.filter(d => d.status === 'pending').length;
    const approvedDesigns = designs.filter(d => d.status === 'approved').length;
    
    // Messages are not fully implemented yet, returning placeholder 0
    const messagesReceived = 0;

    res.status(200).json({
      success: true,
      data: {
        totalDesigns,
        pendingDesigns,
        approvedDesigns,
        messagesReceived
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get engineer profile
// @route   GET /api/engineer/profile
// @access  Private/Engineer
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update engineer profile/availability
// @route   PUT /api/engineer/profile
// @access  Private/Engineer
exports.updateProfile = async (req, res) => {
  try {
    console.log('DEBUG: Update Profile Request Body:', req.body);
    const { bio, specialization, isAvailable, workingHours } = req.body;
    
    const user = await User.findOneAndUpdate(
      { _id: req.user.id },
      { 
        $set: { 
          bio: bio || '', 
          specialization: specialization || '', 
          isAvailable: isAvailable !== undefined ? isAvailable : true, 
          workingHours: workingHours || '9 AM - 5 PM' 
        } 
      },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('DEBUG: Updated User Data:', {
      id: user._id,
      bio: user.bio,
      available: user.isAvailable
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
