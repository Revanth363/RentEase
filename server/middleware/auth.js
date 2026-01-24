// server/middleware/auth.js
const { verifyToken } = require("../utils/jwt");

// Helper to extract and verify token (used by all middlewares)
const getVerifiedUser = (req) => {
  // Try cookie first, then Bearer token
  let token = req.cookies?.accessToken;
  
  if (!token) {
    // Check for Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Remove 'Bearer ' prefix
    }
  }

  if (!token) {
    throw new Error("No token provided");
  }

  try {
    const decoded = verifyToken(token);
    return decoded;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
};

// Base protection: any logged-in user
const protect = (req, res, next) => {
  try {
    const user = getVerifiedUser(req);
    console.log('[Auth] Token verified successfully for user:', user.id);
    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth] Token verification failed:', err.message);
    console.error('[Auth] Authorization header:', req.headers.authorization ? 'present' : 'missing');
    console.error('[Auth] AccessToken cookie:', req.cookies?.accessToken ? 'present' : 'missing');
    return res.status(401).json({
      success: false,
      error: err.message || "Unauthorized - please login"
    });
  }
};

// Admin or Superadmin protection
const adminProtect = (req, res, next) => {
  try {
    const user = getVerifiedUser(req);

    // Allow both "admin" and "superadmin"
    if (user.userType !== "admin" && user.userType !== "superadmin") {
      return res.status(403).json({
        success: false,
        error: "Forbidden - admin or superadmin access required"
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.message || "Unauthorized - please login"
    });
  }
};

// Superadmin-only protection (strict)
const superadminProtect = (req, res, next) => {
  try {
    const user = getVerifiedUser(req);

    if (user.userType !== "superadmin") {
      return res.status(403).json({
        success: false,
        error: "Forbidden - superadmin access only"
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.message || "Unauthorized - please login"
    });
  }
};

module.exports = {
  protect,           // any logged-in user
  adminProtect,      // admin OR superadmin
  superadminProtect  // only superadmin
};