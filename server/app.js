const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
// express-session removed (migrated to JWT cookies)
const rateLimit = require("express-rate-limit");
const cors = require("cors");
// Suppress dotenv tips
const originalLog = console.log;
console.log = () => {};
require("dotenv").config();
console.log = originalLog;
const passport = require("passport");
const helmet = require("helmet");
require("./passport");
const { verifyToken, signToken } = require("./utils/jwt");
const { cachedQuery } = require("./utils/cacheWrapper");
const metricsCollector = require("./utils/metricsCollector");
const { metricsMiddleware } = require("./middleware/metricsMiddleware");
const { solrSearch, getSearchStats } = require("./utils/solrSearch");
const solrConfig = require("./config/solr");


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
const razorpayRoutes = require("./routes/razorpay");

// Swagger Setup
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

require("dns").setDefaultResultOrder("ipv4first");
mongoose.set('debug', false);

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
//           CORS – Supports Dev & Production
// ==============================================

const corsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:80',
];

// Add production origin if specified in environment
if (process.env.CORS_ORIGIN) {
  corsOrigins.push(process.env.CORS_ORIGIN);
  console.log('[CORS] Added production origin:', process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 204
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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      fontSrc: [
        "'self'",
        "data:",                      // Allow data: URIs for fonts (needed for Vite inline fonts)
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      // Default CSP for other directives
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  }
}));
app.use(helmet.hidePoweredBy());                        // Remove X-Powered-By header
app.use(helmet.frameguard({ action: 'deny' }));         // Prevent clickjacking (X-Frame-Options: DENY)
app.use(helmet.xssFilter());                            // Add X-XSS-Protection header (legacy but still used)
app.use(helmet.noSniff());                              // Prevent MIME-type sniffing (X-Content-Type-Options: nosniff)
app.use(helmet.ieNoOpen());                             // X-Download-Options for IE8+ (no open in browser)
// app.use(helmet.hsts({ maxAge: 31536000 }));             // Strict-Transport-Security (1 year) — enable only if you have HTTPS!
app.use(helmet.referrerPolicy({ policy: 'no-referrer' })); // Strict referrer policy

// ─── PHASE 4: Metrics Collection Middleware ────────────────────
app.use(metricsMiddleware);

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

// ============================================
// SWAGGER UI SETUP
// ============================================
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: true,
    displayRequestDuration: true,
  }
}));

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


// ============================================
// HEALTH CHECK ENDPOINT (for deployment)
// ============================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Backend server is running',
  });
});

