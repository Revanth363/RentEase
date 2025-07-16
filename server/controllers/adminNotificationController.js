// controllers/adminNotificationController.js
const Notification = require('../models/notification');
const Owner = require('../models/owner');
const Tenant = require('../models/tenant');
const Worker = require('../models/worker');

exports.getNotificationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id)
      .populate('recipient')
      .populate('worker', 'firstName lastName serviceType phone')
      .lean();

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notificationData = {
      _id: notification._id.toString(),
      id: notification._id.toString(),
      type: notification.type || 'General',
      message: notification.message,
      status: notification.status,
      priority: notification.priority,
      propertyName: notification.propertyName,
      createdAt: notification.createdAt,
      recipient: notification.recipient
        ? {
            _id: notification.recipient._id.toString(),
            firstName: notification.recipient.firstName,
            lastName: notification.recipient.lastName,
            email: notification.recipient.email,
            userType: notification.recipientType
              ? notification.recipientType.charAt(0).toLowerCase() + notification.recipientType.slice(1)
              : 'user',
          }
        : null,
      recipientType: notification.recipientType,
      worker: notification.worker
        ? {
            _id: notification.worker._id.toString(),
            firstName: notification.worker.firstName,
            lastName: notification.worker.lastName,
            serviceType: notification.worker.serviceType,
            phone: notification.worker.phone,
          }
        : null,
      workerName: notification.workerName,
      tenantName: notification.tenantName,
    };

    res.json(notificationData);
  } catch (error) {
    console.error('getNotificationDetails error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.completeNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { status: 'Completed' },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as completed' });
  } catch (error) {
    console.error('completeNotification error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllNotifications = async (req, res) => {
  try {
    const { type, fromDate, toDate, page = 1, limit = 500 } = req.query;

    const matchFilter = {};
    if (type) matchFilter.type = type;
    if (fromDate || toDate) {
      matchFilter.createdAt = {};
      if (fromDate) matchFilter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.createdAt.$lte = end;
      }
    }

    const total = await Notification.countDocuments(matchFilter);
    const skip = (Number(page) - 1) * Number(limit);

    const notifications = await Notification.find(matchFilter)
      .select('type message status priority propertyName bookingId tenant worker recipientType recipientName workerName tenantName createdDate createdAt')
      .populate('worker', 'firstName lastName')
      .populate('tenant', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const formatted = notifications.map(n => ({
      _id: n._id.toString(),
      id: n._id.toString(),
      type: n.type || 'General',
      message: n.message,
      status: n.status || 'Pending',
      priority: n.priority || 'Normal',
      propertyName: n.propertyName || '—',
      bookingId: n.bookingId?.toString() || null,
      tenantId: n.tenant?._id?.toString() || null,
      tenantName: n.tenant
        ? `${n.tenant.firstName} ${n.tenant.lastName}`.trim()
        : n.tenantName || null,
      workerId: n.worker?._id?.toString() || null,
      workerName: n.worker
        ? `${n.worker.firstName} ${n.worker.lastName}`.trim()
        : n.workerName || null,
      recipientType: n.recipientType,
      recipientName: n.recipientName,
      createdDate: n.createdDate || n.createdAt,
      createdAt: n.createdAt,
    }));

    res.json({ notifications: formatted, total });
  } catch (error) {
    console.error('getAllNotifications error:', error);
    res.status(500).json({ error: error.message });
  }
};