const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
// express-session removed (migrated to JWT cookies)
const rateLimit = require("express-rate-limit");
const cors = require("cors");
require("dotenv").config();
const passport = require("passport");
const helmet = require("helmet");
require("./passport");
const { verifyToken, signToken } = require("./utils/jwt");


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
const SuperAdmin = require("./models/SuperAdmin");

const fs = require("fs");

const propertyRoutes = require("./routes/property");
const workerRoutes = require("./routes/workers");
const TenantRoutes = require("./routes/tenant");
const ownerRoutes = require("./routes/owner");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/admin");
const superadminRoutes = require("./routes/superadmin");
const verificationRoutes = require("./routes/verification");
const adminUserVerificationsRoutes = require("./routes/adminUserVerifications");

require("dns").setDefaultResultOrder("ipv4first");
mongoose.set('debug', true);

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


// ==============================================
//           CORS – THIS IS THE CORRECT ONE
// ==============================================

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',   // if you ever use another Vite port
    // Add your production domain later, e.g. 'https://your-app.com'
  ],
  credentials: true,              // ← must be true for cookies (accessToken)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 204       // browsers expect 204 for OPTIONS
}));

// Optional but very helpful in dev: log CORS requests
// You can remove this later
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`OPTIONS ${req.originalUrl} from ${req.headers.origin}`);
  }
  next();
});







// (new middleware)
// ─── Body Parsing ───────────────────────────────────────────────
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }))
app.use(bodyParser.json({ limit: '15mb' }));


app.use(express.static(path.join(__dirname, "public")));



// ─── Security Headers (Helmet) ──────────────────────────────────
app.use(helmet());
app.use(helmet.hidePoweredBy());                        // Remove X-Powered-By header
app.use(helmet.frameguard({ action: 'deny' }));         // Prevent clickjacking (X-Frame-Options: DENY)
app.use(helmet.xssFilter());                            // Add X-XSS-Protection header (legacy but still used)
app.use(helmet.noSniff());                              // Prevent MIME-type sniffing (X-Content-Type-Options: nosniff)
app.use(helmet.ieNoOpen());                             // X-Download-Options for IE8+ (no open in browser)
// app.use(helmet.hsts({ maxAge: 31536000 }));             // Strict-Transport-Security (1 year) — enable only if you have HTTPS!
app.use(helmet.referrerPolicy({ policy: 'no-referrer' })); // Strict referrer policy


// express-session removed; using stateless JWT cookies instead

// ─── Cookie Parser (needed for signed cookies & csurf) ──────────
const cookieParser = require('cookie-parser');
app.use(cookieParser(process.env.SESSION_SECRET || 'your_secret_key'));



app.use(passport.initialize());

const errorLogger = require("./middleware/errorLogger");
app.use(errorLogger);

const { logger } = require("./middleware/logger");
app.use(logger);




const { protect, adminProtect } = require("./middleware/auth");

