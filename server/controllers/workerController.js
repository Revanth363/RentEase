// Get all unique locations and service types for filters
exports.getWorkerFilters = async (req, res) => {
  try {
    const locations = await Worker.distinct("location", {
      location: { $ne: null, $ne: "" },
    });
    const areas = await Worker.distinct("area", {
      area: { $ne: null, $ne: "" },
    });
    const serviceTypes = await Worker.distinct("serviceType", {
      serviceType: { $ne: null, $ne: "" },
    });
    // Filter out empty strings and normalize
    const cleanLocations = locations
      .filter((l) => l && l.trim())
      .map((l) => l.trim());
    const cleanAreas = areas.filter((a) => a && a.trim()).map((a) => a.trim());
    const cleanServiceTypes = serviceTypes
      .filter((s) => s && s.trim())
      .map((s) => s.trim());
    res.json({
      locations: cleanLocations,
      areas: cleanAreas,
      serviceTypes: cleanServiceTypes,
    });
  } catch (error) {
    console.error("Error fetching filter data:", error);
    res.status(500).json({ error: "Error fetching filter data" });
  }
};

// Search workers by location (city/area) - dedicated search endpoint
exports.searchWorkersByLocation = async (req, res) => {
  try {
    const { location, area } = req.query;
    const filter = {
      $or: [
        { serviceStatus: "Available" },
        { serviceStatus: { $exists: false } },
        { serviceStatus: null },
      ],
    };

    if (location) {
      filter.location = new RegExp(location, "i");
    }
    if (area) {
      filter.area = new RegExp(area, "i");
    }

    // Exclude workers already booked by this tenant
    if (req.session.user && req.session.user.userType === "tenant") {
      const tenant = await Tenant.findById(req.session.user._id).select(
        "domesticWorkerId"
      );
      if (
        tenant &&
        tenant.domesticWorkerId &&
        tenant.domesticWorkerId.length > 0
      ) {
        filter._id = { $nin: tenant.domesticWorkerId };
      }
    }

    const workers = await Worker.find(filter).sort({ createdAt: -1 });
    res.json(workers);
  } catch (error) {
    console.error("Error searching workers:", error);
    res.status(500).json({ error: "Error searching workers" });
  }
};

