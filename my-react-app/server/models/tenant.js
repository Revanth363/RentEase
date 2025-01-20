const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
  userType: { type: String, default: "tenant" },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  location: { type: String, required: true },
  password: {
    type: String,
    required: true,
    select: false // Don't include password by default
  },
  status: { type: String, enum: ['Active', 'Suspended'], default: "Active" },
  lastLogin: { type: Date },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", default: null },
  savedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
  paymentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
  maintenanceRequestIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "MaintenanceRequest" }],
  complaintIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Complaint" }],
  notificationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],
  domesticWorkerId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Worker" }], // Changed to array
  rentalHistoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "RentalHistory" }],
  ratingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Rating" }],
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
  rentReminders: { type: Boolean, default: true },
  maintenanceUpdates: { type: Boolean, default: true },
  newListings: { type: Boolean, default: false },
}, { timestamps: true });

// Add indexes for performance
tenantSchema.index({ _id: 1, maintenanceRequestIds: 1, complaintIds: 1 });

module.exports = mongoose.model("Tenant", tenantSchema);