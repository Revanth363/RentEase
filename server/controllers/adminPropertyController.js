const Property = require('../models/property');
const Owner = require('../models/owner');
const Tenant = require('../models/tenant');

exports.getPropertyManagement = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('ownerId', 'firstName lastName email')
      .populate('tenantId', 'firstName lastName email')
      .lean();

    const enhancedProperties = properties.map(prop => ({
      ...prop,
      owner: prop.ownerId ? `${prop.ownerId.firstName} ${prop.ownerId.lastName} (${prop.ownerId.email})` : 'N/A',
      tenant: prop.tenantId ? `${prop.tenantId.firstName} ${prop.tenantId.lastName} (${prop.tenantId.email})` : 'N/A',
      ownerId: prop.ownerId?._id,
      tenantId: prop.tenantId?._id
    }));

    res.render('admin/property-management', { properties: enhancedProperties });
  } catch (error) {
    console.error('getPropertyManagement error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.getPropertyView = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('ownerId', 'firstName lastName email')
      .populate('tenantId', 'firstName lastName email')
      .lean();

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.render('admin/property-view', {
      property: {
        ...property,
        owner: property.ownerId || null,
        tenant: property.ownerId || null
      }
    });
  } catch (error) {
    console.error('getPropertyView error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to delete property with ID: ${id}`);
    const property = await Property.findById(id);
    if (!property) {
      console.log(`Property not found: ${id}`);
      return res.status(404).json({ message: 'Property not found' });
    }

    await Property.deleteOne({ _id: id });
    console.log(`Property deleted successfully: ${id}`);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('deleteProperty error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.toggleVerify = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    console.log(`ToggleVerify: id=${id}, isVerified=${isVerified}`);
    if (isVerified === undefined) {
      console.log('isVerified field is missing');
      return res.status(400).json({ message: 'isVerified field is required' });
    }
    const property = await Property.findById(id);
    if (!property) {
      console.log(`Property not found: ${id}`);
      return res.status(404).json({ message: 'Property not found' });
    }
    const newIsVerified = isVerified === true || isVerified === 'true';
    await Property.findByIdAndUpdate(
      id,
      { isVerified: newIsVerified },
      { new: true, runValidators: false }
    );
    console.log(`Property updated: id=${id}, isVerified=${newIsVerified}`);
    res.json({ message: 'Verification status updated', isVerified: newIsVerified });
  } catch (error) {
    console.error('toggleVerify error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};