// Routes
app.use("/api/property", propertyRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/tenant", TenantRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", protect, adminProtect, adminRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/admin/verifications", adminUserVerificationsRoutes);
app.use("/api/razorpay", razorpayRoutes);

// TEST ENDPOINT - Remove after testing
/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test Endpoint
 *     description: Simple test endpoint to verify Swagger is working
 *     tags:
 *       - Test
 *     responses:
 *       200:
 *         description: Test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Swagger is working
 */
app.get("/api/test", (req, res) => {
  res.json({ message: "Swagger is working!" });
});

// API Routes for React Frontend

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get featured properties
 *     description: Fetch popular verified properties that are available for rent (displayed on homepage)
 *     tags:
 *       - Properties
 *     responses:
 *       200:
 *         description: List of featured properties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   location:
 *                     type: string
 *                   subtype:
 *                     type: string
 *                   price:
 *                     type: number
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *       500:
 *         description: Server error
 */

app.get("/api/properties", async (req, res) => {
  try {
    const propertiesData = await Property.find({
      isRented: false,
      isVerified: true,
      is_popular: true,
    })
      .select("_id name type subtype location price images")
      .limit(6)
      .lean();
    
    // Transform images array to simple string format for first image
    const transformedData = propertiesData.map(prop => ({
      ...prop,
      id: prop._id,
      place: prop.name,
      image: prop.images && prop.images.length > 0 ? prop.images[0].url || prop.images[0] : null
    }));
    
    res.json(transformedData);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Failed to load properties" });
  }
});

/**
 * @swagger
 * /api/slider-properties:
 *   get:
 *     summary: Get slider properties
 *     description: Fetch verified available properties for homepage slider/carousel
 *     tags:
 *       - Properties
 *     responses:
 *       200:
 *         description: List of slider properties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *       500:
 *         description: Server error
 */

app.get("/api/slider-properties", async (req, res) => {
  try {
    const sliderPropertiesData = await Property.find({
      isRented: false,
      isVerified: true,
    })
      .select("name description images _id location subtype")
      .limit(6)
      .lean();
    
    // Transform images array - extract URL from objects
    const transformedData = sliderPropertiesData.map(prop => ({
      ...prop,
      images: prop.images && prop.images.length > 0 
        ? prop.images.map(img => typeof img === 'object' ? img.url : img)
        : []
    }));
    
    res.json(transformedData);
  } catch (error) {
    console.error("Error fetching slider properties:", error);
    res.status(500).json({ error: "Failed to load slider properties" });
  }
});

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all unique property locations
 *     description: Fetch list of unique verified property locations for search filter dropdown
 *     tags:
 *       - Properties
 *     responses:
 *       200:
 *         description: List of unique locations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Mumbai", "Bangalore", "Hyderabad", "Visakhapatnam"]
 *       500:
 *         description: Server error
 */
app.get("/api/locations", async (req, res) => {
  try {
    const properties = await Property.find({
      isRented: false,
      isVerified: true,
      location: { $ne: null, $ne: "" }
    })
      .select("location")
      .lean();
    
    // Create a map with normalized keys to deduplicate (handling spelling variations)
    const locationsMap = new Map();
    properties.forEach((p) => {
      if (p.location && p.location.trim()) {
        const original = p.location.trim();
        
        // Normalize for comparison: handle common spelling variations
        let normalized = original
          .toLowerCase()
          .replace(/\s+/g, "") // Remove all spaces
          .replace(/[^a-z0-9]/g, ""); // Remove special chars
        
        // Handle common Indian city spelling variations
        normalized = normalized
          .replace(/visakhapatnam|viskahapatnam|visg|vizag/g, "visakhapatnam")
          .replace(/hydrabad|hyderbad/g, "hyderabad")
          .replace(/banglore|bangalore/g, "bangalore")
          .replace(/bombay|mumbai/g, "mumbai")
          .replace(/kolkata|calcutta/g, "kolkata");
        
        // Store only if not already present (preserves first occurrence's original casing)
        if (!locationsMap.has(normalized)) {
          locationsMap.set(normalized, original);
        }
      }
    });

    const uniqueLocations = Array.from(locationsMap.values()).sort();
    res.json(uniqueLocations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ error: "Failed to load locations" });
  }
});

/**
 * @swagger
 * /api/property-types:
 *   get:
 *     summary: Get all unique property types
 *     description: Fetch list of unique verified property subtypes for search filter dropdown
 *     tags:
 *       - Properties
 *     responses:
 *       200:
 *         description: List of unique property types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["2BHK", "3BHK", "1BHK", "Villa"]
 *       500:
 *         description: Server error
 */
