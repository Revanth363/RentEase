// controllers/adminPropertyController.js
const Property = require('../models/property');
const Owner = require('../models/owner');
const Tenant = require('../models/tenant');

exports.getPropertyManagement = async (req, res) => {
  try {
    const {
      search = '',
      ownerName = '',
      type = '',
      isRented = '',
      minPrice = '',
      maxPrice = '',
      status = '',
      verified = '',
      fromDate = '',
      toDate = '',
      page = 1,
      limit = 25
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10));
    const currentLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (currentPage - 1) * currentLimit;

    const hasFilter = search || ownerName || type || isRented !== '' || minPrice || maxPrice || status || verified !== '' || fromDate || toDate;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (isRented !== '') filter.isRented = isRented === 'true';
    if (verified !== '') filter.isVerified = verified === 'true';

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    let textSearch = {};
    if (search) {
      const term = search.trim();
      textSearch = {
        $or: [
          { name: { $regex: term, $options: 'i' } },
          { location: { $regex: term, $options: 'i' } }
        ]
      };
    }

    let ownerMatch = {};
    if (ownerName) {
      const owners = await Owner.find({
        $or: [
          { firstName: { $regex: ownerName.trim(), $options: 'i' } },
          { lastName: { $regex: ownerName.trim(), $options: 'i' } },
          { $expr: { $regexMatch: { input: { $concat: ['$firstName', ' ', '$lastName'] }, regex: ownerName.trim(), options: 'i' } } }
        ]
      }).select('_id');

      const ownerIds = owners.map(o => o._id);
      if (ownerIds.length === 0) {
        return res.json({ properties: [], total: 0 });
      }
      ownerMatch.ownerId = { $in: ownerIds };
    }

    let properties;
    let total;

    if (!hasFilter) {
      // First load: only 10 latest
      properties = await Property.find()
        .populate('ownerId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      total = properties.length;
    } else {
      // Full filtered + paginated
      properties = await Property.find({ ...filter, ...textSearch, ...ownerMatch })
        .populate('ownerId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(currentLimit)
        .lean();

      total = await Property.countDocuments({ ...filter, ...textSearch, ...ownerMatch });
    }

    const formatted = properties.map(p => ({
      _id: p._id.toString(),
      name: p.name,
      ownerName: p.ownerId ? `${p.ownerId.firstName} ${p.ownerId.lastName}`.trim() : 'Unknown',
      ownerId: p.ownerId?._id?.toString(),
      owner: p.ownerId ? { firstName: p.ownerId.firstName, lastName: p.ownerId.lastName } : null,
      location: p.location,
      type: p.type,
      status: p.status || 'Available',
      isRented: !!p.isRented,
      price: p.price,
      isVerified: !!p.isVerified,
      propertyProof: p.propertyProof || null,
      createdAt: p.createdAt,
    }));

    res.json({ properties: formatted, total });

  } catch (error) {
    console.error('getPropertyManagement error:', error);
    res.status(500).json({ message: 'Server Error' });
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