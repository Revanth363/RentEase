const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const ownerController = require('../controllers/ownerController'); // Add this import

// Booking form routes
router.get('/book-property', bookingController.getBookingForm);
router.post('/book-property', bookingController.createBooking);

// Notification action route
router.post('/notifications/action', bookingController.handleNotificationAction);

// Notification fetch route
router.get('/api/notifications', ownerController.getNotifications); // Update to use ownerController

module.exports = router;