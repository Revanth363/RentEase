const mongoose = require("mongoose");
const Owner = require("../models/owner");
const Property = require("../models/property");
const Tenant = require("../models/tenant");
const Payment = require("../models/payment");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const Complaint = require("../models/complaint");
const Agreement = require("../models/Agreement");
const Notification = require("../models/notification");
const UnrentRequest = require("../models/unrentRequest");
const bookingController = require("./bookingController");
// bcrypt removed; plain-text password comparisons are used per requirement

exports.getOwnerDashboard = async (req, res) => {
  try {
    // Log user for debugging (JWT-based, from middleware decode)
    console.log("User:", req.user);

    // Owner's ObjectId from JWT/req.user
    const ownerId = req.user?.id;

    // Validate ownerId
    if (!ownerId) {
      console.error("No ownerId found in request");
      return res
        .status(401)
        .json({ message: "Unauthorized: No user ID in request" });
    }

    // Ensure ownerId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      console.error("Invalid ownerId format:", ownerId);
      return res.status(400).json({ message: "Invalid owner ID format" });
    }

    // Convert to ObjectId
    const objectId = new mongoose.Types.ObjectId(ownerId);

    // Fetch owner
    const owner = await Owner.findById(objectId);
    if (!owner) {
      console.error("Owner not found for ID:", ownerId);
      return res.status(404).json({ message: "Owner not found" });
    }

    // Fetch properties by ownerId (include all fields including images)
    const properties = await Property.find({ ownerId: objectId }).lean();
    
    console.log("Properties found:", {
      count: properties.length,
      propertiesWithTenants: properties.filter(p => p.tenantId).length
    });

    // Fetch tenants by matching tenantId in properties
    const tenantIds = properties
      .filter(
        (property) =>
          property.tenantId &&
          mongoose.Types.ObjectId.isValid(property.tenantId)
      )
      .map((property) => property.tenantId);
    const tenants = await Tenant.find({ _id: { $in: tenantIds } }).lean();

    // Attach property name to each tenant
    tenants.forEach((tenant) => {
      const property = properties.find(
        (prop) =>
          prop.tenantId && prop.tenantId.toString() === tenant._id.toString()
      );
      tenant.property = property ? property.name : "N/A";
      tenant.propid = property ? property._id : "N/A";
      tenant.rentalStartDate = property ? property.rentalStartDate : null;
      tenant.leaseDuration = tenant.leaseDuration || "N/A";
      tenant.occupation = tenant.occupation || "N/A";
    });

    // Fetch other data - fetch payments by property (not tenant) to include historical payments  
    const propertyIds = properties.map(p => p._id);
    const payments = await Payment.find({ propertyId: { $in: propertyIds } })
      .populate('tenantId', 'firstName lastName')
      .populate('propertyId', 'name')
      .sort({ paymentDate: -1 })
      .lean();
    
    console.log("Payment enrichment debug:", {
      totalProperties: properties.length,
      paymentsFound: payments.length,
      paymentSample: payments.length > 0 ? {
        _id: payments[0]._id,
        tenantId: payments[0].tenantId,
        propertyId: payments[0].propertyId,
        userName: payments[0].userName,
        amount: payments[0].amount
      } : null
    });

    // Enrich payments with tenant and property names from populated data
    payments.forEach((payment) => {
      // Use tenant firstName + lastName if populated, fallback to stored userName
      if (payment.tenantId && payment.tenantId.firstName) {
        payment.userName = `${payment.tenantId.firstName} ${payment.tenantId.lastName}`;
      } else if (!payment.userName) {
        payment.userName = "Unknown";
      }
      // Use property name if populated
      if (payment.propertyId && payment.propertyId.name) {
        payment.property = payment.propertyId.name;
      } else {
        payment.property = "Unknown Property";
      }
    });
    
    console.log("After enrichment:", {
      paymentsCount: payments.length,
      enrichedSample: payments.length > 0 ? {
        _id: payments[0]._id,
        userName: payments[0].userName,
        property: payments[0].property,
        amount: payments[0].amount
      } : null
    });

    const maintenanceRequests = await MaintenanceRequest.find({
      tenantId: { $in: tenantIds },
    }).lean();

    // Fetch tenant and property details for maintenance requests
    const tenantMap = new Map();
    const propertyMap = new Map();

    // Collect unique tenant and property IDs
    const tenantIdsForRequests = maintenanceRequests
      .filter(
        (req) => req.tenantId && mongoose.Types.ObjectId.isValid(req.tenantId)
      )
      .map((req) => req.tenantId);
    const propertyIdsForRequests = maintenanceRequests
      .filter(
        (req) =>
          req.propertyId && mongoose.Types.ObjectId.isValid(req.propertyId)
      )
      .map((req) => req.propertyId);

    // Fetch tenants
    const tenantsForRequests = await Tenant.find({
      _id: { $in: tenantIdsForRequests },
    })
      .select("firstName lastName")
      .lean();

    tenantsForRequests.forEach((tenant) => {
      tenantMap.set(
        tenant._id.toString(),
        `${tenant.firstName} ${tenant.lastName}` // Added backticks for template literal
      );
    });
    // Fetch properties
    const propertiesForRequests = await Property.find({
      _id: { $in: propertyIdsForRequests },
    })
      .select("name")
      .lean();
    propertiesForRequests.forEach((property) => {
      propertyMap.set(property._id.toString(), property.name);
    });

    // Attach tenantName and propertyName to each maintenance request
    maintenanceRequests.forEach((request) => {
      request.tenantName = tenantMap.get(request.tenantId?.toString()) || "N/A";
      request.propertyName =
        propertyMap.get(request.propertyId?.toString()) || "N/A";
    });

    // Fetch complaints with tenant & property info
    let complaints = await Complaint.find({ tenantId: { $in: tenantIds } })
      .populate("tenantId", "firstName lastName phone")
      .populate("propertyId", "name")
      .lean();

    // Format complaints for frontend
    complaints = complaints.map((c) => ({
      _id: c._id,
      property: c.propertyId?.name || "N/A",
      subject: c.subject || "N/A",
      reportedBy: c.tenantId
        ? `${c.tenantId.firstName} ${c.tenantId.lastName}`
        : "N/A",
      dateSubmitted: c.dateSubmitted,
      status: c.status || "Open",
      phone: c.tenantId?.phone || "",
    }));

    const agreements = await Agreement.find({ ownerId: objectId });
    // Fetch notifications from Notification model
    let notifications = await Notification.find({
      _id: { $in: owner.notificationIds },
    }).lean();

    // Fetch pending unrent requests
    const unrentRequests = await UnrentRequest.find({
      ownerId: objectId,
      status: "Pending",
    }).lean();

    // Create a Set of notification IDs that have corresponding pending unrent requests
    const unrentNotificationIds = new Set(
      unrentRequests
        .filter((req) => req.notificationId)
        .map((req) => req.notificationId.toString())
    );

    // Filter out notifications that are pending unrent requests
    // (because we'll show them from UnrentRequest model instead)
    notifications = notifications.filter((notification) => {
      // If this notification is linked to a pending unrent request, exclude it
      if (unrentNotificationIds.has(notification._id.toString())) {
        return false;
      }
      // Keep all other notifications
      return true;
    });

    // Now add unrent requests as notification objects
    for (const request of unrentRequests) {
      const property = await Property.findById(request.propertyId)
        .select("name")
        .lean();
      const tenant = await Tenant.findById(request.tenantId)
        .select("firstName lastName")
        .lean();

      // Add unrent request as a notification object
      notifications.push({
        _id: request._id,
        type: "Unrent Request",
        message: `${
          tenant ? tenant.firstName + " " + tenant.lastName : "Tenant"
        } has requested to unrent the property.${
          request.reason ? "\nReason: " + request.reason : ""
        }`,
        recipientName: tenant
          ? `${tenant.firstName} ${tenant.lastName}`
          : "N/A",
        propertyName: property ? property.name : "N/A",
        status: request.status,
        createdDate: request.createdDate,
        propertyId: request.propertyId,
        tenantId: request.tenantId,
        isUnrentRequest: true,
        isNew: true,
        originalNotificationId: request.notificationId, // Keep track of the original notification
      });
    }

    // Sort notifications by date
    notifications.sort(
      (a, b) => new Date(b.createdDate) - new Date(a.createdDate)
    );

    // Sample reports data
    const reports = {
      monthlyRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      occupancyRate: properties.length
        ? (properties.filter((p) => p.isRented).length / properties.length) *
          100
        : 0,
      maintenanceCosts: maintenanceRequests.length * 5000,
      revenueTrend: { class: "positive", text: "Up 5%" },
      occupancyTrend: { class: "stable", text: "Stable" },
      maintenanceTrend: { class: "negative", text: "Down 2%" },
      revenueChart: [
        { height: 60, value: 40000, month: "Jan" },
        { height: 80, value: 50000, month: "Feb" },
        { height: 70, value: 45000, month: "Mar" },
        { height: 90, value: 60000, month: "Apr" },
        { height: 65, value: 42000, month: "May" },
        { height: 85, value: 55000, month: "Jun" },
      ],
    };

    // Sample payment summary
    const paymentSummary = {
      monthlyRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      upcomingPayments: payments
        .filter((p) => p.status === "Pending")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      totalRevenue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      commission: payments.reduce((sum, p) => sum + (p.amount || 0), 0) * 0.05,
      netIncome: payments.reduce((sum, p) => sum + (p.amount || 0), 0) * 0.95,
    };

    // Return JSON response for React frontend
    res.json({
      success: true,
      user: {
        _id: owner._id,
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        phone: owner.phone,
        location: owner.location,
        accountNo: owner.accountNo,
        upiid: owner.upiid,
        numProperties: properties.length,
        notifications: owner.notifications || {
          email: true,
          sms: true,
          payment: true,
          complaint: true,
          maintenance: true,
        },
      },
      properties: properties || [],
      tenants: tenants || [],
      payments: payments || [],
      paymentSummary: paymentSummary || {},
      maintenanceRequests: maintenanceRequests || [],
      complaints: complaints || [],
      reports: reports || {},
      agreements: agreements || [],
      notifications: notifications || [],
    });
  } catch (err) {
    console.error("Error fetching owner dashboard:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Add delete property function
exports.deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid property ID" });
    }

    // Find property to check if it's rented
    const property = await Property.findById(propertyId);

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    // Check if property is currently rented
    if (property.isRented) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete property because it is currently rented",
      });
    }

    // Delete the property
    await Property.findByIdAndDelete(propertyId);

    return res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting property",
      error: error.message,
    });
  }
};

