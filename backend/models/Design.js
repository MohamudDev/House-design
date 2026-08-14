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
    required: [true, 'Please specify number of rooms'],
    min: [1, 'A design must have at least 1 room']
  },
  bathrooms: {
    type: Number,
    default: 1
  },
  kitchens: {
    type: Number,
    default: 1
  },
  livingRooms: {
    type: Number,
    default: 1
  },
  masterRooms: {
    type: Number,
    default: 0
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
    required: [true, 'Please specify a budget estimate'],
    min: [0.01, 'Price must be at least $0.01']
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
    length: Number, // m
    width: Number,  // m
    area: Number,   // m² (length × width)
  }],
  // Overall house footprint (meters) — Villa / Townhouse
  houseLength: {
    type: Number,
    min: [0.01, 'House length must be greater than 0']
  },
  houseWidth: {
    type: Number,
    min: [0.01, 'House width must be greater than 0']
  },
  houseArea: {
    type: Number // m² = houseLength × houseWidth
  },
  // Per-room dimensions including bathrooms (meters)
  roomDimensions: [{
    name: String,
    type: {
      type: String,
      enum: ['bedroom', 'bathroom', 'kitchen', 'living', 'master', 'other'],
      default: 'other'
    },
    length: Number,
    width: Number,
    area: Number
  }],
  price: {
    type: Number,
    default: 100 // Default price for fake payment simulation
  },
  /** Allow selling house as Half A, Half B, or Full */
  allowHalfSale: {
    type: Boolean,
    default: false
  },
  halfA: {
    label: { type: String, default: 'Half A' },
    rooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    area: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['available', 'sold'], default: 'available' }
  },
  halfB: {
    label: { type: String, default: 'Half B' },
    rooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    area: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['available', 'sold'], default: 'available' }
  },
  fullSaleStatus: {
    type: String,
    enum: ['available', 'sold'],
    default: 'available'
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
    order: Number,
    length: Number, // m
    width: Number,  // m
    area: Number    // m²
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
  isHidden: { type: Boolean, default: false },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Design', designSchema);
