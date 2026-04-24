// server/controllers/superadminauditController.js
// Comprehensive audit logging system

const AuditLog = require('../models/AuditLog');

exports.getAuditLogs = async (req, res) => {
  try {
    const existingCount = await AuditLog.estimatedDocumentCount();

    if (existingCount === 0 && req.user?.id) {
      await AuditLog.create({
        action: 'LOGIN',
        performedBy: {
          userId: req.user.id,
          name: req.user.email || 'Super Admin',
          email: req.user.email,
          role: req.user.userType,
        },
        resource: {
          type: 'system',
          name: 'audit-bootstrap',
        },
        description: 'Audit logging initialized',
        status: 'success',
        timestamp: new Date(),
      });
    }

    const {
      action,
      userId,
      role,
      search,
      startDate,
      endDate,
      resourceType,
      status,
      limit = 50,
      skip = 0,
      sortBy = 'timestamp',
      sortOrder = '-1',
    } = req.query;

    // Build filter query
    const filter = {};

    // FIXED: Show only admin logins, filter out all other roles and actions
    filter.action = 'LOGIN';
    filter['performedBy.role'] = 'admin';

    // Use aggregation to get only the LAST login per admin
    const pipeline = [
      { $match: filter },
      // Sort by timestamp descending to get latest first
      { $sort: { timestamp: -1 } },
      // Group by userId and get the first (latest) login for each admin
      {
        $group: {
          _id: '$performedBy.userId',
          doc: { $first: '$$ROOT' },
        },
      },
      // Unwind to get back the document
      { $replaceRoot: { newRoot: '$doc' } },
      // Final sort by timestamp descending
      { $sort: { timestamp: -1 } },
    ];

    // Execute aggregation query
    const logs = await AuditLog.aggregate(pipeline).exec();

    // Get total count (number of unique admins)
    const total = logs.length;

    // Format response
    const formattedLogs = logs.map((log) => ({
      _id: log._id,
      action: log.action,
      performedBy: log.performedBy.name || 'Unknown',
      email: log.performedBy.email,
      role: log.performedBy.role,
      resource: log.resource,
      description: log.description,
      timestamp: log.timestamp,
      date: log.timestamp ? log.timestamp.toISOString() : null,
      ipAddress: log.ipAddress,
      status: log.status,
      errorMessage: log.errorMessage,
      changes: log.changes,
      oldData: log.oldData,
      newData: log.newData,
      metadata: log.metadata,
    }));

    res.status(200).json({
      success: true,
      logs: formattedLogs,
      pagination: {
        total,
        limit: total,
        skip: 0,
        pages: 1,
      },
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message,
    });
  }
};

