const mongoose = require("mongoose");
const Worker = require("../models/worker");
const Booking = require("../models/booking");
const Tenant = require("../models/tenant");
const Payment = require("../models/payment");
const WorkerPayment = require("../models/workerPayment");
const WorkerBooking = require("../models/workerBooking");
const Notification = require("../models/notification");
const formidable = require("formidable");
const fs = require("fs");
const workerBooking = require("../models/workerBooking");

// Middleware to check if user is authenticated
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect("/login?returnTo=/workers/worker_dashboard");
};

// Redirect to appropriate dashboard based on user type
const redirectToDashboard = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect("/login?returnTo=/workers/worker_dashboard");
  }
  const { userType } = req.session.user;
  switch (userType) {
    case "owner":
      return res.redirect("/owner_dashboard");
    case "tenant":
      return res.redirect("/tenant_dashboard");
    case "worker":
      return res.redirect("/workers/worker_dashboard");
    default:
      return res.redirect("/");
  }
};

// Render the worker dashboard
exports.renderWorkerDashboardSafer = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.userType !== "worker") {
      console.log("Unauthorized: No user session or not a worker");
      return res.redirect("/login");
    }

    const worker = await Worker.findById(req.session.user._id);
    if (!worker) {
      console.log("Worker not found");
      return res.redirect("/login?error=Account%20not%20found");
    }

    const user = worker.toObject();
    req.session.user = user;

    user.clientIds = Array.isArray(user.clientIds) ? user.clientIds : [];

    const services = user.serviceType
      ? [
          {
            name: user.serviceType || "Unknown Service",
            price: user.price || 0,
            rateUnit: user.rateUnit || "monthly",
            experience: user.experience || 0,
            serviceStatus: user.serviceStatus || "Available",
            image: user.image || "/images/default_service.jpg",
          },
        ]
      : [];

    // Fetch bookings
    const bookings = await WorkerBooking.find({ workerId: user._id })
      .populate("tenantId", "firstName lastName")
      .lean();
    
    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id,
      serviceName: booking.serviceType || user.serviceType || "N/A",
      tenantId: {
        firstName: booking.tenantId?.firstName || "N/A",
        lastName: booking.tenantId?.lastName || "",
      },
      propertyId: {
        address: booking.tenantAddress || "N/A",
      },
      date: booking.bookingDate
        ? new Date(booking.bookingDate).toLocaleDateString()
        : "N/A",
      time: booking.bookingDate
        ? new Date(booking.bookingDate).toLocaleTimeString()
        : "N/A",
      status: booking.status || "Pending",
    }));

    // ===== CRITICAL FIX: Fetch clients ONLY from worker.clientIds =====
    const clients = await Tenant.find({
      _id: { $in: user.clientIds }
    })
    .select('firstName lastName phone email')
    .lean();

    // Get services for each client from WorkerBooking
    const clientBookings = await WorkerBooking.find({
      workerId: user._id,
      tenantId: { $in: user.clientIds },
      status: "Approved"
    })
    .select("tenantId serviceType bookingDate")
    .lean();

    const formattedClients = clients.map((client) => {
      const tenantBookings = clientBookings.filter(
        (b) => b.tenantId && b.tenantId.toString() === client._id.toString()
      );
      
      const services = tenantBookings.length > 0
        ? tenantBookings.map((b) => b.serviceType).filter((s) => s)
        : [user.serviceType || "N/A"];
      
      const bookingDate = tenantBookings.length > 0 && tenantBookings[0].bookingDate
        ? tenantBookings[0].bookingDate
        : null;

      return {
        _id: client._id,
        firstName: client.firstName || "N/A",
        lastName: client.lastName || "",
        phone: client.phone || "N/A",
        email: client.email || "N/A",
        services: [...new Set(services)], // Remove duplicates
        bookingDate: bookingDate,
      };
    });

    // Fetch payments
    const payments = await WorkerPayment.find({
      workerId: new mongoose.Types.ObjectId(user._id),
    }).lean();
    
    const transactions = payments.map((payment) => ({
      title: "Worker Payment",
      serviceName: user.serviceType || "N/A",
      clientName: payment.userName || "N/A",
      date: payment.paymentDate
        ? new Date(payment.paymentDate).toLocaleDateString()
        : "N/A",
      amount: payment.amount || 0,
      status: payment.status || "Pending",
    }));
    
    const earnings = {
      monthly: payments.reduce(
        (sum, p) => (p.status === "Paid" ? sum + p.amount : sum),
        0
      ),
      pending: payments.reduce(
        (sum, p) => (p.status === "Pending" ? sum + p.amount : sum),
        0
      ),
    };

    // Fetch reviews
    const reviews = user.ratingId || { average: 0, reviews: [] };
    const formattedReviews = {
      averageRating: reviews.average || 0,
      count: reviews.reviews ? reviews.reviews.length : 0,
      items: reviews.reviews ? reviews.reviews.map((review) => ({
        user: review.user || "Anonymous",
        rating: review.rating || 0,
        date: review.date ? new Date(review.date).toLocaleDateString() : "N/A",
        comment: review.comment || "No comment",
        serviceName: review.serviceName || user.serviceType || "N/A",
      })) : [],
    };

    // ===== CRITICAL FIX: Fetch notifications correctly =====
    const notifications = await Notification.find({ 
      recipient: user._id, 
      recipientType: "Worker" 
    })
    .sort({ createdDate: -1 })
    .lean();
    
    const formattedNotifications = notifications.map((notification) => ({
      _id: notification._id,
      type: notification.type || "Notification",
      message: notification.message || "",
      tenantName: notification.tenantName || null,
      createdDate: notification.createdDate || notification.createdAt || new Date(),
      status: notification.status || "Info",
      read: notification.read || false,
    }));

    console.log("Worker Dashboard Data:");
    console.log("- Worker ID:", user._id);
    console.log("- Client IDs:", user.clientIds);
    console.log("- Clients found:", formattedClients.length);
    console.log("- Notifications:", formattedNotifications.length);

    res.render("pages/worker_dashboard", {
      user,
      services,
      bookings: formattedBookings,
      clients: formattedClients,
      earnings,
      transactions,
      reviews: formattedReviews,
      notifications: formattedNotifications,
      successMessage: req.session.successMessage,
    });
    
    req.session.successMessage = null;
  } catch (error) {
    console.error("Error rendering worker dashboard:", {
      message: error.message,
      stack: error.stack,
      workerId: req.session.user?._id,
    });
    res.render("pages/error", { error: "Failed to load worker dashboard" });
  }
};

