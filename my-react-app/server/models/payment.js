const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" }, // From first, replaces 'user'
  userName: String, // From second
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" }, // From first
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // From second
  amount: Number, // From both
  paymentDate: Date, // From both
  dueDate: Date, // From first
  paymentMethod: String, // From both
  status: { type: String, default: "Pending", enum: ["Pending", "Paid", "Overdue"] }, // From first
  receiptUrl: String, // From first
  transactionId: String, // From second
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);