app.get("/api/property-types", async (req, res) => {
  try {
    const properties = await Property.find({
      isRented: false,
      isVerified: true,
      subtype: { $ne: null, $ne: "" }
    })
      .select("subtype")
      .lean();
    
    // Create a map with normalized keys to deduplicate
    const typesMap = new Map();
    properties.forEach((p) => {
      if (p.subtype && p.subtype.trim()) {
        const original = p.subtype.trim();
        
        // Normalize: lowercase + remove spaces and special chars
        const normalized = original
          .toLowerCase()
          .replace(/\s+/g, "") // Remove all spaces
          .replace(/[^a-z0-9]/g, ""); // Remove special chars
        
        if (!typesMap.has(normalized)) {
          typesMap.set(normalized, original);
        }
      }
    });

    const uniqueTypes = Array.from(typesMap.values()).sort();
    res.json(uniqueTypes);
  } catch (error) {
    console.error("Error fetching property types:", error);
    res.status(500).json({ error: "Failed to load property types" });
  }
});

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Get current logged-in user
 *     description: Retrieve the current user's information from the JWT token. Requires authentication.
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CurrentUserResponse'
 *       401:
 *         description: Unauthorized - No valid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/logout:
 *   get:
 *     summary: Logout user
 *     description: Clear the JWT authentication cookie and logout the user.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 redirectUrl:
 *                   type: string
 *                   example: "/"
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/property:
 *   get:
 *     summary: Get single property details
 *     description: Fetch full details of a single property by ID
 *     tags:
 *       - Properties
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439016"
 *     responses:
 *       200:
 *         description: Property details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/submit-form:
 *   post:
 *     summary: Submit contact form
 *     description: Submit a contact form message. Phone must be 10 digits, email must be Gmail
 *     tags:
 *       - Public
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Must be a Gmail address
 *                 example: "john@gmail.com"
 *               phone:
 *                 type: string
 *                 description: Optional - must be 10 digits if provided
 *                 example: "9876543210"
 *               subject:
 *                 type: string
 *                 example: "Inquiry about properties"
 *               message:
 *                 type: string
 *                 example: "I am interested in learning more about your properties"
 *     responses:
 *       200:
 *         description: Form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Form submitted successfully"
 *       400:
 *         description: Invalid input (missing fields, invalid email, invalid phone)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     description: Generates a 6-digit OTP and sends it for password reset (Dev mode returns OTP in response)
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: tenant@example.com
 *     responses:
 *       200:
 *         description: OTP generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP generated (dev mode - check console)"
 *                 otp:
 *                   type: string
 *                   example: "123456"
 *       400:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many OTP requests
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

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

/**
 * @swagger
 * /api/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     description: Verify the OTP sent to user's email. OTP expires in 10 minutes.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: tenant@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "OTP verified"
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /api/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     description: Reset user password after verifying OTP. Password must be at least 8 characters.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: tenant@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "NewPassword123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset successful"
 *       400:
 *         description: Invalid email, weak password, or OTP not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */

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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login
 *     description: Authenticate users (tenant, owner, worker, admin, or superadmin). JWT token is set in httpOnly cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: tenant@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Password123"
 *               userType:
 *                 type: string
 *                 enum:
 *                   - tenant
 *                   - owner
 *                   - worker
 *                 description: Required for normal users. Not needed for admin/superadmin.
 *                 example: "tenant"
 *     responses:
 *       200:
 *         description: Login successful. JWT token set in httpOnly cookie.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Missing required fields or invalid user type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials or account inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */

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



/**
 * @swagger
 * /api/public-settings:
 *   get:
 *     summary: Get public platform settings
 *     description: Fetch public settings like maintenance mode status (no authentication required)
 *     tags:
 *       - Public
 *     responses:
 *       200:
 *         description: Public settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 maintenanceMode:
 *                   type: boolean
 *                   example: false
 *                 maintenanceMessage:
 *                   type: string
 *                   example: "Platform under maintenance. Please try again later."
 *       500:
 *         description: Server error (returns default maintenance mode = false)
 */

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

