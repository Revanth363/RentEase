const express = require("express");
const router = express.Router();
const ownerController = require("../controllers/ownerController");
const propertyController = require("../controllers/propertyController");
const { protect } = require("../middleware/auth");

const UnrentRequest = require("../models/unrentRequest");

// Get owner dashboard data (React API endpoint)
router.get("/dashboard", protect,ownerController.getOwnerDashboard);

// Legacy route for backward compatibility
router.get("/owner_dashboard", protect, ownerController.getOwnerDashboard);

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
  protect
,
  ownerController.approveUnrentProperty
);

// Legacy route for backward compatibility
router.post(
  "/approve-unrent-property",
  protect
,
  ownerController.approveUnrentProperty
);

// Get notifications
router.get("/notifications", ownerController.getNotifications);

// Mark notification as read
router.post("/notifications/:notificationId/read", ownerController.markNotificationRead);

module.exports = router;