// Fetch owner's notifications
exports.getNotifications = async (req, res) => {
  try {
    // Check if user is owner
    if (!req.user || req.user.userType !== "owner") {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const ownerId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid owner ID" });
    }

    // Fetch notifications for the owner
    const notifications = await Notification.find({
      recipient: ownerId,
      recipientType: "Owner",
    }).sort({ createdDate: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Mark notification as read (set isNew to false)
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    }

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isNew: false, read: true },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Approve notification - delegates to bookingController if booking-related, otherwise simple update
exports.approveNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    }

    // Fetch the notification first
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    // If it's a booking request, use full booking controller logic
    if (notification.type === "Booking Request" && notification.bookingId) {
      if (!req.body) req.body = {};
      req.body.notificationId = notificationId;
      req.body.action = "approve";
      req.body.reason = req.body.reason || "";
      return await bookingController.handleNotificationAction(req, res);
    }

    // If it's an unrent request, use full unrent logic
    if (notification.type === "Unrent Request" && notification.unrentRequestId) {
      if (!req.body) req.body = {};
      req.body.unrentRequestId = notification.unrentRequestId;
      req.body.action = "approve";
      return await exports.approveUnrentProperty(req, res);
    }

    // For other notification types, just update status
    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      { status: "Approved", isNew: false, read: true },
      { new: true }
    );

    res.status(200).json({ success: true, notification: updated });
  } catch (err) {
    console.error("Error approving notification:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Reject notification - delegates to bookingController if booking-related, otherwise simple update
exports.rejectNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    }

    // Fetch the notification first
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    // If it's a booking request, use full booking controller logic
    if (notification.type === "Booking Request" && notification.bookingId) {
      if (!req.body) req.body = {};
      req.body.notificationId = notificationId;
      req.body.action = "reject";
      req.body.reason = req.body.reason || "";
      return await bookingController.handleNotificationAction(req, res);
    }

    // If it's an unrent request, use full unrent logic
    if (notification.type === "Unrent Request" && notification.unrentRequestId) {
      if (!req.body) req.body = {};
      req.body.unrentRequestId = notification.unrentRequestId;
      req.body.action = "reject";
      return await exports.approveUnrentProperty(req, res);
    }

    // For other notification types, just update status
    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      { status: "Rejected", isNew: false, read: true },
      { new: true }
    );

    res.status(200).json({ success: true, notification: updated });
  } catch (err) {
    console.error("Error rejecting notification:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// Update complaint status
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(complaintId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid complaint ID" });
    }

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { status: status.charAt(0).toUpperCase() + status.slice(1) },
      { new: true }
    );

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found" });
    }

    res.status(200).json({ success: true, complaint });
  } catch (err) {
    console.error("Error updating complaint status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update maintenance request status
exports.updateMaintenanceRequestStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    // Validate requestId
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request ID" });
    }

    // Validate status
    const validStatuses = ["Pending", "In Progress", "Resolved"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    // Find and update the maintenance request
    const maintenanceRequest = await MaintenanceRequest.findById(requestId);
    if (!maintenanceRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Maintenance request not found" });
    }

    // Update status
    maintenanceRequest.status = status;
    await maintenanceRequest.save();

    // Optionally, create a notification for the tenant
    return res.status(200).json({
      success: true,
      message: "Maintenance request status updated successfully",
      status: maintenanceRequest.status,
    });
  } catch (error) {
    console.error("Error updating maintenance request status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating maintenance request status",
      error: error.message,
    });
  }
};

