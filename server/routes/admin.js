const express = require("express");
const router = express.Router();
const adminPropertyController = require("../controllers/adminPropertyController");
const adminUserController = require("../controllers/adminUserController");
const adminBookingController = require("../controllers/adminBookingController");
const adminNotificationController = require("../controllers/adminNotificationController");
const adminMaintenanceController = require("../controllers/adminMaintenanceController");
const adminPaymentController = require("../controllers/adminPaymentController");
const adminWorkerPaymentController = require("../controllers/adminWorkerPaymentController");
const adminContactUsController = require("../controllers/adminContactUsController");

// View routes
/**
 * @swagger
 * /api/admin/user/{id}/{userType}:
 *   get:
 *     summary: Get user details
 *     description: '**Admin Only** - Retrieve detailed information about a specific user (tenant, owner, or worker). Requires admin or superadmin authorization.'
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "5f7a1234567890abcdef1234"
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tenant, owner, worker]
 *         description: Type of user
 *         example: "tenant"
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin or superadmin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/user/:id/:userType", adminUserController.getUserDetails);

// Property Booking Routes
/**
 * @swagger
 * /api/admin/booking/{id}:
 *   get:
 *     summary: Get booking details
 *     description: Retrieve detailed information about a specific property booking
 *     tags:
 *       - Admin - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.get("/booking/:id", adminBookingController.getBookingDetails);

/**
 * @swagger
 * /api/admin/booking/approve/{id}:
 *   post:
 *     summary: Approve property booking
 *     description: Admin approves a property booking request
 *     tags:
 *       - Admin - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID to approve
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Booking approved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post("/booking/approve/:id", adminBookingController.approveBooking);

/**
 * @swagger
 * /api/admin/booking/reject/{id}:
 *   post:
 *     summary: Reject property booking
 *     description: Admin rejects a property booking request
 *     tags:
 *       - Admin - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID to reject
 *         example: "5f7a1234567890abcdef1234"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Invalid booking dates"
 *     responses:
 *       200:
 *         description: Booking rejected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
router.post("/booking/reject/:id", adminBookingController.rejectBooking);

// Worker/Service Booking Routes
/**
 * @swagger
 * /api/admin/worker-bookings:
 *   get:
 *     summary: Get all worker bookings
 *     description: Retrieve a list of all worker service bookings with optional filtering
 *     tags:
 *       - Admin - Worker Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - approved
 *             - completed
 *             - cancelled
 *         description: Filter by booking status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *     responses:
 *       200:
 *         description: Worker bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/worker-bookings", adminBookingController.getAllWorkerBookings);

/**
 * @swagger
 * /api/admin/worker-booking/{id}:
 *   get:
 *     summary: Get worker booking details
 *     description: Retrieve detailed information about a specific worker service booking
 *     tags:
 *       - Admin - Worker Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker booking ID
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Worker booking details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Worker booking not found
 *       500:
 *         description: Server error
 */
router.get(
  "/worker-booking/:id",
  adminBookingController.getWorkerBookingDetails
);

/**
 * @swagger
 * /api/admin/worker-booking/approve/{id}:
 *   post:
 *     summary: Approve worker booking
 *     description: Admin approves a worker service booking request
 *     tags:
 *       - Admin - Worker Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker booking ID to approve
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Worker booking approved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Worker booking not found
 *       500:
 *         description: Server error
 */
router.post(
  "/worker-booking/approve/:id",
  adminBookingController.approveWorkerBooking
);

/**
 * @swagger
 * /api/admin/worker-booking/decline/{id}:
 *   post:
 *     summary: Decline worker booking
 *     description: Admin declines a worker service booking request
 *     tags:
 *       - Admin - Worker Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker booking ID to decline
 *         example: "5f7a1234567890abcdef1234"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Worker not available"
 *     responses:
 *       200:
 *         description: Worker booking declined successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Worker booking not found
 *       500:
 *         description: Server error
 */
router.post(
  "/worker-booking/decline/:id",
  adminBookingController.declineWorkerBooking
);

// Notification routes
/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Get all notifications
 *     description: Retrieve all system notifications for admin management
 *     tags:
 *       - Admin - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/notifications",
  adminNotificationController.getAllNotifications
);