app.use((req, res, next) => {
  res.locals.user = req.user || null;
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
    return res.status(429).json({
      success: false,
      error: "Too many OTP requests, please try again later.",
    });
  },
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
app.use("/api/superadmin", superadminRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/admin/verifications", adminUserVerificationsRoutes);

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

// Return minimal current user info (JWT-based)
app.get("/api/me", protect, async (req, res) => {
  let user = null;

  try {
    if (req.user.userType === "superadmin") {
      const SuperAdmin = require('./models/SuperAdmin');
      user = await SuperAdmin.findById(req.user.id).select("-password").lean();
    } else if (req.user.userType === "admin") {
      user = await Admin.findById(req.user.id).select("-password").lean();
    } else if (req.user.userType === "tenant") {
      user = await Tenant.findById(req.user.id).select("-password").lean();
    } else if (req.user.userType === "owner") {
      user = await Owner.findById(req.user.id).select("-password").lean();
    } else if (req.user.userType === "worker") {
      user = await Worker.findById(req.user.id).select("-password").lean();
    }
  } catch (err) {
    // silent fail
  }

  const safeUser = user ? {
    id: user._id.toString(),
    email: user.email,
    userType: req.user.userType,
    firstName: user.fullName?.split(' ')[0] || user.firstName || "",
    lastName: user.fullName?.split(' ').slice(1).join(' ') || user.lastName || "",
    isSuperAdmin: req.user.userType === "superadmin"
  } : null;

  res.json({
    success: true,
    user: safeUser,
    admin: req.user.userType === "admin" || req.user.userType === "superadmin"
  });
});


// Backwards-compat: keep /api/check-session redirecting to /api/me
app.get("/api/check-session", (req, res) => res.redirect("/api/me"));

app.get("/api/logout", (req, res) => {
  // use same options as when the cookie was set so clearCookie matches
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // login sets secure=false in dev
    sameSite: "lax",     // must match login sameSite
    path: "/",          // explicit path
  };
  res.clearCookie("accessToken", cookieOptions);
  res.json({ success: true, redirectUrl: "/" });
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
  res.json({
    message: "Welcome to RentEase API. Use /api endpoints for React frontend.",
  });
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
    if (!user) return res.json({ success: false, error: "Email not found" });

    const otp = generateOtp();
    const otpExpires = Date.now() + 10 * 60 * 1000;
    otpStore.set(email, { otp, expires: otpExpires });
    setTimeout(() => {
      const entry = otpStore.get(email);
      if (entry && entry.expires <= Date.now()) otpStore.delete(email);
    }, 11 * 60 * 1000);

    // Dev mode: return OTP in response (no email service)
    return res.json({
      success: true,
      message: "OTP generated (dev mode - check console)",
      otp,
    });
  } catch (err) {
    console.error("Error in forgot password flow:", err);
    return res.json({
      success: false,
      error: "Server error. Please try again later.",
    });
  }
}

app.post("/forgot-password", forgotPasswordLimiter, handleForgotPassword);
app.post("/api/forgot-password", forgotPasswordLimiter, handleForgotPassword);

function handleVerifyOtp(req, res) {
  const { email, otp } = req.body;
  try {
    const entry = otpStore.get(email);
    if (!entry) return res.json({ success: false, error: "No OTP requested" });
    if (Date.now() > entry.expires) {
      otpStore.delete(email);
      return res.json({ success: false, error: "OTP has expired" });
    }
    if (entry.otp !== String(otp))
      return res.json({ success: false, error: "Invalid OTP" });
    return res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.json({ success: false, error: "Server error" });
  }
}
app.post("/verify-otp", handleVerifyOtp);
app.post("/api/verify-otp", handleVerifyOtp);

async function handleResetPassword(req, res) {
  const { email, password } = req.body;
  try {
    if (!password || password.length < 8)
      return res.json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    const tenant = await Tenant.findOne({ email }).select("+password");
    const owner = await Owner.findOne({ email }).select("+password");
    const worker = await Worker.findOne({ email }).select("+password");
    const user = tenant || owner || worker;
    if (!user) return res.json({ success: false, error: "User not found" });
    const entry = otpStore.get(email);
    if (!entry)
      return res.json({ success: false, error: "Please verify OTP first" });
    if (Date.now() > entry.expires) {
      otpStore.delete(email);
      return res.json({
        success: false,
        error: "OTP has expired, please request a new one",
      });
    }
    user.password = password;
    await user.save();
    otpStore.delete(email);
    return res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Error resetting password:", err);
    return res.json({ success: false, error: "Server error" });
  }
}
app.post("/reset-password", handleResetPassword);
app.post("/api/reset-password", handleResetPassword);

app.get("/login", (req, res) => {
  if (req.user) {
    return res.redirect("/api/dashboard");
  }
  res.redirect("http://localhost:5173/login");
});

app.post("/login", async (req, res) => {
  const { email, password, userType } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password required"
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ───── 1. SUPERADMIN CHECK (separate collection) ─────
    const SuperAdmin = require('./models/SuperAdmin');
    const superAdmin = await SuperAdmin.findOne({ email: normalizedEmail });

    if (superAdmin && superAdmin.password === password && superAdmin.isActive) {
      const payload = {
        id: superAdmin._id.toString(),
        email: superAdmin.email,
        userType: "superadmin",          // ← new type
        isSuperAdmin: true
      };

      const token = signToken(payload, { expiresIn: "1h" });

      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        // send them straight to the overview page
        redirectUrl: "/superadmin/overview",
        token,
      });
    }

    // ───── 2. NORMAL ADMIN CHECK ─────
    if (normalizedEmail.endsWith("@admin.com")) {
      const admin = await Admin.findOne({ email: normalizedEmail });

      if (!admin || admin.password !== password || admin.status !== 'Active') {
        return res.status(401).json({
          success: false,
          error: "Invalid admin credentials or account inactive"
        });
      }

      // update lastLogin timestamp for audit
      admin.lastLogin = new Date();
      await admin.save();

      const payload = {
        id: admin._id.toString(),
        userType: "admin",
        email: admin.email,
        isSuperAdmin: false
      };

      const token = signToken(payload, { expiresIn: "1h" });

      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        redirectUrl: "/admin",
        token,
      });
    }

    // ───── 3. NORMAL USER (tenant/owner/worker) ─────
    if (!userType) {
      return res.status(400).json({
        success: false,
        error: "Please select role"
      });
    }


    const Model =
      userType === "tenant" ? Tenant :
      userType === "owner"  ? Owner  :
      userType === "worker" ? Worker : null;

    if (!Model) {
      return res.status(400).json({
        success: false,
        error: "Invalid user type"
      });
    }

    // Always select password explicitly (in case schema excludes it by default)
    const user = await Model.findOne({ email: normalizedEmail }).select("+password");

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    // update lastLogin timestamp for audit
    user.lastLogin = new Date();
    await user.save();

    const payload = {
      id: user._id.toString(),
      userType,
      email: user.email
    };

    const token = signToken(payload, { expiresIn: "1h" });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      redirectUrl: getDashboardUrl(userType),
      token,
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});



