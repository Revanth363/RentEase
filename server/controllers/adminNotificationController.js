const Notification = require('../models/notification');
const Owner = require('../models/owner');
const Tenant = require('../models/tenant');
const Worker = require('../models/worker');

exports.getNotificationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id)
      .populate('recipient') // Dynamic population based on recipientType
      .populate('worker', 'firstName lastName serviceType');

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Ensure recipient data is formatted for EJS
    let recipientData = null;
    if (notification.recipient) {
      recipientData = {
        _id: notification.recipient._id,
        firstName: notification.recipient.firstName,
        lastName: notification.recipient.lastName,
        email: notification.recipient.email,
        userType: notification.recipientType.charAt(0).toLowerCase() + notification.recipientType.slice(1) // Normalize for EJS (owner, tenant, worker)
      };
    }

    res.render('admin/notification-view', {
      notification: {
        ...notification.toObject(),
        recipient: recipientData
      }
    });
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