/**
 * @swagger
 * /api/admin/notification/{id}:
 *   get:
 *     summary: Get notification details
 *     description: Retrieve detailed information about a specific notification
 *     tags:
 *       - Admin - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Notification details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.get(
  "/notification/:id",
  adminNotificationController.getNotificationDetails
);

/**
 * @swagger
 * /api/admin/notification/{id}/complete:
 *   post:
 *     summary: Mark notification as complete
 *     description: Admin marks a notification as completed or resolved
 *     tags:
 *       - Admin - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID to mark complete
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Notification marked as complete
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.post(
  "/notification/:id/complete",
  adminNotificationController.completeNotification
);

// Maintenance routes
/**
 * @swagger
 * /api/admin/maintenance-requests:
 *   get:
 *     summary: Get all maintenance requests
 *     description: Retrieve all maintenance requests for admin review and management
 *     tags:
 *       - Admin - Maintenance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - approved
 *             - in-progress
 *             - completed
 *         description: Filter by maintenance status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *     responses:
 *       200:
 *         description: Maintenance requests retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/maintenance-requests",
  adminMaintenanceController.getAllMaintenanceRequests
);

/**
 * @swagger
 * /api/admin/maintenance/{id}:
 *   get:
 *     summary: Get maintenance details
 *     description: Retrieve detailed information about a specific maintenance request
 *     tags:
 *       - Admin - Maintenance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance request ID
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Maintenance details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Maintenance request not found
 *       500:
 *         description: Server error
 */
router.get(
  "/maintenance/:id",
  adminMaintenanceController.getMaintenanceDetails
);

/**
 * @swagger
 * /api/admin/maintenance/{id}/complete:
 *   post:
 *     summary: Mark maintenance as complete
 *     description: Admin marks a maintenance request as completed
 *     tags:
 *       - Admin - Maintenance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Maintenance request ID to complete
 *         example: "5f7a1234567890abcdef1234"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completionNotes:
 *                 type: string
 *                 example: "Maintenance work completed successfully"
 *     responses:
 *       200:
 *         description: Maintenance marked as complete
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Maintenance request not found
 *       500:
 *         description: Server error
 */
router.post(
  "/maintenance/:id/complete",
  adminMaintenanceController.completeMaintenance
);

// Contact / Messages routes
/**
 * @swagger
 * /api/admin/message/{id}:
 *   get:
 *     summary: Get contact submission
 *     description: Retrieve a specific contact form submission by ID
 *     tags:
 *       - Admin - Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Submission retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Submission not found
 *       500:
 *         description: Server error
 */
router.get("/message/:id", adminContactUsController.getSubmissionById);

/**
 * @swagger
 * /api/admin/messages:
 *   get:
 *     summary: Get all contact submissions
 *     description: Retrieve all contact form submissions for admin review
 *     tags:
 *       - Admin - Messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - new
 *             - replied
 *             - resolved
 *         description: Filter by submission status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/messages", adminContactUsController.getAllSubmissions);

// Property Management
/**
 * @swagger
 * /api/admin/property/verify/{id}:
 *   post:
 *     summary: Verify or unverify property
 *     description: Admin verifies or unverifies a property listing
 *     tags:
 *       - Admin - Properties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID to verify
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Property verification status toggled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 *       500:
 *         description: Server error
 */
router.post("/property/verify/:id", adminPropertyController.toggleVerify);

/**
 * @swagger
 * /api/admin/property/delete/{id}:
 *   delete:
 *     summary: Delete property
 *     description: Admin permanently deletes a property listing from the platform
 *     tags:
 *       - Admin - Properties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID to delete
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 *       500:
 *         description: Server error
 */
router.delete("/property/delete/:id", adminPropertyController.deleteProperty);

/**
 * @swagger
 * /api/admin/property-management:
 *   get:
 *     summary: Get property management dashboard
 *     description: Retrieve comprehensive property management data for admins
 *     tags:
 *       - Admin - Properties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *           example: true
 *         description: Filter by verification status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *     responses:
 *       200:
 *         description: Property management data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/property-management",
  adminPropertyController.getPropertyManagement
);

/**
 * @swagger
 * /api/admin/property/{id}:
 *   get:
 *     summary: Get property details
 *     description: Retrieve detailed information about a specific property
 *     tags:
 *       - Admin - Properties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Property details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 *       500:
 *         description: Server error
 */
router.get("/property/:id", adminPropertyController.getPropertyView);

// User Management
/**
 * @swagger
 * /api/admin/user/status/{id}/{userType}:
 *   post:
 *     summary: Change user status
 *     description: '**Admin Only** - Change the status of a user (activate, deactivate, suspend, verify, etc.). Requires admin or superadmin authorization.'
 *     tags:
 *       - Admin - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "5f7a1234567890abcdef1234"
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tenant, owner, worker]
 *         description: Type of user
 *         example: "tenant"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, verified]
 *                 example: "suspended"
 *               reason:
 *                 type: string
 *                 example: "Violation of platform policies"
 *     responses:
 *       200:
 *         description: User status changed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/user/status/:id/:userType", adminUserController.changeUserStatus);

/**
 * @swagger
 * /api/admin/user/delete/{id}/{userType}:
 *   delete:
 *     summary: Delete user
 *     description: '**Admin Only** - Permanently delete a user account from the platform. This action cannot be undone. Requires admin or superadmin authorization.'
 *     tags:
 *       - Admin - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *         example: "5f7a1234567890abcdef1234"
 *       - in: path
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [tenant, owner, worker]
 *         description: Type of user
 *         example: "tenant"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/user/delete/:id/:userType", adminUserController.deleteUser);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Verified & Unverified)
 *     description: '**Admin Only** - Retrieve complete list of all users (tenants, owners, workers) including both verified and unverified users in a single request. When no filters are applied, shows the 5 most recent users. With filters, returns all matching users with pagination support. Each user includes verification status. Requires admin or superadmin authorization.'
 *     tags:
 *       - Admin - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum:
 *             - tenant
 *             - owner
 *             - worker
 *         description: Filter by user type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - active
 *             - inactive
 *             - suspended
 *             - verified
 *         description: Filter by user status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *     responses:
 *       200:
 *         description: Users retrieved successfully with verification status for each user (both verified and unverified included)
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin or superadmin access required
 *       500:
 *         description: Server error
 */
