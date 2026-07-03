const Design = require('../models/Design');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Upload new design
// @route   POST /api/engineer/designs
// @access  Private/Engineer
exports.uploadDesign = async (req, res) => {
  try {
    const { title, houseType, rooms, bathrooms, kitchens, carParking, budgetEstimate, price, description } = req.body;

    // Process files
    const images = req.files['images'] ? req.files['images'].map(file => `/uploads/${file.filename}`) : [];
    const plan2D = req.files['plan2D'] ? `/uploads/${req.files['plan2D'][0].filename}` : null;
    const model3D = req.files['model3D'] ? `/uploads/${req.files['model3D'][0].filename}` : null;

    const design = await Design.create({
      title,
      houseType,
      rooms,
      bathrooms: bathrooms || 1,
      kitchens: kitchens || 1,
      carParking: carParking === 'true' || carParking === true,
      budgetEstimate,
      price: price || budgetEstimate,
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
    const rejectedDesigns = designs.filter(d => d.status === 'rejected').length;
    
    const transactions = await Transaction.aggregate([
      { $match: { engineer: req.user._id, paymentStatus: 'completed' } },
      { $group: { _id: null, totalEarnings: { $sum: "$engineerAmount" } } }
    ]);
    const totalEarnings = transactions.length > 0 ? transactions[0].totalEarnings : 0;

    // Messages are not fully implemented yet, returning placeholder 0
    const messagesReceived = 0;
    const user = await User.findById(req.user._id);
    const walletBalance = user.walletBalance || 0;

    res.status(200).json({
      success: true,
      data: {
        totalDesigns,
        pendingDesigns,
        approvedDesigns,
        rejectedDesigns,
        messagesReceived,
        totalEarnings,
        walletBalance
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

// @desc    Update a design (metadata and optional thumbnail)
// @route   PUT /api/engineer/designs/:id
// @access  Private/Engineer
exports.updateDesign = async (req, res) => {
  try {
    const { title, houseType, rooms, budgetEstimate, price, description } = req.body;
    
    let design = await Design.findById(req.params.id);
    
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    if (design.engineer.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this design' });
    }

    const updateData = {
      title,
      houseType,
      rooms,
      budgetEstimate,
      price: price || budgetEstimate,
      description,
      status: 'pending' // Reset status to pending for admin re-approval
    };

    if (req.files && req.files['images']) {
      updateData.images = req.files['images'].map(file => `/uploads/${file.filename}`);
    }

    design = await Design.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: design });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a design
// @route   DELETE /api/engineer/designs/:id
// @access  Private/Engineer
exports.deleteDesign = async (req, res) => {
  try {
    const design = await Design.findById(req.params.id);
    
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    if (design.engineer.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this design' });
    }

    await design.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
