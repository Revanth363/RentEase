// server/controllers/superadminauditController.js
// For now: simple recent admin actions (later use real audit log model)

const Admin = require('../models/admin');

exports.getAuditLogs = async (req, res) => {
  try {
    // Example: last 50 admin logins or actions (expand with real audit collection)
    const recentLogins = await Admin.find({})
      .sort({ lastLogin: -1 })
      .limit(50)
      .select('email lastLogin firstName lastName')
      .lean();

    const logs = recentLogins.map(admin => ({
      action: 'Login',
      performedBy: `${admin.firstName} ${admin.lastName} (${admin.email})`,
      role: 'Admin',
      // send ISO string when available, otherwise null so frontend can render N/A
      date: admin.lastLogin ? admin.lastLogin.toISOString() : null,
      details: 'User logged in to admin panel'
    }));

    res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};