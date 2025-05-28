const Property = require("../models/property");
const mongoose = require("mongoose");
const Owner = require("../models/owner");
const cloudinary = require("../config/cloudinary");

exports.listProperty = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    // Extract fields from req.body (form data was parsed)
    const {
      "property-type": type,
      "property-subtype": subtype,
      bedrooms,
      bathrooms,
      furnishing,
      "property-description": description,
      address,
      city,
      state,
      pincode,
      landmark,
      "rent-amount": price,
      "map-link": mapLink,
      "security-deposit": securityDeposit,
      maintenance,
      "available-from": availableFrom,
      "preferred-tenants": preferredTenants,
      "lease-duration": leaseDuration,
      amenities = [],
      "owner-name": owner,
      "contact-number": contactNumber,
      "alternative-number": alternativeNumber,
      "contact-email": contactEmail,
    } = req.body;

    // Support multer.any() which produces req.files as an array
    // Also accept other multer shapes (req.file, req.files.images)
    let uploadedFiles = [];

    if (Array.isArray(req.files)) {
      // Filter files that were uploaded under the "images" field (or common variants)
      uploadedFiles = req.files.filter((f) =>
        ["images", "image", "property-photos", "photos"].includes(f.fieldname)
      );
      // If nothing matched, assume all files are images
      if (uploadedFiles.length === 0) uploadedFiles = req.files;
    } else if (req.files && req.files.images) {
      uploadedFiles = req.files.images;
    } else if (req.file) {
      uploadedFiles = [req.file];
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      console.log("No images received", { filesPresent: !!req.files, file: !!req.file });
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Map Cloudinary files to our schema format, robust to different storage engines
    const images = uploadedFiles.map((file) => ({
      url: file.secure_url || file.path || file.url || file.location || "",
      publicId: file.public_id || file.publicId || file.key || file.filename || "",
    }));

    // Construct full address
    const addressParts = [address];
    if (landmark) addressParts.push(`Near ${landmark}`);
    addressParts.push(city, state);
    addressParts.push(pincode);
    const fullAddress = addressParts.join(", ");

    const property = new Property({
      name: `${type} in ${city}`,
      ownerId: req.user.id,
      owner,
      location: city, // Use city only
      address: fullAddress, // Full address with all details
      type,
      subtype,
      beds: parseInt(bedrooms),
      baths: parseInt(bathrooms),
      furnished: furnishing || "unfurnished",
      description,
      images, // Cloudinary URLs with publicIds
      amenities: Array.isArray(amenities)
        ? amenities
        : amenities
        ? [amenities]
        : [],
      map: mapLink || "", // Save map-link to map field
      price: parseFloat(price),
      status: "Pending",
      isRented: false,
      isVerified: false,
      rating: 0,
      reviews: 0,
      securityDeposit: parseFloat(securityDeposit),
      maintenance: parseFloat(maintenance),
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      preferredTenants,
      leaseDuration,
      contactNumber,
      alternativeNumber,
      contactEmail,
    });

    await property.save();

    // Update owner
    await Owner.findByIdAndUpdate(req.user.id, {
      $push: { propertyIds: property._id },
      $inc: { numProperties: 1 }
    });

    res.status(201).json({ message: "Property listed successfully", property });
  } catch (error) {
    console.error("Error listing property:", error);
    res
      .status(400)
      .json({ error: error.message || "Server error while listing property" });
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid property ID" });
    }

    // Find property to check if it's rented
    const property = await Property.findById(propertyId);

    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    // Check if property is currently rented
    if (property.isRented) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete property because it is currently rented",
      });
    }

    // Delete images from Cloudinary
    if (property.images && property.images.length > 0) {
      for (const image of property.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
            console.log(`Deleted image from Cloudinary: ${image.publicId}`);
          } catch (err) {
            console.error(
              `Error deleting image from Cloudinary: ${image.publicId}`,
              err
            );
          }
        }
      }
    }

    // Delete the property
    await Property.findByIdAndDelete(propertyId);

    // Update owner
    await Owner.findByIdAndUpdate(property.ownerId, {
      $pull: { propertyIds: propertyId },
      $inc: { numProperties: -1 }
    });

    return res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting property",
      error: error.message,
    });
  }
};
