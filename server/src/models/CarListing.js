const mongoose = require('mongoose');

const carListingSchema = new mongoose.Schema(
  {
    // ── Owner
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Basic Info
    title: {
      type: String,
      required: [true, 'Titlul este obligatoriu'],
      trim: true,
      maxlength: [100, 'Titlul nu poate depăși 100 de caractere'],
    },

    description: {
      type: String,
      required: [true, 'Descrierea este obligatorie'],
      trim: true,
      maxlength: [2000, 'Descrierea nu poate depăși 2000 de caractere'],
    },

    // ── Car Details
    brand: {
      type: String,
      required: [true, 'Marca este obligatorie'],
      trim: true,
    },

    model: {
      type: String,
      required: [true, 'Modelul este obligatoriu'],
      trim: true,
    },

    year: {
      type: Number,
      required: [true, 'Anul este obligatoriu'],
      min: [1900, 'Anul trebuie să fie după 1900'],
      max: [new Date().getFullYear() + 1, 'Anul este prea mare'],
    },

    mileage: {
      type: Number,
      required: [true, 'Kilometrajul este obligatoriu'],
      min: [0, 'Kilometrajul nu poate fi negativ'],
    },

    price: {
      type: Number,
      required: [true, 'Prețul este obligatoriu'],
      min: [0, 'Prețul nu poate fi negativ'],
    },

    currency: {
      type: String,
      enum: ['EUR', 'USD', 'MDL', 'RON'],
      default: 'EUR',
    },

    // ── Technical Specs
    fuelType: {
      type: String,
      enum: ['Benzină', 'Diesel', 'Electric', 'Hibrid', 'GPL', 'Gaz'],
      required: true,
    },

    transmission: {
      type: String,
      enum: ['Manuală', 'Automată', 'Robotizată', 'CVT'],
      required: true,
    },

    engineSize: {
      type: Number,
      required: false,
    },

    power: {
      type: Number,
      required: false,
    },

    color: {
      type: String,
      required: false,
    },

    // ── Location
    location: {
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: 'Moldova',
      },
    },

    // ── Contact
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // ── Media
    images: [
      {
        type: String,
      },
    ],

    mainImage: {
      type: String,
    },

    // ── Status
    // 'pending'  → awaiting admin approval (default for new listings)
    // 'active'   → approved and visible publicly
    // 'rejected' → rejected by admin
    // 'sold'     → marked as sold by owner
    // 'archived' → archived
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'sold', 'archived'],
      default: 'pending',
    },

    // Admin rejection reason
    rejectionReason: {
      type: String,
      default: null,
    },

    // Admin who approved/rejected
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // ── Features (optional)
    features: [
      {
        type: String,
      },
    ],

    // ── Stats
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes
carListingSchema.index({ owner: 1, createdAt: -1 });
carListingSchema.index({ brand: 1, model: 1 });
carListingSchema.index({ price: 1 });
carListingSchema.index({ year: -1 });
carListingSchema.index({ status: 1 });

// ── Virtual
carListingSchema.virtual('ownerInfo', {
  ref: 'User',
  localField: 'owner',
  foreignField: '_id',
  justOne: true,
});

// ── Method
carListingSchema.methods.incrementViews = async function () {
  this.views += 1;
  return this.save();
};

carListingSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    brand: this.brand,
    model: this.model,
    year: this.year,
    mileage: this.mileage,
    price: this.price,
    currency: this.currency,
    fuelType: this.fuelType,
    transmission: this.transmission,
    engineSize: this.engineSize,
    power: this.power,
    color: this.color,
    location: this.location,
    phone: this.phone,
    images: this.images,
    mainImage: this.mainImage || this.images[0],
    status: this.status,
    rejectionReason: this.rejectionReason,
    features: this.features,
    views: this.views,
    owner: this.owner,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('CarListing', carListingSchema);