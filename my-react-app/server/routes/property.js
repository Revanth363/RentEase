// routes/property.js
const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/propertyController");

const Property = require("../models/property"); // Adjust path as needed
const Notification = require("../models/notification");

// Authentication middleware (reusing your isAuthenticated)
const isAuthenticated = require("../middleware/auth");

// Route for property listing form submission
router.post("/list-property", isAuthenticated, propertyController.listProperty);

router.delete("/:id", propertyController.deleteProperty);

console.log('Contact route registered'); // Debug log
router.post('/:propertyId/contact', async (req, res) => {
  console.log('Contact route hit!', req.params.propertyId); // Debug log
  try {
    const { name, phone, email, query } = req.body;
    const propertyId = req.params.propertyId;

    // Find the property and get owner ID
    const property = await Property.findById(propertyId).populate('ownerId');
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!property.ownerId) {
      return res.status(404).json({ error: 'Owner not found for this property' });
    }

    // Create notification for the owner with contact details
    const notification = new Notification({
      type: 'Query',
      message: `${query}\n\nContact: ${name}\nPhone: ${phone}\nEmail: ${email}`,
      recipient: property.ownerId._id,
      recipientType: 'Owner',
      recipientName: name, // Store the visitor's name here
      propertyName: property.name,
      status: 'Info',
      priority: 'Medium',
      createdDate: new Date(),
      read: false
    });

    await notification.save();
    
    console.log('Notification created:', notification);

    // Update the Owner model directly to add notification ID
    const Owner = require('../models/owner');
    await Owner.findByIdAndUpdate(
      property.ownerId._id,
      { $push: { notificationIds: notification._id } }
    );

    res.status(200).json({ message: 'Query sent successfully' });
  } catch (error) {
    console.error('Error saving contact form:', error);
    res.status(500).json({ error: 'Failed to send query' });
  }
});

module.exports = router;