router.get("/users", adminUserController.getAllUsers);

// Payment routes
/**
 * @swagger
 * /api/admin/payment/{id}:
 *   get:
 *     summary: Get payment details
 *     description: Retrieve detailed information about a specific payment transaction
 *     tags:
 *       - Admin - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.get("/payment/:id", adminPaymentController.getPaymentDetails);

/**
 * @swagger
 * /api/admin/payment/{id}/refund:
 *   post:
 *     summary: Refund payment
 *     description: Admin initiates a refund for a specific payment
 *     tags:
 *       - Admin - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID to refund
 *         example: "5f7a1234567890abcdef1234"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Booking cancelled by tenant"
 *               refundAmount:
 *                 type: number
 *                 example: 5000
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid refund amount or payment already refunded
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.post("/payment/:id/refund", adminPaymentController.refundPayment);

/**
 * @swagger
 * /api/admin/payment/{id}/retry:
 *   post:
 *     summary: Retry payment
 *     description: Admin retries a failed payment transaction
 *     tags:
 *       - Admin - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID to retry
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Payment retry initiated successfully
 *       400:
 *         description: Payment cannot be retried
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.post("/payment/:id/retry", adminPaymentController.retryPayment);

/**
 * @swagger
 * /api/admin/payments:
 *   get:
 *     summary: Get all payments
 *     description: Retrieve list of all payment transactions for admin review
 *     tags:
 *       - Admin - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - completed
 *             - failed
 *             - refunded
 *         description: Filter by payment status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/payments", adminPaymentController.getAllPayments);

// Worker Payment routes
/**
 * @swagger
 * /api/admin/worker-payments:
 *   get:
 *     summary: Get all worker payments
 *     description: Retrieve list of all worker payment transactions for payroll management
 *     tags:
 *       - Admin - Worker Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - approved
 *             - completed
 *             - failed
 *         description: Filter by payment status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: number
 *           example: 0
 *     responses:
 *       200:
 *         description: Worker payments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  "/worker-payments",
  adminWorkerPaymentController.getAllWorkerPayments
);

/**
 * @swagger
 * /api/admin/worker-payment/{id}:
 *   get:
 *     summary: Get worker payment details
 *     description: Retrieve detailed information about a specific worker payment transaction
 *     tags:
 *       - Admin - Worker Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker payment ID
 *         example: "5f7a1234567890abcdef1234"
 *     responses:
 *       200:
 *         description: Worker payment details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Worker payment not found
 *       500:
 *         description: Server error
 */
router.get(
  "/worker-payment/:id",
  adminWorkerPaymentController.getWorkerPaymentDetails
);

/**
 * @swagger
 * /api/admin/property/{id}/toggle-popular:
 *   put:
 *     summary: Toggle property popular status
 *     description: Admin can mark/unmark a property as popular (only for verified, non-rented properties)
 *     tags:
 *       - Admin - Properties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *         example: "5f7a1234567890abcdef1234"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_popular:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Property popularity status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 is_popular:
 *                   type: boolean
 *       400:
 *         description: Cannot mark rented or unverified property as popular
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 *       500:
 *         description: Server error
 */
router.put("/property/:id/toggle-popular", async (req, res) => {
  const { id } = req.params;
  const { is_popular } = req.body;

  try {
    const Property = require("../models/property");
    
    // Find the property
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if property can be marked as popular (only if verified and not rented)
    if (is_popular && (property.isRented || !property.isVerified)) {
      return res.status(400).json({ 
        error: property.isRented 
          ? "Cannot mark rented property as popular" 
          : "Property must be verified first"
      });
    }

    // Update the property
    property.is_popular = is_popular;
    await property.save();

    res.json({ 
      success: true, 
      is_popular: property.is_popular 
    });
  } catch (error) {
    console.error("Error toggling property popularity:", error);
    res.status(500).json({ error: "Failed to update property popularity" });
  }
});

module.exports = router;
