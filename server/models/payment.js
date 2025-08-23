const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }, // From first, replaces 'user'
  userName: String, // From second
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner" }, // Added for rent payments
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" }, // From first
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // From second
  amount: Number, // From both
  paymentDate: Date, // From both
  dueDate: Date, // From first
  paymentMethod: { type: String, default: "razorpay" }, // From both
  status: { type: String, default: "Pending", enum: ["Pending", "Paid", "Overdue", "Refunded", "Failed", "Cancelled"] }, // From first
  receiptUrl: String, // From first
  transactionId: String, // From second
  commission: { type: Number, default: 0 }, // platform commission amount
  commissionPercent: { type: Number, default: 0 }, // commission percentage at time of payment
  
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
  
}, { timestamps: true });

// ============================================
// PAYMENT INDEXES FOR PERFORMANCE
// ============================================
paymentSchema.index({ tenantId: 1, status: 1 }); // P0: Tenant payment queries with status
paymentSchema.index({ propertyId: 1 }); // P0: Owner earnings queries
paymentSchema.index({ ownerId: 1 }); // P0: Owner payment history
paymentSchema.index({ status: 1 }); // P1: Payment status filtering
paymentSchema.index({ propertyId: 1, status: 1 }); // P1: Property-specific status queries
paymentSchema.index({ createdAt: -1 }); // P2: Date-based sorting

module.exports = mongoose.model('Payment', paymentSchema);