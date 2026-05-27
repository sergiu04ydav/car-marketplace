const CarListing = require('../models/CarListing');

/**
 * @desc    Get toate anunțurile publice active (cu filtre opționale)
 * @route   GET /api/listings
 * @access  Public
 */
exports.getAllListings = async (req, res) => {
  try {
    const {
      brand, model, minPrice, maxPrice,
      minYear, maxYear, fuelType, transmission,
      city, status = 'active',
      page = 1, limit = 12, sort = '-createdAt',
    } = req.query;

    const filter = { status };

    if (brand) filter.brand = new RegExp(brand, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = Number(minYear);
      if (maxYear) filter.year.$lte = Number(maxYear);
    }
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (city) filter['location.city'] = new RegExp(city, 'i');

    const skip = (Number(page) - 1) * Number(limit);

    const listings = await CarListing.find(filter)
      .populate('owner', 'username email avatar')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    const total = await CarListing.countDocuments(filter);

    res.json({
      success: true,
      data: listings.map((l) => l.toPublicJSON()),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('Error in getAllListings:', error);
    res.status(500).json({ success: false, message: 'Eroare la obținerea anunțurilor' });
  }
};

/**
 * @desc    Get un singur anunț după ID
 * @route   GET /api/listings/:id
 * @access  Public
 */
exports.getListingById = async (req, res) => {
  try {
    const listing = await CarListing.findById(req.params.id).populate('owner', 'username email avatar phone');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Anunț negăsit' });
    }

    if (!req.user || listing.owner._id.toString() !== req.user.id) {
      await listing.incrementViews();
    }

    res.json({ success: true, data: listing.toPublicJSON() });
  } catch (error) {
    console.error('Error in getListingById:', error);
    res.status(500).json({ success: false, message: 'Eroare la obținerea anunțului' });
  }
};

/**
 * @desc    Get anunțurile utilizatorului curent (toate statusurile)
 * @route   GET /api/listings/user/my-listings
 * @access  Private
 */
exports.getMyListings = async (req, res) => {
  try {
    const listings = await CarListing.find({ owner: req.user.id }).sort('-createdAt');
    res.json({ success: true, data: listings.map((l) => l.toPublicJSON()), count: listings.length });
  } catch (error) {
    console.error('Error in getMyListings:', error);
    res.status(500).json({ success: false, message: 'Eroare la obținerea anunțurilor' });
  }
};

/**
 * @desc    Creează un anunț nou (status: pending — awaiting admin approval)
 * @route   POST /api/listings
 * @access  Private
 */
exports.createListing = async (req, res) => {
  try {
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Trebuie să îți verifici emailul pentru a posta anunțuri',
      });
    }

    const listingData = {
      ...req.body,
      owner: req.user.id,
      status: 'pending', // Always pending until admin approves
    };

    const listing = await CarListing.create(listingData);

    res.status(201).json({
      success: true,
      message: 'Anunțul a fost trimis spre aprobare. Vei fi notificat când administratorul îl verifică.',
      data: listing.toPublicJSON(),
    });
  } catch (error) {
    console.error('Error in createListing:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Date invalide',
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({ success: false, message: 'Eroare la crearea anunțului' });
  }
};

/**
 * @desc    Actualizează un anunț (owner only; resets to pending)
 * @route   PUT /api/listings/:id
 * @access  Private
 */
exports.updateListing = async (req, res) => {
  try {
    const listing = await CarListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Anunț negăsit' });
    }

    if (listing.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Nu ai permisiunea să modifici acest anunț' });
    }

    delete req.body.owner;

    // If owner (not admin) edits, reset to pending for re-approval
    if (req.user.role !== 'admin') {
      req.body.status = 'pending';
      req.body.rejectionReason = null;
      req.body.reviewedBy = null;
      req.body.reviewedAt = null;
    }

    Object.assign(listing, req.body);
    await listing.save();

    const message = req.user.role === 'admin'
      ? 'Anunț actualizat cu succes'
      : 'Anunțul a fost actualizat și trimis spre re-aprobare.';

    res.json({ success: true, message, data: listing.toPublicJSON() });
  } catch (error) {
    console.error('Error in updateListing:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Date invalide', errors: Object.values(error.errors).map((e) => e.message) });
    }
    res.status(500).json({ success: false, message: 'Eroare la actualizarea anunțului' });
  }
};