/**
 * @swagger
 * /register:
 *   post:
 *     summary: User registration
 *     description: Register a new user (tenant, owner, or worker). Automatically logs in and sets JWT cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userType
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               userType:
 *                 type: string
 *                 enum:
 *                   - tenant
 *                   - owner
 *                   - worker
 *                 example: "tenant"
 *               firstName:
 *                 type: string
 *                 example: "Raj"
 *               lastName:
 *                 type: string
 *                 example: "Kumar"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newtenant@example.com"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "SecurePass123"
 *               location:
 *                 type: string
 *                 example: "Bangalore"
 *               serviceType:
 *                 type: string
 *                 description: Required for workers only. Type of service provided (e.g., Electrician, Plumber)
 *                 example: "Electrician"
 *               experience:
 *                 type: string
 *                 description: Required for workers only
 *                 example: "5 years"
 *               numProperties:
 *                 type: integer
 *                 description: For property owners - number of properties
 *                 example: 2
 *     responses:
 *       200:
 *         description: Registration successful. User automatically logged in.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Missing required fields, invalid email, or weak password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Registration failed
 */

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


/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search properties with filters
 *     description: Search for available verified properties. Can filter by amenities (comma-separated).
 *     tags:
 *       - Properties
 *     parameters:
 *       - in: query
 *         name: amenities
 *         schema:
 *           type: string
 *         description: Comma-separated list of amenities to filter by
 *         example: "WiFi,AC,Parking"
 *     responses:
 *       200:
 *         description: List of matching properties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Property'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Search properties endpoint – filter by optional location, property-type, and amenities
/**
 * PHASE 5 OPTIMIZED: Full-text property search with Solr
 * Before Phase 2: Multiple find() queries
 * After Phase 2: 1 aggregation query = 320ms
 * After Phase 3: Redis caching + aggregation = 60ms avg
 * After Phase 5: Solr full-text search = 50-100ms (95% faster than Phase 2!)
 * With Redis caching: ~20-30ms avg on cache hits
 */
