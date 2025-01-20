const mongoose = require('mongoose');
// Define the Mongoose Schema and Model here, as it's directly related to the routes
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: false },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Contact', contactSchema);