// Render the worker registration page
exports.renderWorkerRegisterPage = async (req, res) => {
  try {
    if (req.session.user.userType !== "worker") {
      return redirectToDashboard(req, res);
    }
    const user = req.session.user;
    if (user.location) {
      const locationParts = user.location.split(",");
      user.city = locationParts[0] ? locationParts[0].trim().toLowerCase() : "";
      user.area =
        locationParts.length > 1
          ? locationParts[1].trim().toLowerCase()
          : user.area || "";
    }
    res.render("pages/worker_register", { user });
  } catch (error) {
    console.error("Error rendering worker registration page:", error);
    res.status(500).send("Error loading worker registration page");
  }
};

// Render the worker details page
exports.renderWorkerDetailsPage = async (req, res) => {
  try {
    const filter = {
      availability: { $in: ["full-time", "part-time", "weekends", true] },
      serviceStatus: "Available",
    };
    const workers = await Worker.find(filter);

    res.render("pages/workerDetails", {
      user: req.session.user || null,
      workers,
    });
  } catch (error) {
    console.error("Error rendering worker details page:", error);
    res.status(500).send("Error loading worker details page");
  }
};

// Render the service details page
exports.renderServiceDetailsPage = async (req, res) => {
  try {
    const workerId = req.params.id;
    const worker = await Worker.findById(workerId);

    if (!worker) {
      return res.redirect(
        "/workers/worker_dashboard?error=Worker%20not%20found"
      );
    }

    res.render("pages/service_details", {
      user: worker.toObject(),
      loggedInUser: req.session.user || null,
    });
  } catch (error) {
    console.error("Error rendering service details page:", error);
    res.redirect(
      "/workers/worker_dashboard?error=Error%20loading%20service%20details"
    );
  }
};

