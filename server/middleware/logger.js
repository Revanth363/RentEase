// middleware/logger.js
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const rfs = require("rotating-file-stream");

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Rotating file stream - creates a new log file every day
const accessLogStream = rfs.createStream(
  (time, index) => {
    if (!time) return "access.log";
    const date = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `access-${year}-${month}-${day}.log`;
  },
  {
    interval: "1d", // Rotate daily
    path: logsDir,
  }
);

// Custom Morgan tokens for user info
morgan.token("username", (req) => {
  return req.session && req.session.user
    ? req.session.user.name || req.session.user.email || "anonymous"
    : "guest";
});

morgan.token("usertype", (req) => {
  return req.session && req.session.user
    ? req.session.user.role || req.session.user.userType || "none"
    : "none";
});

morgan.token("userid", (req) => {
  return req.session && req.session.user
    ? req.session.user._id || req.session.user.id || "-"
    : "-";
});

morgan.token("body", (req) => {
  // Only log body for non-sensitive routes (avoid logging passwords)
  if (
    req.originalUrl.includes("login") ||
    req.originalUrl.includes("register") ||
    req.originalUrl.includes("password")
  ) {
    return "[REDACTED]";
  }
  return JSON.stringify(req.body) || "-";
});

morgan.token("ip", (req) => {
  return (
    req.ip ||
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    "-"
  );
});

morgan.format(
  "timed",
  ":date[iso] | :method :url :status | :response-time ms | User: :username | Type: :usertype | ID: :userid | IP: :ip"
);

// File logger middleware
const fileLogger = morgan("timed", { stream: accessLogStream });



const logger = (req, res, next) => {
  fileLogger(req, res, (err) => {
    if (err) return next(err);
    next(); // no console logging
  });
};


module.exports = {
  logger,
  fileLogger,
  accessLogStream,
};