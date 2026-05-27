const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getAllListings,
  getListingById,
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
  markAsSold,
  adminGetAllListings,
  adminApproveListing,
  adminRejectListing,
} = require('../controllers/listingController');

// ── Public routes ─────────────────────────────────────────
router.get('/', getAllListings);

// IMPORTANT: specific paths must come BEFORE /:id
router.get('/user/my-listings', protect, getMyListings);

// ── Admin routes ──────────────────────────────────────────
router.get('/admin/all',                protect, restrictTo('admin'), adminGetAllListings);
router.patch('/admin/:id/approve',      protect, restrictTo('admin'), adminApproveListing);
router.patch('/admin/:id/reject',       protect, restrictTo('admin'), adminRejectListing);
// Admin can also use the standard update/delete routes (they bypass ownership checks)

// ── Single listing (public) ────────────────────────────────
router.get('/:id', getListingById);

// ── Protected routes ──────────────────────────────────────
router.post('/',                protect, createListing);
router.put('/:id',              protect, updateListing);
router.delete('/:id',           protect, deleteListing);
router.patch('/:id/mark-sold',  protect, markAsSold);

module.exports = router;