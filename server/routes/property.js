// routes/property.js
const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/propertyController");
const { uploadProperties } = require("../middleware/uploadCloudinary");

const Property = require("../models/property"); // Adjust path as needed
const Notification = require("../models/notification");

// Authentication middleware (reusing your protect)
const { protect } = require("../middleware/auth");


// Route for property listing form submission with Cloudinary upload
// Wrap to catch multer errors and return JSON
router.post("/list-property", protect, (req, res, next) => {
  uploadProperties(req, res, (err) => {
    if (err) {
      // Multer error - return JSON instead of HTML
      console.error("Multer error:", err.message);
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    // No multer error, continue to controller
    next();
  });
}, propertyController.listProperty);

router.delete("/:id", propertyController.deleteProperty);

router.post('/:propertyId/contact', async (req, res) => {
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

router.get("/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).lean();

    if (!property) {
      return res.status(404).json({ 
        success: false, 
        message: "Property not found" 
      });
    }

    res.json({
      success: true,
      property: {
        ...property,
        _id: property._id.toString(), // String for React
        images: property.images || [],
        coordinates: property.coordinates || null,
        amenities: property.amenities || [],
        price: Number(property.price || 0),
        beds: Number(property.beds || 0),
        baths: Number(property.baths || 0),
        rating: Number(property.rating || 0),
        reviews: Number(property.reviews || 0),
      }
    });
  } catch (err) {
    console.error("Error fetching property:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

module.exports = router;