// Check if tenant can review a worker (must have completed booking)
exports.canTenantReviewWorker = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.userType !== "tenant") {
      return res.status(401).json({ canReview: false, reason: "Not a tenant" });
    }
    const tenantId = req.session.user._id;
    const workerId = req.params.id;
    // Only allow review if tenant has an approved booking with this worker
    const booking = await WorkerBooking.findOne({
      tenantId,
      workerId,
      status: "Approved",
    });
    if (booking) {
      return res.json({ canReview: true });
    } else {
      return res.json({ canReview: false, reason: "No completed booking" });
    }
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    res.status(500).json({ canReview: false, error: "Server error" });
  }
};
const mongoose = require("mongoose");
const Worker = require("../models/worker");
const Booking = require("../models/booking");
const Property = require("../models/property");
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
      _id: { $in: user.clientIds },
    })
      .select("firstName lastName phone email")
      .lean();

    // Get services for each client from WorkerBooking
    const clientBookings = await WorkerBooking.find({
      workerId: user._id,
      tenantId: { $in: user.clientIds },
      status: "Approved",
    })
      .select("tenantId serviceType bookingDate")
      .lean();

    const formattedClients = clients.map((client) => {
      const tenantBookings = clientBookings.filter(
        (b) => b.tenantId && b.tenantId.toString() === client._id.toString()
      );

      const services =
        tenantBookings.length > 0
          ? tenantBookings.map((b) => b.serviceType).filter((s) => s)
          : [user.serviceType || "N/A"];

      const bookingDate =
        tenantBookings.length > 0 && tenantBookings[0].bookingDate
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
      items: reviews.reviews
        ? reviews.reviews.map((review) => ({
            user: review.user || "Anonymous",
            rating: review.rating || 0,
            date: review.date
              ? new Date(review.date).toLocaleDateString()
              : "N/A",
            comment: review.comment || "No comment",
            serviceName: review.serviceName || user.serviceType || "N/A",
          }))
        : [],
    };

    // ===== CRITICAL FIX: Fetch notifications correctly =====
    const notifications = await Notification.find({
      recipient: user._id,
      recipientType: "Worker",
    })
      .sort({ createdDate: -1 })
      .lean();

    const formattedNotifications = notifications.map((notification) => ({
      _id: notification._id,
      type: notification.type || "Notification",
      message: notification.message || "",
      tenantName: notification.tenantName || null,
      createdDate:
        notification.createdDate || notification.createdAt || new Date(),
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

exports.registerWorker = async (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form:", err);
      return res.status(500).json({ error: "Error processing form data" });
    }

    try {
      // Helper function to extract field value (formidable returns arrays)
      const getField = (fieldName) => {
        const value = fields[fieldName];
        if (Array.isArray(value)) return value[0];
        return value || "";
      };

      // Extract all fields
      const fullName = getField("full-name").trim();
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const phone = getField("phone");
      const email = getField("email");
      const city = getField("city");
      const area = getField("area");
      const serviceType = getField("service-type");
      const experience = parseInt(getField("experience")) || 0;
      const price = parseInt(getField("price")) || 0;
      const description = getField("description");
      const availability = getField("availability");
      const rateUnit = getField("rateUnit") || "monthly";
      const termsAgreement =
        getField("terms-agreement") === "on" ||
        getField("terms-agreement") === "true";

      console.log("Processing registration:", {
        fullName,
        firstName,
        lastName,
        phone,
        email,
        city,
        area,
        serviceType,
        termsAgreement,
      });

      // Validation
      if (
        !fullName ||
        !phone ||
        !email ||
        !city ||
        !area ||
        !serviceType ||
        !description ||
        !availability
      ) {
        return res.status(400).json({
          error: "All required fields must be provided",
          missing: {
            fullName: !fullName,
            phone: !phone,
            email: !email,
            city: !city,
            area: !area,
            serviceType: !serviceType,
            description: !description,
            availability: !availability,
          },
        });
      }

      if (!termsAgreement) {
        return res
          .status(400)
          .json({ error: "You must agree to Terms & Conditions" });
      }

      // Phone validation - exactly 10 digits
      if (!/^[0-9]{10}$/.test(phone)) {
        return res
          .status(400)
          .json({ error: "Phone number must be exactly 10 digits" });
      }

      // Email validation
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email address" });
      }

      // Experience validation
      if (experience < 0 || experience > 50) {
        return res
          .status(400)
          .json({ error: "Experience must be between 0 and 50 years" });
      }

      // Price validation
      if (price < 1000) {
        return res.status(400).json({ error: "Salary must be at least ₹1000" });
      }

      // Availability validation
      if (!["full-time", "part-time", "weekends"].includes(availability)) {
        return res.status(400).json({ error: "Invalid availability option" });
      }

      // Rate unit validation
      if (!["hourly", "daily", "monthly"].includes(rateUnit)) {
        return res.status(400).json({ error: "Invalid rate unit" });
      }

      // Handle image upload
      let imageBase64 = null;
      if (files["image"] && files["image"][0]) {
        const image = files["image"][0];
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];

        if (!allowedTypes.includes(image.mimetype)) {
          return res
            .status(400)
            .json({ error: "Image must be JPEG, PNG, GIF, or WEBP" });
        }

        const imageData = fs.readFileSync(image.filepath);
        imageBase64 = `data:${image.mimetype};base64,${imageData.toString(
          "base64"
        )}`;
      }

      // Find and update worker
      const worker = await Worker.findById(req.session.user._id);
      if (!worker) {
        return res.status(404).json({ error: "Worker account not found" });
      }

      // Update worker fields
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

      // Update session
      req.session.user = worker.toObject();

      console.log("Worker profile updated successfully:", worker._id);

      res.json({
        success: true,
        message: "Worker profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating worker:", error);
      res.status(500).json({
        error: "Error updating worker profile",
        details: error.message,
      });
    }
  });
};

