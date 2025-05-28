const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const { protect } = require("../middleware/auth");


// Worker payment submission
router.post(
  "/worker-payment",
  protect,
  tenantController.submitWorkerPayment
);

// Debug log for tenant routes
router.use((req, res, next) => {
  console.log(`Tenant route: ${req.method} ${req.url}`);
  next();
});

// Tenant dashboard route
router.get("/tenant_dashboard", protect, tenantController.getDashboard);
// New: dashboard JSON data for React frontend
router.get(
  "/dashboard-data",
  protect,
  tenantController.getDashboardData
);

// Maintenance request submission
router.post(
  "/maintenance",
  protect,
  tenantController.submitMaintenanceRequest
);

// Complaint submission
router.post("/complaint", protect, tenantController.submitComplaint);

// Property review submission
router.post("/review", protect, tenantController.submitPropertyReview);

// Profile update
router.post("/profile", protect, tenantController.updateProfile);

// Password change
router.post("/password", protect, tenantController.changePassword);

// Save/Remove Property
router.post("/saved-property", protect, (req, res, next) => {
  console.log("Reached /saved-property route:", {
    method: req.method,
    body: req.body,
    user: req.user,
  });
  tenantController.toggleSavedProperty(req, res, next);
});

// Notification preferences update
router.post(
  "/notifications",
  protect,
  tenantController.updateNotificationPreferences
);

router.post(
  "/notification/read",
  protect,
  tenantController.markNotificationAsRead
);
router.post(
  "/check-recent-payment",
  protect,
  tenantController.checkRecentPayment
);
router.post("/payment", protect, tenantController.submitPayment);

router.post(
  "/check-account-status",
  protect,
  tenantController.checkAccountStatus
);
router.post("/delete-account", protect, tenantController.deleteAccount);
// Unrent property request
router.post(
  "/unrent-property",
  protect,
  tenantController.requestUnrentProperty
);

// Work tracking routes
router.get(
  "/work-tracking/history/:workerId",
  protect,
  tenantController.getWorkerWorkHistory
);

module.exports = router;