// Get audit log statistics
exports.getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Get stats
    const stats = await AuditLog.aggregate([
      { $match: filter },
      {
        $facet: {
          byAction: [
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byRole: [
            { $group: { _id: '$performedBy.role', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byResource: [
            { $group: { _id: '$resource.type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          totalLogs: [{ $count: 'count' }],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0],
    });
  } catch (error) {
    console.error('Audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit statistics',
      error: error.message,
    });
  }
};

// Export audit logs to CSV (optional)
exports.exportAuditLogs = async (req, res) => {
  try {
    const { action, role, status, resourceType, search, startDate, endDate } = req.query;

    const filter = {};
    if (action && action !== 'all') filter.action = action.toUpperCase();
    if (role && role !== 'all') filter['performedBy.role'] = role;
    if (status && status !== 'all') filter.status = status;
    if (resourceType && resourceType !== 'all') filter['resource.type'] = resourceType;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { action: searchRegex },
        { 'performedBy.name': searchRegex },
        { 'performedBy.email': searchRegex },
        { 'resource.name': searchRegex },
        { description: searchRegex },
      ];
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).lean();

    // Convert to CSV format
    const csv = [
      ['Timestamp', 'Action', 'Performed By', 'Email', 'Role', 'Resource Type', 'Description', 'IP Address', 'Status'].join(','),
      ...logs.map((log) => [
        log.timestamp.toISOString(),
        log.action,
        `"${log.performedBy.name || 'Unknown'}"`,
        log.performedBy.email,
        log.performedBy.role,
        log.resource.type || 'N/A',
        `"${log.description || ''}"`,
        log.ipAddress,
        log.status,
      ].join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
      error: error.message,
    });
  }
};

// Create sample audit logs for testing
exports.createSampleAuditLogs = async (req, res) => {
  try {
    // First, delete existing logs to start fresh
    await AuditLog.deleteMany({});
    console.log('Cleared existing audit logs');

    const sampleLogs = [
      {
        action: 'LOGIN',
        performedBy: {
          userId: new (require('mongoose')).Types.ObjectId(),
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        },
        resource: {
          type: 'user',
          id: new (require('mongoose')).Types.ObjectId(),
          name: 'admin@example.com',
        },
        description: 'Admin logged in to dashboard',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        metadata: { browser: 'Chrome', os: 'Windows', device: 'desktop' },
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        action: 'CREATE_PROPERTY',
        performedBy: {
          userId: new (require('mongoose')).Types.ObjectId(),
          name: 'John Owner',
          email: 'owner@example.com',
          role: 'owner',
        },
        resource: {
          type: 'property',
          id: new (require('mongoose')).Types.ObjectId(),
          name: 'Luxury Apartment',
        },
        description: 'Property created: Luxury Apartment',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        metadata: { browser: 'Chrome', os: 'Windows', device: 'desktop' },
        timestamp: new Date(Date.now() - 1800000),
      },
      {
        action: 'CREATE_BOOKING',
        performedBy: {
          userId: new (require('mongoose')).Types.ObjectId(),
          name: 'Jane Tenant',
          email: 'tenant@example.com',
          role: 'tenant',
        },
        resource: {
          type: 'booking',
          id: new (require('mongoose')).Types.ObjectId(),
          name: 'Booking #001',
        },
        description: 'Booking created for Luxury Apartment',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        metadata: { browser: 'Safari', os: 'iOS', device: 'mobile' },
        timestamp: new Date(Date.now() - 900000),
      },
      {
        action: 'PROCESS_PAYMENT',
        performedBy: {
          userId: new (require('mongoose')).Types.ObjectId(),
          name: 'Jane Tenant',
          email: 'tenant@example.com',
          role: 'tenant',
        },
        resource: {
          type: 'payment',
          id: new (require('mongoose')).Types.ObjectId(),
          name: 'Payment-001',
        },
        description: 'Payment processed: ₹50,000',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        metadata: { browser: 'Safari', os: 'iOS', device: 'mobile' },
        timestamp: new Date(Date.now() - 300000),
      },
      {
        action: 'UPDATE_BOOKING',
        performedBy: {
          userId: new (require('mongoose')).Types.ObjectId(),
          name: 'Operation Executive',
          email: 'exec@example.com',
          role: 'admin',
        },
        resource: {
          type: 'booking',
          id: new (require('mongoose')).Types.ObjectId(),
          name: 'Booking #001',
        },
        description: 'Booking status updated to confirmed',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        metadata: { browser: 'Chrome', os: 'Windows', device: 'desktop' },
        timestamp: new Date(Date.now() - 100000),
      },
      {
        action: 'VERIFY_USER',
        performedBy: {
          userId: new (require('mongoose')).Types.ObjectId(),
          name: 'Super Admin',
          email: 'superadmin@example.com',
          role: 'superadmin',
        },
        resource: {
          type: 'verification',
          id: new (require('mongoose')).Types.ObjectId(),
          name: 'john@example.com',
        },
        description: 'User verified: john@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        metadata: { browser: 'Chrome', os: 'Windows', device: 'desktop' },
        timestamp: new Date(Date.now() - 50000),
      },
      {
        action: 'RESOLVE_COMPLAINT',
        performedBy: {
          userId: new (require('mongoose')).Types.ObjectId(),
          name: 'Operation Executive',
          email: 'exec@example.com',
          role: 'admin',
        },
        resource: {
          type: 'complaint',
          id: new (require('mongoose')).Types.ObjectId(),
          name: 'Complaint-001',
        },
        description: 'Complaint resolved: Water leakage issue',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        metadata: { browser: 'Chrome', os: 'Windows', device: 'desktop' },
        timestamp: new Date(Date.now() - 10000),
      },
    ];

    console.log('Creating sample logs:', sampleLogs.length);
    const created = await AuditLog.insertMany(sampleLogs);
    
    console.log('Successfully created audit logs:', created.length);

    res.status(200).json({
      success: true,
      message: `Created ${created.length} sample audit logs`,
      count: created.length,
      logs: created.map(log => ({
        _id: log._id,
        action: log.action,
        performedBy: log.performedBy.name,
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    console.error('Create sample logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sample audit logs',
      error: error.message,
      stack: error.stack,
    });
  }
};