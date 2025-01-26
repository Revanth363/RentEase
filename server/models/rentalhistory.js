// RentalHistory Model
const mongoose = require('mongoose');
const rentalHistorySchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
    propertyIds: [{ 
      property: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
      startDate: Date,
      endDate: Date,
      rent: Number,
      owner: String,
      address: String,
      status: { type: String, enum: ["Current", "Completed"] },
      reasonForMoving: String
    }]
  }, { timestamps: true });
  
module.exports= mongoose.model('RentalHistory', rentalHistorySchema);
