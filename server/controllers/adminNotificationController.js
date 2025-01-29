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
      .populate('worker', 'firstName lastName serviceType')
      .lean();

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const notificationData = {
      id: notification._id.toString(),
      recipient: notification.recipient
        ? {
            _id: notification.recipient._id.toString(),
            firstName: notification.recipient.firstName,
            lastName: notification.recipient.lastName,
            email: notification.recipient.email,
            userType: notification.recipientType.charAt(0).toLowerCase() + notification.recipientType.slice(1),
          }
        : null,
      worker: notification.worker
        ? {
            _id: notification.worker._id.toString(),
            firstName: notification.worker.firstName,
            lastName: notification.worker.lastName,
            serviceType: notification.worker.serviceType,
          }
        : null,
      message: notification.message,
      status: notification.status,
      createdAt: notification.createdAt,
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