// Delete owner account if no tenants and no rented properties
exports.deleteOwnerAccount = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    const { password } = req.body;

    // Validate ownerId
    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Invalid user ID" });
    }

    // Fetch owner with password
    const owner = await Owner.findById(ownerId).select("+password");
    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: "Owner not found" });
    }

    // Validate password (plain text comparison as requested)
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    // if password does not match with owner's password
    if (password !== owner.password) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password" });
    }

    // Check for associated tenants using ownerId in Tenant model
    const tenants = await Tenant.find({
      ownerId: new mongoose.Types.ObjectId(ownerId),
    });

    // If there are tenants, prevent deletion
    if (tenants.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete account because there are associated tenants",
      });
    }

    // Fetch properties by ownerId
    const properties = await Property.find({
      ownerId: new mongoose.Types.ObjectId(ownerId),
    });

    // Check if any properties are rented
    const hasRentedProperties = properties.some(
      (property) => property.isRented
    );

    // If any property is rented, prevent deletion
    if (hasRentedProperties) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete account because one or more properties are currently rented",
      });
    }

    // Delete all properties owned by the owner
    if (properties.length > 0) {
      await Property.deleteMany({
        ownerId: new mongoose.Types.ObjectId(ownerId),
      });
    }

    // Delete the owner account
    await Owner.findByIdAndDelete(ownerId);

    // Clear auth cookie for stateless JWT
    try {
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    } catch (err) {
      console.error("Error clearing auth cookie:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting owner account:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting account",
      error: error.message,
    });
  }
};
// Update owner settings
exports.updateOwnerSettings = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const {
      firstName,
      lastName,
      email,
      phone,
      location,
      accountNo,
      upiid,
      numProperties,
      emailNotifications,
      smsNotifications,
      paymentReminders,
      complaintAlerts,
      maintenanceAlerts,
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // Validate ownerId
    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Invalid user ID" });
    }

    // Fetch owner
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: "Owner not found" });
    }

    // Update personal information
    if (firstName) owner.firstName = firstName;
    if (lastName) owner.lastName = lastName;
    if (email) owner.email = email;
    if (phone) owner.phone = phone;
    if (location) owner.location = location;
    if (accountNo) owner.accountNo = accountNo;
    if (upiid) owner.upiid = upiid;
    if (numProperties) owner.numProperties = numProperties;

    // Update notification preferences
    owner.notifications = {
      email: emailNotifications === "true",
      sms: smsNotifications === "true",
      payment: paymentReminders === "true",
      complaint: complaintAlerts === "true",
      maintenance: maintenanceAlerts === "true",
    };

    // Handle password change
    if (currentPassword && newPassword && confirmPassword) {
      // Validate current password (plain text comparison as per existing logic)
      if (currentPassword !== owner.password) {
        return res
          .status(400)
          .json({ success: false, message: "Incorrect current password" });
      }
      // Validate new password match
      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({ success: false, message: "New passwords do not match" });
      }
      // Update password
      owner.password = newPassword;
    }

    // Save updated owner data
    await owner.save();

    // Stateless JWT: do not update session; return updated data in response

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating owner settings:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating settings",
      error: error.message,
    });
  }
};

