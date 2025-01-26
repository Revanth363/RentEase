const MaintenanceRequest = require('../models/MaintenanceRequest');
const Property = require('../models/property');
const Tenant = require('../models/tenant');
const Owner = require('../models/owner');

exports.getAllMaintenanceRequests = async (req, res) => {
  try {
    // Get all maintenance requests
    const maintenanceRequests = await MaintenanceRequest.find()
      .populate('propertyId', 'name location address')
      .populate('tenantId', 'firstName lastName');
      
    // Get all properties (needed for owner lookup in the template)
    const properties = await Property.find().populate('ownerId', 'firstName lastName');
    
    // Enhance maintenance requests with additional data
    const enhancedRequests = maintenanceRequests.map(request => {
      const property = properties.find(p => p._id.equals(request.propertyId?._id));
      
      // Create a plain object that we can add properties to
      const enhancedRequest = request.toObject();
      
      // Add property name if available
      enhancedRequest.propertyName = request.propertyId?.name || 'N/A';
      
      // Add tenant name if available
      enhancedRequest.tenantName = request.tenantId ? 
        `${request.tenantId.firstName} ${request.tenantId.lastName}` : 'N/A';
      
      // Add owner name if available
      if (property && property.ownerId) {
        enhancedRequest.ownerName = `${property.ownerId.firstName} ${property.ownerId.lastName}`;
      } else {
        enhancedRequest.ownerName = null;
      }
      
      return enhancedRequest;
    });
    
    res.render('admin/maintenance-list', {
      maintenanceRequests: enhancedRequests,
      properties: properties
    });
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMaintenanceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await MaintenanceRequest.findById(id)
      .populate('propertyId', 'name location address')
      .populate('tenantId', 'firstName lastName email phone');
    
    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found' });
    }
    
    // Get property details
    const property = await Property.findById(request.propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Get owner details using property's ownerId
    const owner = await Owner.findById(property.ownerId);
    
    res.render('admin/maintenance-view', { 
      request,
      owner: owner
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.completeMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    
    await MaintenanceRequest.findByIdAndUpdate(
      id,
      { 
        status: 'Completed',
        completionDate: new Date() 
      }
    );
    
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};