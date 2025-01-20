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

// API endpoint to get all workers data
router.get("/api/workers", workerController.getAllWorkers);

// API endpoint to get a specific worker by ID
router.get("/api/workers/:id", workerController.getWorkerById);

// Add filter functionality for workers
router.get("/api/workers/filter", workerController.filterWorkers);

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




module.exports = router;
