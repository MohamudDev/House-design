const Design = require('../models/Design');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Message = require('../models/Message');

// @desc    Upload new design
// @route   POST /api/engineer/designs
// @access  Private/Engineer
exports.uploadDesign = async (req, res) => {
  try {
    const { title, houseType, rooms, bathrooms, kitchens, carParking, budgetEstimate, price, description, location, numberOfFloors, totalUnits, units, parkingType, vehicleType, totalParkingSpaces, parkingLocation, reservedParking, visitorParking, parkingDescription } = req.body;

    // Process files
    const images = req.files['images'] ? req.files['images'].map(file => `/uploads/${file.filename}`) : [];
    const plan2D = req.files['plan2D'] ? `/uploads/${req.files['plan2D'][0].filename}` : null;
    const model3D = req.files['model3D'] ? `/uploads/${req.files['model3D'][0].filename}` : null;

    let parsedUnits = [];
    if (units) {
      try {
        parsedUnits = JSON.parse(units);
      } catch (e) {
        parsedUnits = [];
      }
    }

    let parsedVehicleType = [];
    if (vehicleType) {
      try {
        parsedVehicleType = JSON.parse(vehicleType);
      } catch (e) {
        parsedVehicleType = [];
      }
    }

    let interiorGallery = [];
    if (req.body.interiorGalleryData) {
      try {
        const galleryData = JSON.parse(req.body.interiorGalleryData);
        const interiorFiles = req.files['interiorImages'] || [];
        
        let fileIndex = 0;
        interiorGallery = galleryData.map(item => {
          // If item indicates it has a new file, we grab the next file from interiorFiles
          let imagePath = item.image; // fallback to whatever was sent
          if (item.hasNewFile && interiorFiles[fileIndex]) {
            imagePath = `/uploads/${interiorFiles[fileIndex].filename}`;
            fileIndex++;
          }
          return {
            roomName: item.roomName,
            description: item.description,
            order: item.order,
            image: imagePath
          };
        }).filter(item => item.image); // Only keep items with an image
      } catch (e) {
        console.error('Error parsing interiorGalleryData:', e);
      }
    }

    const design = await Design.create({
      title,
      houseType,
      rooms,
      bathrooms: bathrooms || 1,
      kitchens: kitchens || 1,
      carParking: carParking === 'true' || carParking === true,
      parkingType,
      vehicleType: parsedVehicleType,
      totalParkingSpaces: totalParkingSpaces ? Number(totalParkingSpaces) : undefined,
      parkingLocation,
      reservedParking: reservedParking === 'true' || reservedParking === true,
      visitorParking: visitorParking === 'true' || visitorParking === true,
      parkingDescription,
      budgetEstimate,
      price: price || budgetEstimate,
      description,
      location,
      numberOfFloors,
      totalUnits,
      units: parsedUnits,
      images,
      plan2D,
      model3D,
      interiorGallery,
      engineer: req.user.id,
      status: req.user.isApproved ? 'approved' : 'pending'
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
    const designs = await Design.find({ engineer: req.user.id })
      .populate('ratings.user', 'name')
      .sort('-createdAt');
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
    
    // Property Reports
    const activeProperties = approvedDesigns;
    
    const transactions = await Transaction.aggregate([
      { $match: { engineer: req.user._id, paymentStatus: 'completed' } },
      { $group: { _id: "$design" } }
    ]);
    const soldDesignIds = transactions.map(t => t._id.toString());
    
    const totalPropertiesSold = soldDesignIds.length;
    const totalUnsoldProperties = totalDesigns - totalPropertiesSold;

    const allTransactions = await Transaction.aggregate([
      { $match: { engineer: req.user._id, paymentStatus: 'completed' } },
      { $group: { _id: null, totalEarnings: { $sum: "$engineerAmount" } } }
    ]);
    const totalEarnings = allTransactions.length > 0 ? allTransactions[0].totalEarnings : 0;

    // Customer Communication Reports
    const messages = await Message.find({ receiver: req.user._id });
    const messagesReceived = messages.length;
    const totalPendingReplies = messages.filter(m => !m.isRead).length;
    const totalMessagesReplied = messagesReceived - totalPendingReplies;

    // Property Performance
    const designIds = designs.map(d => d._id);
    const messagesPerDesign = await Message.aggregate([
      { $match: { designId: { $in: designIds } } },
      { $group: { _id: "$designId", count: { $sum: 1 } } }
    ]);
    const messagesMap = {};
    messagesPerDesign.forEach(m => messagesMap[m._id] = m.count);

    const propertyPerformance = designs.map(d => ({
      _id: d._id,
      title: d.title,
      views: d.views || 0,
      favorites: d.favoritesCount || 0,
      messages: messagesMap[d._id] || 0,
      status: soldDesignIds.includes(d._id.toString()) ? 'Sold' : 'Unsold'
    }));

    // Recent Activities
    const recentUploads = [...designs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(d => ({ type: 'upload', title: d.title, date: d.createdAt }));
    const recentMessages = [...messages].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(m => ({ type: 'message', content: m.content, date: m.createdAt }));
    
    const recentSalesTransactions = await Transaction.find({ engineer: req.user._id, paymentStatus: 'completed' })
      .sort('-createdAt').limit(5).populate('design', 'title');
    const recentSales = recentSalesTransactions.map(t => ({ type: 'sale', title: t.design?.title, amount: t.engineerAmount, date: t.createdAt }));

    const recentActivities = [...recentUploads, ...recentMessages, ...recentSales]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    const user = await User.findById(req.user._id);
    const walletBalance = user.walletBalance || 0;

    res.status(200).json({
      success: true,
      data: {
        totalDesigns,
        pendingDesigns,
        approvedDesigns,
        rejectedDesigns,
        activeProperties,
        totalPropertiesSold,
        totalUnsoldProperties,
        messagesReceived,
        totalMessagesReplied,
        totalPendingReplies,
        totalEarnings,
        walletBalance,
        propertyPerformance,
        recentActivities
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
    const { title, houseType, rooms, bathrooms, kitchens, carParking, budgetEstimate, price, description, location, numberOfFloors, totalUnits, units, parkingType, vehicleType, totalParkingSpaces, parkingLocation, reservedParking, visitorParking, parkingDescription } = req.body;
    
    let design = await Design.findById(req.params.id);
    
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    if (design.engineer.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this design' });
    }

    let parsedUnits = design.units;
    if (units) {
      try {
        parsedUnits = JSON.parse(units);
      } catch (e) {
        // keep existing units if parse fails or skip
      }
    }

    let parsedVehicleType = design.vehicleType;
    if (vehicleType) {
      try {
        parsedVehicleType = JSON.parse(vehicleType);
      } catch (e) {
        // keep existing
      }
    }

    const updateData = {
      title,
      houseType,
      rooms,
      bathrooms,
      kitchens,
      carParking: carParking === 'true' || carParking === true,
      parkingType,
      vehicleType: parsedVehicleType,
      totalParkingSpaces: totalParkingSpaces ? Number(totalParkingSpaces) : undefined,
      parkingLocation,
      reservedParking: reservedParking === 'true' || reservedParking === true,
      visitorParking: visitorParking === 'true' || visitorParking === true,
      parkingDescription,
      budgetEstimate,
      price: price || budgetEstimate,
      description,
      location,
      numberOfFloors,
      totalUnits,
      units: parsedUnits,
      status: req.user.isApproved ? 'approved' : 'pending'
    };

    if (req.body.interiorGalleryData) {
      try {
        const galleryData = JSON.parse(req.body.interiorGalleryData);
        const interiorFiles = (req.files && req.files['interiorImages']) ? req.files['interiorImages'] : [];
        
        let fileIndex = 0;
        updateData.interiorGallery = galleryData.map(item => {
          let imagePath = item.image; 
          if (item.hasNewFile && interiorFiles[fileIndex]) {
            imagePath = `/uploads/${interiorFiles[fileIndex].filename}`;
            fileIndex++;
          }
          return {
            roomName: item.roomName,
            description: item.description,
            order: item.order,
            image: imagePath
          };
        }).filter(item => item.image);
      } catch (e) {
        console.error('Error parsing interiorGalleryData:', e);
      }
    }

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
