// server/middleware/auth.js
const { verifyToken } = require("../utils/jwt");

function protect(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function adminProtect(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = verifyToken(token);
    if (decoded.userType !== "admin") {
      return res.status(403).json({ error: "Forbidden - admin only" });
    }
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = {
  protect,
  adminProtect
};