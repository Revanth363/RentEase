const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  status: { type: String, enum: ['Active', 'Suspended'], default: 'Active' },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Admin', adminSchema);