// Render the edit service page
exports.renderEditServicePage = async (req, res) => {
  try {
    if (req.session.user.userType !== "worker") {
      return redirectToDashboard(req, res);
    }

    const workerId = req.params.id;
    const worker = await Worker.findById(workerId);

    if (!worker || worker._id.toString() !== req.session.user._id) {
      return res.redirect(
        "/workers/worker_dashboard?error=Unauthorized%20access"
      );
    }

    const user = worker.toObject();
    if (user.location) {
      const locationParts = user.location.split(",");
      user.city = locationParts[0] ? locationParts[0].trim().toLowerCase() : "";
      user.area =
        locationParts.length > 1
          ? locationParts[1].trim().toLowerCase()
          : user.area || "";
    }

    res.render("pages/edit_service", { user });
  } catch (error) {
    console.error("Error rendering edit service page:", error);
    res.redirect(
      "/workers/worker_dashboard?error=Error%20loading%20edit%20service%20page"
    );
  }
};

// Register/Update worker details
exports.registerWorker = async (req, res) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(500).json({ error: "Error processing form data" });
    }

    try {
      const fullName = fields["full-name"] ? fields["full-name"][0] : "";
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const phone = fields["phone"] ? fields["phone"][0] : "";
      const email = fields["email"] ? fields["email"][0] : "";
      const city = fields["city"] ? fields["city"][0] : "";
      const area = fields["area"] ? fields["area"][0] : "";
      const serviceType = fields["service-type"]
        ? fields["service-type"][0]
        : "";
      const experience = fields["experience"]
        ? parseInt(fields["experience"][0])
        : 0;
      const price = fields["price"] ? parseInt(fields["price"][0]) : 0;
      const description = fields["description"] ? fields["description"][0] : "";
      const availability = fields["availability"]
        ? fields["availability"][0]
        : null;
      const rateUnit = fields["rateUnit"] ? fields["rateUnit"][0] : "monthly";
      const termsAgreement = fields["terms-agreement"]
        ? fields["terms-agreement"][0] === "on"
        : false;

      if (
        !phone ||
        !email ||
        !city ||
        !area ||
        !serviceType ||
        !description ||
        !price ||
        !availability ||
        !termsAgreement
      ) {
        return res
          .status(400)
          .json({ error: "All required fields must be provided" });
      }

      if (!/^[0-9]{10}$/.test(phone)) {
        return res
          .status(400)
          .json({ error: "Phone number must be a 10-digit number" });
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      if (experience < 0 || experience > 50) {
        return res
          .status(400)
          .json({ error: "Experience must be between 0 and 50 years" });
      }

      if (price < 1000) {
        return res.status(400).json({ error: "Rate must be at least ₹1000" });
      }

      if (!["full-time", "part-time", "weekends"].includes(availability)) {
        return res.status(400).json({ error: "Invalid availability" });
      }

      if (!["hourly", "daily", "monthly"].includes(rateUnit)) {
        return res.status(400).json({ error: "Invalid rate unit" });
      }

      let imageBase64 = null;
      if (files["image"] && files["image"][0]) {
        const image = files["image"][0];
        const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
        if (!allowedTypes.includes(image.mimetype)) {
          return res
            .status(400)
            .json({ error: "Image must be JPEG, PNG, or GIF" });
        }
        const imageData = fs.readFileSync(image.filepath);
        imageBase64 = `data:${image.mimetype};base64,${imageData.toString(
          "base64"
        )}`;
      }

      const worker = await Worker.findById(req.session.user._id);
      if (!worker) {
        return res.status(404).json({ error: "Worker not found" });
      }

      worker.firstName = firstName;
      worker.lastName = lastName;
      worker.phone = phone;
      worker.email = email;
      worker.location = city;
      worker.area = area;
      worker.serviceType = serviceType;
      worker.experience = experience;
      worker.price = price;
      worker.rateUnit = rateUnit;
      worker.description = description;
      worker.availability = availability;
      worker.serviceStatus = availability ? "Available" : "Unavailable";
      if (imageBase64) {
        worker.image = imageBase64;
      }

      await worker.save();

      req.session.user = worker.toObject();

      res.json({
        success: true,
        message: "Worker profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating worker:", error);
      res.status(500).json({ error: "Error updating worker profile" });
    }
  });
};

