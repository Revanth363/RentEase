const mongoose = require("mongoose");

const ownerSchema = new mongoose.Schema({
  
  userType: { type: String, default: "owner" },
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  location: String,
  numProperties: Number,
  password: {
    type: String,
    required: true,
    select: false // Don't include password by default
  },
  accountNo: String,
  upiid: String,
  status: { type: String, enum: ['Active', 'Suspended'], default: "Active" },
  lastLogin: Date,

  // New fields
  propertyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Property" }],
  tenantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }],
  rentalId: { type: mongoose.Schema.Types.ObjectId, ref: "Rental" },
  complaintIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Complaint" }],
  maintenanceRequestIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "MaintenanceRequest" }],
  notificationIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],
  rentalAgreementIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "RentalAgreement" }],

  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    payment: { type: Boolean, default: true },
    complaint: { type: Boolean, default: true },
    maintenance: { type: Boolean, default: true }
  },

}, { timestamps: true });

module.exports = mongoose.model("Owner", ownerSchema);