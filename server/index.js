require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const passport = require('./config/passport');
const authRoutes = require('./routes/authRoutes');

const app = express();
connectDB();

/* ── CORS ────────────────────────────────────────────────────── */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }),
);

/* ── Middleware ──────────────────────────────────────────────── */
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

/* ── Global rate limit ───────────────────────────────────────── */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/* ── Health check ────────────────────────────────────────────── */
app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() }),
);

/* ── Routes ──────────────────────────────────────────────────── */
app.use('/api/auth',      authRoutes);
app.use('/api/listings',  require('./routes/listingRoutes'));
app.use('/api/upload',    require('./routes/uploadRoutes'));
app.use('/api/favorites', require('./routes/favoriteRoutes')); // ← NEW

/* ── Error handlers ──────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
});

/* ── Start ───────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));