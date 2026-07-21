const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('--- NEW REGISTRATION REQUEST ---');
    console.log('Headers:', req.headers['content-type']);
    console.log('Body:', req.body);
    console.log('Files:', req.files ? Object.keys(req.files) : 'none');
    
    // Fallback to empty object to prevent "Cannot destructure property" crash
    const body = req.body || {};
    const { name, email, password, role, acceptedTerms } = body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields. The form data was not parsed correctly by the server.' });
    }

    if (role === 'engineer' && !acceptedTerms) {
      return res.status(400).json({ message: 'Engineers must accept the Terms and Conditions' });
    }

    let nationalIdUrl = '';
    let certificateUrl = '';

    if (role === 'engineer') {
      if (!req.files || !req.files['nationalId'] || !req.files['certificate']) {
        return res.status(400).json({ message: 'Engineers must upload National ID and Engineering Certificate' });
      }
      nationalIdUrl = `/uploads/${req.files['nationalId'][0].filename}`;
      certificateUrl = `/uploads/${req.files['certificate'][0].filename}`;
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      acceptedTerms: role === 'engineer' ? true : undefined,
      nationalIdUrl,
      certificateUrl,
      verificationStatus: role === 'engineer' ? 'pending' : undefined
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({ message: 'Your account is suspended by the administrator.' });
    }

    // Check if engineer is approved
    if (user.role === 'engineer' && !user.isApproved) {
      return res.status(403).json({ message: `Your account is ${user.verificationStatus || 'pending verification'}` });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      verificationStatus: user.verificationStatus,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      verificationStatus: user.verificationStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
