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
    paymentMethod: { type: String, required: true },
    status: {
      type: String,
      default: "Paid",
      enum: ["Paid", "Pending", "Failed"],
    },
    transactionId: { type: String, required: true },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkerPayment", workerPaymentSchema);
