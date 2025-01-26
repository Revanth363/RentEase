const mongoose = require('mongoose');

const workerBookingSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  serviceType: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Declined", "Completed"], default: "Pending" },
  bookingDate: { type: Date, default: Date.now },
  tenantName: { type: String },
  tenantAddress: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkerBooking', workerBookingSchema);