// Approve or reject unrent property request
exports.approveUnrentProperty = async (req, res) => {
  try {
    const { unrentRequestId, action } = req.body;
    const ownerId = req.user.id;
    // Validate inputs
    if (!unrentRequestId || !action) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    if (!mongoose.Types.ObjectId.isValid(unrentRequestId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid UnrentRequest ID" });
    }
    // UnrentRequest is already required at the top
    const unrentRequest = await UnrentRequest.findById(unrentRequestId);
    if (!unrentRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Unrent request not found" });
    }
    if (unrentRequest.ownerId.toString() !== ownerId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const propertyId = unrentRequest.propertyId;
    const tenantId = unrentRequest.tenantId;
    // Approve or reject
    if (action === "approve") {
      // Get property and tenant details for rental history
      const property = await Property.findById(propertyId);
      const tenant = await Tenant.findById(tenantId);

      // Find or create rental history record for this tenant
      const RentalHistory = require("../models/rentalhistory");
      let rentalHistoryRecord = await RentalHistory.findOne({ tenantId });

      const propertyDetails = {
        property: propertyId,
        startDate: null,
        endDate: new Date(),
        rent: property ? property.price : null,
        owner:
          property && property.ownerId ? property.ownerId.toString() : null,
        address: property ? property.address : "N/A",
        status: "Completed",
        reasonForMoving: unrentRequest.reason || "Unrent requested",
      };

      if (rentalHistoryRecord) {
        // Add property to existing rental history
        rentalHistoryRecord.propertyIds.push(propertyDetails);
        await rentalHistoryRecord.save();
      } else {
        // Create new rental history record
        rentalHistoryRecord = await new RentalHistory({
          tenantId,
          propertyIds: [propertyDetails],
        }).save();
      }

      // Update property status
      if (property) {
        property.tenantId = null;
        property.status = "Available";
        property.isRented = false;
        property.lastRentedDate = null;
        property.rentalStartDate = null;
        await property.save();
      }
      // Update tenant - add rentalHistoryIds reference and remove propertyId
      await Tenant.findByIdAndUpdate(tenantId, {
        $unset: { propertyId: "" },
        $addToSet: { rentalHistoryIds: rentalHistoryRecord._id },
      });
      // Update owner
      await Owner.findByIdAndUpdate(ownerId, {
        $pull: { tenantIds: tenantId },
      });
      // Update UnrentRequest status
      unrentRequest.status = "Approved";
      unrentRequest.completedDate = new Date();
      await unrentRequest.save();
      // Update notification status
      if (unrentRequest.notificationId) {
        await Notification.findByIdAndUpdate(unrentRequest.notificationId, {
          status: "Approved",
          read: true,
          completedDate: new Date(),
        });
      }
      // Cancel any pending payments
      await Payment.updateMany(
        {
          propertyId,
          tenantId,
          status: "Pending",
        },
        {
          $set: { status: "Cancelled" },
        }
      );
      return res.status(200).json({
        success: true,
        message: "Property unrented successfully",
        property: {
          id: propertyId,
          status: "Available",
        },
      });
    } else if (action === "reject") {
      unrentRequest.status = "Rejected";
      unrentRequest.completedDate = new Date();
      await unrentRequest.save();
      if (unrentRequest.notificationId) {
        await Notification.findByIdAndUpdate(unrentRequest.notificationId, {
          status: "Rejected",
          read: true,
          completedDate: new Date(),
        });
      }
      return res
        .status(200)
        .json({ success: true, message: "Unrent request rejected" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }
  } catch (error) {
    console.error("Approve unrent property error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing unrent request",
    });
  }
};

// Owner login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const owner = await Owner.findOne({ email }).select("+password");
    if (!owner)
      return res
        .status(401)
        .render("pages/login", { error: "Account not found" });
    // Plain-text comparison
    if (owner.password !== password) {
      return res
        .status(401)
        .render("pages/login", { error: "Incorrect password" });
    }
    // For JWT-based login, this endpoint should be handled in app.js or auth routes.
    // Legacy EJS render endpoint; consider deprecating in favor of JSON API.
    res.redirect("/owners/dashboard");
  } catch (err) {
    res.status(500).render("pages/login", { error: "Server error" });
  }
};
