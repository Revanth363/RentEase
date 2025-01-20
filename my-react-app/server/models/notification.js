const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: String,
  message: String,
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientType'
  },
  recipientType: {
    type: String,
    enum: ['Owner', 'Tenant', 'Worker'],
    required: true
  },
  recipientName: String,
  worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
  workerName: String,
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }, // ADD THIS
  tenantName: String, // ADD THIS
  propertyName: { type: String },
  status: { type: String, enum: ['Pending', 'Completed', 'Approved', 'Rejected', 'Info'], default: 'Pending' }, // Added 'Info'
  priority: String,
  createdDate: Date,
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);