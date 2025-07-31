const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const ownerController = require('../controllers/ownerController'); // Add this import

/**
 * @swagger
 * /api/bookings/book-property:
 *   get:
 *     summary: Get booking form
 *     description: Retrieve the booking form template with available dates and pricing information for a property
 *     tags:
 *       - Bookings
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: ID of the property to get booking form for
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Booking form retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 property:
 *                   type: object
 *                 availableDates:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: date
 *                 pricing:
 *                   type: object
 *       400:
 *         description: Invalid property ID
 *       404:
 *         description: Property not found
 *       500:
 *         description: Server error
 */
// Booking form routes
router.get('/book-property', bookingController.getBookingForm);

/**
 * @swagger
 * /api/bookings/book-property:
 *   post:
 *     summary: Create a new booking
 *     description: Create a new booking for a property with check-in and check-out dates
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - checkInDate
 *               - checkOutDate
 *               - totalGuests
 *             properties:
 *               propertyId:
 *                 type: string
 *                 example: "5f7a1234567890abcdef1234"
 *               checkInDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-04-15"
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-04-20"
 *               totalGuests:
 *                 type: number
 *                 example: 4
 *               specialRequests:
 *                 type: string
 *                 example: "High floor preferred"
 *               paymentMethod:
 *                 type: string
 *                 enum:
 *                   - credit_card
 *                   - debit_card
 *                   - wallet
 *                 example: "credit_card"
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookingId:
 *                   type: string
 *                 bookingNumber:
 *                   type: string
 *                 totalPrice:
 *                   type: number
 *                 status:
 *                   type: string
 *       400:
 *         description: Invalid booking parameters or property unavailable
 *       401:
 *         description: Unauthorized - authentication required
 *       404:
 *         description: Property not found
 *       500:
 *         description: Server error
 */
router.post('/book-property', bookingController.createBooking);

/**
 * @swagger
 * /api/bookings/notifications/action:
 *   post:
 *     summary: Handle notification action
 *     description: Process booking-related notification actions like accepting or declining booking requests
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationId
 *               - action
 *             properties:
 *               notificationId:
 *                 type: string
 *                 example: "5f7a1234567890abcdef1234"
 *               action:
 *                 type: string
 *                 enum:
 *                   - accept
 *                   - decline
 *                   - cancel
 *                 example: "accept"
 *               reason:
 *                 type: string
 *                 example: "Property not available"
 *     responses:
 *       200:
 *         description: Notification action processed successfully
 *       400:
 *         description: Invalid action or notification ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
// Notification action route
router.post('/notifications/action', bookingController.handleNotificationAction);

/**
 * @swagger
 * /api/bookings/notifications:
 *   get:
 *     summary: Get booking notifications
 *     description: Retrieve all booking-related notifications for the authenticated user
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *         description: Number of notifications to retrieve
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *         description: Number of notifications to skip for pagination
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   bookingId:
 *                     type: string
 *                   type:
 *                     type: string
 *                   message:
 *                     type: string
 *                   read:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Notification fetch route
router.get('/notifications', ownerController.getNotifications); // Update to use ownerController

module.exports = router;