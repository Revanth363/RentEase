const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const isAuthenticated = require("../middleware/auth");

// Worker payment submission
router.post(
  "/worker-payment",
  isAuthenticated,
  tenantController.submitWorkerPayment
);

// Debug log for tenant routes
router.use((req, res, next) => {
  console.log(`Tenant route: ${req.method} ${req.url}`);
  next();
});

// Tenant dashboard route
router.get("/tenant_dashboard", isAuthenticated, tenantController.getDashboard);

// Maintenance request submission
router.post(
  "/maintenance",
  isAuthenticated,
  tenantController.submitMaintenanceRequest
);

// Complaint submission
router.post("/complaint", isAuthenticated, tenantController.submitComplaint);

// Property review submission
router.post("/review", isAuthenticated, tenantController.submitPropertyReview);

// Profile update
router.post("/profile", isAuthenticated, tenantController.updateProfile);

// Password change
router.post("/password", isAuthenticated, tenantController.changePassword);

// Save/Remove Property
router.post("/saved-property", isAuthenticated, (req, res, next) => {
  console.log("Reached /saved-property route:", {
    method: req.method,
    body: req.body,
    session: req.session.user,
  });
  tenantController.toggleSavedProperty(req, res, next);
});

// Notification preferences update
router.post(
  "/notifications",
  isAuthenticated,
  tenantController.updateNotificationPreferences
);

router.post(
  "/notification/read",
  isAuthenticated,
  tenantController.markNotificationAsRead
);
router.post(
  "/check-recent-payment",
  isAuthenticated,
  tenantController.checkRecentPayment
);
router.post("/payment", isAuthenticated, tenantController.submitPayment);

router.post(
  "/check-account-status",
  isAuthenticated,
  tenantController.checkAccountStatus
);
router.post("/delete-account", isAuthenticated, tenantController.deleteAccount);
// Unrent property request
router.post(
  "/unrent-property",
  isAuthenticated,
  tenantController.requestUnrentProperty
);

module.exports = router;
