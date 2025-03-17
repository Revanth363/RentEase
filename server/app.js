const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
require("dotenv").config();

const Property = require("./models/property");
const Tenant = require("./models/tenant");
const Worker = require("./models/worker");
const Owner = require("./models/owner");
const Booking = require("./models/booking");
const Payment = require("./models/payment");
const Notification = require("./models/notification");
const Contact = require("./models/contactus");
const Rating = require("./models/rating");
const MaintenanceRequest = require("./models/MaintenanceRequest");
const Admin = require("./models/admin");
const WorkerPayment = require("./models/workerPayment");
const formidable = require('formidable');
const fs = require('fs');

const propertyRoutes = require("./routes/property");
const workerRoutes = require("./routes/workers");
const TenantRoutes = require("./routes/tenant");
const ownerRoutes = require("./routes/owner");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/admin");


require("dns").setDefaultResultOrder("ipv4first");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://revanthkumardompaka:qqo8F9xCiY5DPQLT@ffsd.pjcw0o6.mongodb.net/rentease"
  )
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB Atlas connection error:", err));

// Middleware
// CORS: allow common localhost dev ports or configured CLIENT_URL
const allowedOrigins = new Set([
  process.env.CLIENT_URL || '',
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:5174', 'http://127.0.0.1:5174'
].filter(Boolean));
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1):51\d{2}$/.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "15mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

const isAuthenticated = require("./middleware/auth");

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// In-memory OTP store
const otpStore = new Map();

// Rate limiter for OTP requests with JSON response
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({ success: false, error: "Too many OTP requests, please try again later." });
  }
});

// Generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// OTP will be returned in response for development (no email service needed)

// Routes
app.use("/api/property", propertyRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/tenant", TenantRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

// API Routes for React Frontend
app.get("/api/properties", async (req, res) => {
  try {
    const propertiesData = await Property.find({
      isRented: false,
      isVerified: true,
      is_popular: true,
    })
      .select("_id location subtype price images")
      .limit(10)
      .lean();
    res.json(propertiesData);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Failed to load properties" });
  }
});

app.get("/api/slider-properties", async (req, res) => {
  try {
    const sliderPropertiesData = await Property.find({
      isRented: false,
      isVerified: true,
    })
      .select("name description images _id")
      .limit(10)
      .lean();
    res.json(sliderPropertiesData);
  } catch (error) {
    console.error("Error fetching slider properties:", error);
    res.status(500).json({ error: "Failed to load slider properties" });
  }
});

app.get("/api/check-session", (req, res) => {
  // Return both regular user session and admin session info
  const user = req.session.user || null;
  const isAdmin = !!req.session.adminId;
  return res.json({ user, admin: isAdmin });
});

app.get("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ success: true, redirectUrl: "/" });
  });
});

app.get("/api/property", async (req, res) => {
  const propertyId = req.query.id;
  try {
    const property = await Property.findById(propertyId).lean();
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json(property);
  } catch (err) {
    console.error("Error fetching property:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/submit-form", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res
        .status(400)
        .json({ error: "Name, email, subject, and message are required" });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ error: "Please provide a valid Gmail address" });
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ error: "Please provide a valid 10-digit phone number" });
    }

    const contact = new Contact({
      name,
      email,
      phone: phone || "",
      subject,
      message,
    });

    await contact.save();

    res.status(200).json({ message: "Form submitted successfully" });
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({ error: "Server error, please try again later" });
  }
});

// Replaced EJS Routes with API or Redirects
app.get("/", (req, res) => {
  res.json({ message: "Welcome to RentEase API. Use /api endpoints for React frontend." });
});

app.get("/forgot-password", (req, res) => {
  res.redirect("http://localhost:5173/forgot-password");
});

async function handleForgotPassword(req, res) {
  const { email } = req.body;
  try {
    const tenant = await Tenant.findOne({ email });
    const owner = await Owner.findOne({ email });
    const worker = await Worker.findOne({ email });
    const user = tenant || owner || worker;
    if (!user) return res.json({ success: false, error: 'Email not found' });

    const otp = generateOtp();
    const otpExpires = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expires: otpExpires });
    setTimeout(() => { const entry = otpStore.get(email); if (entry && entry.expires <= Date.now()) otpStore.delete(email); }, 11 * 60 * 1000);

    // Dev mode: return OTP in response (no email service)
    return res.json({ success: true, message: 'OTP generated (dev mode - check console)', otp });
  } catch (err) {
    console.error('Error in forgot password flow:', err);
    return res.json({ success: false, error: 'Server error. Please try again later.' });
  }
}

