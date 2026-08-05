const Design = require('../models/Design');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Message = require('../models/Message');
const { getFileUrl } = require('../middleware/uploadMiddleware');

const ROOM_TYPES = new Set(['bedroom', 'bathroom', 'kitchen', 'living', 'master', 'other']);

const roundArea = (length, width) => {
  const l = Number(length);
  const w = Number(width);
  if (!l || !w || l <= 0 || w <= 0) return null;
  return Math.round(l * w * 100) / 100;
};

const normalizeUnits = (units = []) =>
  (Array.isArray(units) ? units : []).map((u) => {
    const length = u.length !== undefined && u.length !== '' ? Number(u.length) : undefined;
    const width = u.width !== undefined && u.width !== '' ? Number(u.width) : undefined;
    const area = roundArea(length, width) ?? (u.area !== undefined && u.area !== '' ? Number(u.area) : undefined);
    return {
      unitName: u.unitName,
      floorNumber: u.floorNumber,
      length: length && length > 0 ? length : undefined,
      width: width && width > 0 ? width : undefined,
      area: area && area > 0 ? area : undefined
    };
  });

const normalizeRoomDimensions = (rooms = []) =>
  (Array.isArray(rooms) ? rooms : [])
    .map((r) => {
      const length = Number(r.length);
      const width = Number(r.width);
      const area = roundArea(length, width);
      const type = ROOM_TYPES.has(r.type) ? r.type : 'other';
      return {
        name: (r.name || '').trim() || type.charAt(0).toUpperCase() + type.slice(1),
        type,
        length,
        width,
        area
      };
    })
    .filter((r) => r.length > 0 && r.width > 0);

const parseHouseDimensions = (body) => {
  const houseLength = body.houseLength !== undefined && body.houseLength !== '' ? Number(body.houseLength) : undefined;
  const houseWidth = body.houseWidth !== undefined && body.houseWidth !== '' ? Number(body.houseWidth) : undefined;
  const houseArea = roundArea(houseLength, houseWidth);
  return {
    houseLength: houseLength && houseLength > 0 ? houseLength : undefined,
    houseWidth: houseWidth && houseWidth > 0 ? houseWidth : undefined,
    houseArea: houseArea || undefined
  };
};

const validateDimensionsPayload = ({ houseType, houseLength, houseWidth, parsedUnits }) => {
  const isApartment = houseType === 'Apartment';

  if (!isApartment) {
    if (!houseLength || !houseWidth) {
      return 'Please enter house length and width (meters).';
    }
  } else if (parsedUnits && parsedUnits.length > 0) {
    for (const u of parsedUnits) {
      if (!u.length || !u.width || u.length <= 0 || u.width <= 0) {
        return 'Each apartment unit must have length and width (meters).';
      }
    }
  }

  return null;
};

