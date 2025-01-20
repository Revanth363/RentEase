const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  name: String, // From both
  value: String, // From both
  platformFee: Number, // From first
  emailNotifications: Boolean, // From first
  maintenanceMode: Boolean, // From first
  paymentGateway: { provider: String, apiKey: String }, // From first
  currency: { type: String, default: "INR" }, // From first
});

module.exports = mongoose.model("Setting", settingSchema);