// Get all workers as JSON for API
exports.getAllWorkers = async (req, res) => {
  try {
    const { location, area, serviceType, rating } = req.query;
    // Show workers who are available OR newly-registered workers where
    // `serviceStatus` or `availability` may not yet be set. This ensures
    // newly registered users appear on the services listing.
    const filter = {
      $and: [
        {
          $or: [
            { serviceStatus: "Available" },
            { serviceStatus: { $exists: false } },
            { serviceStatus: null },
          ],
        },
      ],
    };

    if (location) filter.location = new RegExp(location, "i");
    if (area) filter.area = new RegExp(area, "i");
    if (serviceType) filter.serviceType = serviceType;
    if (rating) {
      filter["ratingId.average"] = { $gte: parseInt(rating) };
    }

    if (req.session.user && req.session.user.userType === "tenant") {
      const tenant = await Tenant.findById(req.session.user._id).select(
        "domesticWorkerId"
      );
      if (
        tenant &&
        tenant.domesticWorkerId &&
        tenant.domesticWorkerId.length > 0
      ) {
        filter._id = { $nin: tenant.domesticWorkerId };
      }
    }

    // Show newest workers first so newly-registered users are visible.
    const workers = await Worker.find(filter).sort({ createdAt: -1 });
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
    const { location, area, serviceType, rating, price, available } = req.query;
    // Same permissive filter for the filter API: include workers with missing
    // `serviceStatus` so newly-registered users are not accidentally hidden.
    const filter = {
      $and: [
        {
          $or: [
            { serviceStatus: "Available" },
            { serviceStatus: { $exists: false } },
            { serviceStatus: null },
          ],
        },
      ],
    };

    if (location) filter.location = new RegExp(location, "i");
    if (area) filter.area = new RegExp(area, "i");
    if (serviceType) filter.serviceType = serviceType;
    if (rating) {
      filter["ratingId.average"] = { $gte: parseInt(rating) };
    }
    // Price range filter
    if (price) {
      let min = 0,
        max = Infinity;
      if (price.includes("-")) {
        [min, max] = price.split("-").map(Number);
      } else if (price.endsWith("+")) {
        min = Number(price.replace("+", ""));
      }
      filter.price = { $gte: min };
      if (isFinite(max)) filter.price.$lte = max;
    }
    // Available filter
    if (available === "true") {
      filter.isBooked = false;
    }

    if (req.session.user && req.session.user.userType === "tenant") {
      const tenant = await Tenant.findById(req.session.user._id).select(
        "domesticWorkerId"
      );
      if (
        tenant &&
        tenant.domesticWorkerId &&
        tenant.domesticWorkerId.length > 0
      ) {
        filter._id = { $nin: tenant.domesticWorkerId };
      }
    }

    const workers = await Worker.find(filter).sort({ createdAt: -1 });
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

    // ---- NEW CHECK: BLOCK deletion ONLY if client has rented property ----
    let activeRentedClients = 0;

    if (worker.clientIds && worker.clientIds.length > 0) {
      const tenants = await Tenant.find({
        _id: { $in: worker.clientIds },
      }).lean();

      for (const tenant of tenants) {
        const rentedProperty = await Property.findOne({
          tenantId: tenant._id,
          isRented: true,
        }).lean();

        if (rentedProperty) {
          activeRentedClients++;
        }
      }
    }

    // ❌ Block deletion only if rented clients exist
    if (activeRentedClients > 0) {
      return res.status(400).json({
        error: "Cannot delete service while clients are in rented properties",
        hasClients: true,
        rentedClientCount: activeRentedClients,
      });
    }

    // ---- SERVICE CAN BE DELETED ----
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
      return res.status(401).json({ error: "Please login as a tenant" });
    }

    const workerId = req.params.id;
    const tenantId = req.session.user._id;
    const { serviceType } = req.body;

    if (!serviceType) {
      return res.status(400).json({ error: "Service type is required" });
    }

    // 🔥 Tenant must be renting a property
    const rentedProperty = await Property.findOne({
      tenantId,
      isRented: true,
    });

    if (!rentedProperty) {
      return res.status(400).json({
        error: "You must rent a property before booking a worker",
      });
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

    // Mark worker as unavailable and booked
    worker.serviceStatus = "Unavailable";
    worker.isBooked = true;
    await worker.save();

    const newBooking = new WorkerBooking({
      tenantId,
      workerId,
      serviceType,
      status: "Pending",
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      tenantAddress:
        rentedProperty.address || tenant.location || "Not provided",
      bookingDate: new Date(),
    });

    await newBooking.save();

    return res.status(200).json({
      success: true,
      message: "Booking request sent successfully",
    });
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
        ...(status === "Declined" && { declinedDate: new Date() }),
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
        if (
          !tenant.domesticWorkerId.some((id) => id.toString() === workerIdStr)
        ) {
          tenant.domesticWorkerId.push(workerId);
          await tenant.save();
        }

        // ===== CRITICAL: Add tenant to worker's clientIds =====
        if (!worker.clientIds.some((id) => id.toString() === tenantIdStr)) {
          worker.clientIds.push(tenant._id);
          worker.isBooked = true;
          await worker.save();

          console.log(
            `Added tenant ${tenantIdStr} to worker ${workerId} clientIds`
          );
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
      currentPassword,
      newPassword,
    } = req.body;

    const worker = await Worker.findById(userId);

    if (!worker) {
      return res
        .status(404)
        .json({ success: false, error: "Worker not found" });
    }

    // ✅ VALIDATION - Trim and check for empty values
    if (!firstName || !firstName.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "First name is required" });
    }
    if (firstName.trim().length < 2) {
      return res
        .status(400)
        .json({
          success: false,
          error: "First name must be at least 2 characters long",
        });
    }

    if (!lastName || !lastName.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Last name is required" });
    }
    if (lastName.trim().length < 2) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Last name must be at least 2 characters long",
        });
    }

    if (!email || !email.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter a valid email address" });
    }

    if (!phone || !phone.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Phone number is required" });
    }
    const phoneDigits = phone.replace(/[\s\-\(\)]/g, "");
    if (!/^[0-9]{10}$/.test(phoneDigits)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Please enter a valid 10-digit phone number",
        });
    }

    if (experience && (experience < 0 || experience > 100)) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Experience must be between 0 and 100 years",
        });
    }

    // ✅ Update only personal information - TRIM all values
    worker.firstName = firstName.trim();
    worker.lastName = lastName.trim();
    worker.email = email.trim();
    worker.phone = phone.trim();

    // ✅ Only update location if provided
    if (location && location.trim()) {
      worker.location = location.trim();
    }

    // ✅ Only update experience if provided and valid
    if (experience !== undefined && experience !== null && experience !== "") {
      worker.experience = experience;
    }

    // ✅ Only update availability if provided
    if (
      availability &&
      ["full-time", "part-time", "weekends"].includes(availability)
    ) {
      worker.availability = availability;
    }

    // ✅ DO NOT UPDATE serviceType - it should only be updated through worker registration
    // Removed: worker.serviceType = serviceType;

    // ✅ Password change validation
    if (newPassword && newPassword.trim()) {
      if (!currentPassword || !currentPassword.trim()) {
        return res.status(400).json({
          success: false,
          error: "Please enter your current password to change password",
        });
      }
      if (currentPassword !== worker.password) {
        return res.status(400).json({
          success: false,
          error: "Current password is incorrect",
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: "New password must be at least 6 characters long",
        });
      }
      worker.password = newPassword;
    }

    await worker.save();

    // ✅ Update session with fresh worker data
    req.session.user = worker.toObject();

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
    if (!tenant.domesticWorkerId.some((id) => id.toString() === workerId)) {
      return res
        .status(400)
        .json({ error: "Worker is not booked by this tenant" });
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
        currentCycleStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          dayOfMonth
        );
        currentCycleEnd = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          dayOfMonth - 1,
          23,
          59,
          59,
          999
        );
      } else {
        currentCycleStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          dayOfMonth
        );
        currentCycleEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          dayOfMonth - 1,
          23,
          59,
          59,
          999
        );
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
          message:
            "Please complete the current billing cycle payment before debooking the worker.",
        });
      }
    }

    // ===== CRITICAL FIX: Remove tenant from worker's clientIds =====
    worker.clientIds = worker.clientIds.filter(
      (id) => id.toString() !== tenantId.toString()
    );

    // Update worker's isBooked status based on remaining clients
    worker.isBooked = worker.clientIds.length > 0;
    await worker.save();

    // Remove worker from tenant's domesticWorkerId array
    tenant.domesticWorkerId = tenant.domesticWorkerId.filter(
      (id) => id.toString() !== workerId
    );
    await tenant.save();

    // Delete or update WorkerBooking records
    await WorkerBooking.deleteMany({
      tenantId,
      workerId,
      status: "Approved",
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

    console.log(
      `Worker ${workerId} debooked successfully by tenant ${tenantId}`
    );
    console.log(`Worker clientIds after debook:`, worker.clientIds);

    res.json({
      success: true,
      message: "Worker debooked successfully",
    });
  } catch (error) {
    console.error("Error debooking worker:", error);
    res.status(500).json({
      error: "Server error while debooking worker",
      message: error.message,
    });
  }
};

