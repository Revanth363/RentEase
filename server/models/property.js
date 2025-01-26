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
  images: [String],
  amenities: [String],
  map: String,
  securityDeposit: Number,
  maintenance: Number,
  availableFrom: Date,
  preferredTenants: String,
  leaseDuration: String,
  contactNumber: String,
  alternativeNumber: String,
  contactEmail: String,

}, { timestamps: true });


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