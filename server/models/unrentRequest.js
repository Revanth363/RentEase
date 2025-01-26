const mongoose = require("mongoose");

const UnrentRequestSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
    required: true,
  },
  reason: { type: String },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  createdDate: { type: Date, default: Date.now },
  completedDate: { type: Date },
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
  rentPaid: { type: Boolean, default: false },
});

module.exports =
  mongoose.models["UnrentRequest"] ||
  mongoose.model("UnrentRequest", UnrentRequestSchema);
