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
  image: String,
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

module.exports = mongoose.model("Worker", workerSchema);