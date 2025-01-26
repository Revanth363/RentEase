const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  issueType: String,
  description: String,
  location: String,
  dateReported: Date,
  scheduledDate: Date,
  status: String,
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);