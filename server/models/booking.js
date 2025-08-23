const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true }, // From second, replaces 'user'
  userName: String, // From first
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true }, // From second, replaces 'property'
  propertyName: String, // From first
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true }, // From second
  status: { type: String, enum: ["Active", "Pending", "Terminated", "Approved", "Rejected"], default: "Pending" }, // From second
  bookingDate: Date, // From first
  startDate: { type: Date, required: true }, // From second
  endDate: Date, // From first
  amount: Number, // From first
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" }, // From first
  workerName: String, // From first
}, { timestamps: true });

// ============================================
// BOOKING INDEXES FOR PERFORMANCE
// ============================================
bookingSchema.index({ tenantId: 1, status: 1 }); // P0: Tenant booking queries with status
bookingSchema.index({ propertyId: 1 }); // P0: Property booking lookups
bookingSchema.index({ status: 1 }); // P1: Status-based filtering
bookingSchema.index({ ownerId: 1 }); // P1: Owner's bookings

module.exports = mongoose.model("Booking", bookingSchema);