// Get all workers as JSON for API
exports.getAllWorkers = async (req, res) => {
  try {
    const { location, area, serviceType, rating } = req.query;
    const filter = {
      availability: { $in: ["full-time", "part-time", "weekends"] },
      serviceStatus: "Available",
    };

    if (location) filter.location = new RegExp(location, "i");
    if (area) filter.area = new RegExp(area, "i");
    if (serviceType) filter.serviceType = serviceType;
    if (rating) {
      filter["ratingId.average"] = { $gte: parseInt(rating) };
    }

    if (req.session.user && req.session.user.userType === "tenant") {
      const tenant = await Tenant.findById(req.session.user._id).select("domesticWorkerId");
      if (tenant && tenant.domesticWorkerId && tenant.domesticWorkerId.length > 0) {
        filter._id = { $nin: tenant.domesticWorkerId };
      }
    }

    const workers = await Worker.find(filter);
    res.json(workers);
  } catch (error) {
    console.error("Error fetching workers:", error);
    res.status(500).json({ error: "Error fetching worker details" });
  }
};

// Get a single worker by ID
exports.getWorkerById = async (req, res) => {
  try {
    const workerId = req.params.id;
    const worker = await Worker.findById(workerId);

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    res.json(worker);
  } catch (error) {
    console.error("Error fetching worker details:", error);
    res.status(500).json({ error: "Error fetching worker details" });
  }
};

// Filter workers based on multiple criteria
exports.filterWorkers = async (req, res) => {
  try {
    const { location, area, serviceType, rating } = req.query;
    const filter = {
      availability: { $in: ["full-time", "part-time", "weekends"] },
      serviceStatus: "Available",
    };

    if (location) filter.location = new RegExp(location, "i");
    if (area) filter.area = new RegExp(area, "i");
    if (serviceType) filter.serviceType = serviceType;
    if (rating) {
      filter["ratingId.average"] = { $gte: parseInt(rating) };
    }

    if (req.session.user && req.session.user.userType === "tenant") {
      const tenant = await Tenant.findById(req.session.user._id).select("domesticWorkerId");
      if (tenant && tenant.domesticWorkerId && tenant.domesticWorkerId.length > 0) {
        filter._id = { $nin: tenant.domesticWorkerId };
      }
    }

    const workers = await Worker.find(filter);
    res.json(workers);
  } catch (error) {
    console.error("Error filtering workers:", error);
    res.status(500).json({ error: "Error filtering workers" });
  }
};

// Toggle worker service availability
exports.toggleWorkerAvailability = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker || worker._id.toString() !== req.session.user._id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    worker.serviceStatus =
      worker.serviceStatus === "Available" ? "Unavailable" : "Available";
    await worker.save();
    req.session.user = worker.toObject();
    res.json({ success: true, serviceStatus: worker.serviceStatus });
  } catch (error) {
    console.error("Error toggling worker availability:", error);
    res.status(500).json({ error: "Error toggling worker availability" });
  }
};

