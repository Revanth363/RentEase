const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema({
  userType: { type: String, default: "worker" },
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  location: String,
  area: String,
  serviceType: String, 
  experience: Number,
  price: Number, 
  rateUnit: String,
  availability: String,
  description: String,
  image: {
  url: String,
  publicId: String
},

  password: {
    type: String,
    required: true,
    select: false
  },
  status: { type: String, enum: ['Active', 'Suspended'], default: "Active" },
  serviceStatus: { type: String, default: "Available" },
  lastLogin: Date,
  bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
  clientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }],
  notificationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }], // ADD THIS
  ratingId: { type: mongoose.Schema.Types.ObjectId, ref: "Rating" },
  isBooked: { type: Boolean, default: false },
}, { timestamps: true });

// ============================================
// WORKER INDEXES FOR PERFORMANCE
// ============================================
workerSchema.index({ email: 1 }); // P0: Email-based authentication
workerSchema.index({ location: 1, serviceType: 1 }); // P1: Worker search and filtering
workerSchema.index({ status: 1 }); // P1: Status filtering
workerSchema.index({ area: 1 }); // P2: Area-based queries

module.exports = mongoose.model("Worker", workerSchema);