// Tenant updates maintenance request status
exports.updateMaintenanceStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: Please log in" });
    }
    const { requestId, status } = req.body;
    const validStatuses = ["Pending", "In Progress", "Resolved"];
    if (!requestId || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }
    const MaintenanceRequest = require('../models/MaintenanceRequest');
    const maintenanceRequest = await MaintenanceRequest.findById(requestId);
    if (!maintenanceRequest) {
      return res.status(404).json({ success: false, message: "Maintenance request not found" });
    }
    if (maintenanceRequest.tenantId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized for this request" });
    }
    maintenanceRequest.status = status;
    await maintenanceRequest.save();
    return res.status(200).json({ success: true, message: "Status updated", status });
  } catch (error) {
    console.error("Error updating maintenance status:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
// Tenant confirms maintenance request is fixed
exports.confirmMaintenanceFixed = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized: Please log in" });
    }
    const { requestId, confirmation } = req.body; // confirmation: 'Confirmed' or 'Rejected'
    if (!requestId || !['Confirmed', 'Rejected'].includes(confirmation)) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }
    const maintenanceRequest = await require('../models/MaintenanceRequest').findById(requestId);
    if (!maintenanceRequest) {
      return res.status(404).json({ success: false, message: "Maintenance request not found" });
    }
    if (maintenanceRequest.tenantId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized for this request" });
    }
    maintenanceRequest.tenantConfirmation = confirmation;
    maintenanceRequest.tenantConfirmationDate = new Date();
    await maintenanceRequest.save();
    return res.status(200).json({ success: true, message: "Confirmation updated", tenantConfirmation: confirmation });
  } catch (error) {
    console.error("Error confirming maintenance fix:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const mongoose = require("mongoose");
const Tenant = require("../models/tenant");
const Property = require("../models/property");
const Worker = require("../models/worker");
const Owner = require("../models/owner");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const Complaint = require("../models/complaint");
const Payment = require("../models/payment");
const Rating = require("../models/rating");
const RentalHistory = require("../models/rentalhistory");
const Notification = require("../models/notification");
const WorkerBooking = require("../models/workerBooking");
const UnrentRequest = require("../models/unrentRequest");
// bcrypt removed; plain-text password comparisons are used per requirement

// Dashboard Controller
// Dashboard Controller
// Dashboard Controller
exports.getDashboard = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to dashboard, redirecting to login");
      return res.redirect("/login?error=Please log in");
    }
    const userId = req.user.id;
    console.log("Fetching dashboard for tenant ID:", userId);

    const tenant = await Tenant.findById(userId)
      .populate("savedListings")
      .populate({
        path: "maintenanceRequestIds",
        model: "MaintenanceRequest",
        options: { sort: { dateReported: -1 } },
      })
      .populate({
        path: "complaintIds",
        model: "Complaint",
        options: { sort: { dateSubmitted: -1 } },
      });

    if (!tenant) {
      console.log("Tenant not found for ID:", userId);
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    // CORRECTED: Fetch workers directly from tenant's domesticWorkerId array
    let domesticWorkers = [];
    if (tenant.domesticWorkerId && tenant.domesticWorkerId.length > 0) {
      domesticWorkers = await Worker.find({
        _id: { $in: tenant.domesticWorkerId },
      }).populate("ratingId");

      console.log(
        `Fetched ${domesticWorkers.length} domestic workers from tenant's domesticWorkerId`
      );
    } else {
      console.log("No domestic workers assigned to this tenant");
    }

    const currentProperty = await Property.findOne({ tenantId: userId });

    let propertyOwner = null;
    if (currentProperty && currentProperty.ownerId) {
      propertyOwner = await Owner.findById(currentProperty.ownerId);
    }

    const payments = await Payment.find({ tenantId: userId })
      .sort({ paymentDate: -1 })
      .limit(10);

    const nextPayment = await Payment.findOne({
      tenantId: userId,
      status: "Pending",
    }).sort({ dueDate: 1 });

    const activeMaintenanceRequests = await MaintenanceRequest.find({
      tenantId: userId,
      status: { $in: ["Pending", "In Progress"] },
    }).sort({ dateReported: -1 });

    const completedMaintenanceRequests = await MaintenanceRequest.find({
      tenantId: userId,
      status: "Resolved",
    })
      .sort({ dateReported: -1 })
      .limit(5);

    const complaints = await Complaint.find({ tenantId: userId }).sort({
      dateSubmitted: -1,
    });

    const rentalHistory = await RentalHistory.findOne({ tenantId: userId });

    const ratings = await Rating.find({
      tenantId: userId,
      propertyId: { $exists: true },
    }).populate("propertyId");

    // Fetch notifications for the tenant
    const notifications = await Notification.find({
      recipient: userId,
      recipientType: "Tenant",
    }).sort({ createdDate: -1 });

    // Fetch worker payments for this tenant
    // Fetch worker payments for this tenant
    const WorkerPayment = require("../models/workerPayment");
    const workerPaymentsRaw = await WorkerPayment.find({
      tenantId: userId,
    })
      .populate("workerId") // Populate the worker details
      .sort({ paymentDate: -1 });

    // Map worker payments to include workerName and serviceType
    const workerPayments = workerPaymentsRaw.map((payment) => ({
      _id: payment._id,
      paymentDate: payment.paymentDate,
      workerName: payment.workerId
        ? `${payment.workerId.firstName} ${payment.workerId.lastName}`
        : "N/A",
      serviceType: payment.workerId ? payment.workerId.serviceType : "N/A",
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      receiptUrl: payment.receiptUrl,
      transactionId: payment.transactionId,
    }));

    res.render("pages/tenant_dashboard", {
      user: tenant,
      currentProperty,
      propertyOwner,
      payments,
      nextPayment,
      activeMaintenanceRequests,
      completedMaintenanceRequests,
      complaints,
      workers: domesticWorkers, // Use workers from domesticWorkerId
      rentalHistory: rentalHistory ? rentalHistory.propertyIds : [],
      ratings,
      notifications: notifications.map((n) => ({
        _id: n._id,
        type: n.type,
        message: n.message,
        workerName: n.workerName,
        propertyName: n.propertyName,
        createdDate: n.createdDate || new Date(),
        status: n.status,
        read: n.read,
      })),
      workerPayments,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// JSON endpoint for React: returns the same data as the EJS render but as JSON
exports.getDashboardData = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Please log in" });
    }
    const userId = req.user.id;

    // Fetch tenant with populated arrays
    const tenant = await Tenant.findById(userId)
      .populate("savedListings")
      .populate({
        path: "maintenanceRequestIds",
        model: "MaintenanceRequest",
        options: { sort: { dateReported: -1 } },
      })
      .populate({
        path: "complaintIds",
        model: "Complaint",
        options: { sort: { dateSubmitted: -1 } },
      })
      .lean(); // ← lean for better performance & consistent serialization

    if (!tenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }

    // Domestic workers
    let domesticWorkers = [];
    if (tenant.domesticWorkerId?.length > 0) {
      domesticWorkers = await Worker.find({
        _id: { $in: tenant.domesticWorkerId },
      })
        .populate("ratingId")
        .lean();
    }

    // Current rented property (with .lean())
    const currentPropertyRaw = await Property.findOne({ tenantId: userId }).lean();

    let currentProperty = null;
    let currentPropertyImages = [];

    if (currentPropertyRaw) {
      // Normalize images → array of usable strings (base64 or Cloudinary URL)
      currentPropertyImages = (currentPropertyRaw.images || []).map(img => {
        if (typeof img === "string") return img;               // base64
        if (img && typeof img === "object" && img.url) return img.url; // Cloudinary
        return null;
      }).filter(Boolean);

      currentProperty = {
        ...currentPropertyRaw,
        images: currentPropertyImages
      };
    }

    // Property owner
    let propertyOwner = null;
    if (currentPropertyRaw?.ownerId) {
      propertyOwner = await Owner.findById(currentPropertyRaw.ownerId).lean();
    }

    // Payments
    const payments = await Payment.find({ tenantId: userId })
      .sort({ paymentDate: -1 })
      .limit(10)
      .lean();

    const nextPayment = await Payment.findOne({
      tenantId: userId,
      status: "Pending",
    })
      .sort({ dueDate: 1 })
      .lean();

    // Maintenance requests
    const activeMaintenanceRequests = await MaintenanceRequest.find({
      tenantId: userId,
      status: { $in: ["Pending", "In Progress"] },
    })
      .sort({ dateReported: -1 })
      .lean();

    const completedMaintenanceRequests = await MaintenanceRequest.find({
      tenantId: userId,
      status: "Resolved",
    })
      .sort({ dateReported: -1 })
      .limit(5)
      .lean();

    const complaints = await Complaint.find({ tenantId: userId })
      .sort({ dateSubmitted: -1 })
      .lean();

    // Rental history with enriched property data
    const rentalHistoryDoc = await RentalHistory.findOne({ tenantId: userId }).lean();

    let enrichedRentalHistory = [];
    if (rentalHistoryDoc?.propertyIds?.length > 0) {
      enrichedRentalHistory = await Promise.all(
        rentalHistoryDoc.propertyIds.map(async (historyItem) => {
          const propertyId = historyItem.property;

          const property = await Property.findById(propertyId).lean();

          let propertyImages = [];
          if (property?.images) {
            propertyImages = property.images.map(img => {
              if (typeof img === "string") return img;
              if (img?.url) return img.url;
              return null;
            }).filter(Boolean);
          }

          const propertyRating = await Rating.findOne({
            tenantId: userId,
            propertyId: propertyId
          }).lean();

          return {
            ...historyItem,
            propertyName: property ? property.name : "Property",
            propertyImages,                     // ← normalized array of strings
            rating: propertyRating?.rating || null,
            review: propertyRating?.review || null,
          };
        })
      );
    }

    // Notifications
    const notificationsRaw = await Notification.find({
      recipient: userId,
      recipientType: "Tenant",
    })
      .sort({ createdDate: -1 })
      .lean();

    const notifications = notificationsRaw.map(n => ({
      _id: n._id,
      type: n.type,
      message: n.message,
      workerName: n.workerName,
      propertyName: n.propertyName,
      createdDate: n.createdDate || new Date(),
      status: n.status,
      read: n.read,
    }));

    // Worker payments
    const WorkerPayment = require("../models/workerPayment");
    const workerPaymentsRaw = await WorkerPayment.find({ tenantId: userId })
      .populate("workerId")
      .sort({ paymentDate: -1 })
      .lean();

    const workerPayments = workerPaymentsRaw.map(payment => ({
      _id: payment._id,
      paymentDate: payment.paymentDate,
      workerName: payment.workerId
        ? `${payment.workerId.firstName} ${payment.workerId.lastName}`
        : "N/A",
      serviceType: payment.workerId?.serviceType || "N/A",
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      receiptUrl: payment.receiptUrl,
      transactionId: payment.transactionId,
    }));

    return res.json({
      success: true,
      user: tenant,
      currentProperty,                    // now with normalized images
      propertyOwner,
      payments,
      nextPayment,
      activeMaintenanceRequests,
      completedMaintenanceRequests,
      complaints,
      workers: domesticWorkers,
      rentalHistory: enrichedRentalHistory, // now with normalized propertyImages
      ratings: await Rating.find({ tenantId: userId }).lean(), // optional: if you need them separately
      notifications,
      workerPayments,
    });
  } catch (error) {
    console.error("Dashboard-data error:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

// Maintenance Request Controller
exports.submitMaintenanceRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to maintenance request");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const { issueType, description, location, preferredDate } = req.body;
    const tenantId = req.user.id;
    console.log("Submitting maintenance request for tenant ID:", tenantId, {
      issueType,
      description,
      location,
      preferredDate,
    });

    const property = await Property.findOne({ tenantId });
    if (!property) {
      console.log("No property found for tenant ID:", tenantId);
      return res
        .status(404)
        .json({ success: false, message: "No property found for this tenant" });
    }

    const newRequest = new MaintenanceRequest({
      tenantId,
      propertyId: property._id,
      issueType,
      description,
      location,
      scheduledDate: preferredDate ? new Date(preferredDate) : null,
      status: "Pending",
    });

    await newRequest.save();

    await Tenant.findByIdAndUpdate(tenantId, {
      $push: { maintenanceRequestIds: newRequest._id },
    });

    await Owner.findByIdAndUpdate(property.ownerId, {
      $push: { maintenanceRequestIds: newRequest._id },
    });

    res.status(201).json({
      success: true,
      message: "Maintenance request submitted successfully",
      request: newRequest,
    });
  } catch (error) {
    console.error("Maintenance request error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// Complaint Controller
exports.submitComplaint = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to complaint submission");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const { category, subject, description } = req.body;
    const tenantId = req.user.id;
    console.log("Submitting complaint for tenant ID:", tenantId, {
      category,
      subject,
      description,
    });

    const property = await Property.findOne({ tenantId });
    if (!property) {
      console.log("No property found for tenant ID:", tenantId);
      return res
        .status(404)
        .json({ success: false, message: "No property found for this tenant" });
    }

    const newComplaint = new Complaint({
      tenantId,
      propertyId: property._id,
      category,
      subject,
      description,
      status: "Open",
    });

    await newComplaint.save();

    await Tenant.findByIdAndUpdate(tenantId, {
      $push: { complaintIds: newComplaint._id },
    });

    await Owner.findByIdAndUpdate(property.ownerId, {
      $push: { complaintIds: newComplaint._id },
    });

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      complaint: newComplaint,
    });
  } catch (error) {
    console.error("Complaint submission error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// Property Reviews Controller
exports.submitPropertyReview = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to review submission");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const { propertyId, rating, review } = req.body;
    const tenantId = req.user.id;
    console.log("Submitting review for tenant ID:", tenantId, {
      propertyId,
      rating,
      review,
    });

    const property = await Property.findById(propertyId);
    if (!property) {
      console.log("Property not found:", propertyId);
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const existingRating = await Rating.findOne({
      tenantId,
      propertyId,
    });

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.review = review;
      existingRating.date = new Date();
      await existingRating.save();

      return res.status(200).json({
        success: true,
        message: "Review updated successfully",
        rating: existingRating,
      });
    }

    const newRating = new Rating({
      tenantId,
      propertyId,
      ownerId: property.ownerId,
      rating,
      review,
    });

    await newRating.save();

    await Tenant.findByIdAndUpdate(tenantId, {
      $push: { ratingIds: newRating._id },
    });

    const propertyRatings = await Rating.find({ propertyId });
    const averageRating =
      propertyRatings.reduce((acc, curr) => acc + curr.rating, 0) /
      propertyRatings.length;

    await Property.findByIdAndUpdate(propertyId, {
      rating: averageRating,
      reviews: propertyRatings.length,
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      rating: newRating,
    });
  } catch (error) {
    console.error("Rating submission error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// Update Profile Controller
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to profile update");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const { firstName, lastName, email, phone, location } = req.body;
    const tenantId = req.user.id;
    console.log("Received profile update request for tenant ID:", tenantId, {
      firstName,
      lastName,
      email,
      phone,
      location,
    });

    // Validate inputs
    if (!firstName || !lastName || !email) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({
        success: false,
        message: "First name, last name, and email are required",
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log("Validation failed: Invalid email format");
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    // Check email uniqueness
    const existingTenant = await Tenant.findOne({
      email,
      _id: { $ne: tenantId },
    });
    if (existingTenant) {
      console.log("Email already in use:", email);
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // Prepare update object
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (location) updateFields.location = location;

    console.log("Updating tenant with fields:", updateFields);
    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedTenant) {
      console.log("Tenant not found for ID:", tenantId);
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    // Stateless JWT: do not update session; return updated user data in response

    console.log(
      "Profile updated successfully for tenant ID:",
      tenantId,
      updatedTenant
    );
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        firstName: updatedTenant.firstName,
        lastName: updatedTenant.lastName,
        email: updatedTenant.email,
        phone: updatedTenant.phone || "",
        location: updatedTenant.location || "",
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// Change Password Controller
exports.changePassword = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to password change");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const { currentPassword, newPassword } = req.body;
    const tenantId = req.user.id;
    console.log("Received password change request for tenant ID:", tenantId, {
      currentPassword,
      newPassword,
    });

    // Validate inputs
    if (!currentPassword || !newPassword) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }
    if (newPassword.length < 6) {
      console.log("Validation failed: Password too short");
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      console.log("Tenant not found for ID:", tenantId);
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    // Verify current password
    if (tenant.password !== currentPassword) {
      console.log("Incorrect current password for tenant ID:", tenantId);
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    tenant.password = newPassword;
    await tenant.save();

    console.log("Password changed successfully for tenant ID:", tenantId);
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// Update Notification Preferences Controller
exports.updateNotificationPreferences = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to notification preferences");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const {
      emailNotifications,
      smsNotifications,
      rentReminders,
      maintenanceUpdates,
      newListings,
    } = req.body;
    const tenantId = req.user.id;
    console.log(
      "Received notification preferences update for tenant ID:",
      tenantId,
      {
        emailNotifications,
        smsNotifications,
        rentReminders,
        maintenanceUpdates,
        newListings,
      }
    );

    // Prepare update object
    const updateFields = {};
    if (emailNotifications !== undefined)
      updateFields.emailNotifications =
        emailNotifications === true || emailNotifications === "true";
    if (smsNotifications !== undefined)
      updateFields.smsNotifications =
        smsNotifications === true || smsNotifications === "true";
    if (rentReminders !== undefined)
      updateFields.rentReminders =
        rentReminders === true || rentReminders === "true";
    if (maintenanceUpdates !== undefined)
      updateFields.maintenanceUpdates =
        maintenanceUpdates === true || maintenanceUpdates === "true";
    if (newListings !== undefined)
      updateFields.newListings = newListings === true || newListings === "true";

    console.log(
      "Updating tenant notification preferences with fields:",
      updateFields
    );
    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedTenant) {
      console.log("Tenant not found for ID:", tenantId);
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    // Stateless JWT: do not update session; return updated preferences

    console.log(
      "Notification preferences updated successfully for tenant ID:",
      tenantId,
      updatedTenant
    );
    res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      user: {
        emailNotifications: updatedTenant.emailNotifications,
        smsNotifications: updatedTenant.smsNotifications,
        rentReminders: updatedTenant.rentReminders,
        maintenanceUpdates: updatedTenant.maintenanceUpdates,
        newListings: updatedTenant.newListings,
      },
    });
  } catch (error) {
    console.error("Notification preferences update error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// Save/Remove Property Controller
exports.toggleSavedProperty = async (req, res) => {
  try {
    console.log("Received /saved-property request:", { body: req.body, user: req.user });
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to saved property, no user");
      return res.status(401).json({ success: false, message: "Unauthorized: Please log in" });
    }
    if (req.user.userType !== "tenant") {
      console.log(
        "Non-tenant user attempted to save property, user ID:",
        req.user.id,
        "userType:",
        req.user.userType
      );
      return res.status(403).json({ success: false, message: "Only tenants can save properties" });
    }

    const { propertyId, action } = req.body;
    const tenantId = req.user.id;
    console.log("Processing toggle saved property for tenant ID:", tenantId, { propertyId, action });

    // Validate inputs
    if (!propertyId) {
      console.log("Missing property ID");
      return res
        .status(400)
        .json({ success: false, message: "Property ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      console.log("Invalid property ID format:", propertyId);
      return res
        .status(400)
        .json({ success: false, message: "Invalid property ID" });
    }
    if (!["save", "remove"].includes(action)) {
      console.log("Invalid action:", action);
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      console.log("Property not found for ID:", propertyId);
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    // Check if tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      console.log("Tenant not found for ID:", tenantId);
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    if (action === "save") {
      if (tenant.savedListings.includes(propertyId)) {
        console.log("Property already saved:", propertyId);
        return res
          .status(400)
          .json({ success: false, message: "Property already saved" });
      }

      await Tenant.findByIdAndUpdate(tenantId, {
        $push: { savedListings: propertyId },
      });

      const updatedTenant = await Tenant.findById(tenantId);
      console.log(
        "Property saved successfully for tenant ID:",
        tenantId,
        "Property ID:",
        propertyId
      );
      return res.status(200).json({
        success: true,
        message: "Property saved successfully",
        savedCount: updatedTenant.savedListings.length,
      });
    } else if (action === "remove") {
      await Tenant.findByIdAndUpdate(tenantId, {
        $pull: { savedListings: propertyId },
      });

      const updatedTenant = await Tenant.findById(tenantId);
      console.log(
        "Property removed successfully for tenant ID:",
        tenantId,
        "Property ID:",
        propertyId
      );
      return res.status(200).json({
        success: true,
        message: "Property removed from saved listings",
        savedCount: updatedTenant.savedListings.length,
      });
    }
  } catch (error) {
    console.error(
      "Saved property error for tenant ID:",
      req.user?.id,
      error.stack
    );
    res.status(500).json({
      success: false,
      message: "Server error: Unable to save property",
    });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to mark notification as read");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const { notificationId } = req.body;
    const tenantId = req.user.id;
    console.log("Marking notification as read for tenant ID:", tenantId, {
      notificationId,
    });

    // Validate inputs
    if (!notificationId) {
      console.log("Missing notification ID");
      return res
        .status(400)
        .json({ success: false, message: "Notification ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      console.log("Invalid notification ID format:", notificationId);
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    }

    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: tenantId, recipientType: "Tenant" },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      console.log(
        "Notification not found or not authorized for ID:",
        notificationId
      );
      return res.status(404).json({
        success: false,
        message: "Notification not found or you are not authorized",
      });
    }

    console.log(
      "Notification marked as read successfully for tenant ID:",
      tenantId,
      notificationId
    );
    res.status(200).json({
      success: true,
      message: "Notification marked as read successfully",
      notification: {
        _id: notification._id,
        read: notification.read,
      },
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

exports.checkRecentPayment = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to check recent payment");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const tenantId = req.user.id;
    console.log("Checking recent payment for tenant ID:", tenantId);

    const property = await Property.findOne({ tenantId });
    if (!property) {
      console.log("No property found for tenant ID:", tenantId);
      return res
        .status(404)
        .json({ success: false, message: "No property found for this tenant" });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPayment = await Payment.findOne({
      tenantId,
      propertyId: property._id,
      paymentDate: { $gte: thirtyDaysAgo },
      status: "Paid",
    });

    if (recentPayment) {
      console.log("Recent payment found for tenant ID:", tenantId);
      return res.status(200).json({
        success: true,
        recentPayment: true,
        message: "You have already paid this month's rent",
      });
    }

    console.log("No recent payment found for tenant ID:", tenantId);
    return res.status(200).json({
      success: true,
      recentPayment: false,
      message: "No recent payment found, you can proceed to pay",
    });
  } catch (error) {
    console.error("Check recent payment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

exports.submitPayment = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to payment submission");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const { amount, paymentMethod, transactionId } = req.body;
    const tenantId = req.user.id;
    console.log("Submitting payment for tenant ID:", tenantId, {
      amount,
      paymentMethod,
      transactionId,
    });

    // Validate inputs
    if (!amount || !paymentMethod || !transactionId) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Amount, payment method, and transaction ID are required",
      });
    }
    if (isNaN(amount) || amount <= 0) {
      console.log("Validation failed: Invalid amount");
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment amount" });
    }

    // Find the tenant's current property
    const property = await Property.findOne({ tenantId });
    if (!property) {
      console.log("No property found for tenant ID:", tenantId);
      return res
        .status(404)
        .json({ success: false, message: "No property found for this tenant" });
    }

    // Double-check for recent payment
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPayment = await Payment.findOne({
      tenantId,
      propertyId: property._id,
      paymentDate: { $gte: thirtyDaysAgo },
      status: "Paid",
    });

    if (recentPayment) {
      console.log(
        "Recent payment found for tenant ID:",
        tenantId,
        "within last 30 days"
      );
      return res.status(400).json({
        success: false,
        message: "You have already paid this month's rent",
      });
    }

    // Create new payment
    // compute commission based on current settings
    const { getCachedSettings } = require('./superadminsettingsController');
    const settings = await getCachedSettings();
    const rate = settings.commission || 20;
    const commissionAmt = Math.round((amount || 0) * rate / 100);

    const newPayment = new Payment({
      tenantId,
      propertyId: property._id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      amount,
      commission: commissionAmt,
      paymentDate: new Date(),
      dueDate: new Date(),
      paymentMethod,
      status: "Paid",
      transactionId,
      receiptUrl: `/receipts/${transactionId}.pdf`,
    });

    await newPayment.save();

    // 🚨 FIX: UPDATE ALL ARRAYS
    await Tenant.findByIdAndUpdate(tenantId, {
      $push: { paymentIds: newPayment._id },
      ownerId: property.ownerId,
    });

    await Owner.findByIdAndUpdate(property.ownerId, {
      $push: {
        tenantIds: tenantId,
        paymentIds: newPayment._id,
      },
    });

    // Update next payment status (if exists)
    const nextPayment = await Payment.findOne({
      tenantId,
      propertyId: property._id,
      status: "Pending",
    }).sort({ dueDate: 1 });

    if (nextPayment) {
      nextPayment.status = "Paid";
      nextPayment.paymentDate = newPayment.paymentDate;
      nextPayment.paymentMethod = newPayment.paymentMethod;
      nextPayment.transactionId = newPayment.transactionId;
      nextPayment.receiptUrl = newPayment.receiptUrl;
      await nextPayment.save();
    }

    console.log("Payment submitted successfully for tenant ID:", tenantId);
    res.status(201).json({
      success: true,
      message: "Payment submitted successfully",
      payment: {
        _id: newPayment._id,
        amount: newPayment.amount,
        paymentDate: newPayment.paymentDate,
        paymentMethod: newPayment.paymentMethod,
        status: newPayment.status,
        receiptUrl: newPayment.receiptUrl,
      },
    });
  } catch (error) {
    console.error("Payment submission error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

exports.checkAccountStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to check account status");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const tenantId = req.user.id;
    console.log("Checking account status for tenant ID:", tenantId);

    // Check for active property rental (ownerId is not null)
    const property = await Property.findOne({ tenantId });
    const hasActiveRentals = !!property;

    // Check for active worker bookings
    const activeBookings = await WorkerBooking.find({
      tenantId,
      status: { $in: ["Pending", "Approved"] },
    });
    const hasActiveBookings = activeBookings.length > 0;

    if (hasActiveRentals) {
      console.log("Tenant has active property rental:", tenantId);
      return res.status(400).json({
        success: false,
        message: "Cannot delete account while renting a property",
        hasActiveRentals,
        hasActiveBookings,
      });
    }

    if (hasActiveBookings) {
      console.log("Tenant has active worker bookings:", tenantId);
      return res.status(400).json({
        success: false,
        message: "Cannot delete account with active worker bookings",
        hasActiveRentals,
        hasActiveBookings,
      });
    }

    console.log("No active rentals or bookings for tenant ID:", tenantId);
    return res.status(200).json({
      success: true,
      message: "Account eligible for deletion",
      hasActiveRentals,
      hasActiveBookings,
    });
  } catch (error) {
    console.error("Check account status error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized access to delete account");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const { password } = req.body;
    const tenantId = req.user.id;
    console.log("Processing account deletion for tenant ID:", tenantId);

    // Validate input
    if (!password) {
      console.log("Password not provided");
      return res
        .status(400)
        .json({ success: false, message: "Password is required" });
    }

    // Find tenant with password field (it has select: false by default)
    const tenant = await Tenant.findById(tenantId).select("+password");
    if (!tenant) {
      console.log("Tenant not found for ID:", tenantId);
      return res
        .status(404)
        .json({ success: false, message: "Tenant not found" });
    }

    // Verify password
    if (tenant.password !== password.trim()) {
      console.log("Incorrect password for tenant ID:", tenantId);
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }

    // Double-check for active rentals
    const property = await Property.findOne({ tenantId });
    if (property) {
      console.log("Tenant has active property rental:", tenantId);
      return res.status(400).json({
        success: false,
        message: "Cannot delete account while renting a property",
      });
    }

    // Double-check for active worker bookings
    const activeBookings = await WorkerBooking.find({
      tenantId,
      status: { $in: ["Pending", "Approved"] },
    });
    if (activeBookings.length > 0) {
      console.log("Tenant has active worker bookings:", tenantId);
      return res.status(400).json({
        success: false,
        message: "Cannot delete account with active worker bookings",
      });
    }

    // Delete related data
    await Payment.deleteMany({ tenantId });
    await MaintenanceRequest.deleteMany({ tenantId });
    await Complaint.deleteMany({ tenantId });
    await Rating.deleteMany({ tenantId });
    await RentalHistory.deleteMany({ tenantId });
    await Notification.deleteMany({
      recipient: tenantId,
      recipientType: "Tenant",
    });
    await WorkerBooking.deleteMany({ tenantId });

    // Remove tenant references from other collections
    if (tenant.ownerId) {
      await Owner.findByIdAndUpdate(tenant.ownerId, {
        $pull: { tenantIds: tenantId },
      });
    }

    // Delete tenant
    await Tenant.findByIdAndDelete(tenantId);

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

    // Optionally clear in-memory user for this request
    req.user = null;

    console.log("Account deleted successfully for tenant ID:", tenantId);
    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

// Handle worker payment from tenant dashboard
exports.submitWorkerPayment = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }
    const tenantId = req.user.id;
    const { workerId, amount, paymentMethod, transactionId } = req.body;
    if (!workerId || !amount || !paymentMethod || !transactionId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    if (isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment amount" });
    }
    const Worker = require("../models/worker");
    const WorkerPayment = require("../models/workerPayment");
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res
        .status(404)
        .json({ success: false, message: "Worker not found" });
    }
    const newWorkerPayment = new WorkerPayment({
      tenantId,
      workerId: worker._id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      amount,
      paymentDate: new Date(),
      paymentMethod,
      status: "Paid",
      transactionId,
      receiptUrl: `/receipts/${transactionId}.pdf`,
    });
    await newWorkerPayment.save();
    res.status(201).json({
      success: true,
      message: "Worker payment submitted successfully",
      payment: newWorkerPayment,
    });
  } catch (error) {
    console.error("Worker payment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error: " + error.message });
  }
};

exports.requestUnrentProperty = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Please log in" });
    }

    const tenantId = req.user.id;
    const property = await Property.findOne({ tenantId });
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "No property found for this tenant" });
    }
    // Check if this month's rent is paid
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentPayment = await Payment.findOne({
      tenantId,
      propertyId: property._id,
      paymentDate: { $gte: thirtyDaysAgo },
      status: "Paid",
    });
    if (!recentPayment) {
      return res.status(400).json({
        success: false,
        message: "Please pay this month's rent before requesting to unrent.",
        code: "RENT_NOT_PAID",
      });
    }
    // Check for active worker bookings (only "Approved" status)
    const WorkerBooking = require("../models/workerBooking");
    const activeBookings = await WorkerBooking.find({
      tenantId,
      status: "Approved",
    });
    
    console.log("Unrent validation - Worker bookings check:", {
      tenantId,
      activeBookingsFound: activeBookings.length,
      bookings: activeBookings.map(b => ({ _id: b._id, status: b.status, workerId: b.workerId })),
    });
    
    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please cancel all active domestic worker bookings before requesting to unrent.",
        code: "ACTIVE_WORKERS",
        activeBookings: activeBookings.map(b => ({ _id: b._id, workerId: b.workerId, status: b.status })),
      });
    }
    // Find owner
    const owner = await Owner.findById(property.ownerId);
    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: "Owner not found" });
    }
    // Create UnrentRequest
    const unrentReason = req.body.reason || "No reason provided";
    const unrentRequest = new UnrentRequest({
      propertyId: property._id,
      tenantId,
      ownerId: owner._id,
      reason: unrentReason,
      status: "Pending",
      rentPaid: true,
      createdDate: new Date(),
    });
    const savedUnrentRequest = await unrentRequest.save();
    // Create notification and link to UnrentRequest
    const notification = new Notification({
      type: "Unrent Request",
      message: `Tenant ${req.user.firstName} ${
        req.user.lastName
      } has requested to unrent property ${property.name || property._id}.`,
      recipient: owner._id,
      recipientType: "Owner",
      recipientName: `${owner.firstName} ${owner.lastName}`,
      propertyId: property._id,
      propertyName: property.name || "N/A",
      tenantId,
      tenantName: `${req.user.firstName} ${req.user.lastName}`,
      status: "Pending",
      createdDate: new Date(),
      read: false,
      unrentRequestId: savedUnrentRequest._id,
    });
    const savedNotification = await notification.save();
    savedUnrentRequest.notificationId = savedNotification._id;
    await savedUnrentRequest.save();
    await Owner.findByIdAndUpdate(owner._id, {
      $push: { notificationIds: savedNotification._id },
    });
    await Tenant.findByIdAndUpdate(tenantId, {
      $push: { notificationIds: savedNotification._id },
    });
    console.log("Unrent request created:", {
      unrentRequestId: savedUnrentRequest._id,
      notificationId: savedNotification._id,
      tenantId,
      ownerId: owner._id,
      propertyId: property._id,
    });
    return res.status(200).json({
      success: true,
      message: "Unrent request sent to owner for approval.",
      unrentRequestId: savedUnrentRequest._id,
      notificationId: savedNotification._id,
    });
  } catch (error) {
    console.error("Unrent property error:", {
      error: error.message,
      stack: error.stack,
      tenantId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const tenant = await Tenant.findOne({ email }).select("+password");
    if (!tenant)
      return res
        .status(401)
        .render("pages/login", { error: "Account not found" });
    // Plain-text comparison
    if (tenant.password !== password) {
      return res
        .status(401)
        .render("pages/login", { error: "Incorrect password" });
    }
    // For JWT-based login, this endpoint should be handled in app.js or auth routes.
    // Legacy EJS render endpoint; consider deprecating in favor of JSON API.
    res.redirect("/tenants/dashboard");
  } catch (err) {
    res.status(500).render("pages/login", { error: "Server error" });
  }
};

// Get work history for a tenant (given a worker)
exports.getWorkerWorkHistory = async (req, res) => {
  try {
    const tenantId = req.user?.id;
    const { workerId } = req.params;

    if (!workerId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing worker ID" });
    }

    const WorkTracking = require("../models/workTracking");

    // Get all verified work dates for this worker-tenant pair
    const workHistory = await WorkTracking.find({
      workerId,
      tenantId,
      otpVerified: true,
    }).sort({ workDate: -1 });

    const completedDates = workHistory.map((w) => w.workDate);

    res.json({
      success: true,
      data: completedDates,
    });
  } catch (error) {
    console.error("Error fetching work history:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch work history" });
  }
};