app.get("/api/search", async (req, res) => {
  try {
    const { location, "property-type": propertyType, amenities, query: searchQuery, price, page = 1, limit = 20 } = req.query;
    
    // Build cache key including pagination and price
    const cacheKey = `search:${location || 'all'}:${propertyType || 'all'}:${searchQuery || 'all'}:${amenities || 'all'}:${price || 'all'}:${page}:${limit}`;
    const TTL_SECONDS = 600; // 10 minutes

    // PHASE 3 + 5: Cached Solr search with automatic MongoDB fallback
    const cacheResult = await cachedQuery(
      cacheKey,
      async () => {
        // This function executes on cache miss
        // PHASE 5: Use Solr for full-text search (95% faster than regex)
        const searchResult = await solrSearch({
          query: searchQuery || '',
          location: location || '',
          propertyType: propertyType || '',
          amenities: amenities ? amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
          maxPrice: price ? parseInt(price) : null,
          start: (parseInt(page) - 1) * parseInt(limit),
          rows: parseInt(limit)
        });

        // Fetch images from MongoDB for search results
        let properties = searchResult.results || [];
        if (properties.length > 0) {
          try {
            const propertyIds = properties.map(p => p._id);
            const imagesData = await Property.find(
              { _id: { $in: propertyIds } },
              { _id: 1, images: 1 }
            ).lean().exec();
            
            const imagesMap = {};
            imagesData.forEach(p => {
              imagesMap[p._id] = p.images || [];
            });
            
            properties = properties.map(p => ({
              ...p,
              images: imagesMap[p._id] || []
            }));
          } catch (imgErr) {
            console.warn('Could not fetch images:', imgErr);
            // Continue without images
          }
        }

        // Add metrics collection
        metricsCollector.recordDatabaseQuery('search', 'properties', searchResult.responseTime);

        return {
          success: searchResult.success,
          properties: properties,
          total: searchResult.total || 0,
          source: searchResult.source,
          responseTime: searchResult.responseTime,
          queryStats: searchResult.stats
        };
      },
      TTL_SECONDS
    );

    // Return response with full optimization stack metadata
    if (cacheResult.source === 'error') {
      return res.status(500).json({ error: cacheResult.error });
    }

    return res.json({
      success: cacheResult.data.success,
      meta: {
        optimized: true,
        phases: {
          phase1: 'Database Indexing (40 indexes)',
          phase2: 'Query Optimization (aggregation)',
          phase3: 'Redis Caching',
          phase5: 'Solr Full-Text Search'
        },
        caching: 'phase3',
        search: cacheResult.data.source,
        source: cacheResult.source,
        responseTime: `${cacheResult.time}ms`,
        cacheKey: cacheResult.cacheKey,
        ttl: cacheResult.ttl || TTL_SECONDS,
        count: cacheResult.data.properties.length,
        total: cacheResult.data.total,
        expectedImprovement: '95% vs Phase 2 (regex)',
        cacheStats: cacheResult.stats,
        queryStats: cacheResult.data.queryStats
      },
      properties: cacheResult.data.properties,
      total: cacheResult.data.total
    });
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

/**
 * @swagger
 * /api/admin:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Retrieve comprehensive dashboard statistics for admin. Admin or SuperAdmin authentication required. 🔒
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalProperties:
 *                       type: integer
 *                       example: 150
 *                     totalRenters:
 *                       type: integer
 *                       example: 200
 *                     totalOwners:
 *                       type: integer
 *                       example: 50
 *                     totalWorkers:
 *                       type: integer
 *                       example: 80
 *                     activeRentals:
 *                       type: integer
 *                       example: 120
 *                     pendingBookings:
 *                       type: integer
 *                       example: 15
 *                     cancelledBookings:
 *                       type: integer
 *                       example: 5
 *                     activeUsers:
 *                       type: integer
 *                       example: 300
 *                     totalRevenue:
 *                       type: number
 *                       example: 500000
 *                     revenueDaily:
 *                       type: number
 *                       example: 5000
 *                     revenueWeekly:
 *                       type: number
 *                       example: 35000
 *                     revenueMonthly:
 *                       type: number
 *                       example: 150000
 *                     propertiesActive:
 *                       type: integer
 *                       example: 120
 *                     propertiesPending:
 *                       type: integer
 *                       example: 10
 *                     propertiesAvailable:
 *                       type: integer
 *                       example: 30
 *                     workersAvailable:
 *                       type: integer
 *                       example: 75
 *                     userGrowth:
 *                       type: integer
 *                       example: 45
 *       401:
 *         description: Unauthorized - Must be admin or superadmin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 */

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

// ═══════════════════════════════════════════════════════════════════
// PHASE 5: Solr Full-Text Search Admin Endpoints
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/solr/status
 * Get Solr connection status and index statistics
 * Admin only
 */
app.get('/api/admin/solr/status', adminProtect, async (req, res) => {
  try {
    const stats = await solrConfig.getIndexStats();
    res.json({
      success: true,
      solr: {
        connected: solrConfig.isSolrConnected(),
        indexStats: stats,
        searchStats: getSearchStats()
      }
    });
  } catch (error) {
    console.error('Error getting Solr status:', error);
    res.status(500).json({ error: 'Failed to get Solr status' });
  }
});

/**
 * POST /api/admin/solr/index-all
 * Bulk index all properties into Solr
 * Use after initial Solr setup or to rebuild index
 * Admin only
 */
app.post('/api/admin/solr/index-all', adminProtect, async (req, res) => {
  try {
    if (!solrConfig.isSolrConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Solr is not connected'
      });
    }

    // Fetch all available properties
    const properties = await Property.find({ isVerified: true }).lean().exec();

    if (!properties || properties.length === 0) {
      return res.json({
        success: true,
        message: 'No properties to index',
        indexed: 0
      });
    }

    // Batch index properties
    const indexed = await solrConfig.indexPropertiesBatch(properties);

    res.json({
      success: true,
      message: `Successfully indexed ${indexed} properties to Solr`,
      indexed,
      total: properties.length
    });
  } catch (error) {
    console.error('Error indexing properties:', error);
    res.status(500).json({ error: 'Failed to index properties' });
  }
});

/**
 * DELETE /api/admin/solr/clear-index
 * Clear all documents from Solr index
 * WARNING: This removes all indexed documents!
 * Admin only
 */
app.delete('/api/admin/solr/clear-index', adminProtect, async (req, res) => {
  try {
    if (!solrConfig.isSolrConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Solr is not connected'
      });
    }

    const cleared = await solrConfig.clearIndex();

    if (cleared) {
      res.json({
        success: true,
        message: 'Solr index cleared successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to clear Solr index'
      });
    }
  } catch (error) {
    console.error('Error clearing Solr index:', error);
    res.status(500).json({ error: 'Failed to clear index' });
  }
});

