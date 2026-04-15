const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    // Action details
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGOUT',
        'CREATE_PROPERTY',
        'UPDATE_PROPERTY',
        'DELETE_PROPERTY',
        'CREATE_BOOKING',
        'UPDATE_BOOKING',
        'CANCEL_BOOKING',
        'CREATE_USER',
        'UPDATE_USER',
        'DELETE_USER',
        'SUSPEND_USER',
        'ACTIVATE_USER',
        'VERIFY_USER',
        'REJECT_VERIFICATION',
        'PROCESS_PAYMENT',
        'REFUND_PAYMENT',
        'CREATE_COMPLAINT',
        'UPDATE_COMPLAINT',
        'RESOLVE_COMPLAINT',
        'CREATE_MAINTENANCE',
        'UPDATE_MAINTENANCE',
        'COMPLETE_MAINTENANCE',
        'CHANGE_PASSWORD',
        'UPDATE_PROFILE',
        'APPROVE_RENT_REQUEST',
        'REJECT_RENT_REQUEST',
        'APPROVE_UNRENT_REQUEST',
        'REJECT_UNRENT_REQUEST',
        'SYSTEM_SETTING_CHANGE',
        'ADMIN_ROLE_CHANGE',
        'NOTIFICATION_SENT',
      ],
      index: true,
    },

    // User who performed the action
    performedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      name: String,
      email: String,
      role: {
        type: String,
        enum: ['admin', 'superadmin', 'owner', 'tenant', 'worker'],
      },
    },

    // Resource being acted upon
    resource: {
      type: {
        type: String,
        enum: [
          'user',
          'property',
          'booking',
          'payment',
          'complaint',
          'maintenance',
          'verification',
          'admin',
          'system',
        ],
        index: true,
      },
      id: mongoose.Schema.Types.ObjectId,
      name: String,
    },

    // Data changes
    oldData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,

    // Request details
    ipAddress: String,
    userAgent: String,
    statusCode: Number,

    // Additional context
    description: String,
    changes: [
      {
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
      },
    ],

    // Metadata
    metadata: {
      browser: String,
      os: String,
      device: String,
      location: String,
    },

    // Status of operation
    status: {
      type: String,
      enum: ['success', 'failed', 'partial'],
      default: 'success',
    },
    errorMessage: String,

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for efficient querying
auditLogSchema.index({ 'performedBy.userId': 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ 'resource.type': 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

// TTL index to auto-delete logs after 90 days (configurable)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('AuditLog', auditLogSchema);
