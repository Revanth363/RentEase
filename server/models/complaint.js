// Complaint Model
const mongoose = require('mongoose');
const complaintSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    category: String,
    subject: String,
    description: String,
    dateSubmitted: { type: Date, default: Date.now },
    status: { type: String, default: "Open", enum: ["Open", "In Progress", "Resolved"] },
    response: String,
    responseDate: Date,
  }, { timestamps: true });
  
module.exports = mongoose.model('Complaint', complaintSchema);
  