app.post('/forgot-password', forgotPasswordLimiter, handleForgotPassword);
app.post('/api/forgot-password', forgotPasswordLimiter, handleForgotPassword);

function handleVerifyOtp(req, res) {
  const { email, otp } = req.body;
  try {
    const entry = otpStore.get(email);
    if (!entry) return res.json({ success: false, error: 'No OTP requested' });
    if (Date.now() > entry.expires) { otpStore.delete(email); return res.json({ success: false, error: 'OTP has expired' }); }
    if (entry.otp !== String(otp)) return res.json({ success: false, error: 'Invalid OTP' });
    return res.json({ success: true, message: 'OTP verified' });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.json({ success: false, error: 'Server error' });
  }
}
app.post('/verify-otp', handleVerifyOtp);
app.post('/api/verify-otp', handleVerifyOtp);

async function handleResetPassword(req, res) {
  const { email, password } = req.body;
  try {
    if (!password || password.length < 8) return res.json({ success: false, error: 'Password must be at least 8 characters long' });
    const tenant = await Tenant.findOne({ email }).select('+password');
    const owner = await Owner.findOne({ email }).select('+password');
    const worker = await Worker.findOne({ email }).select('+password');
    const user = tenant || owner || worker;
    if (!user) return res.json({ success: false, error: 'User not found' });
    const entry = otpStore.get(email);
    if (!entry) return res.json({ success: false, error: 'Please verify OTP first' });
    if (Date.now() > entry.expires) { otpStore.delete(email); return res.json({ success: false, error: 'OTP has expired, please request a new one' }); }
    user.password = password; await user.save(); otpStore.delete(email);
    return res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('Error resetting password:', err);
    return res.json({ success: false, error: 'Server error' });
  }
}
app.post('/reset-password', handleResetPassword);
app.post('/api/reset-password', handleResetPassword);

app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/api/dashboard");
  }
  res.redirect("http://localhost:5173/login");
});

