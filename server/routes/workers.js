const express = require("express");
const router = express.Router();

const workerController = require("../controllers/workerController");
const { uploadWorker } = require("../middleware/uploadCloudinary");
const { protect } = require("../middleware/auth"); // JWT protect middleware

// ────────────────────────────────────────────────
// Public Routes (no auth required)
// ────────────────────────────────────────────────

/**
 * @swagger
 * /api/workers/dashboard:
 *   get:
 *     summary: Get worker dashboard data
 *     description: Retrieve dashboard information for the logged-in worker
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker dashboard data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/dashboard", protect, workerController.getDashboardDataAPI);

/**
 * @swagger
 * /api/workers/filters:
 *   get:
 *     summary: Get worker filter options
 *     description: Get available filter options for location, areas, and service types
 *     tags:
 *       - Workers
 *     responses:
 *       200:
 *         description: Filter options
 *       500:
 *         description: Server error
 */
// Get filter options (locations, areas, service types)
router.get("/filters", workerController.getWorkerFilters);

/**
 * @swagger
 * /api/workers/search:
 *   get:
 *     summary: Search workers by location
 *     description: Search for workers available in a specific location or area
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location to search in
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *         description: Area/region to search
 *     responses:
 *       200:
 *         description: List of workers in location
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Worker'
 *       500:
 *         description: Server error
 */
// Search workers by location/area
router.get("/search", workerController.searchWorkersByLocation);

/**
 * @swagger
 * /api/workers/:id/can-review:
 *   get:
 *     summary: Check if tenant can review worker
 *     description: Verify if the current tenant can submit a review for a specific worker
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID
 *     responses:
 *       200:
 *         description: Review eligibility status
 *       404:
 *         description: Worker not found
 *       500:
 *         description: Server error
 */
// Check if tenant can review a specific worker
router.get("/:id/can-review", workerController.canTenantReviewWorker);

/**
 * @swagger
 * /api/workers/:id:
 *   get:
 *     summary: Get worker public profile
 *     description: Retrieve public profile details of a worker
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID
 *     responses:
 *       200:
 *         description: Worker details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Worker'
 *       404:
 *         description: Worker not found
 *       500:
 *         description: Server error
 */
// Get single worker details (public profile)
router.get("/:id", workerController.getWorkerById);

/**
 * @swagger
 * /api/workers:
 *   get:
 *     summary: Get all workers
 *     description: Retrieve list of all available workers (public listing with pagination)
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (for pagination)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Array of workers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Worker'
 *       500:
 *         description: Server error
 */
// Get all workers (public listing)
router.get("/", workerController.getAllWorkers);

/**
 * @swagger
 * /api/workers/filter:
 *   get:
 *     summary: Advanced worker filtering
 *     description: Filter workers by multiple criteria (service type, rating, availability, etc.)
 *     tags:
 *       - Workers
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *         description: Type of service (e.g., Electrician, Plumber)
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating filter
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location filter
 *     responses:
 *       200:
 *         description: Filtered workers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Worker'
 *       500:
 *         description: Server error
 */
// Advanced filter workers
router.get("/filter", workerController.filterWorkers);

// ────────────────────────────────────────────────
// Protected API Routes (require JWT)
// ────────────────────────────────────────────────