/**
 * @desc    Șterge un anunț
 * @route   DELETE /api/listings/:id
 * @access  Private (owner sau admin)
 */
exports.deleteListing = async (req, res) => {
  try {
    const listing = await CarListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Anunț negăsit' });
    }

    if (listing.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Nu ai permisiunea să ștergi acest anunț' });
    }

    await listing.deleteOne();
    res.json({ success: true, message: 'Anunț șters cu succes' });
  } catch (error) {
    console.error('Error in deleteListing:', error);
    res.status(500).json({ success: false, message: 'Eroare la ștergerea anunțului' });
  }
};

/**
 * @desc    Marchează anunțul ca vândut
 * @route   PATCH /api/listings/:id/mark-sold
 * @access  Private (owner only)
 */
exports.markAsSold = async (req, res) => {
  try {
    const listing = await CarListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Anunț negăsit' });
    }

    if (listing.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Nu ai permisiunea să modifici acest anunț' });
    }

    listing.status = 'sold';
    await listing.save();

    res.json({ success: true, message: 'Anunț marcat ca vândut', data: listing.toPublicJSON() });
  } catch (error) {
    console.error('Error in markAsSold:', error);
    res.status(500).json({ success: false, message: 'Eroare la actualizarea anunțului' });
  }
};

/* ════════════════════════════════════════════════════════
   ADMIN ROUTES
════════════════════════════════════════════════════════ */

/**
 * @desc    Admin: Get ALL listings (any status), with optional status filter
 * @route   GET /api/listings/admin/all
 * @access  Admin
 */
exports.adminGetAllListings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const filter = status ? { status } : {};

    const skip = (Number(page) - 1) * Number(limit);

    const listings = await CarListing.find(filter)
      .populate('owner', 'username email avatar')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    const total = await CarListing.countDocuments(filter);

    // Stats by status
    const stats = await CarListing.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statsMap = {};
    stats.forEach((s) => { statsMap[s._id] = s.count; });

    res.json({
      success: true,
      data: listings.map((l) => l.toPublicJSON()),
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      stats: statsMap,
    });
  } catch (error) {
    console.error('Error in adminGetAllListings:', error);
    res.status(500).json({ success: false, message: 'Eroare la obținerea anunțurilor' });
  }
};

/**
 * @desc    Admin: Approve a listing
 * @route   PATCH /api/listings/admin/:id/approve
 * @access  Admin
 */
exports.adminApproveListing = async (req, res) => {
  try {
    const listing = await CarListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Anunț negăsit' });

    listing.status = 'active';
    listing.rejectionReason = null;
    listing.reviewedBy = req.user.id;
    listing.reviewedAt = new Date();
    await listing.save();

    res.json({ success: true, message: 'Anunț aprobat cu succes', data: listing.toPublicJSON() });
  } catch (error) {
    console.error('Error in adminApproveListing:', error);
    res.status(500).json({ success: false, message: 'Eroare la aprobare' });
  }
};

/**
 * @desc    Admin: Reject a listing
 * @route   PATCH /api/listings/admin/:id/reject
 * @access  Admin
 */
exports.adminRejectListing = async (req, res) => {
  try {
    const listing = await CarListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: 'Anunț negăsit' });

    listing.status = 'rejected';
    listing.rejectionReason = req.body.reason || 'Anunțul nu respectă regulile platformei.';
    listing.reviewedBy = req.user.id;
    listing.reviewedAt = new Date();
    await listing.save();

    res.json({ success: true, message: 'Anunț respins', data: listing.toPublicJSON() });
  } catch (error) {
    console.error('Error in adminRejectListing:', error);
    res.status(500).json({ success: false, message: 'Eroare la respingere' });
  }
};