// Add this function to workerController.js
exports.getDashboardDataAPI = async (req, res) => {
  try {
    if (!req.session.user || req.session.user.userType !== "worker") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const worker = await Worker.findById(req.session.user._id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });

    const user = worker.toObject();
    user.clientIds = Array.isArray(user.clientIds) ? user.clientIds : [];

    // SERVICES
    const services = user.serviceType
      ? [
          {
            _id: user._id,
            name: user.serviceType,
            price: user.price || 0,
            rateUnit: user.rateUnit || "monthly",
            experience: user.experience || 0,
            serviceStatus: user.serviceStatus || "Available",
            image: user.image || "/images/default_service.jpg",
            description: user.description || "",
          },
        ]
      : [];

    // BOOKINGS
    const bookingsRaw = await WorkerBooking.find({ workerId: user._id })
      .populate("tenantId", "firstName lastName phone")
      .lean();

    const bookings = bookingsRaw.map((b) => ({
      _id: b._id,
      serviceName: b.serviceType || user.serviceType || "N/A",
      tenantId: {
        firstName: b.tenantId?.firstName || "N/A",
        lastName: b.tenantId?.lastName || "",
        phone: b.tenantId?.phone || "N/A",
      },
      propertyId: { address: b.tenantAddress || "N/A" },
      date: b.bookingDate
        ? new Date(b.bookingDate).toLocaleDateString()
        : "N/A",
      time: b.bookingDate
        ? new Date(b.bookingDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A",
      status: b.status || "Pending",
    }));

    // CLIENTS → ONLY THOSE WHO HAVE A RENTED PROPERTY
    const tenants = await Tenant.find({
      _id: { $in: user.clientIds },
    })
      .select("firstName lastName phone email")
      .lean();

    const formattedClients = [];

    for (const client of tenants) {
      // Find the rented property for this client
      const rentedProperty = await Property.findOne({
        tenantId: client._id,
        isRented: true,
      })
        .select("address location")
        .lean();

      // ❌ If client has NO rented property → skip entirely
      if (!rentedProperty) continue;

      // Find approved worker booking
      const approvedBooking = await WorkerBooking.findOne({
        workerId: user._id,
        tenantId: client._id,
        status: "Approved",
      }).lean();

      const servicesUsed = approvedBooking?.serviceType
        ? [approvedBooking.serviceType]
        : [user.serviceType || "N/A"];

      formattedClients.push({
        _id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone || "N/A",
        email: client.email || "N/A",
        services: servicesUsed,
        bookingDate: approvedBooking?.bookingDate
          ? new Date(approvedBooking.bookingDate).toLocaleDateString()
          : "N/A",
        address: rentedProperty.address || "N/A",
        location: rentedProperty.location || "N/A",
      });
    }

    // PAYMENTS
    const payments = await WorkerPayment.find({ workerId: user._id }).lean();

    const transactions = payments.map((p) => ({
      _id: p._id,
      title: "Salary Payment",
      serviceName: user.serviceType || "N/A",
      clientName: p.userName || "Client",
      date: p.paymentDate
        ? new Date(p.paymentDate).toLocaleDateString()
        : "N/A",
      amount: p.amount || 0,
      status: p.status || "Pending",
    }));

    const earnings = {
      monthly: payments
        .filter((p) => p.status === "Paid")
        .reduce((s, p) => s + p.amount, 0),
      pending: payments
        .filter((p) => p.status === "Pending")
        .reduce((s, p) => s + p.amount, 0),
    };

    // REVIEWS
    const reviews = {
      averageRating: user.ratingId?.average || 0,
      count: user.ratingId?.reviews?.length || 0,
      items: (user.ratingId?.reviews || []).map((r) => ({
        _id: r._id || `${user._id}-${Date.now()}`,
        user: r.user || "Anonymous",
        rating: r.rating || 0,
        date: r.date ? new Date(r.date).toLocaleDateString() : "N/A",
        comment: r.comment || "No comment",
        serviceName: r.serviceName || user.serviceType || "N/A",
      })),
    };

    // NOTIFICATIONS
    const notifications = await Notification.find({
      recipient: user._id,
      recipientType: "Worker",
    })
      .sort({ createdDate: -1 })
      .lean();

    const formattedNotifications = notifications.map((n) => ({
      _id: n._id,
      type: n.type || "Info",
      message: n.message || "",
      tenantName: n.tenantName || null,
      createdDate: n.createdDate || new Date(),
      read: n.read || false,
    }));

    // FINAL RESPONSE
    res.json({
      user,
      services,
      bookings,
      clients: formattedClients, // Only tenants WITH rented property
      earnings,
      transactions,
      reviews,
      notifications: formattedNotifications,
    });
  } catch (error) {
    console.error("Error in getDashboardDataAPI:", error);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.session.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Generate OTP for work tracking
exports.generateWorkOTP = async (req, res) => {
  try {
    const workerId = req.session.user._id;
    const { tenantId, workDate } = req.body;

    if (!tenantId || !workDate) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Generate 4-digit random OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Calculate expiry time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    // Save OTP to database
    const WorkTracking = require("../models/workTracking");
    const workTracking = new WorkTracking({
      workerId,
      tenantId,
      workDate: new Date(workDate),
      otp,
      otpVerified: false,
      expiresAt,
    });

    await workTracking.save();

    // Create a notification for the tenant so it appears in their dashboard
    try {
      const workerObj = await Worker.findById(workerId).select(
        "firstName lastName"
      );
      const workerName = workerObj
        ? `${workerObj.firstName} ${workerObj.lastName}`
        : "Worker";

      // Use helper so notification ID is also pushed to tenant.notificationIds
      await sendNotification(tenantId, "Tenant", {
        message: `Work OTP ${otp} generated by ${workerName} for ${new Date(
          workDate
        ).toLocaleDateString()}`,
        workerId,
        type: "Work-OTP",
        status: "Info",
        priority: "High",
      });
    } catch (notifErr) {
      console.error("Failed to create tenant notification:", notifErr);
    }

    res.json({
      success: true,
      message: "OTP generated successfully",
      otp, // Send OTP to frontend for display (in production, send via SMS)
    });
  } catch (error) {
    console.error("Error generating OTP:", error);
    res.status(500).json({ success: false, message: "Failed to generate OTP" });
  }
};

// Verify OTP and mark work as completed
exports.verifyWorkOTP = async (req, res) => {
  try {
    const workerId = req.session.user._id;
    const { tenantId, workDate, otp } = req.body;

    if (!tenantId || !workDate || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const WorkTracking = require("../models/workTracking");

    // Find the OTP record
    const workTracking = await WorkTracking.findOne({
      workerId,
      tenantId,
      workDate: new Date(workDate),
      otp,
    });

    if (!workTracking) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Check if OTP is expired
    if (new Date() > workTracking.expiresAt) {
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }

    // Mark as verified
    workTracking.otpVerified = true;
    await workTracking.save();

    res.json({
      success: true,
      message: "Work marked as completed successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};

// Get work history for a worker (given a tenant)
exports.getWorkHistory = async (req, res) => {
  try {
    const workerId = req.session.user._id;
    const { tenantId } = req.params;

    if (!tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing tenant ID" });
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
