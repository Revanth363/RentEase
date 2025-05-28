// middleware/errorLogger.js
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const rfs = require("rotating-file-stream");

// logs directory
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Daily rotating error log
const errorLogStream = rfs.createStream(
  (time) => {
    if (!time) return "error.log";
    const date = new Date(time);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `error-${y}-${m}-${d}.log`;
  },
  {
    interval: "1d",
    path: logsDir,
    compress: "gzip",
  }
);

// Custom format for errors
morgan.format("error", (tokens, req, res) => {
  if (res.statusCode < 400) return null;

  const user = req.user
    ? `${req.user.email || "unknown"} (${req.user.userType || "none"}, ID: ${req.user.id || "-"})`
    : "guest";

  let body = "-";
  if (req.body && Object.keys(req.body).length) {
    const safe = { ...req.body };
    ["password", "token", "newPassword", "currentPassword"].forEach(k => {
      if (safe[k]) safe[k] = "[REDACTED]";
    });
    body = JSON.stringify(safe);
  }

  return [
    new Date().toISOString(),
    res.statusCode,
    tokens.method(req, res),
    tokens.url(req, res),
    `${tokens["response-time"](req, res)}ms`,
    `User: ${user}`,
    `IP: ${tokens.ip(req, res)}`,
    `Body: ${body}`,
    `Msg: ${res.locals.errorMessage || "No error message"}`
  ].join(" | ");
});

// Middleware
const errorLogger = (req, res, next) => {
  // capture error message from res.json
  const originalJson = res.json;
  res.json = function (data) {
    if (res.statusCode >= 400 && data?.error) {
      res.locals.errorMessage = data.error;
    }
    return originalJson.apply(this, arguments);
  };

  morgan("error", {
    stream: errorLogStream,
    skip: (req, res) => res.statusCode < 400,
  })(req, res, next);
};

module.exports = errorLogger;
