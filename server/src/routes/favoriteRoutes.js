const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  toggleFavorite,
  getMyFavorites,
  getMyFavoriteIds,
} = require('../controllers/favoriteController');

// All routes require authentication
router.get('/', protect, getMyFavorites);
router.get('/ids', protect, getMyFavoriteIds);
router.post('/toggle/:listingId', protect, toggleFavorite);

module.exports = router;