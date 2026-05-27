const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { verifyAccessToken, verifyRefreshToken, attachTokenCookies } = require('../utils/jwt');

/**
 * Protect routes — verifies access token from cookie.
 * If access token is expired, silently rotates using refresh token.
 */
const protect = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    // 1. Try access token first
    if (accessToken) {
      try {
        const decoded = verifyAccessToken(accessToken);
        const user = await User.findById(decoded.id).select('role isEmailVerified');
        req.user = { id: decoded.id, role: decoded.role, isEmailVerified: user?.isEmailVerified || false };
        return next();
      } catch (err) {
        // Only continue if the token is simply expired — any other error is a hard fail
        if (err.name !== 'TokenExpiredError') {
          return res.status(401).json({ message: 'Invalid token. Please log in again.' });
        }
      }
    }

    // 2. Try refresh token rotation
    if (!refreshToken) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken +password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or account disabled.' });
    }

    const tokenValid = await bcrypt.compare(refreshToken, user.refreshToken || '');
    if (!tokenValid) {
      return res.status(401).json({ message: 'Invalid session. Please log in again.' });
    }

    // Rotate refresh token
    const { refreshToken: newRefreshToken } = attachTokenCookies(res, user);
    const salt = await bcrypt.genSalt(10);
    user.refreshToken = await bcrypt.hash(newRefreshToken, salt);
    await user.save({ validateBeforeSave: false });

    req.user = { id: user._id, role: user.role, isEmailVerified: user.isEmailVerified };
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error.' });
  }
};

/**
 * Restrict access to specific roles.
 * Usage: restrictTo('admin')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };