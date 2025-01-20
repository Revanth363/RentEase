const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true }, // From second, replaces 'user'
  userName: String, // From first
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true }, // From second, replaces 'property'
  propertyName: String, // From first
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true }, // From second
  status: { type: String, enum: ["Active", "Pending", "Terminated"], default: "Active" }, // From second
  bookingDate: Date, // From first
  startDate: { type: Date, required: true }, // From second
  endDate: Date, // From first
  amount: Number, // From first
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" }, // From first
  workerName: String, // From first
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);