const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false // Do not return password by default
  },
  role: {
    type: String,
    enum: ['client', 'engineer', 'admin', 'superadmin'],
    default: 'client'
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: function() {
      // Engineers need approval, clients and admins don't
      return this.role !== 'engineer';
    }
  },
  // Engineer specific fields
  nationalIdUrl: { type: String, default: '' },
  certificateUrl: { type: String, default: '' },
  selfieUrl: { type: String, default: '' },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  bio: { type: String, default: '' },
  specialization: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  workingHours: { type: String, default: '9 AM - 5 PM' },
  walletBalance: { type: Number, default: 0 },
  acceptedTerms: { type: Boolean, default: false },
  ratings: [{
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isSatisfied: Boolean,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  // Client specific fields
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design'
  }]
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
