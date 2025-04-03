const express = require("express");
const router = express.Router();
const workerController = require("../controllers/workerController");
// Only require controllers and express at the top. Do not require WorkerPayment here.

// Route to render the worker dashboard
//router.get("/worker_dashboard", workerController.isAuthenticated, workerController.renderWorkerDashboard);

// Route to render the worker registration page
router.get(
  "/worker_register",
  workerController.isAuthenticated,
  workerController.renderWorkerRegisterPage
);

// Route to render the worker details page (no authentication)
router.get("/workerDetails", workerController.renderWorkerDetailsPage);

// Route to render the service details page
router.get("/service/:id", workerController.renderServiceDetailsPage);

// Route to render the edit service page
router.get(
  "/edit_service/:id",
  workerController.isAuthenticated,
  workerController.renderEditServicePage
);

// API endpoint to get all unique locations, areas, and service types for filters
router.get("/filters", workerController.getWorkerFilters);

// API endpoint to search workers by location
router.get("/search", workerController.searchWorkersByLocation);

// API endpoint to check if tenant can review a worker
router.get("/:id/can-review", workerController.canTenantReviewWorker);

// Route to render the worker dashboard
//router.get("/worker_dashboard", workerController.isAuthenticated, workerController.renderWorkerDashboard);

// Route to render the worker registration page
router.get(
  "/worker_register",
  workerController.isAuthenticated,
  workerController.renderWorkerRegisterPage
);

// Route to render the worker details page (no authentication)
router.get("/workerDetails", workerController.renderWorkerDetailsPage);

// Route to render the service details page
router.get("/service/:id", workerController.renderServiceDetailsPage);

// Route to render the edit service page
router.get(
  "/edit_service/:id",
  workerController.isAuthenticated,
  workerController.renderEditServicePage
);

// API endpoint to get all workers data (mounted at /api/workers/)
router.get("/", workerController.getAllWorkers);

// Add filter functionality for workers (mounted at /api/workers/filter)
// Register filter route before ":id" so "filter" doesn't match the id param.
router.get("/filter", workerController.filterWorkers);

// API endpoint to get a specific worker by ID (mounted at /api/workers/:id)
router.get("/:id", workerController.getWorkerById);

// API endpoint to register/update a worker
router.post("/api/workers/register", workerController.registerWorker);

// API endpoint to toggle worker availability
router.post(
  "/api/workers/:id/toggle",
  workerController.toggleWorkerAvailability
);

// API endpoint to delete worker service details
router.post(
  "/api/workers/delete-service",
  workerController.deleteWorkerService
);

router.post("/api/workers/:id/book", workerController.bookWorkerCorrected);
router.post(
  "/api/workers/bookings/:id/status",
  workerController.updateWorkerBookingStatus
);
// API endpoint to check if worker is booked
router.get(
  "/api/workers/check-booked/:id",
  workerController.isAuthenticated,
  workerController.checkWorkerBookedStatus
);

// API endpoint to delete worker account
router.delete(
  "/api/workers/delete-account/:id",
  workerController.isAuthenticated,
  workerController.deleteWorkerAccount
);
router.get("/worker_dashboard", workerController.renderWorkerDashboardSafer);
// API endpoint to update worker settings
router.post(
  "/api/workers/update-settings",
  workerController.isAuthenticated,
  workerController.updateWorkerSettings
);

// API endpoint to debook a worker
router.post(
  "/api/workers/debook/:id",
  workerController.isAuthenticated,
  workerController.debookWorker
);

// Add this line with your other API routes
router.get(
  "/api/dashboard",
  workerController.isAuthenticated,
  workerController.getDashboardDataAPI
);

// Work tracking routes
router.post(
  "/work-tracking/generate-otp",
  workerController.isAuthenticated,
  workerController.generateWorkOTP
);

router.post(
  "/work-tracking/verify-otp",
  workerController.isAuthenticated,
  workerController.verifyWorkOTP
);

router.get(
  "/work-tracking/history/:tenantId",
  workerController.isAuthenticated,
  workerController.getWorkHistory
);

module.exports = router;
