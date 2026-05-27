const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('Missing JWT secrets. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env');
}

/* ── Token generation ──────────────────────────────────────── */

/** Short-lived access token — 15 minutes */
const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, ACCESS_SECRET, { expiresIn: '15m' });
};

/** Long-lived refresh token — 7 days */
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: '7d' });
};

/* ── Token verification ────────────────────────────────────── */

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

/* ── Cookie options ────────────────────────────────────────── */

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  path: '/',
};

const ACCESS_COOKIE_OPTIONS  = { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 };         // 15 min
const REFRESH_COOKIE_OPTIONS = { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 }; // 7 days

/** Attach both tokens as httpOnly cookies */
const attachTokenCookies = (res, user) => {
  const accessToken  = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  res.cookie('accessToken',  accessToken,  ACCESS_COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  return { accessToken, refreshToken };
};

/** Clear both auth cookies (logout) */
const clearTokenCookies = (res) => {
  const clearOptions = { ...COOKIE_BASE, maxAge: 0 };
  res.cookie('accessToken',  '', clearOptions);
  res.cookie('refreshToken', '', clearOptions);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  attachTokenCookies,
  clearTokenCookies,
};
