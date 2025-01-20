// Rating Model
const mongoose = require('mongoose');
const ratingSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner" },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    date: { type: Date, default: Date.now },
  }, { timestamps: true });
  
module.exports = mongoose.model('Rating', ratingSchema);
  