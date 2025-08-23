const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  issueType: String,
  description: String,
  location: String,
  dateReported: Date,
  scheduledDate: Date,
  completionDate: Date,
  status: String,
  tenantConfirmation: {
    type: String, // 'Pending', 'Confirmed', 'Rejected'
    default: 'Pending'
  },
  tenantConfirmationDate: Date,
}, { timestamps: true });

// ============================================
// MAINTENANCE REQUEST INDEXES FOR PERFORMANCE
// ============================================
maintenanceRequestSchema.index({ propertyId: 1, tenantId: 1 }); // P0: Property and tenant maintenance lookups
maintenanceRequestSchema.index({ status: 1 }); // P1: Status filtering
maintenanceRequestSchema.index({ assignedWorker: 1 }); // P1: Worker's maintenance requests

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);