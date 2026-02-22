// D:\RentEase\models\property.js
const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner" },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
  owner: String,
  location: String,
  type: String,
  subtype: String,
  status: { type: String, default: "Pending" },
  isRented: { type: Boolean, default: false },
  rentalStartDate: { type: Date, default: null },

  tenant: String,
  activeWorkers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Worker" }],
  price: Number, 
  rating: Number,
  reviews: Number,
  isVerified: { type: Boolean, default: false },
  is_popular: { type: Boolean, default: false }, // New field for popular listings

  // Fields from the second schema
  address: String,
  beds: Number,
  baths: Number,
  size: String,
  floor: String,
  furnished: String,
  description: String,
  images: [
    {
      url: String,
      publicId: String
    }
  ],

  propertyProof: {
    url: String,
    publicId: String,
    type: { type: String, enum: ['pdf', 'image'], required: false }
  },

  amenities: [String],

  // ── CHANGED: replaced map: String with precise coordinates ──
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },

  securityDeposit: Number,
  maintenance: Number,
  availableFrom: Date,
  preferredTenants: String,
  leaseDuration: String,
  contactNumber: String,
  alternativeNumber: String,
  contactEmail: String,

}, { timestamps: true });

// ============================================
// PROPERTY INDEXES FOR PERFORMANCE
// ============================================
// P0: Core search filters (most frequent queries)
propertySchema.index({ ownerId: 1 }); // Owner dashboard queries
propertySchema.index({ tenantId: 1 }); // Tenant property lookups
propertySchema.index({ status: 1 }); // Status filtering
propertySchema.index({ isRented: 1 }); // Rented/available properties
propertySchema.index({ isVerified: 1 }); // Verified properties for listing
propertySchema.index({ is_popular: 1 }); // Popular properties for homepage
propertySchema.index({ price: 1 }); // Price range queries

// P1: Compound indexes for search queries
propertySchema.index({ isRented: 1, isVerified: 1, is_popular: 1 }); // Homepage/featured properties
propertySchema.index({ isRented: 1, isVerified: 1, location: 1 }); // Location-based search
propertySchema.index({ isRented: 1, isVerified: 1, price: 1 }); // Price-based search
propertySchema.index({ isRented: 1, isVerified: 1, subtype: 1 }); // Property type search
propertySchema.index({ ownerId: 1, status: 1 }); // Owner + status
propertySchema.index({ location: 1, createdAt: -1 }); // Location + recency

// P2: Text index for full-text search (MongoDB text search)
propertySchema.index({ name: 'text', description: 'text', address: 'text', location: 'text' }); // Full-text search fallback

// Validate activeWorkers before saving
propertySchema.pre('save', async function (next) {
  if (this.activeWorkers && this.activeWorkers.length > 0) {
    const Worker = mongoose.model('Worker');
    const validWorkers = [];
    for (const workerId of this.activeWorkers) {
      try {
        const id = mongoose.Types.ObjectId(workerId);
        const worker = await Worker.findById(id);
        if (worker) {
          validWorkers.push(id);
        } else {
          console.warn(`Worker not found for ID: ${workerId}`);
        }
      } catch (e) {
        console.warn(`Invalid ObjectId for activeWorkers: ${workerId}`);
      }
    }
    this.activeWorkers = validWorkers;
  }
  next();
});

module.exports = mongoose.model('Property', propertySchema);