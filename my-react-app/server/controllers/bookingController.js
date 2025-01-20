const mongoose = require('mongoose');
const Booking = require('../models/booking');
const Tenant = require('../models/tenant');
const Property = require('../models/property');
const Owner = require('../models/owner');
const Notification = require('../models/notification');

// Render booking form
exports.getBookingForm = async (req, res) => {
  try {
    console.log(`Attempting to render booking form, property ID: ${req.query.id || 'none'}, session user:`, req.session.user);
    if (!req.session.user || req.session.user.userType !== 'tenant') {
      console.warn(`Unauthorized access to booking form, tenant ID: ${req.session.user?._id || 'none'}`);
      return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
    }

    const propertyId = req.query.id;
    if (!propertyId) {
      console.warn(`Missing property ID, tenant ID: ${req.session.user._id}`);
      req.session.error = 'Property ID is required';
      return res.redirect(`/property?id=${propertyId || ''}`);
    }

    // Fetch property to get _id (no validations)
    const property = await Property.findById(propertyId);
    if (!property) {
      console.warn(`Property not found: ${propertyId}, tenant ID: ${req.session.user._id}`);
      req.session.error = 'Property not found';
      return res.redirect(`/property?id=${propertyId}`);
    }

    console.log(`Rendering book_property.ejs with propertyId: ${property._id.toString()}, tenant ID: ${req.session.user._id}`);
    res.render('pages/book_property', {
      user: req.session.user,
      propertyId: property._id.toString()
    }, (err, html) => {
      if (err) {
        console.error(`Error rendering book_property.ejs, property ID: ${propertyId}, tenant ID: ${req.session.user._id}`, err);
        req.session.error = 'Failed to load booking form';
        return res.redirect(`/property?id=${propertyId}`);
      }
      res.send(html);
    });
  } catch (err) {
    console.error(`Error in getBookingForm, property ID: ${req.query.id || 'none'}, tenant ID: ${req.session.user?._id || 'none'}`, err);
    req.session.error = 'Server error occurred';
    res.redirect(`/property?id=${req.query.id || ''}`);
  }
};

// Process booking form submission
exports.createBooking = async (req, res) => {
  try {
    console.log(`Processing booking submission, property ID: ${req.body.propertyId}, tenant ID: ${req.session.user?._id}, body:`, req.body);
    if (!req.session.user || req.session.user.userType !== 'tenant') {
      console.warn(`Unauthorized booking attempt, tenant ID: ${req.session.user?._id || 'none'}`);
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { propertyId, startDate, leaseDuration, comments } = req.body;

    // Minimal validation for required fields
    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      console.warn(`Invalid property ID: ${propertyId}, tenant ID: ${req.session.user._id}`);
      return res.status(400).json({ success: false, message: 'Invalid property ID' });
    }
    if (!startDate || !leaseDuration) {
      console.warn(`Missing startDate or leaseDuration, tenant ID: ${req.session.user._id}`);
      return res.status(400).json({ success: false, message: 'Start date and lease duration are required' });
    }

    // Fetch property
    const property = await Property.findById(propertyId);
    if (!property) {
      console.warn(`Property not found: ${propertyId}, tenant ID: ${req.session.user._id}`);
      return res.status(400).json({ success: false, message: 'Property not found' });
    }

    // Calculate endDate (no validation)
    const startDateObj = new Date(startDate);
    const leaseDurationNum = parseInt(leaseDuration) || 6; // Default to 6 if invalid
    const endDate = new Date(startDateObj);
    endDate.setMonth(endDate.getMonth() + leaseDurationNum);

    // Get ownerId or fallback
    let ownerId = property.ownerId;
    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      console.warn(`Property missing valid ownerId: ${propertyId}, tenant ID: ${req.session.user._id}`);
      // Fallback: Use first owner in database
      const fallbackOwner = await Owner.findOne().select('_id firstName lastName');
      if (!fallbackOwner) {
        console.warn(`No owners found in database, tenant ID: ${req.session.user._id}`);
        return res.status(400).json({ success: false, message: 'No owners available' });
      }
      ownerId = fallbackOwner._id;
      console.log(`Using fallback ownerId: ${ownerId}`);
    }

    // Create booking
    const booking = new Booking({
      tenantId: req.session.user._id,
      userName: `${req.session.user.firstName || ''} ${req.session.user.lastName || ''}`.trim() || 'Tenant',
      propertyId: propertyId,
      propertyName: property.name || 'Unknown Property',
      ownerId: ownerId,
      status: 'Pending',
      startDate: startDateObj,
      endDate: endDate,
      bookingDate: new Date(),
      comments: comments || ''
    });

    console.log(`Saving booking:`, booking);
    await booking.save();

    // Fetch owner for notification
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      console.warn(`Owner not found for ownerId: ${ownerId}, tenant ID: ${req.session.user._id}`);
      return res.status(400).json({ success: false, message: 'Owner not found' });
    }

    // Create notification
    const notification = new Notification({
      recipient: ownerId,
      recipientType: 'Owner',
      type: 'Booking Request',
      message: `New booking request for ${property.name || 'Unknown Property'} by ${req.session.user.firstName || ''} ${req.session.user.lastName || ''}`.trim() || 'Tenant',
      status: 'Pending',
      propertyName: property.name || 'Unknown Property',
      recipientName: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Owner',
      createdDate: new Date(),
      bookingId: booking._id
    });

    console.log(`Saving notification:`, notification);
    await notification.save();

    // Add notification to owner's notificationIds
    console.log(`Updating owner with notification ID: ${notification._id}`);
    await Owner.updateOne(
      { _id: ownerId },
      { $push: { notificationIds: notification._id } }
    );

    console.log(`Booking submitted successfully, booking ID: ${booking._id}, notification ID: ${notification._id}`);
    res.status(200).json({ success: true, message: 'Booking request submitted, awaiting owner approval' });
  } catch (err) {
    console.error(`Error processing booking, property ID: ${req.body.propertyId || 'none'}, tenant ID: ${req.session.user?._id || 'none'}, error:`, err);
    res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
};

