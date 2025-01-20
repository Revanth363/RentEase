const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  title: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  startDate: { type: String },
  endDate: { type: String },
  monthlyRent: { type: Number },
  securityDeposit: { type: Number },
  lastTenant: { type: String },
  action: { type: String }
});

module.exports = mongoose.model('Agreement', agreementSchema);