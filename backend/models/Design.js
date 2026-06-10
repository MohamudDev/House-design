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
  budgetEstimate: {
    type: Number,
    required: [true, 'Please specify a budget estimate']
  },
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
  engineer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Design', designSchema);
