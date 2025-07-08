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