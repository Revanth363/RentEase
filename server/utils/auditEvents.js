// server/utils/auditEvents.js
// Helper functions to log common audit events

const { getUserInfo, getClientIp } = require('../middleware/auditLogger');

// User Authentication Events
const logUserLogin = async (req, user) => {
  return req.audit({
    action: 'LOGIN',
    performedBy: getUserInfo({ user }),
    resource: {
      type: 'user',
      id: user._id,
      name: user.email || user.username,
    },
    description: `${user.role} logged in`,
    req,
    status: 'success',
  });
};

const logUserLogout = async (req, user) => {
  return req.audit({
    action: 'LOGOUT',
    performedBy: getUserInfo({ user }),
    resource: {
      type: 'user',
      id: user._id,
      name: user.email || user.username,
    },
    description: `${user.role} logged out`,
    req,
    status: 'success',
  });
};

const logPasswordChange = async (req, user) => {
  return req.audit({
    action: 'CHANGE_PASSWORD',
    performedBy: getUserInfo({ user }),
    resource: {
      type: 'user',
      id: user._id,
      name: user.email || user.username,
    },
    description: 'Password changed',
    req,
    status: 'success',
  });
};

// Property Events
const logPropertyCreate = async (req, property) => {
  return req.audit({
    action: 'CREATE_PROPERTY',
    performedBy: getUserInfo(req),
    resource: {
      type: 'property',
      id: property._id,
      name: property.name,
    },
    newData: property,
    description: `Property created: ${property.name}`,
    req,
    status: 'success',
  });
};

const logPropertyUpdate = async (req, oldProperty, newProperty) => {
  return req.audit({
    action: 'UPDATE_PROPERTY',
    performedBy: getUserInfo(req),
    resource: {
      type: 'property',
      id: newProperty._id,
      name: newProperty.name,
    },
    oldData: oldProperty,
    newData: newProperty,
    description: `Property updated: ${newProperty.name}`,
    req,
    status: 'success',
  });
};

const logPropertyDelete = async (req, property) => {
  return req.audit({
    action: 'DELETE_PROPERTY',
    performedBy: getUserInfo(req),
    resource: {
      type: 'property',
      id: property._id,
      name: property.name,
    },
    oldData: property,
    description: `Property deleted: ${property.name}`,
    req,
    status: 'success',
  });
};

// Booking Events
const logBookingCreate = async (req, booking) => {
  return req.audit({
    action: 'CREATE_BOOKING',
    performedBy: getUserInfo(req),
    resource: {
      type: 'booking',
      id: booking._id,
      name: `Booking ${booking._id}`,
    },
    newData: booking,
    description: `Booking created for property ${booking.property}`,
    req,
    status: 'success',
  });
};

const logBookingUpdate = async (req, oldBooking, newBooking) => {
  return req.audit({
    action: 'UPDATE_BOOKING',
    performedBy: getUserInfo(req),
    resource: {
      type: 'booking',
      id: newBooking._id,
      name: `Booking ${newBooking._id}`,
    },
    oldData: oldBooking,
    newData: newBooking,
    description: `Booking status updated to ${newBooking.status}`,
    req,
    status: 'success',
  });
};

const logBookingCancel = async (req, booking) => {
  return req.audit({
    action: 'CANCEL_BOOKING',
    performedBy: getUserInfo(req),
    resource: {
      type: 'booking',
      id: booking._id,
      name: `Booking ${booking._id}`,
    },
    oldData: booking,
    description: `Booking cancelled`,
    req,
    status: 'success',
  });
};

// User Management Events
const logUserCreate = async (req, user) => {
  return req.audit({
    action: 'CREATE_USER',
    performedBy: getUserInfo(req),
    resource: {
      type: 'user',
      id: user._id,
      name: user.email || user.username,
    },
    newData: user,
    description: `User created: ${user.email}`,
    req,
    status: 'success',
  });
};

const logUserUpdate = async (req, oldUser, newUser) => {
  return req.audit({
    action: 'UPDATE_USER',
    performedBy: getUserInfo(req),
    resource: {
      type: 'user',
      id: newUser._id,
      name: newUser.email || newUser.username,
    },
    oldData: oldUser,
    newData: newUser,
    description: `User updated: ${newUser.email}`,
    req,
    status: 'success',
  });
};

const logUserSuspend = async (req, user, reason) => {
  return req.audit({
    action: 'SUSPEND_USER',
    performedBy: getUserInfo(req),
    resource: {
      type: 'user',
      id: user._id,
      name: user.email || user.username,
    },
    description: `User suspended. Reason: ${reason || 'Not provided'}`,
    req,
    status: 'success',
  });
};

