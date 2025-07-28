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
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes for OTP validity
    },
  },
  { timestamps: true }
);

// Note: TTL index removed - work records are now stored permanently for salary tracking

module.exports = mongoose.model("WorkTracking", workTrackingSchema);