// Delete worker service details
exports.deleteWorkerService = async (req, res) => {
  try {
    const worker = await Worker.findById(req.session.user._id);
    if (!worker || worker._id.toString() !== req.session.user._id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // ✅ NEW CHECK: Cannot delete if has active clients
    if (worker.clientIds && worker.clientIds.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete service while you have active clients",
        clientCount: worker.clientIds.length,
        hasClients: true 
      });
    }

    worker.serviceType = null;
    worker.experience = null;
    worker.price = null;
    worker.rateUnit = null;
    worker.description = null;
    worker.availability = null;
    worker.serviceStatus = "Unavailable";
    worker.image = null;

    await worker.save();
    req.session.user = worker.toObject();

    res.json({
      success: true,
      message: "Service details deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting worker service:", error);
    res.status(500).json({ error: "Error deleting worker service" });
  }
};

// Check if worker is booked
exports.checkWorkerBookedStatus = async (req, res) => {
  try {
    const workerId = req.params.id;
    const worker = await Worker.findById(workerId);

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (worker._id.toString() !== req.session.user._id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({ isBooked: worker.isBooked });
  } catch (error) {
    console.error("Error checking worker booked status:", error);
    res.status(500).json({ error: "Error checking booked status" });
  }
};

// Delete worker account
exports.deleteWorkerAccount = async (req, res) => {
  try {
    const workerId = req.params.id;
    const { password } = req.body;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (worker._id.toString() !== req.session.user._id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (worker.isBooked) {
      return res
        .status(400)
        .json({ error: "Cannot delete account: You are currently working" });
    }

    if (worker.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    await Worker.deleteOne({ _id: workerId });

    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
    });

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting worker account:", error);
    res.status(500).json({ error: "Error deleting account" });
  }
};

// Book worker
exports.bookWorkerCorrected = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.userType !== "tenant") {
      return res
        .status(401)
        .json({ error: "Unauthorized: Please log in as a tenant" });
    }

    const workerId = req.params.id;
    const tenantId = req.session.user._id;
    const { serviceType } = req.body;

    if (!serviceType) {
      return res.status(400).json({ error: "Service type is required" });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (worker.serviceStatus !== "Available") {
      return res.status(400).json({ error: "Worker is not available" });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (tenant.domesticWorkerId.includes(workerId)) {
      return res.status(400).json({ error: "Worker already booked" });
    }

    const newBooking = new WorkerBooking({
      tenantId,
      workerId,
      serviceType,
      status: "Pending",
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      tenantAddress: tenant.location || "Not provided",
      bookingDate: new Date(),
    });

    await newBooking.save();

    return res
      .status(200)
      .json({ success: true, message: "Booking request sent successfully" });
  } catch (error) {
    console.error("Error booking worker:", error);
    return res.status(500).json({ error: "Server error while booking worker" });
  }
};

