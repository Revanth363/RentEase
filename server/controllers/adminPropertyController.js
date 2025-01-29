// controllers/adminPropertyController.js
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
      id: prop._id.toString(),
      name: prop.name,
      owner: prop.ownerId
        ? {
            _id: prop.ownerId._id.toString(),
            firstName: prop.ownerId.firstName,
            lastName: prop.ownerId.lastName,
            email: prop.ownerId.email,
          }
        : null,
      tenant: prop.tenantId
        ? {
            _id: prop.tenantId._id.toString(),
            firstName: prop.tenantId.firstName,
            lastName: prop.tenantId.lastName,
            email: prop.tenantId.email,
          }
        : null,
      location: prop.location,
      address: prop.address,
      type: prop.type,
      subtype: prop.subtype,
      status: prop.status,
      isRented: prop.isRented,
      isVerified: prop.isVerified,
      price: prop.price,
      securityDeposit: prop.securityDeposit,
      maintenance: prop.maintenance,
      availableFrom: prop.availableFrom,
      leaseDuration: prop.leaseDuration,
      beds: prop.beds,
      baths: prop.baths,
      furnished: prop.furnished,
      amenities: prop.amenities,
      description: prop.description,
      contactNumber: prop.contactNumber,
      alternativeNumber: prop.alternativeNumber,
      contactEmail: prop.contactEmail,
      images: prop.images,
      createdAt: prop.createdAt,
      updatedAt: prop.updatedAt,
    }));

    res.json({ properties: enhancedProperties });
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

    const propertyData = {
      id: property._id.toString(),
      name: property.name,
      owner: property.ownerId
        ? {
            _id: property.ownerId._id.toString(),
            firstName: property.ownerId.firstName,
            lastName: property.ownerId.lastName,
            email: property.ownerId.email,
          }
        : null,
      tenant: property.tenantId
        ? {
            _id: property.tenantId._id.toString(),
            firstName: property.tenantId.firstName,
            lastName: property.tenantId.lastName,
            email: property.tenantId.email,
          }
        : null,
      location: property.location,
      address: property.address,
      type: property.type,
      subtype: property.subtype,
      status: property.status,
      isRented: property.isRented,
      isVerified: property.isVerified,
      price: property.price,
      securityDeposit: property.securityDeposit,
      maintenance: property.maintenance,
      availableFrom: property.availableFrom,
      leaseDuration: property.leaseDuration,
      beds: property.beds,
      baths: property.baths,
      furnished: property.furnished,
      amenities: property.amenities,
      description: property.description,
      contactNumber: property.contactNumber,
      alternativeNumber: property.alternativeNumber,
      contactEmail: property.contactEmail,
      images: property.images,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };

    res.json(propertyData);
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