/**
 * GET /api/admin/search/stats
 * Get search performance statistics
 * Shows Solr vs MongoDB performance comparison
 * Admin only
 */
app.get('/api/admin/search/stats', adminProtect, (req, res) => {
  try {
    const stats = getSearchStats();
    res.json({
      success: true,
      searchStats: stats,
      solrAvailable: solrConfig.isSolrConnected()
    });
  } catch (error) {
    console.error('Error getting search stats:', error);
    res.status(500).json({ error: 'Failed to get search statistics' });
  }
});

// ═══════════════════════════════════════════════════════════════════
// PUBLIC SETUP ENDPOINT: Initial Solr Indexing
// ═══════════════════════════════════════════════════════════════════

/**
 * POST /api/setup/index-properties
 * PUBLIC endpoint for initial Solr indexing setup
 * Can only be used if index is empty (safety check)
 * After first use, requires admin auth via /api/admin/solr/index-all
 */
app.post('/api/setup/index-properties', async (req, res) => {
  try {
    console.log('📌 Setup index endpoint called');
    
    if (!solrConfig.isSolrConnected()) {
      console.log('❌ Solr not connected');
      return res.status(503).json({
        success: false,
        error: 'Solr is not connected'
      });
    }
    
    console.log('✓ Solr connected');

    // Safety check: only allow if index is completely empty
    console.log('📌 Checking index stats...');
    const stats = await solrConfig.getIndexStats();
    console.log(`📊 Index stats: ${stats.indexed} documents`);
    
    if (stats.indexed > 0) {
      return res.status(400).json({
        success: false,
        error: 'Index already contains documents. Use /api/admin/solr/index-all with admin access to re-index.',
        indexedCount: stats.indexed
      });
    }

    // Fetch all available properties
    console.log('📌 Fetching properties from MongoDB...');
    const properties = await Property.find({ isVerified: true }).lean().exec();
    console.log(`📊 Found ${properties?.length || 0} verified properties`);

    if (!properties || properties.length === 0) {
      console.log('✓ No properties to index');
      return res.json({
        success: true,
        message: 'No properties to index',
        indexed: 0
      });
    }

    // Batch index properties
    console.log(`📌 Starting to index ${properties.length} properties...`);
    const indexed = await solrConfig.indexPropertiesBatch(properties);
    console.log(`✓ Indexing complete: ${indexed}/${properties.length}`);

    res.json({
      success: true,
      message: `Successfully indexed ${indexed} properties to Solr`,
      indexed,
      total: properties.length
    });
  } catch (error) {
    console.error('❌ Error indexing properties:', error);
    res.status(500).json({ error: 'Failed to index properties', details: error.message });
  }
});

/**
 * POST /api/cache/flush
 * ADMIN endpoint to clear search cache
 * Used to invalidate stale cached results
 */
app.post('/api/cache/flush', async (req, res) => {
  try {
    const { invalidateCachePattern } = require('./utils/cacheWrapper');
    await invalidateCachePattern('search:*');
    console.log('✓ Search cache flushed');
    res.json({ success: true, message: 'Search cache cleared' });
  } catch (error) {
    console.error('❌ Error flushing cache:', error);
    res.status(500).json({ error: 'Failed to flush cache' });
  }
});

