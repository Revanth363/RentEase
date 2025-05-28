const express = require("express");
const router = express.Router();

const workerController = require("../controllers/workerController");
const { uploadWorker } = require("../middleware/uploadCloudinary");
const { protect } = require("../middleware/auth"); // JWT protect middleware

// ────────────────────────────────────────────────
// Public Routes (no auth required)
// ────────────────────────────────────────────────

router.get("/dashboard", protect, workerController.getDashboardDataAPI);

// Get filter options (locations, areas, service types)
router.get("/filters", workerController.getWorkerFilters);

// Search workers by location/area
router.get("/search", workerController.searchWorkersByLocation);

// Check if tenant can review a specific worker
router.get("/:id/can-review", workerController.canTenantReviewWorker);

// Get single worker details (public profile)
router.get("/:id", workerController.getWorkerById);

// Get all workers (public listing)
router.get("/", workerController.getAllWorkers);

// Advanced filter workers
router.get("/filter", workerController.filterWorkers);

// ────────────────────────────────────────────────
// Protected API Routes (require JWT)
// ────────────────────────────────────────────────

// Worker dashboard data (JSON API)


// Toggle availability
router.post("/:id/toggle", protect, workerController.toggleWorkerAvailability);

// Delete own service details
router.post("/delete-service", protect, workerController.deleteWorkerService);

// Check if worker is booked
router.get("/check-booked/:id", protect, workerController.checkWorkerBookedStatus);

// Delete own account
router.delete("/delete-account/:id", protect, workerController.deleteWorkerAccount);

// Update own settings
router.post("/update-settings", protect, workerController.updateWorkerSettings);

// Debook worker (tenant action)
router.post("/debook/:id", protect, workerController.debookWorker);

// ────────────────────────────────────────────────
// Work Tracking (protected)
// ────────────────────────────────────────────────

router.post("/work-tracking/generate-otp", protect, workerController.generateWorkOTP);
router.post("/work-tracking/verify-otp", protect, workerController.verifyWorkOTP);
router.get("/work-tracking/history/:tenantId", protect, workerController.getWorkHistory);

// ────────────────────────────────────────────────
// Booking Routes
// ────────────────────────────────────────────────

// Book a worker
router.post("/:id/book", protect, workerController.bookWorkerCorrected);

// Update booking status
router.post("/bookings/:id/status", protect, workerController.updateWorkerBookingStatus);

// ────────────────────────────────────────────────
// Worker Registration / Upload (protected + multer)
// ────────────────────────────────────────────────

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