const logUserActivate = async (req, user) => {
  return req.audit({
    action: 'ACTIVATE_USER',
    performedBy: getUserInfo(req),
    resource: {
      type: 'user',
      id: user._id,
      name: user.email || user.username,
    },
    description: `User activated`,
    req,
    status: 'success',
  });
};

// Verification Events
const logUserVerify = async (req, user) => {
  return req.audit({
    action: 'VERIFY_USER',
    performedBy: getUserInfo(req),
    resource: {
      type: 'verification',
      id: user._id,
      name: user.email || user.username,
    },
    description: `User verified: ${user.email}`,
    req,
    status: 'success',
  });
};

const logVerificationReject = async (req, user, reason) => {
  return req.audit({
    action: 'REJECT_VERIFICATION',
    performedBy: getUserInfo(req),
    resource: {
      type: 'verification',
      id: user._id,
      name: user.email || user.username,
    },
    description: `Verification rejected. Reason: ${reason || 'Not provided'}`,
    req,
    status: 'success',
  });
};

// Payment Events
const logPaymentProcess = async (req, payment) => {
  return req.audit({
    action: 'PROCESS_PAYMENT',
    performedBy: getUserInfo(req),
    resource: {
      type: 'payment',
      id: payment._id,
      name: `Payment ${payment._id}`,
    },
    newData: payment,
    description: `Payment processed: ₹${payment.amount}`,
    req,
    status: 'success',
  });
};

const logPaymentRefund = async (req, payment, refundAmount) => {
  return req.audit({
    action: 'REFUND_PAYMENT',
    performedBy: getUserInfo(req),
    resource: {
      type: 'payment',
      id: payment._id,
      name: `Payment ${payment._id}`,
    },
    description: `Refund processed: ₹${refundAmount}`,
    req,
    status: 'success',
  });
};

// Complaint Events
const logComplaintCreate = async (req, complaint) => {
  return req.audit({
    action: 'CREATE_COMPLAINT',
    performedBy: getUserInfo(req),
    resource: {
      type: 'complaint',
      id: complaint._id,
      name: `Complaint ${complaint._id}`,
    },
    newData: complaint,
    description: `Complaint created`,
    req,
    status: 'success',
  });
};

const logComplaintResolve = async (req, complaint) => {
  return req.audit({
    action: 'RESOLVE_COMPLAINT',
    performedBy: getUserInfo(req),
    resource: {
      type: 'complaint',
      id: complaint._id,
      name: `Complaint ${complaint._id}`,
    },
    description: `Complaint resolved`,
    req,
    status: 'success',
  });
};

// Maintenance Events
const logMaintenanceCreate = async (req, request) => {
  return req.audit({
    action: 'CREATE_MAINTENANCE',
    performedBy: getUserInfo(req),
    resource: {
      type: 'maintenance',
      id: request._id,
      name: `Maintenance ${request._id}`,
    },
    newData: request,
    description: `Maintenance request created`,
    req,
    status: 'success',
  });
};

const logMaintenanceComplete = async (req, request) => {
  return req.audit({
    action: 'COMPLETE_MAINTENANCE',
    performedBy: getUserInfo(req),
    resource: {
      type: 'maintenance',
      id: request._id,
      name: `Maintenance ${request._id}`,
    },
    description: `Maintenance request completed`,
    req,
    status: 'success',
  });
};

// Admin Events
const logAdminRoleChange = async (req, admin, oldRole, newRole) => {
  return req.audit({
    action: 'ADMIN_ROLE_CHANGE',
    performedBy: getUserInfo(req),
    resource: {
      type: 'admin',
      id: admin._id,
      name: admin.email,
    },
    description: `Admin role changed from ${oldRole} to ${newRole}`,
    req,
    status: 'success',
  });
};

// Error logging
const logError = async (req, error, action) => {
  return req.audit({
    action: action || 'ERROR',
    performedBy: getUserInfo(req),
    resource: {
      type: 'system',
    },
    description: error.message,
    req,
    status: 'failed',
    errorMessage: error.message,
  });
};

module.exports = {
  // User Auth
  logUserLogin,
  logUserLogout,
  logPasswordChange,
  
  // Property
  logPropertyCreate,
  logPropertyUpdate,
  logPropertyDelete,
  
  // Booking
  logBookingCreate,
  logBookingUpdate,
  logBookingCancel,
  
  // User Management
  logUserCreate,
  logUserUpdate,
  logUserSuspend,
  logUserActivate,
  
  // Verification
  logUserVerify,
  logVerificationReject,
  
  // Payment
  logPaymentProcess,
  logPaymentRefund,
  
  // Complaints
  logComplaintCreate,
  logComplaintResolve,
  
  // Maintenance
  logMaintenanceCreate,
  logMaintenanceComplete,
  
  // Admin
  logAdminRoleChange,
  
  // Error
  logError,
};