// Update worker booking status
exports.updateWorkerBookingStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    const workerId = req.session.user._id;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: "Invalid booking ID format" });
    }

    const updatedBooking = await WorkerBooking.findOneAndUpdate(
      { _id: bookingId, workerId: workerId },
      { 
        status: status,
        ...(status === "Approved" && { approvedDate: new Date() }),
        ...(status === "Declined" && { declinedDate: new Date() })
      },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res
        .status(404)
        .json({ error: "Booking not found or not authorized to update" });
    }

    if (status === "Approved" || status === "Declined") {
      const tenant = await Tenant.findById(updatedBooking.tenantId);
      const worker = await Worker.findById(workerId);

      if (!tenant || !worker) {
        return res.status(404).json({ error: "Tenant or worker not found" });
      }

      if (status === "Approved") {
        // Initialize arrays if needed
        tenant.domesticWorkerId = Array.isArray(tenant.domesticWorkerId)
          ? tenant.domesticWorkerId
          : [];
        worker.clientIds = Array.isArray(worker.clientIds)
          ? worker.clientIds
          : [];

        const workerIdStr = workerId.toString();
        const tenantIdStr = tenant._id.toString();

        // Add worker to tenant's domesticWorkerId if not already there
        if (!tenant.domesticWorkerId.some((id) => id.toString() === workerIdStr)) {
          tenant.domesticWorkerId.push(workerId);
          await tenant.save();
        }

        // ===== CRITICAL: Add tenant to worker's clientIds =====
        if (!worker.clientIds.some((id) => id.toString() === tenantIdStr)) {
          worker.clientIds.push(tenant._id);
          worker.isBooked = true;
          await worker.save();
          
          console.log(`Added tenant ${tenantIdStr} to worker ${workerId} clientIds`);
          console.log(`Worker clientIds after approval:`, worker.clientIds);
        }

        req.session.user = worker.toObject();
      }

      // Send notification to tenant
      const message =
        status === "Approved"
          ? `Your booking for ${updatedBooking.serviceType} has been approved by ${worker.firstName} ${worker.lastName}.`
          : `Your booking for ${updatedBooking.serviceType} has been declined by ${worker.firstName} ${worker.lastName}.`;
      
      await sendNotification(updatedBooking.tenantId, "Tenant", {
        message,
        bookingId: updatedBooking._id,
        workerId,
        serviceType: updatedBooking.serviceType,
        type: "Booking Update",
        status: status === "Approved" ? "Approved" : "Rejected",
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status}!`,
      bookingId: updatedBooking._id,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res
      .status(500)
      .json({ error: "Server error while updating booking status" });
  }
};

// Helper function - sendNotification (keep as is)
const sendNotification = async (recipientId, recipientType, data) => {
  try {
    let workerName = "";
    if (data.workerId) {
      const worker = await Worker.findById(data.workerId);
      if (worker) {
        workerName = `${worker.firstName} ${worker.lastName}`;
      }
    }

    const notification = new Notification({
      type: data.type || "General",
      message: data.message,
      recipient: recipientId,
      recipientType,
      worker: data.workerId || null,
      workerName,
      status: data.status || "Info",
      priority: data.priority || "Medium",
      createdDate: new Date(),
      bookingId: data.bookingId || null,
      read: false,
    });

    const savedNotification = await notification.save();

    const Model = recipientType === "Tenant" ? Tenant : Worker;
    await Model.findByIdAndUpdate(
      recipientId,
      { $push: { notificationIds: savedNotification._id } },
      { new: true }
    );

    return savedNotification;
  } catch (error) {
    console.error(`Error sending notification to ${recipientType}:`, error);
  }
};

// Get worker bookings
exports.getWorkerBookings = async (req, res) => {
  try {
    const workerId = req.session.user._id;
    const bookings = await WorkerBooking.find({ workerId })
      .populate("tenantId", "firstName lastName location")
      .populate("workerId", "serviceType");
    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id,
      serviceName: booking.serviceType || "N/A",
      tenantId: {
        firstName: booking.tenantId?.firstName || "N/A",
        lastName: booking.tenantId?.lastName || "",
      },
      propertyId: {
        address: booking.tenantAddress || "N/A",
      },
      date: booking.bookingDate
        ? new Date(booking.bookingDate).toLocaleDateString()
        : "N/A",
      time: booking.bookingDate
        ? new Date(booking.bookingDate).toLocaleTimeString()
        : "N/A",
      status: booking.status || "Pending",
    }));
    return res.status(200).json(formattedBookings);
  } catch (error) {
    console.error("Error fetching worker bookings:", error);
    return res.status(500).json([]);
  }
};

// Update worker settings
exports.updateWorkerSettings = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const {
      firstName,
      lastName,
      email,
      phone,
      location,
      experience,
      availability,
      serviceType,
      currentPassword,
      newPassword,
    } = req.body;

    const worker = await Worker.findById(userId);

    if (!worker) {
      return res
        .status(404)
        .json({ success: false, error: "Worker not found" });
    }

    worker.firstName = firstName;
    worker.lastName = lastName;
    worker.email = email;
    worker.phone = phone;
    worker.location = location;
    worker.experience = experience;
    worker.availability = availability;
    worker.serviceType = serviceType;

    if (newPassword) {
      if (currentPassword !== worker.password) {
        return res
          .status(400)
          .json({ success: false, error: "Current password is incorrect" });
      }
      worker.password = newPassword;
    }

    await worker.save();

    res.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating worker settings:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};


exports.debookWorker = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.userType !== "tenant") {
      return res
        .status(401)
        .json({ error: "Unauthorized: Please log in as a tenant" });
    }

    const workerId = req.params.id;
    const tenantId = req.session.user._id;

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check if worker is booked by this tenant
    if (!tenant.domesticWorkerId.some(id => id.toString() === workerId)) {
      return res.status(400).json({ error: "Worker is not booked by this tenant" });
    }

    // Check if current billing cycle payment is made for monthly workers
    const booking = await WorkerBooking.findOne({
      tenantId,
      workerId,
      status: "Approved",
    });

    if (booking && worker.rateUnit === "monthly") {
      const bookingDate = new Date(booking.bookingDate);
      const now = new Date();
      const dayOfMonth = bookingDate.getDate();
      
      let currentCycleStart, currentCycleEnd;
      
      if (now.getDate() >= dayOfMonth) {
        currentCycleStart = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
        currentCycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth - 1, 23, 59, 59, 999);
      } else {
        currentCycleStart = new Date(now.getFullYear(), now.getMonth() - 1, dayOfMonth);
        currentCycleEnd = new Date(now.getFullYear(), now.getMonth(), dayOfMonth - 1, 23, 59, 59, 999);
      }

      const recentPayment = await WorkerPayment.findOne({
        tenantId,
        workerId,
        paymentDate: { $gte: currentCycleStart, $lte: currentCycleEnd },
        status: "Paid",
      });

      if (!recentPayment) {
        return res.status(400).json({ 
          error: "Payment pending for current billing cycle",
          message: "Please complete the current billing cycle payment before debooking the worker." 
        });
      }
    }

    // ===== CRITICAL FIX: Remove tenant from worker's clientIds =====
    worker.clientIds = worker.clientIds.filter(
      id => id.toString() !== tenantId.toString()
    );
    
    // Update worker's isBooked status based on remaining clients
    worker.isBooked = worker.clientIds.length > 0;
    await worker.save();

    // Remove worker from tenant's domesticWorkerId array
    tenant.domesticWorkerId = tenant.domesticWorkerId.filter(
      id => id.toString() !== workerId
    );
    await tenant.save();

    // Delete or update WorkerBooking records
    await WorkerBooking.deleteMany({ 
      tenantId, 
      workerId, 
      status: "Approved" 
    });

    // Send notification to worker
    const notification = new Notification({
      type: "Debooking",
      message: `You have been debooked by ${tenant.firstName} ${tenant.lastName} for ${worker.serviceType}.`,
      recipient: workerId,
      recipientType: "Worker",
      tenant: tenantId,
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      status: "Info",
      priority: "High",
      createdDate: new Date(),
      read: false,
    });

    const savedNotification = await notification.save();

    // Add notification to worker's notificationIds array
    await Worker.findByIdAndUpdate(workerId, {
      $push: { notificationIds: savedNotification._id },
    });

    console.log(`Worker ${workerId} debooked successfully by tenant ${tenantId}`);
    console.log(`Worker clientIds after debook:`, worker.clientIds);

    res.json({ 
      success: true, 
      message: "Worker debooked successfully" 
    });
  } catch (error) {
    console.error("Error debooking worker:", error);
    res.status(500).json({ 
      error: "Server error while debooking worker",
      message: error.message 
    });
  }
};