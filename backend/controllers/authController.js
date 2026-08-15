const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getFileUrl } = require('../middleware/uploadMiddleware');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const normalizePhone = (phone) =>
  String(phone || '').replace(/[\s\-()]/g, '').trim();

const escapeRegex = (value) =>
  String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findUserByLogin = async (identifier, withPassword = false) => {
  const raw = String(identifier || '').trim();
  if (!raw) return null;

  const query = User.findOne(
    raw.includes('@')
      ? { email: { $regex: new RegExp(`^${escapeRegex(raw.toLowerCase())}$`, 'i') } }
      : { phone: normalizePhone(raw) }
  );

  return withPassword ? query.select('+password') : query;
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
    const { name, password, role, acceptedTerms } = body;
    const email = (body.email || '').trim().toLowerCase();
    const phone = normalizePhone(body.phone);

    if (!name || !phone || !email || !password) {
      return res.status(400).json({ message: 'Name, phone number, email, and password are required.' });
    }

    if (phone.length < 7) {
      return res.status(400).json({ message: 'Please enter a valid phone number.' });
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (role === 'engineer' && !acceptedTerms) {
      return res.status(400).json({ message: 'Engineers must accept the Terms and Conditions' });
    }

    let nationalIdUrl = '';
    let certificateUrl = '';
    let selfieUrl = '';

    if (role === 'engineer') {
      if (!req.files || !req.files['nationalId'] || !req.files['certificate'] || !req.files['selfie']) {
        return res.status(400).json({ message: 'Engineers must upload National ID, Certificate, and Selfie Verification' });
      }
      nationalIdUrl = getFileUrl(req.files['nationalId'][0]);
      certificateUrl = getFileUrl(req.files['certificate'][0]);
      selfieUrl = getFileUrl(req.files['selfie'][0]);
    }

    const orQuery = [
      { phone },
      { email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } }
    ];

    const userExists = await User.findOne({ $or: orQuery });

    if (userExists) {
      const samePhone = userExists.phone === phone;
      return res.status(400).json({
        message: samePhone
          ? 'An account with this phone number already exists'
          : 'An account with this email already exists'
      });
    }

    const userData = {
      name,
      phone,
      email,
      password,
      role,
      acceptedTerms: role === 'engineer' ? true : undefined,
      nationalIdUrl,
      certificateUrl,
      selfieUrl,
      verificationStatus: role === 'engineer' ? 'pending' : undefined
    };

    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email || '',
        phone: user.phone,
        role: user.role,
        isApproved: user.isApproved,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'phone';
      return res.status(400).json({
        message: field === 'email'
          ? 'An account with this email already exists'
          : 'An account with this phone number already exists'
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Please login with your email address' });
    }

    const user = await findUserByLogin(email, true);

    if (!user) {
      console.log('Login failed: no user for', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('Login failed: bad password for', email);
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
      email: user.email || '',
      phone: user.phone || '',
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
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      isApproved: user.isApproved,
      verificationStatus: user.verificationStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot password — send OTP code to email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (!user) {
      console.log('Forgot password: no user found for', normalizedEmail);
      return res.status(404).json({
        success: false,
        code: 'EMAIL_NOT_REGISTERED',
        message: 'This email is not registered. Please sign up first.'
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Password reset code</h2>
        <p style="margin: 0 0 16px; color: #475569;">
          Hi ${user.name || 'there'}, use this code to reset your House Design password:
        </p>
        <p style="margin: 0 0 20px; font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #4f46e5;">
          ${otp}
        </p>
        <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="margin: 0; color: #64748b; font-size: 13px;">If you did not request this, you can ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your House Design password reset code',
        html
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Forgot password email failed:', emailError.message);
      return res.status(500).json({ message: 'Email could not be sent. Please try again later.' });
    }

    res.json({
      success: true,
      message: 'A verification code has been sent to your email. Check your inbox and Spam folder.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password with email + OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedOtp = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code. Please request a new one.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully. You can now sign in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