/**
 * @swagger
 * /api/workers/:id/toggle:
 *   post:
 *     summary: Toggle worker availability
 *     description: Toggle availability status for the worker (online/offline)
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               available:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Availability toggled successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Toggle availability
router.post("/:id/toggle", protect, workerController.toggleWorkerAvailability);

/**
 * @swagger
 * /api/workers/delete-service:
 *   post:
 *     summary: Delete worker service details
 *     description: Worker can delete their service profile information
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439111"
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Delete own service details
router.post("/delete-service", protect, workerController.deleteWorkerService);

/**
 * @swagger
 * /api/workers/check-booked/:id:
 *   get:
 *     summary: Check if worker is booked
 *     description: Verify the booking status of a worker
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID
 *     responses:
 *       200:
 *         description: Booking status
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Check if worker is booked
router.get("/check-booked/:id", protect, workerController.checkWorkerBookedStatus);

/**
 * @swagger
 * /api/workers/delete-account/:id:
 *   delete:
 *     summary: Delete worker account
 *     description: Permanently delete worker account and associated data
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID to delete
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Delete own account
router.delete("/delete-account/:id", protect, workerController.deleteWorkerAccount);

/**
 * @swagger
 * /api/workers/update-settings:
 *   post:
 *     summary: Update worker settings
 *     description: Update personal settings and preferences for worker account
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               location:
 *                 type: string
 *               serviceType:
 *                 type: string
 *               experience:
 *                 type: string
 *               ratePerHour:
 *                 type: number
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Update own settings
router.post("/update-settings", protect, workerController.updateWorkerSettings);

/**
 * @swagger
 * /api/workers/debook/:id:
 *   post:
 *     summary: Debook a worker
 *     description: Tenant action to remove/cancel a worker booking
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID to debook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Service no longer needed"
 *     responses:
 *       200:
 *         description: Worker debookedsuccessfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Debook worker (tenant action)
router.post("/debook/:id", protect, workerController.debookWorker);

// ────────────────────────────────────────────────
// Work Tracking (protected)
// ────────────────────────────────────────────────

/**
 * @swagger
 * /api/workers/work-tracking/generate-otp:
 *   post:
 *     summary: Generate work OTP
 *     description: Generate OTP for work tracking verification
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439020"
 *     responses:
 *       200:
 *         description: OTP generated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/work-tracking/generate-otp", protect, workerController.generateWorkOTP);

/**
 * @swagger
 * /api/workers/work-tracking/verify-otp:
 *   post:
 *     summary: Verify work OTP
 *     description: Verify OTP for work completion tracking
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - otp
 *             properties:
 *               bookingId:
 *                 type: string
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid OTP
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/work-tracking/verify-otp", protect, workerController.verifyWorkOTP);

/**
 * @swagger
 * /api/workers/work-tracking/history/:tenantId:
 *   get:
 *     summary: Get work history
 *     description: Retrieve work history for a specific tenant
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Work history with all sessions
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/work-tracking/history/:tenantId", protect, workerController.getWorkHistory);

/**
 * @swagger
 * /api/workers/notifications/:notificationId/read:
 *   post:
 *     summary: Mark notification as read
 *     description: Update notification read status
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Mark notification as read
router.post("/notifications/:notificationId/read", protect, workerController.markNotificationAsRead);

// ────────────────────────────────────────────────
// Booking Routes
// ────────────────────────────────────────────────

/**
 * @swagger
 * /api/workers/:id/book:
 *   post:
 *     summary: Book a worker
 *     description: Create a booking for a specific worker service
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID to book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduledDate
 *               - duration
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-04-15"
 *               duration:
 *                 type: number
 *                 description: Duration in hours
 *                 example: 4
 *               specialRequests:
 *                 type: string
 *                 example: "Bring cleaning supplies"
 *     responses:
 *       201:
 *         description: Worker booked successfully
 *       400:
 *         description: Invalid booking request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Book a worker
router.post("/:id/book", protect, workerController.bookWorkerCorrected);

/**
 * @swagger
 * /api/workers/bookings/:id/status:
 *   post:
 *     summary: Update worker booking status
 *     description: Update the status of a worker booking (accepted, completed, cancelled)
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
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
 *                 enum:
 *                   - Accepted
 *                   - Completed
 *                   - Cancelled
 *                   - In Progress
 *                 example: "Completed"
 *     responses:
 *       200:
 *         description: Booking status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Update booking status
router.post("/bookings/:id/status", protect, workerController.updateWorkerBookingStatus);

// ────────────────────────────────────────────────
// Worker Registration / Upload (protected + multer)
// ────────────────────────────────────────────────

/**
 * @swagger
 * /api/workers/register:
 *   post:
 *     summary: Register as a worker
 *     description: Worker registration with profile image upload
 *     tags:
 *       - Workers
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - serviceType
 *               - experience
 *             properties:
 *               serviceType:
 *                 type: string
 *                 example: "Electrician"
 *               experience:
 *                 type: string
 *                 example: "5 years"
 *               profileImage:
 *                 type: string
 *                 format: binary
 *               certifications:
 *                 type: string
 *               ratePerHour:
 *                 type: number
 *                 example: 500
 *     responses:
 *       201:
 *         description: Worker registered successfully
 *       400:
 *         description: Registration validation failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/register",
  protect,
  (req, res, next) => {
    uploadWorker(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err.message);
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      next();
    });
  },
  workerController.registerWorker
);

module.exports = router;