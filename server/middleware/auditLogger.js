const AuditLog = require('../models/AuditLog');

// Helper to extract user info from request
const getUserInfo = (req) => {
  if (!req.user) {
    return {
      userId: null,
      name: 'System',
      email: 'system@admin.com',
      role: 'system',
    };
  }

  return {
    userId: req.user._id || req.user.id,
    name: req.user.firstName ? `${req.user.firstName} ${req.user.lastName || ''}` : req.user.username,
    email: req.user.email,
    role: req.user.role,
  };
};

// Helper to parse user agent (simple implementation without ua-parser-js)
const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'desktop';

  // Simple browser detection
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  // Simple OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) { os = 'Android'; device = 'mobile'; }
  else if (ua.includes('iPhone') || ua.includes('iPad')) { os = 'iOS'; device = ua.includes('iPhone') ? 'mobile' : 'tablet'; }

  return { browser, os, device };
};

// Helper to get client IP
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'Unknown'
  );
};

// Main audit logging function
const logAudit = async ({
  action,
  performedBy,
  resource,
  oldData,
  newData,
  description,
  changes,
  req,
  status = 'success',
  errorMessage,
}) => {
  try {
    const userAgent = req?.headers['user-agent'] || '';
    const metadata = parseUserAgent(userAgent);

    // Calculate changes if not provided
    let calculatedChanges = changes || [];
    if (oldData && newData && !changes) {
      calculatedChanges = calculateChanges(oldData, newData);
    }

    const auditLog = new AuditLog({
      action,
      performedBy,
      resource,
      oldData,
      newData,
      description,
      changes: calculatedChanges,
      ipAddress: getClientIp(req),
      userAgent,
      metadata,
      status,
      errorMessage,
      timestamp: new Date(),
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging should never break the main operation
  }
};

// Helper to calculate what changed
const calculateChanges = (oldData, newData) => {
  const changes = [];

  if (!oldData) {
    // New record created
    Object.keys(newData || {}).forEach((key) => {
      if (newData[key] !== undefined && newData[key] !== null && key !== '_id') {
        changes.push({
          field: key,
          oldValue: undefined,
          newValue: newData[key],
        });
      }
    });
  } else {
    // Record updated
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

    allKeys.forEach((key) => {
      if (key === '_id' || key === 'createdAt' || key === '__v') return;

      const oldVal = oldData[key];
      const newVal = newData[key];

      // Convert to string for comparison (handle ObjectId, dates, etc.)
      const oldStr = JSON.stringify(oldVal);
      const newStr = JSON.stringify(newVal);

      if (oldStr !== newStr) {
        changes.push({
          field: key,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    });
  }

  return changes;
};

// Middleware to attach audit logging to request
const attachAuditLogger = (req, res, next) => {
  req.audit = logAudit;
  next();
};

module.exports = {
  logAudit,
  attachAuditLogger,
  getUserInfo,
  getClientIp,
  calculateChanges,
  parseUserAgent,
};
