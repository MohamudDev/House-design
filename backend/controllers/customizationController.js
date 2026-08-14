const Design = require('../models/Design');
const CustomizationRequest = require('../models/CustomizationRequest');
const Notification = require('../models/Notification');

const ROOM_TYPES = new Set(['bedroom', 'bathroom', 'kitchen', 'living', 'master', 'other']);

const roundArea = (length, width) => {
  const l = Number(length);
  const w = Number(width);
  if (!l || !w || l <= 0 || w <= 0) return null;
  return Math.round(l * w * 100) / 100;
};

const normalizeRoomsDetail = (rooms = []) =>
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
    .filter((r) => r.length > 0 && r.width > 0 && r.area > 0);

const validateProposed = (proposed) => {
  const houseLength = Number(proposed.houseLength);
  const houseWidth = Number(proposed.houseWidth);
  const houseArea = roundArea(houseLength, houseWidth);

  if (!houseLength || !houseWidth || !houseArea) {
    return { error: 'Please enter valid house length and width (meters).' };
  }

  const rooms = Number(proposed.rooms) || 0;
  const bathrooms = Number(proposed.bathrooms) || 0;
  if (rooms < 1 && bathrooms < 1) {
    return { error: 'Please set at least bedrooms or bathrooms.' };
  }

  // Optional room detail rows (legacy); if present, still enforce vs house area
  const roomsDetail = normalizeRoomsDetail(proposed.roomsDetail);
  if (roomsDetail.length > 0) {
    const totalRoomsArea = roomsDetail.reduce((sum, r) => sum + r.area, 0);
    if (totalRoomsArea > houseArea + 0.001) {
      return { error: 'Cabirka iyo qolalka isma qadanayaan (dimensions and rooms do not match).' };
    }
  }

  return {
    proposed: {
      rooms,
      bathrooms,
      kitchens: Number(proposed.kitchens) || 0,
      livingRooms: Number(proposed.livingRooms) || 0,
      masterRooms: Number(proposed.masterRooms) || 0,
      houseLength,
      houseWidth,
      houseArea,
      roomsDetail
    }
  };
};

const populateRequest = (query) =>
  query
    .populate('design', 'title images houseType houseLength houseWidth houseArea rooms bathrooms')
    .populate('client', 'name email')
    .populate('engineer', 'name email');

// @desc    Create customisation request
// @route   POST /api/customizations
// @access  Private/Client
exports.createCustomization = async (req, res) => {
  try {
    const { designId, proposed, note } = req.body;
    if (!designId) {
      return res.status(400).json({ success: false, message: 'Design is required.' });
    }

    const design = await Design.findById(designId).populate('engineer', 'name');
    if (!design || design.status !== 'approved' || design.isHidden) {
      return res.status(404).json({ success: false, message: 'Design not found or not available.' });
    }

    const validated = validateProposed(proposed || {});
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }

    const houseArea =
      design.houseArea ||
      roundArea(design.houseLength, design.houseWidth) ||
      validated.proposed.houseArea;

    const request = await CustomizationRequest.create({
      design: design._id,
      client: req.user._id,
      engineer: design.engineer._id || design.engineer,
      originalSnapshot: {
        title: design.title,
        rooms: design.rooms,
        bathrooms: design.bathrooms,
        kitchens: design.kitchens,
        livingRooms: design.livingRooms,
        masterRooms: design.masterRooms,
        houseLength: design.houseLength,
        houseWidth: design.houseWidth,
        houseArea
      },
      proposed: validated.proposed,
      note: (note || '').trim(),
      status: 'pending'
    });

    const engineerId = design.engineer._id || design.engineer;
    const notification = await Notification.create({
      recipient: engineerId,
      sender: req.user._id,
      type: 'general',
      title: 'New design customisation',
      message: `${req.user.name || 'A client'} requested changes for "${design.title}".`
    });

    if (req.io) {
      req.io.to(engineerId.toString()).emit('notification', notification);
    }

    const full = await populateRequest(CustomizationRequest.findById(request._id));
    res.status(201).json({ success: true, data: full });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Client's customisation requests
// @route   GET /api/customizations/mine
// @access  Private/Client
exports.getMyCustomizations = async (req, res) => {
  try {
    const items = await populateRequest(
      CustomizationRequest.find({ client: req.user._id }).sort('-createdAt')
    );
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Engineer's customisation requests
// @route   GET /api/customizations/engineer
// @access  Private/Engineer
exports.getEngineerCustomizations = async (req, res) => {
  try {
    const items = await populateRequest(
      CustomizationRequest.find({ engineer: req.user._id }).sort('-createdAt')
    );
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get one request
// @route   GET /api/customizations/:id
// @access  Private (client or engineer party)
exports.getCustomization = async (req, res) => {
  try {
    const item = await populateRequest(CustomizationRequest.findById(req.params.id));
    if (!item) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const uid = req.user._id.toString();
    const isParty =
      item.client._id.toString() === uid ||
      item.engineer._id.toString() === uid ||
      req.user.role === 'admin' ||
      req.user.role === 'superadmin';

    if (!isParty) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Engineer accept / decline
// @route   PUT /api/customizations/:id/respond
// @access  Private/Engineer
exports.respondCustomization = async (req, res) => {
  try {
    const { status, engineerNote } = req.body;
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or declined.' });
    }

    const item = await CustomizationRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (item.engineer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (item.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be responded to.' });
    }

    item.status = status;
    item.engineerNote = (engineerNote || '').trim();

    if (status === 'declined' && !item.engineerNote) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for declining so the client can see it.'
      });
    }

    await item.save();

    const noteSuffix = item.engineerNote ? ` Note: ${item.engineerNote}` : '';
    const notification = await Notification.create({
      recipient: item.client,
      sender: req.user._id,
      type: 'general',
      title: status === 'accepted' ? 'Customisation accepted' : 'Customisation declined',
      message:
        status === 'accepted'
          ? `Your design customisation request was accepted by the engineer.${noteSuffix}`
          : `Your design customisation was declined. Reason: ${item.engineerNote}`
    });

    if (req.io) {
      req.io.to(item.client.toString()).emit('notification', notification);
    }

    const full = await populateRequest(CustomizationRequest.findById(item._id));
    res.json({ success: true, data: full });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Client cancel pending
// @route   PUT /api/customizations/:id/cancel
// @access  Private/Client
exports.cancelCustomization = async (req, res) => {
  try {
    const item = await CustomizationRequest.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (item.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (item.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled.' });
    }

    item.status = 'cancelled';
    await item.save();

    const full = await populateRequest(CustomizationRequest.findById(item._id));
    res.json({ success: true, data: full });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
