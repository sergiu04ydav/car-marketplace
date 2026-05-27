const express = require('express');
const { body, validationResult } = require('express-validator');
const passport = require('../config/passport');
const rateLimit = require('express-rate-limit');

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const {
  register,
  login,
  logout,
  getMe,
  refreshTokens,
  googleCallback,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

// Validation rule sets
const registerRules = [
  body('username').trim().isLength({ min: 2, max: 50 }).withMessage('Username must be between 2 and 50 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
];

// Routes
router.post('/register',           registerRules,         validate, register);
router.post('/login',              loginLimiter, loginRules, validate, login);
router.post('/logout',             protect,               logout);
router.get('/me',                  protect,               getMe);
router.post('/refresh',                                   refreshTokens);
router.post('/forgot-password',    forgotPasswordLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password',     resetPasswordRules,    validate, resetPassword);
router.get('/verify-email',        verifyEmail);
router.post('/resend-verification', protect,              resendVerification);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
  }),
  googleCallback,
);

module.exports = router;
