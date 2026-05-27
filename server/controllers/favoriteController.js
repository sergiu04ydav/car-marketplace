const Favorite = require('../models/Favorite');
const CarListing = require('../models/CarListing');

/**
 * @desc    Toggle favorite (add if not exists, remove if exists)
 * @route   POST /api/favorites/toggle/:listingId
 * @access  Private
 */
exports.toggleFavorite = async (req, res) => {
  try {
    const { listingId } = req.params;

    // Check listing exists and is active
    const listing = await CarListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Anunț negăsit.' });
    }

    const existing = await Favorite.findOne({ user: req.user.id, listing: listingId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, favorited: false, message: 'Eliminat din favorite.' });
    }

    await Favorite.create({ user: req.user.id, listing: listingId });
    return res.json({ success: true, favorited: true, message: 'Adăugat la favorite.' });
  } catch (error) {
    console.error('toggleFavorite error:', error);
    if (error.code === 11000) {
      // Race condition: already exists, treat as remove
      await Favorite.findOneAndDelete({ user: req.user.id, listing: req.params.listingId });
      return res.json({ success: true, favorited: false, message: 'Eliminat din favorite.' });
    }
    return res.status(500).json({ success: false, message: 'Eroare server.' });
  }
};

/**
 * @desc    Get current user's favorites
 * @route   GET /api/favorites
 * @access  Private
 */
exports.getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate({
        path: 'listing',
        populate: { path: 'owner', select: 'username avatar' },
      })
      .sort('-createdAt');

    // Filter out deleted listings
    const validFavorites = favorites.filter((f) => f.listing !== null);

    return res.json({
      success: true,
      data: validFavorites.map((f) => f.listing.toPublicJSON()),
      count: validFavorites.length,
    });
  } catch (error) {
    console.error('getMyFavorites error:', error);
    return res.status(500).json({ success: false, message: 'Eroare server.' });
  }
};

/**
 * @desc    Get favorited listing IDs for current user (for UI state)
 * @route   GET /api/favorites/ids
 * @access  Private
 */
exports.getMyFavoriteIds = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id }).select('listing');
    return res.json({
      success: true,
      ids: favorites.map((f) => f.listing.toString()),
    });
  } catch (error) {
    console.error('getMyFavoriteIds error:', error);
    return res.status(500).json({ success: false, message: 'Eroare server.' });
  }
};