// Handle notification actions (approve/reject)
exports.handleNotificationAction = async (req, res) => {
  try {
    const { notificationId, action, reason } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      console.warn(`Invalid notification ID: ${notificationId}`);
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }
    if (!['approve', 'reject'].includes(action)) {
      console.warn(`Invalid action: ${action}`);
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    // Check if user is owner
    if (!req.session.user || req.session.user.userType !== 'owner') {
      console.warn(`Unauthorized notification action, owner ID: ${req.session.user?._id || 'none'}`);
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Fetch notification and validate
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.recipient.toString() !== req.session.user._id.toString()) {
      console.warn(`Invalid or unauthorized notification: ${notificationId}, owner ID: ${req.session.user._id}`);
      return res.status(400).json({ success: false, message: 'Invalid notification' });
    }

    // Fetch booking
    const booking = await Booking.findById(notification.bookingId);
    if (!booking) {
      console.warn(`Booking not found for notification: ${notificationId}, owner ID: ${req.session.user._id}`);
      return res.status(400).json({ success: false, message: 'Booking not found' });
    }

    // Fetch tenant
    const tenant = await Tenant.findById(booking.tenantId);
    if (!tenant) {
      console.warn(`Tenant not found for booking: ${booking._id}, owner ID: ${req.session.user._id}`);
      return res.status(400).json({ success: false, message: 'Tenant not found' });
    }

    if (action === 'approve') {
      // Update booking
      booking.status = 'Active';
      await booking.save();

      // Update property
      await Property.updateOne(
        { _id: booking.propertyId },
        { isRented: true, tenantId: booking.tenantId }
      );

      // Update tenant
      await Tenant.updateOne(
        { _id: booking.tenantId },
        {
          $push: { rentalHistoryIds: booking._id },
          $set: { ownerId: booking.ownerId }
        }
      );

      // Update notification
      notification.status = 'Approved';
      await notification.save();

      // Notify tenant
      const tenantNotification = new Notification({
        recipient: booking.tenantId,
        recipientType: 'Tenant',
        type: 'Booking Approved',
        message: `Your booking for ${booking.propertyName} has been approved`,
        status: 'Pending',
        propertyName: booking.propertyName,
        recipientName: booking.userName,
        createdDate: new Date(),
        bookingId: booking._id
      });
      await tenantNotification.save();
      await Tenant.updateOne(
        { _id: booking.tenantId },
        { $push: { notificationIds: tenantNotification._id } }
      );
    } else {
      // Update booking
      booking.status = 'Terminated';
      await booking.save();

      // Update property
      await Property.updateOne(
        { _id: booking.propertyId },
        { isRented: false, tenantId: null }
      );

      // Update notification
      notification.status = 'Rejected';
      await notification.save();

      // Notify tenant
      const tenantNotification = new Notification({
        recipient: booking.tenantId,
        recipientType: 'Tenant',
        type: 'Booking Rejected',
        message: `Your booking for ${booking.propertyName} was rejected. Reason: ${reason || 'N/A'}`,
        status: 'Pending',
        propertyName: booking.propertyName,
        recipientName: booking.userName,
        createdDate: new Date(),
        bookingId: booking._id
      });
      await tenantNotification.save();
      await Tenant.updateOne(
        { _id: booking.tenantId },
        { $push: { notificationIds: tenantNotification._id } }
      );
    }

    res.status(200).json({ success: true, message: 'Notification action completed' });
  } catch (err) {
    console.error(`Error processing notification action, notification ID: ${req.body.notificationId || 'none'}, owner ID: ${req.session.user?._id || 'none'}`, err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};