// public endpoint for basic settings (used by frontend to detect maintenance mode)
const settingsCtrl = require('./controllers/superadminsettingsController');
app.get('/api/public-settings', async (req, res) => {
  try {
    const settings = await settingsCtrl.getCachedSettings();
    const { maintenanceMode, maintenanceMessage } = settings;
    res.json({ maintenanceMode, maintenanceMessage });
  } catch (err) {
    console.error('Error fetching public settings:', err);
    res.status(500).json({ maintenanceMode: false, maintenanceMessage: '' });
  }
});

// global maintenance middleware
app.use(async (req, res, next) => {
  try {
    const settings = await settingsCtrl.getCachedSettings();
    const { maintenanceMode, maintenanceMessage } = settings;
    if (maintenanceMode) {
      // allow superadmin and admin to continue
      const userType = req.user?.userType;
      if (userType === 'admin' || userType === 'superadmin') {
        return next();
      }
      // API requests return JSON
      if (req.path.startsWith('/api')) {
        return res.status(503).json({ message: maintenanceMessage || 'Under maintenance' });
      }
      // otherwise serve a simple maintenance HTML message
      return res.send(`
        <html><head><title>Maintenance</title></head><body style="font-family:sans-serif; text-align:center; padding:2rem;">
        <h1>Site Under Maintenance</h1>
        <p>${maintenanceMessage || 'Sorry for the inconvenience, we will be back shortly.'}</p>
        </body></html>
      `);
    }
    next();
  } catch (err) {
    console.error('Maintenance middleware error:', err);
    next();
  }
});

