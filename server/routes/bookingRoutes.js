const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const ownerController = require('../controllers/ownerController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/bookings/book-property:
 *   get:
 *     summary: Get booking form (DEPRECATED - Removed)
 *     description: This endpoint has been removed. Use the frontend component to create bookings instead.
 *     tags:
 *       - Bookings
 *     deprecated: true
 *     responses:
 *       410:
 *         description: Endpoint removed - use frontend booking component
 */

/**
 * @swagger
 * /api/bookings/book-property:
 *   post:
 *     summary: Create a new booking
 *     description: Create a new booking for a property. Property must be verified (isVerified=true) and not currently rented (isRented=false). Tenant only.
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
 *               - startDate
 *               - leaseDuration
 *             properties:
 *               propertyId:
 *                 type: string
 *                 description: MongoDB ID of the property to book (must be verified and available)
 *                 example: "5f7a1234567890abcdef1234"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Lease start date (YYYY-MM-DD format)
 *                 example: "2024-04-15"
 *               leaseDuration:
 *                 type: number
 *                 description: Lease duration in months
 *                 example: 6
 *               comments:
 *                 type: string
 *                 description: Optional comments or special requests
 *                 example: "High floor preferred"
 *     responses:
 *       200:
 *         description: Booking request submitted successfully, awaiting owner approval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Booking request submitted, awaiting owner approval"
 *       400:
 *         description: Invalid booking parameters or property unavailable
 *       401:
 *         description: Unauthorized - tenant authentication required
 *       404:
 *         description: Property or owner not found
 *       500:
 *         description: Server error
 */
router.post('/book-property', protect, bookingController.createBooking);

/**
 * @swagger
 * /api/bookings/notifications:
 *   get:
 *     summary: Get booking notifications (Owners Only)
 *     description: Retrieve all booking-related notifications for a property owner. Owners can see notifications about booking requests from tenants.
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
 *         description: Unauthorized - Owner access required
 *       500:
 *         description: Server error
 */
router.get('/notifications', protect, ownerController.getNotifications);

/**
 * @swagger
 * /api/bookings/notifications/action:
 *   post:
 *     summary: Handle notification action (Owners Only)
 *     description: Process booking-related notification actions like approving or rejecting booking requests. Only accessible to property owners.
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
 *                   - approve
 *                   - reject
 *                 example: "approve"
 *               reason:
 *                 type: string
 *                 example: "Property not available"
 *     responses:
 *       200:
 *         description: Notification action processed successfully
 *       400:
 *         description: Invalid action or notification ID
 *       401:
 *         description: Unauthorized - Owner access required
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.post('/notifications/action', protect, bookingController.handleNotificationAction);

module.exports = router;