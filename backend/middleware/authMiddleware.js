const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async function(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('DEBUG: Auth Token decoded for user ID:', decoded.id);
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        console.error('DEBUG: User not found in DB for ID:', decoded.id);
        return res.status(401).json({ message: 'User not found' });
      }
      
      console.log('DEBUG: User authenticated:', req.user.email, 'Role:', req.user.role);
      return next();
    } catch (error) {
      console.error('DEBUG: Auth error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Grant access to specific roles
const authorize = function(...roles) {
  return function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
