const mongoose = require('mongoose');

const workerBookingSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  serviceType: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Declined", "Completed"], default: "Pending" },
  bookingDate: { type: Date, default: Date.now },
  preferredDate: { type: Date },
  description: { type: String },
  tenantName: { type: String },
  tenantAddress: { type: String }
}, {
  timestamps: true
});

// ============================================
// WORKER BOOKING INDEXES FOR PERFORMANCE
// ============================================
workerBookingSchema.index({ workerId: 1 }); // P1: Worker's bookings
workerBookingSchema.index({ tenantId: 1 }); // P1: Tenant's worker bookings
workerBookingSchema.index({ workerId: 1, status: 1 }); // P1: Worker bookings by status
workerBookingSchema.index({ status: 1 }); // P2: Booking status filtering

module.exports = mongoose.model('WorkerBooking', workerBookingSchema);