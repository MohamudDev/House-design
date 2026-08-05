const mongoose = require('mongoose');

const roomDetailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['bedroom', 'bathroom', 'kitchen', 'living', 'master', 'other'],
    default: 'other'
  },
  length: { type: Number, required: true, min: 0.01 },
  width: { type: Number, required: true, min: 0.01 },
  area: { type: Number, required: true, min: 0.01 }
}, { _id: false });

const snapshotSchema = new mongoose.Schema({
  title: String,
  rooms: Number,
  bathrooms: Number,
  kitchens: Number,
  livingRooms: Number,
  masterRooms: Number,
  houseLength: Number,
  houseWidth: Number,
  houseArea: Number
}, { _id: false });

const proposedSchema = new mongoose.Schema({
  rooms: Number,
  bathrooms: Number,
  kitchens: Number,
  livingRooms: Number,
  masterRooms: Number,
  houseLength: Number,
  houseWidth: Number,
  houseArea: Number,
  roomsDetail: [roomDetailSchema]
}, { _id: false });

const customizationRequestSchema = new mongoose.Schema({
  design: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design',
    required: true,
    index: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  engineer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originalSnapshot: { type: snapshotSchema, required: true },
  proposed: { type: proposedSchema, required: true },
  note: { type: String, default: '' },
  engineerNote: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CustomizationRequest', customizationRequestSchema);