app.post("/login", async (req, res) => {
  const { email, password, userType } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // ADMIN LOGIN (email ends with @admin.com)
    if (email.toLowerCase().trim().endsWith("@admin.com")) {
      const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select("+password");
      if (!admin || admin.password !== password) {
        return res.status(401).json({ error: "Invalid admin credentials" });
      }

      // Save admin session
      req.session.adminId = admin._id.toString();
      req.session.isAdmin = true;

      return res.json({
        success: true,
        redirectUrl: "/admin",
        message: "Admin login successful"
      });
    }

    // NORMAL USER LOGIN (tenant/owner/worker)
    if (!userType) {
      return res.status(400).json({ error: "Please select role" });
    }

    let Model = userType === "tenant" ? Tenant : userType === "owner" ? Owner : Worker;
    const user = await Model.findOne({ email }).select("+password");

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.user = {
      _id: user._id.toString(),
      userType,
      email: user.email
    };

    res.json({
      success: true,
      redirectUrl: getDashboardUrl(userType)
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

);

app.post("/register", async (req, res) => {
  const {
    userType,
    firstName,
    lastName,
    email,
    phone,
    location,
    serviceType,
    experience,
    numProperties,
    password,
  } = req.body;

  try {
    console.log("Received password:", JSON.stringify(password));

    if (!userType || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const existingUser =
      (await Tenant.findOne({ email })) ||
      (await Owner.findOne({ email })) ||
      (await Worker.findOne({ email }));

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const plainPassword = password;

    let newUser;

    if (userType === "tenant") {
      newUser = new Tenant({
        firstName,
        lastName,
        email,
        phone,
        location,
        password: plainPassword,
        userType: "tenant",
      });
    } else if (userType === "worker") {
      if (!serviceType || !experience) {
        return res
          .status(400)
          .json({ error: "Service type and experience required for workers" });
      }
      newUser = new Worker({
        firstName,
        lastName,
        email,
        phone,
        location,
        serviceType,
        experience: Number(experience) || 0,
        password: plainPassword,
        userType: "worker",
      });
    } else if (userType === "owner") {
      if (!numProperties || numProperties < 1) {
        return res
          .status(400)
          .json({ error: "Number of properties required for owners" });
      }
      newUser = new Owner({
        firstName,
        lastName,
        email,
        phone,
        location,
        numProperties: Number(numProperties) || 0,
        password: plainPassword,
        userType: "owner",
        notifications: {
          email: true,
          sms: false,
          payment: true,
          complaint: true,
          maintenance: true,
        },
      });
    } else {
      return res.status(400).json({ error: "Invalid user type" });
    }

    console.log("Saving user with password:", JSON.stringify(newUser.password));
    await newUser.save();
    console.log("User saved successfully");

    return res.json({
      success: true,
      redirectUrl: getDashboardUrl(newUser.userType) || '/worker_register',
      message: 'Registration successful',
      user: req.session.user,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res
      .status(500)
      .json({ error: `Registration failed: ${err.message}` });
  }
});

function getDashboardUrl(userType) {
  if (userType === "tenant") {
    return "/tenant/tenant_dashboard";
  } else if (userType === "owner") {
    return "/owner_dashboard";
  } else if (userType === "worker") {
    return "/worker_dashboard";
  }
  return "/login?error=Invalid user type";
}

app.get("/api/dashboard", isAuthenticated, (req, res) => {
  const userType = req.session.user?.userType;
  if (!userType) {
    return res.status(401).json({ error: "Please log in" });
  }
  res.json({ redirectUrl: getDashboardUrl(userType) });
});

app.get("/register", (req, res) => {
  res.redirect("http://localhost:5173/register");
});

// GET /api/search - Fully Fixed & Working
app.get("/api/search", async (req, res) => {
  try {
    const {
      location,
      "property-type": propertyType,
      price,
      "bedroom-no": bedrooms,
      "bathroom-no": bathrooms,
      furnishing,
      amenities,
    } = req.query;

    // Base query: only verified & not rented properties
    let query = {
      $and: [
        { $or: [{ isRented: false }, { isRented: { $exists: false } }] },
        { isVerified: true },
      ],
    };

    // Apply filters
    if (location) {
      query.location = { $regex: location.trim(), $options: "i" };
    }

    if (propertyType) {
      query.$or = [
        { type: { $regex: propertyType.trim(), $options: "i" } },
        { subtype: { $regex: propertyType.trim(), $options: "i" } }
      ];
    }

    if (price) {
      query.price = { $lte: Number(price) };
    }

    if (bedrooms) {
      query.beds = { $gte: Number(bedrooms) };
    }

    if (bathrooms) {
      query.baths = { $gte: Number(bathrooms) };
    }

   if (furnishing) {
  query.furnished = { $regex: furnishing.trim(), $options: "i" };
}

    if (amenities) {
      const amenitiesArray = amenities
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);

      if (amenitiesArray.length > 0) {
        query.amenities = { $all: amenitiesArray }; // Exact match (recommended)
      }
    }

    const properties = await Property.find(query)
      .select("-__v")
      .lean();

    res.json(properties);
  } catch (err) {
    console.error("Error in /api/search:", err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});
app.get("/property_listing_page", isAuthenticated, (req, res) => {
  if (req.session.user.userType !== "owner") {
    return res.json({ redirectUrl: getDashboardUrl(req.session.user.userType) });
  }
  res.json({ message: "Owner property listing page" });
});

app.get("/worker_register", (req, res) => {
  res.redirect("http://localhost:5173/worker_register");
});

app.get("/faq", (req, res) => {
  res.redirect("http://localhost:5173/faq");
});

app.get("/privacy_policy", (req, res) => {
  res.redirect("http://localhost:5173/privacy_policy");
});

app.get("/termsofservice", (req, res) => {
  res.redirect("http://localhost:5173/termsofservice");
});

app.get("/contact_us", (req, res) => {
  res.redirect("http://localhost:5173/contact_us");
});

app.get("/about_us", (req, res) => {
  res.redirect("http://localhost:5173/about_us");
});

// Admin Authentication Middleware (add this once at the top of your file)
const adminAuth = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next(); // Admin is logged in → proceed
  }
  // Not admin → block access
  return res.status(401).json({ error: "Admin access required. Please login." });
};


// PROTECTED ADMIN DASHBOARD ROUTE
app.get("/api/admin",  async (req, res) => {
  try {
    // Your entire existing code — 100% unchanged (just wrapped in protection)
    const totalProperties = await Property.countDocuments();
    const totalRenters = await Tenant.countDocuments();
    const totalOwners = await Owner.countDocuments();
    const totalWorkers = await Worker.countDocuments();
    const activeRentals = await Property.countDocuments({ isRented: true });
    const pendingBookings = await Booking.countDocuments({ status: "Pending" });
    const cancelledBookings = await Booking.countDocuments({ status: "Terminated" });
    const activeUsers = (await Tenant.countDocuments({ status: "Active" })) +
      (await Worker.countDocuments({ status: "Active" })) +
      (await Owner.countDocuments({ status: "Active" }));

    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const revenueDailyResult = await Payment.aggregate([
      { $match: { status: "Paid", paymentDate: { $gte: oneDayAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const revenueDaily = revenueDailyResult[0]?.total || 0;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const revenueWeeklyResult = await Payment.aggregate([
      { $match: { status: "Paid", paymentDate: { $gte: oneWeekAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const revenueWeekly = revenueWeeklyResult[0]?.total || 0;

    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 1000);
    const revenueMonthlyResult = await Payment.aggregate([
      { $match: { status: "Paid", paymentDate: { $gte: oneMonthAgo } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const revenueMonthly = revenueMonthlyResult[0]?.total || 0;

    const propertiesActive = await Property.countDocuments({
      isVerified: true,
      isRented: true,
    });
    const propertiesPending = await Property.countDocuments({
      isVerified: false,
    });
    const propertiesAvailable = await Property.countDocuments({
      isVerified: true,
      isRented: false,
    });

    const workersAvailable = await Worker.countDocuments({ status: "Active" });

    const userGrowth = (await Tenant.countDocuments({ createdAt: { $gte: oneMonthAgo } })) +
      (await Worker.countDocuments({ createdAt: { $gte: oneMonthAgo } })) +
      (await Owner.countDocuments({ createdAt: { $gte: oneMonthAgo } }));

    const bookingStatusDistribution = {
      active: activeRentals,
      pending: pendingBookings,
      cancelled: cancelledBookings,
    };

    const stats = {
      totalProperties, totalRenters, totalOwners, totalWorkers, activeRentals,
      pendingBookings, cancelledBookings, activeUsers, totalRevenue,
      revenueDaily, revenueWeekly, revenueMonthly, propertiesActive,
      propertiesPending, propertiesAvailable, workersAvailable, userGrowth,
      bookingStatusDistribution,
    };

    const currentYear = new Date().getFullYear();
    const quarters = [
      { name: 'Q1 (Jan-Apr)', months: [0, 1, 2, 3] },
      { name: 'Q2 (May-Aug)', months: [4, 5, 6, 7] },
      { name: 'Q3 (Sep-Dec)', months: [8, 9, 10, 11] }
    ];

    const newProperties = await Promise.all(quarters.map(async (quarter) => {
      const start = new Date(currentYear, quarter.months[0], 1);
      const end = new Date(currentYear, quarter.months[3] + 1, 0);
      return await Property.countDocuments({ createdAt: { $gte: start, $lte: end } });
    }));

    const newTenants = await Promise.all(quarters.map(async (quarter) => {
      const start = new Date(currentYear, quarter.months[0], 1);
      const end = new Date(currentYear, quarter.months[3] + 1, 0);
      return await Tenant.countDocuments({ createdAt: { $gte: start, $lte: end } });
    }));

    const newWorkers = await Promise.all(quarters.map(async (quarter) => {
      const start = new Date(currentYear, quarter.months[0], 1);
      const end = new Date(currentYear, quarter.months[3] + 1, 0);
      return await Worker.countDocuments({ createdAt: { $gte: start, $lte: end } });
    }));

    const newOwners = await Promise.all(quarters.map(async (quarter) => {
      const start = new Date(currentYear, quarter.months[0], 1);
      const end = new Date(currentYear, quarter.months[3] + 1, 0);
      return await Owner.countDocuments({ createdAt: { $gte: start, $lte: end } });
    }));

    const newServices = await Promise.all(quarters.map(async (quarter) => {
      const start = new Date(currentYear, quarter.months[0], 1);
      const end = new Date(currentYear, quarter.months[3] + 1, 0);
      return await Booking.countDocuments({
        createdAt: { $gte: start, $lte: end },
        status: { $in: ['Active', 'Pending'] }
      });
    }));

    const quarterlyRevenue = await Promise.all(quarters.map(async (quarter) => {
      const start = new Date(currentYear, quarter.months[0], 1);
      const end = new Date(currentYear, quarter.months[3] + 1, 0);
      const result = await Payment.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end }, status: { $in: ['Paid', 'Completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      return result.length > 0 ? Math.round(result[0].total) : 0;
    }));

    const userTypeDistribution = {
      tenants: await Tenant.countDocuments(),
      owners: await Owner.countDocuments(),
      workers: await Worker.countDocuments()
    };

    const propertyStatusDistribution = {
      rented: await Property.countDocuments({ isRented: true }),
      available: await Property.countDocuments({ isRented: false }),
      pending: await Property.countDocuments({ isVerified: false })
    };

    const properties = await Property.find()
      .populate("ownerId", "firstName lastName email _id")
      .populate("tenantId", "firstName lastName email _id")
      .populate({ path: "activeWorkers", select: "firstName lastName _id", match: { status: "Active" } })
      .lean();

    properties.forEach((p) => {
      p.id = p._id.toString();
      p.ownerName = p.ownerId ? `${p.ownerId.firstName} ${p.ownerId.lastName}` : "N/A";
      p.ownerIdStr = p.ownerId?._id?.toString() || null;
      p.tenantName = p.tenantId ? `${p.tenantId.firstName} ${p.tenantId.lastName}` : "N/A";
      p.tenantIdStr = p.tenantId?._id?.toString() || null;
      p.activeWorkers = p.activeWorkers?.map((w) => ({
        name: `${w.firstName} ${w.lastName}`,
        id: w._id.toString(),
      })) || [];
    });

    const tenants = await Tenant.find().populate("ownerId", "firstName lastName").lean();
    const workers = await Worker.find({ status: "Active" }).lean();
    const owners = await Owner.find().populate("propertyIds").lean();

    const tenantPropertyCounts = await Promise.all(
      tenants.map((t) => Property.countDocuments({ tenantId: t._id }))
    );
    const workerClientCounts = await Promise.all(
      workers.map((w) => Booking.countDocuments({ assignedWorker: w._id, status: "Active" }))
    );

    const users = [
      ...tenants.map((t, index) => ({
        id: t._id.toString(), firstName: t.firstName, lastName: t.lastName,
        userType: t.userType, email: t.email, phone: t.phone, address: t.location,
        createdAt: t.createdAt, status: t.status,
        ownerName: t.ownerId ? `${t.ownerId.firstName} ${t.ownerId.lastName}` : "None",
        propertyCount: tenantPropertyCounts[index],
      })),
      ...workers.map((w, index) => ({
        id: w._id.toString(), firstName: w.firstName, lastName: w.lastName,
        userType: w.userType, email: w.email, phone: w.phone, address: w.location,
        createdAt: w.createdAt, status: w.status,
        serviceType: w.serviceType, experience: w.experience,
        clientCount: workerClientCounts[index],
      })),
      ...owners.map((o) => ({
        id: o._id.toString(), firstName: o.firstName, lastName: o.lastName,
        userType: o.userType, email: o.email, phone: o.phone, address: o.location,
        createdAt: o.createdAt, status: o.status,
        numProperties: o.numProperties || o.propertyIds?.length || 0,
        accountNo: o.accountNo, upiid: o.upiid,
      })),
    ];

    const bookings = await Booking.find()
      .populate("tenantId", "firstName lastName _id")
      .populate("propertyId", "name ownerId")
      .populate("assignedWorker", "firstName lastName _id")
      .populate("propertyId.ownerId", "firstName lastName")
      .lean();

    bookings.forEach((b) => {
      b.id = b._id.toString();
      b.userName = b.tenantId ? `${b.tenantId.firstName} ${b.tenantId.lastName}` : "N/A";
      b.userId = b.tenantId?._id?.toString();
      b.propertyName = b.propertyId?.name || "N/A";
      b.propertyIdStr = b.propertyId?._id?.toString();
      b.ownerName = b.propertyId?.ownerId ? `${b.propertyId.ownerId.firstName} ${b.propertyId.ownerId.lastName}` : "N/A";
      b.workerName = b.assignedWorker ? `${b.assignedWorker.firstName} ${b.assignedWorker.lastName}` : "None";
      b.workerId = b.assignedWorker?._id?.toString();
    });

    const payments = await Payment.find().populate("tenantId", "firstName lastName _id").lean();
    payments.forEach((p) => {
      p.id = p._id.toString();
      p.userName = p.tenantId ? `${p.tenantId.firstName} ${p.tenantId.lastName}` : "N/A";
      p.user = p.tenantId?._id;
    });

    const notifications = await Notification.find()
  .populate("worker", "firstName lastName")
  .populate("recipient", "firstName lastName")
  .sort({ createdAt: -1 })        // ← ADD THIS
  .limit(10)                      // ← KEEP THIS
  .lean();

notifications.forEach((n) => {
  n.id = n._id.toString();
  n.workerName = n.worker ? `${n.worker.firstName} ${n.worker.lastName}` : "N/A";
  n.recipientName = n.recipient ? `${n.recipient.firstName} ${n.recipient.lastName}` : "N/A";
  n.createdAtFormatted = n.createdAt
    ? new Date(n.createdAt).toLocaleString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : 'N/A';
});

    // Inside your existing GET /api/admin route
const maintenanceRequests = await MaintenanceRequest.find()
  .populate({
    path: 'propertyId',
    select: 'name ownerId',                 // get name + ownerId from Property
    populate: {
      path: 'ownerId',                      // now go one level deeper
      model: 'Owner',                       // important! tell mongoose which model
      select: 'firstName lastName'          // only these fields
    }
  })
  .populate('tenantId', 'firstName lastName _id')
  .sort({ dateReported: -1 })
  .limit(10)
  .lean();

maintenanceRequests.forEach((m) => {
  m.id = m._id.toString();
  m.propertyName = m.propertyId?.name || "N/A";
  m.propertyIdStr = m.propertyId?._id?.toString();
  m.tenantName = m.tenantId ? `${m.tenantId.firstName} ${m.tenantId.lastName}` : "N/A";
  m.tenantIdStr = m.tenantId?._id?.toString();
  m.ownerName = m.propertyId?.ownerId 
    ? `${m.propertyId.ownerId.firstName} ${m.propertyId.ownerId.lastName}` 
    : "N/A";
  m.dateReported = m.dateReported || m.createdAt;
});

    // Use your controller logic — latest 10 only
// SMART CONTACT SUBMISSIONS: latest 10 by default, ALL when filtering by date
let contactSubmissions;

if (req.query.fromDate || req.query.toDate) {
  // User is using date filter → return ALL matching messages
  let dateQuery = {};

  if (req.query.fromDate) {
    dateQuery.$gte = new Date(req.query.fromDate);
  }
  if (req.query.toDate) {
    const toDate = new Date(req.query.toDate);
    toDate.setHours(23, 59, 59, 999);
    dateQuery.$lte = toDate;
  }

  contactSubmissions = await Contact.find({
    submittedAt: dateQuery
  })
    .sort({ submittedAt: -1 })
    .lean();
} else {
  // No filter → show only latest 10
  contactSubmissions = await Contact.find()
    .sort({ submittedAt: -1 })
    .limit(10)
    .lean();
}

// Format for frontend
contactSubmissions.forEach((s) => {
  s.id = s._id.toString();
  s.submittedAtFormatted = s.submittedAt
    ? new Date(s.submittedAt).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      })
    : 'N/A';
});

    const workerPayments = await WorkerPayment.find()
      .populate("tenantId", "firstName lastName _id")
      .populate("workerId", "firstName lastName _id")
      .sort({ createdAt: -1 })
      .lean();
    workerPayments.forEach((p) => {
      p.id = p._id.toString();
      p.paidByName = p.tenantId ? `${p.tenantId.firstName} ${p.tenantId.lastName}` : p.userName || "N/A";
      p.paidById = p.tenantId?._id?.toString();
      p.receivedByName = p.workerId ? `${p.workerId.firstName} ${p.workerId.lastName}` : "N/A";
      p.receivedById = p.workerId?._id?.toString();
    });

    // Final Response
    res.json({
      stats,
      properties,
      users,
      bookings,
      payments,
      notifications,
      maintenanceRequests,
      contactSubmissions,
      workerPayments,
      analyticsData: {
        quarters: quarters.map(q => q.name),
        newProperties,
        newTenants,
        newWorkers,
        newOwners,
        newServices,
        totalRevenue: quarterlyRevenue,
        userTypeDistribution,
        propertyStatusDistribution
      }
    });

  } catch (err) {
    console.error("Error fetching admin dashboard data:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// PROTECTED ROUTE — Only logged-in admin can access
app.get("/api/admin/message/:id", adminAuth, async (req, res) => {
  try {
    const submission = await Contact.findById(req.params.id).lean();

    if (!submission) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.json({
      id: submission._id.toString(),
      name: submission.name || "Anonymous",
      email: submission.email || "N/A",
      phone: submission.phone || "N/A",
      subject: submission.subject || "(No subject)",
      message: submission.message || "No message",
      submittedAt: submission.submittedAt,
      submittedAtFormatted: submission.submittedAt
        ? new Date(submission.submittedAt).toLocaleString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short",
          })
        : "Date not available",
    });
  } catch (err) {
    console.error("Error fetching message details:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    details: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});