// @desc    Upload new design
// @route   POST /api/engineer/designs
// @access  Private/Engineer
exports.uploadDesign = async (req, res) => {
  try {
    const { title, houseType, rooms, bathrooms, kitchens, livingRooms, masterRooms, carParking, budgetEstimate, price, description, location, numberOfFloors, totalUnits, units, parkingType, vehicleType, totalParkingSpaces, parkingLocation, reservedParking, visitorParking, parkingDescription } = req.body;

    if (houseType !== 'Apartment' && (!rooms || Number(rooms) < 1)) {
      return res.status(400).json({ success: false, message: 'A design must have at least 1 room.' });
    }

    const amount = Number(price || budgetEstimate);
    if (!amount || amount < 0.01) {
      return res.status(400).json({ success: false, message: 'Price must be at least $0.01.' });
    }

    // Process files
    const images = req.files['images'] ? req.files['images'].map(file => getFileUrl(file)) : [];
    const plan2D = req.files['plan2D'] ? getFileUrl(req.files['plan2D'][0]) : null;
    const model3D = req.files['model3D'] ? getFileUrl(req.files['model3D'][0]) : null;

    let parsedUnits = [];
    if (units) {
      try {
        parsedUnits = normalizeUnits(JSON.parse(units));
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

    let roomDimensions = [];
    if (req.body.roomDimensions) {
      try {
        roomDimensions = normalizeRoomDimensions(JSON.parse(req.body.roomDimensions));
      } catch (e) {
        roomDimensions = [];
      }
    }

    const { houseLength, houseWidth, houseArea } = parseHouseDimensions(req.body);

    const dimError = validateDimensionsPayload({
      houseType,
      houseLength,
      houseWidth,
      parsedUnits
    });
    if (dimError) {
      return res.status(400).json({ success: false, message: dimError });
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
            imagePath = getFileUrl(interiorFiles[fileIndex]);
            fileIndex++;
          }
          return {
            roomName: item.roomName,
            description: item.description,
            order: item.order,
            length: item.length ? Number(item.length) : undefined,
            width: item.width ? Number(item.width) : undefined,
            area: roundArea(item.length, item.width) || undefined,
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
      rooms: houseType === 'Apartment' ? Math.max(1, Number(rooms) || 1) : rooms,
      bathrooms: bathrooms || 1,
      kitchens: kitchens || 1,
      livingRooms: livingRooms !== undefined ? livingRooms : 1,
      masterRooms: masterRooms || 0,
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
      houseLength,
      houseWidth,
      houseArea,
      roomDimensions,
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
    const engineerId = req.user._id;
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(`${currentYear}-01-01`);

    const designs = await Design.find({ engineer: engineerId })
      .select('-model3D -plan2D')
      .sort('-createdAt')
      .lean();
    const designIds = designs.map((d) => d._id);

    const [
      soldDesignAgg,
      earningsAgg,
      messages,
      recentSalesTransactions,
      user,
      myTransactions,
      myMessages,
      designGrowth,
      bookingGrowth,
      earningsGrowth,
      messagesPerDesign
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { engineer: engineerId, paymentStatus: 'completed' } },
        { $group: { _id: '$design' } }
      ]),
      Transaction.aggregate([
        { $match: { engineer: engineerId, paymentStatus: 'completed' } },
        { $group: { _id: null, totalEarnings: { $sum: '$engineerAmount' } } }
      ]),
      Message.find({ receiver: engineerId }).select('content isRead createdAt designId').lean(),
      Transaction.find({ engineer: engineerId, paymentStatus: 'completed' })
        .sort('-createdAt')
        .limit(5)
        .populate('design', 'title')
        .lean(),
      User.findById(engineerId).select('walletBalance').lean(),
      Transaction.find({ engineer: engineerId })
        .populate('buyer', 'name email')
        .populate('design', 'title houseType price')
        .sort('-createdAt')
        .lean(),
      Message.find({ receiver: engineerId })
        .populate('sender', 'name email')
        .populate('designId', 'title')
        .sort('-createdAt')
        .limit(100)
        .lean(),
      Design.aggregate([
        { $match: { engineer: engineerId, createdAt: { $gte: yearStart } } },
        { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { engineer: engineerId, paymentStatus: 'completed', createdAt: { $gte: yearStart } } },
        { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { engineer: engineerId, paymentStatus: 'completed', createdAt: { $gte: yearStart } } },
        { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$engineerAmount' } } }
      ]),
      designIds.length
        ? Message.aggregate([
            { $match: { designId: { $in: designIds } } },
            { $group: { _id: '$designId', count: { $sum: 1 } } }
          ])
        : Promise.resolve([])
    ]);

    const totalDesigns = designs.length;
    const pendingDesigns = designs.filter((d) => d.status === 'pending').length;
    const approvedDesigns = designs.filter((d) => d.status === 'approved').length;
    const rejectedDesigns = designs.filter((d) => d.status === 'rejected').length;
    const activeProperties = approvedDesigns;
    const soldDesignIds = soldDesignAgg.map((t) => t._id.toString());
    const totalPropertiesSold = soldDesignIds.length;
    const totalUnsoldProperties = totalDesigns - totalPropertiesSold;
    const totalEarnings = earningsAgg.length > 0 ? earningsAgg[0].totalEarnings : 0;
    const messagesReceived = messages.length;
    const totalPendingReplies = messages.filter((m) => !m.isRead).length;
    const totalMessagesReplied = messagesReceived - totalPendingReplies;

    const messagesMap = {};
    messagesPerDesign.forEach((m) => {
      messagesMap[m._id] = m.count;
    });

    const propertyPerformance = designs.map((d) => ({
      _id: d._id,
      title: d.title,
      views: d.views || 0,
      favorites: d.favoritesCount || 0,
      messages: messagesMap[d._id] || 0,
      status: soldDesignIds.includes(d._id.toString()) ? 'Sold' : 'Unsold'
    }));

    const recentUploads = designs.slice(0, 5).map((d) => ({ type: 'upload', title: d.title, date: d.createdAt }));
    const recentMessages = [...messages]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((m) => ({ type: 'message', content: m.content, date: m.createdAt }));
    const recentSales = recentSalesTransactions.map((t) => ({
      type: 'sale',
      title: t.design?.title,
      amount: t.engineerAmount,
      date: t.createdAt
    }));
    const recentActivities = [...recentUploads, ...recentMessages, ...recentSales]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: {
        totalDesigns,
        totalApartments: designs.filter((d) => d.houseType === 'Apartment').length,
        pendingDesigns,
        approvedDesigns,
        rejectedDesigns,
        activeProperties,
        totalPropertiesSold,
        totalUnsoldProperties,
        totalBookings: myTransactions.filter((t) => t.paymentStatus === 'completed').length,
        messagesReceived,
        totalMessagesReplied,
        totalPendingReplies,
        totalEarnings,
        walletBalance: user?.walletBalance || 0,
        propertyPerformance,
        recentActivities,
        myDesigns: designs,
        myTransactions,
        myMessages,
        designGrowth,
        bookingGrowth,
        earningsGrowth
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
    const { title, houseType, rooms, bathrooms, kitchens, livingRooms, masterRooms, carParking, budgetEstimate, price, description, location, numberOfFloors, totalUnits, units, parkingType, vehicleType, totalParkingSpaces, parkingLocation, reservedParking, visitorParking, parkingDescription } = req.body;

    if (rooms !== undefined && houseType !== 'Apartment' && Number(rooms) < 1) {
      return res.status(400).json({ success: false, message: 'A design must have at least 1 room.' });
    }

    if (budgetEstimate !== undefined || price !== undefined) {
      const amount = Number(price !== undefined ? price : budgetEstimate);
      if (!amount || amount < 0.01) {
        return res.status(400).json({ success: false, message: 'Price must be at least $0.01.' });
      }
    }

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
        parsedUnits = normalizeUnits(JSON.parse(units));
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

    let roomDimensions = design.roomDimensions;
    if (req.body.roomDimensions !== undefined) {
      try {
        roomDimensions = normalizeRoomDimensions(JSON.parse(req.body.roomDimensions));
      } catch (e) {
        // keep existing
      }
    }

    const resolvedHouseType = houseType || design.houseType;
    const houseDims = parseHouseDimensions({
      houseLength: req.body.houseLength !== undefined ? req.body.houseLength : design.houseLength,
      houseWidth: req.body.houseWidth !== undefined ? req.body.houseWidth : design.houseWidth
    });

    // Only enforce dimensions when engineer is actively sending dimension fields
    if (req.body.houseLength !== undefined || req.body.houseWidth !== undefined || units) {
      const dimError = validateDimensionsPayload({
        houseType: resolvedHouseType,
        houseLength: houseDims.houseLength,
        houseWidth: houseDims.houseWidth,
        parsedUnits
      });
      if (dimError) {
        return res.status(400).json({ success: false, message: dimError });
      }
    }

    const updateData = {
      title,
      houseType,
      rooms,
      bathrooms,
      kitchens,
      livingRooms,
      masterRooms,
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

    if (req.body.houseLength !== undefined || req.body.houseWidth !== undefined) {
      updateData.houseLength = houseDims.houseLength;
      updateData.houseWidth = houseDims.houseWidth;
      updateData.houseArea = houseDims.houseArea;
    }

    if (req.body.roomDimensions !== undefined) {
      updateData.roomDimensions = roomDimensions;
    }

    if (req.body.interiorGalleryData) {
      try {
        const galleryData = JSON.parse(req.body.interiorGalleryData);
        const interiorFiles = (req.files && req.files['interiorImages']) ? req.files['interiorImages'] : [];
        
        let fileIndex = 0;
        updateData.interiorGallery = galleryData.map(item => {
          let imagePath = item.image; 
          if (item.hasNewFile && interiorFiles[fileIndex]) {
            imagePath = getFileUrl(interiorFiles[fileIndex]);
            fileIndex++;
          }
          return {
            roomName: item.roomName,
            description: item.description,
            order: item.order,
            length: item.length ? Number(item.length) : undefined,
            width: item.width ? Number(item.width) : undefined,
            area: roundArea(item.length, item.width) || undefined,
            image: imagePath
          };
        }).filter(item => item.image);
      } catch (e) {
        console.error('Error parsing interiorGalleryData:', e);
      }
    }

    if (req.files && req.files['images']) {
      updateData.images = req.files['images'].map(file => getFileUrl(file));
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