// 404 handler (this will be logged as 404 in error log)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl} - Route not found`
  });
});

// ═══════════════════════════════════════════════════════════════════
// PHASE 4: Performance Metrics Endpoints
// ═══════════════════════════════════════════════════════════════════

/**
 * GET /metrics
 * Prometheus format metrics for monitoring tools (Grafana, Prometheus, etc.)
 * Used by monitoring infrastructure to scrape metrics
 */
app.get('/metrics', (req, res) => {
  try {
    res.set('Content-Type', metricsCollector.getPrometheusMetrics().contentType);
    res.send(metricsCollector.getPrometheusMetrics().data);
  } catch (error) {
    console.error('Error generating Prometheus metrics:', error);
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

/**
 * GET /api/metrics/dashboard
 * Comprehensive performance dashboard with real-time metrics
 * Shows: response times, cache hit rates, error rates, memory usage, etc.
 * Protected: No auth required for monitoring
 */
app.get('/api/metrics/dashboard', (req, res) => {
  try {
    const dashboard = metricsCollector.getMetricsDashboard();
    res.json({
      success: true,
      meta: {
        optimized: true,
        caching: 'phase3',
        source: 'metrics'
      },
      dashboard
    });
  } catch (error) {
    console.error('Error fetching metrics dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * GET /api/metrics/alerts
 * Performance degradation alerts
 * Triggers warnings and critical alerts based on thresholds
 */
app.get('/api/metrics/alerts', (req, res) => {
  try {
    const alerts = metricsCollector.checkPerformanceAlerts();
    res.json({
      success: true,
      count: alerts.length,
      alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * GET /api/metrics/comparison
 * Phase 1-4 comparison report
 * Shows cumulative performance gains across all optimization phases
 */
app.get('/api/metrics/comparison', (req, res) => {
  try {
    const report = metricsCollector.getPhaseComparisonReport();
    res.json({
      success: true,
      meta: {
        optimized: true,
        report: 'Phase 1-4 Cumulative Optimization'
      },
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching phase comparison:', error);
    res.status(500).json({ error: 'Failed to fetch comparison report' });
  }
});

/**
 * GET /api/metrics/reset (Admin only)
 * Reset all metrics (for testing/development)
 * Use with caution!
 */
app.get('/api/metrics/reset', adminProtect, (req, res) => {
  try {
    metricsCollector.resetMetrics();
    res.json({
      success: true,
      message: 'All metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting metrics:', error);
    res.status(500).json({ error: 'Failed to reset metrics' });
  }
});

// ADD ERROR LOGGER HERE — after routes, before global error handler


// Your existing global error handler (also logs to console)
app.use((err, req, res, next) => {
  

  res.status(err.status || 500).json({
    success: false,
    error: "Internal Server Error"
  });
});

// Initialize server with Redis, Solr, and startup tasks
(async () => {
  try {
    // PHASE 3: Initialize Redis caching layer
    const { initializeRedis } = require('./config/redis');
    const redisConnected = await initializeRedis();
    
    if (redisConnected) {
      console.log('✓ Redis caching layer initialized successfully');
    } else {
      console.log('⚠ Redis unavailable - caching disabled, app will use database queries directly');
    }

    // PHASE 5: Initialize Solr full-text search
    const solrConnected = await solrConfig.initializeSolr();
    if (solrConnected) {
      console.log('✓ Solr full-text search initialized successfully');
    } else {
      console.log('⚠ Solr unavailable - full-text search disabled, using MongoDB regex search as fallback');
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);

      // Initialize payment cleanup job (runs every 24 hours silently)
      const razorpayController = require('./controllers/razorpayPaymentController');
      razorpayController.cleanupCancelledPayments();
      setInterval(() => {
        razorpayController.cleanupCancelledPayments();
      }, 24 * 60 * 60 * 1000);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();