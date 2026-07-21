const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  houseType: {
    type: String,
    required: [true, 'Please specify house type']
  },
  rooms: {
    type: Number,
    required: [true, 'Please specify number of rooms']
  },
  bathrooms: {
    type: Number,
    default: 1
  },
  kitchens: {
    type: Number,
    default: 1
  },
  carParking: {
    type: Boolean,
    default: false
  },
  parkingType: {
    type: String
  },
  vehicleType: [{
    type: String
  }],
  totalParkingSpaces: {
    type: Number
  },
  parkingLocation: {
    type: String
  },
  reservedParking: {
    type: Boolean,
    default: false
  },
  visitorParking: {
    type: Boolean,
    default: false
  },
  parkingDescription: {
    type: String
  },
  budgetEstimate: {
    type: Number,
    required: [true, 'Please specify a budget estimate']
  },
  location: {
    type: String,
  },
  numberOfFloors: {
    type: Number,
  },
  totalUnits: {
    type: Number,
  },
  units: [{
    unitName: String,
    floorNumber: String,
    bedrooms: Number,
    bathrooms: Number,
    kitchens: Number,
    livingRooms: Number,
    diningRooms: Number,
    balconies: Number,
    area: Number,
  }],
  price: {
    type: Number,
    default: 100 // Default price for fake payment simulation
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  images: [{
    type: String // paths to uploaded images
  }],
  plan2D: {
    type: String // path to uploaded 2D plan
  },
  model3D: {
    type: String // path to uploaded 3D model
  },
  interiorGallery: [{
    roomName: String,
    image: String,
    description: String,
    order: Number
  }],
  engineer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  views: { type: Number, default: 0 },
  favoritesCount: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  isHidden: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('Design', designSchema);
