const mongoose = require("mongoose");

const workTrackingSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    workDate: {
      type: Date,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    },
  },
  { timestamps: true }
);

// Index for auto-deleting expired OTPs (TTL)
workTrackingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("WorkTracking", workTrackingSchema);