// Start Google login
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res, next) => {
    try {
      if (!req.user) {
        const err = new Error("Google authentication failed");
        err.status = 401;
        return next(err);
      }

      const payload = {
        id: req.user._id.toString(),
        userType: req.user.userType,
        email: req.user.email,
      };

      const token = signToken(payload, { expiresIn: "1h" });

      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",   // ✅ FIX
        maxAge: 60 * 60 * 1000,
      });

      res.redirect("http://localhost:5173/google-auth-success");
    } catch (err) {
      err.status = 500;
      next(err);
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
      newUser = new Worker({
        firstName,
        lastName,
        email,
        phone,
        location,
        serviceType: serviceType || "Not specified",
        experience: experience ? Number(experience) : 0,
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

    // Sign token for the new user and set cookie
    const payload = {
      id: newUser._id.toString(),
      userType: newUser.userType,
      email: newUser.email,
    };
    const token = signToken(payload, { expiresIn: "1h" });
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    };
    res.cookie("accessToken", token, cookieOptions);

    return res.json({
      success: true,
      redirectUrl: getDashboardUrl(newUser.userType) || "/worker_register",
      message: "Registration successful",
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

app.get("/api/dashboard", protect, (req, res) => {
  const userType = req.user?.userType;
  if (!userType) {
    return res.status(401).json({ error: "Please log in" });
  }
  res.json({ redirectUrl: getDashboardUrl(userType) });
});



// Search properties endpoint – only show verified & not-rented properties
app.get("/api/search", async (req, res) => {
  try {
    const { amenities } = req.query;

    // This is the only filter you want
    const query = {
      isRented: false,       // do NOT show rented properties
      isVerified: true       // do NOT show unverified properties
    };

    // Keep your amenities filter (if user selected any)
    if (amenities) {
      const amenitiesArray = amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (amenitiesArray.length > 0) {
        query.amenities = { $all: amenitiesArray };
      }
    }

    const properties = await Property.find(query)
      .select("-__v")          // exclude version key if you don't need it
      .sort({ createdAt: -1 }) // newest first – change if you prefer different order
      .lean();

    res.json(properties);
  } catch (err) {
    console.error("Error in /api/search:", err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

app.get("/property_listing_page", protect, (req, res) => {
  if (req.user?.userType !== "owner") {
    return res.json({ redirectUrl: getDashboardUrl(req.user?.userType) });
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
  if (req.user && req.user.userType === "admin") {
    return next();
  }
  return res.status(401).json({ error: "Admin access required. Please login." });
};

// PROTECTED ADMIN DASHBOARD ROUTE
app.get("/api/admin", protect, adminProtect, async (req, res) => {
  try {
    // Your entire existing code — 100% unchanged (just wrapped in protection)
    const totalProperties = await Property.countDocuments();
    const totalRenters = await Tenant.countDocuments();
    const totalOwners = await Owner.countDocuments();
    const totalWorkers = await Worker.countDocuments();
    const activeRentals = await Property.countDocuments({ isRented: true });
    const pendingBookings = await Booking.countDocuments({ status: "Pending" });
    const cancelledBookings = await Booking.countDocuments({
      status: "Terminated",
    });
    const activeUsers =
      (await Tenant.countDocuments({ status: "Active" })) +
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

    const userGrowth =
      (await Tenant.countDocuments({ createdAt: { $gte: oneMonthAgo } })) +
      (await Worker.countDocuments({ createdAt: { $gte: oneMonthAgo } })) +
      (await Owner.countDocuments({ createdAt: { $gte: oneMonthAgo } }));

    const bookingStatusDistribution = {
      active: activeRentals,
      pending: pendingBookings,
      cancelled: cancelledBookings,
    };

    const stats = {
      totalProperties,
      totalRenters,
      totalOwners,
      totalWorkers,
      activeRentals,
      pendingBookings,
      cancelledBookings,
      activeUsers,
      totalRevenue,
      revenueDaily,
      revenueWeekly,
      revenueMonthly,
      propertiesActive,
      propertiesPending,
      propertiesAvailable,
      workersAvailable,
      userGrowth,
      bookingStatusDistribution,
    };

    const currentYear = new Date().getFullYear();
    const quarters = [
      { name: "Q1 (Jan-Apr)", months: [0, 1, 2, 3] },
      { name: "Q2 (May-Aug)", months: [4, 5, 6, 7] },
      { name: "Q3 (Sep-Dec)", months: [8, 9, 10, 11] },
    ];

    const newProperties = await Promise.all(
      quarters.map(async (quarter) => {
        const start = new Date(currentYear, quarter.months[0], 1);
        const end = new Date(currentYear, quarter.months[3] + 1, 0);
        return await Property.countDocuments({
          createdAt: { $gte: start, $lte: end },
        });
      })
    );

    const newTenants = await Promise.all(
      quarters.map(async (quarter) => {
        const start = new Date(currentYear, quarter.months[0], 1);
        const end = new Date(currentYear, quarter.months[3] + 1, 0);
        return await Tenant.countDocuments({
          createdAt: { $gte: start, $lte: end },
        });
      })
    );

    const newWorkers = await Promise.all(
      quarters.map(async (quarter) => {
        const start = new Date(currentYear, quarter.months[0], 1);
        const end = new Date(currentYear, quarter.months[3] + 1, 0);
        return await Worker.countDocuments({
          createdAt: { $gte: start, $lte: end },
        });
      })
    );

    const newOwners = await Promise.all(
      quarters.map(async (quarter) => {
        const start = new Date(currentYear, quarter.months[0], 1);
        const end = new Date(currentYear, quarter.months[3] + 1, 0);
        return await Owner.countDocuments({
          createdAt: { $gte: start, $lte: end },
        });
      })
    );

    const newServices = await Promise.all(
      quarters.map(async (quarter) => {
        const start = new Date(currentYear, quarter.months[0], 1);
        const end = new Date(currentYear, quarter.months[3] + 1, 0);
        return await Booking.countDocuments({
          createdAt: { $gte: start, $lte: end },
          status: { $in: ["Active", "Pending"] },
        });
      })
    );

    const quarterlyRevenue = await Promise.all(
      quarters.map(async (quarter) => {
        const start = new Date(currentYear, quarter.months[0], 1);
        const end = new Date(currentYear, quarter.months[3] + 1, 0);
        const result = await Payment.aggregate([
          {
            $match: {
              paymentDate: { $gte: start, $lte: end },
              status: { $in: ["Paid", "Completed"] },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        return result.length > 0 ? Math.round(result[0].total) : 0;
      })
    );

    const userTypeDistribution = {
      tenants: await Tenant.countDocuments(),
      owners: await Owner.countDocuments(),
      workers: await Worker.countDocuments(),
    };

    const propertyStatusDistribution = {
      rented: await Property.countDocuments({ isRented: true }),
      available: await Property.countDocuments({ isRented: false }),
      pending: await Property.countDocuments({ isVerified: false }),
    };

    const properties = await Property.find()
      .populate("ownerId", "firstName lastName email _id")
      .populate("tenantId", "firstName lastName email _id")
      .populate({
        path: "activeWorkers",
        select: "firstName lastName _id",
        match: { status: "Active" },
      })
      .lean();

    properties.forEach((p) => {
      p.id = p._id.toString();
      p.ownerName = p.ownerId
        ? `${p.ownerId.firstName} ${p.ownerId.lastName}`
        : "N/A";
      p.ownerIdStr = p.ownerId?._id?.toString() || null;
      p.tenantName = p.tenantId
        ? `${p.tenantId.firstName} ${p.tenantId.lastName}`
        : "N/A";
      p.tenantIdStr = p.tenantId?._id?.toString() || null;
      p.activeWorkers =
        p.activeWorkers?.map((w) => ({
          name: `${w.firstName} ${w.lastName}`,
          id: w._id.toString(),
        })) || [];
    });

    const tenants = await Tenant.find()
      .populate("ownerId", "firstName lastName")
      .lean();
    const workers = await Worker.find({ status: "Active" }).lean();
    const owners = await Owner.find().populate("propertyIds").lean();

    const tenantPropertyCounts = await Promise.all(
      tenants.map((t) => Property.countDocuments({ tenantId: t._id }))
    );
    const workerClientCounts = await Promise.all(
      workers.map((w) =>
        Booking.countDocuments({ assignedWorker: w._id, status: "Active" })
      )
    );

    const users = [
      ...tenants.map((t, index) => ({
        id: t._id.toString(),
        firstName: t.firstName,
        lastName: t.lastName,
        userType: t.userType,
        email: t.email,
        phone: t.phone,
        address: t.location,
        createdAt: t.createdAt,
        status: t.status,
        ownerName: t.ownerId
          ? `${t.ownerId.firstName} ${t.ownerId.lastName}`
          : "None",
        propertyCount: tenantPropertyCounts[index],
      })),
      ...workers.map((w, index) => ({
        id: w._id.toString(),
        firstName: w.firstName,
        lastName: w.lastName,
        userType: w.userType,
        email: w.email,
        phone: w.phone,
        address: w.location,
        createdAt: w.createdAt,
        status: w.status,
        serviceType: w.serviceType,
        experience: w.experience,
        clientCount: workerClientCounts[index],
      })),
      ...owners.map((o) => ({
        id: o._id.toString(),
        firstName: o.firstName,
        lastName: o.lastName,
        userType: o.userType,
        email: o.email,
        phone: o.phone,
        address: o.location,
        createdAt: o.createdAt,
        status: o.status,
        numProperties: o.numProperties || o.propertyIds?.length || 0,
        accountNo: o.accountNo,
        upiid: o.upiid,
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
      b.userName = b.tenantId
        ? `${b.tenantId.firstName} ${b.tenantId.lastName}`
        : "N/A";
      b.userId = b.tenantId?._id?.toString();
      b.propertyName = b.propertyId?.name || "N/A";
      b.propertyIdStr = b.propertyId?._id?.toString();
      b.ownerName = b.propertyId?.ownerId
        ? `${b.propertyId.ownerId.firstName} ${b.propertyId.ownerId.lastName}`
        : "N/A";
      b.workerName = b.assignedWorker
        ? `${b.assignedWorker.firstName} ${b.assignedWorker.lastName}`
        : "None";
      b.workerId = b.assignedWorker?._id?.toString();
    });

    const payments = await Payment.find()
      .populate("tenantId", "firstName lastName _id")
      .lean();
    payments.forEach((p) => {
      p.id = p._id.toString();
      p.userName = p.tenantId
        ? `${p.tenantId.firstName} ${p.tenantId.lastName}`
        : "N/A";
      p.user = p.tenantId?._id;
    });

    const notifications = await Notification.find({
      type: { $ne: "Work-OTP" }, // ⬅ exclude Work-OTP notifications
    })
      .populate("worker", "firstName lastName")
      .populate("recipient", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    notifications.forEach((n) => {
      n.id = n._id.toString();
      n.workerName = n.worker
        ? `${n.worker.firstName} ${n.worker.lastName}`
        : "N/A";
      n.recipientName = n.recipient
        ? `${n.recipient.firstName} ${n.recipient.lastName}`
        : "N/A";
      n.createdAtFormatted = n.createdAt
        ? new Date(n.createdAt).toLocaleString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A";
    });

    // Inside your existing GET /api/admin route
    const maintenanceRequests = await MaintenanceRequest.find()
      .populate({
        path: "propertyId",
        select: "name ownerId", // get name + ownerId from Property
        populate: {
          path: "ownerId", // now go one level deeper
          model: "Owner", // important! tell mongoose which model
          select: "firstName lastName", // only these fields
        },
      })
      .populate("tenantId", "firstName lastName _id")
      .sort({ dateReported: -1 })
      .limit(10)
      .lean();

    maintenanceRequests.forEach((m) => {
      m.id = m._id.toString();
      m.propertyName = m.propertyId?.name || "N/A";
      m.propertyIdStr = m.propertyId?._id?.toString();
      m.tenantName = m.tenantId
        ? `${m.tenantId.firstName} ${m.tenantId.lastName}`
        : "N/A";
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
        submittedAt: dateQuery,
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
        ? new Date(s.submittedAt).toLocaleString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short",
          })
        : "N/A";
    });

    const workerPayments = await WorkerPayment.find()
      .populate("tenantId", "firstName lastName _id")
      .populate("workerId", "firstName lastName _id")
      .sort({ createdAt: -1 })
      .lean();
    workerPayments.forEach((p) => {
      p.id = p._id.toString();
      p.paidByName = p.tenantId
        ? `${p.tenantId.firstName} ${p.tenantId.lastName}`
        : p.userName || "N/A";
      p.paidById = p.tenantId?._id?.toString();
      p.receivedByName = p.workerId
        ? `${p.workerId.firstName} ${p.workerId.lastName}`
        : "N/A";
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
        quarters: quarters.map((q) => q.name),
        newProperties,
        newTenants,
        newWorkers,
        newOwners,
        newServices,
        totalRevenue: quarterlyRevenue,
        userTypeDistribution,
        propertyStatusDistribution,
      },
    });
  } catch (err) {
    console.error("Error fetching admin dashboard data:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// PROTECTED ROUTE — Only logged-in admin can access
app.get("/api/admin/message/:id", protect, adminProtect, async (req, res) => {
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



// 404 handler (this will be logged as 404 in error log)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});

// ADD ERROR LOGGER HERE — after routes, before global error handler


// Your existing global error handler (also logs to console)
app.use((err, req, res, next) => {
  

  res.status(err.status || 500).json({
    success: false,
    error: "Internal Server Error"
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});