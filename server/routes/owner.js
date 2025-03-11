const express = require("express");
const router = express.Router();
const ownerController = require("../controllers/ownerController");
const propertyController = require("../controllers/propertyController");
const isAuthenticated = require("../middleware/auth");
const UnrentRequest = require("../models/unrentRequest");

// Get owner dashboard data (React API endpoint)
router.get("/dashboard", ownerController.getOwnerDashboard);

// Legacy route for backward compatibility
router.get("/owner_dashboard", ownerController.getOwnerDashboard);

// Update maintenance request status
router.post(
  "/maintenance-request/status",
  ownerController.updateMaintenanceRequestStatus
);

// Delete owner account
router.delete("/delete-account", ownerController.deleteOwnerAccount);

// Legacy route for backward compatibility
router.delete("/owner/delete-account", ownerController.deleteOwnerAccount);

// Update owner settings
router.post("/update-settings", ownerController.updateOwnerSettings);

// Legacy route for backward compatibility
router.post("/owner/update-settings", ownerController.updateOwnerSettings);

// Approve or reject unrent property requests
router.post(
  "/approve-unrent-property",
  isAuthenticated,
  ownerController.approveUnrentProperty
);

// Legacy route for backward compatibility
router.post(
  "/approve-unrent-property",
  isAuthenticated,
  ownerController.approveUnrentProperty
);

// Get notifications
router.get("/notifications", ownerController.getNotifications);

module.exports = router;
