const mongoose = require("mongoose");

const workerPaymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    userName: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: { type: String, default: "razorpay", required: true },
    status: {
      type: String,
      default: "Pending",
      enum: ["Paid", "Pending", "Failed", "Refunded"],
    },
    transactionId: { type: String },
    receiptUrl: { type: String },
    
    // Working days calculation
    workingDays: { type: Number, required: true }, // Number of working days
    dailyRate: { type: Number, required: true }, // Daily wage rate
    
    // Commission fields
    commission: { type: Number, default: 0 }, // Platform commission amount
    commissionPercent: { type: Number, default: 0 }, // Commission percentage at time of payment
    
    // Razorpay fields
    orderId: { type: String }, // Razorpay order ID
    razorpayPaymentId: { type: String }, // Razorpay payment ID
    razorpaySignature: { type: String }, // Razorpay signature for verification
    paymentGateway: { type: String, default: "razorpay" }, // Payment gateway used
    
    // Refund fields
    refundId: { type: String }, // Razorpay refund ID if refunded
    refundAmount: { type: Number }, // Amount refunded in paise
    refundDate: { type: Date }, // Date of refund
    refundReason: { type: String }, // Reason for refund
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkerPayment", workerPaymentSchema);
