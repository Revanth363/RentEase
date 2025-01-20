const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  id: Number,
  userType: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  location: String,
  serviceType: String,
  experience: Number,
  numProperties: Number,
  password: String,
});
module.exports = mongoose.model("User", userSchema);