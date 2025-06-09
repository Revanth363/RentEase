const Property = require("../models/property");
const mongoose = require("mongoose");
const Owner = require("../models/owner");
const cloudinary = require("../config/cloudinary");

exports.listProperty = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    // Extract fields from req.body
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
      "map-link": mapLink,                // optional fallback
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
      coordinates,                        // ← this is the JSON string from frontend
    } = req.body;

    // ── Parse coordinates safely ──
    let parsedCoordinates = undefined;

    if (coordinates) {
      try {
        const coordObj = JSON.parse(coordinates);

        if (
          typeof coordObj?.lat === "number" &&
          typeof coordObj?.lng === "number" &&
          !isNaN(coordObj.lat) &&
          !isNaN(coordObj.lng) &&
          Math.abs(coordObj.lat) <= 90 &&
          Math.abs(coordObj.lng) <= 180
        ) {
          parsedCoordinates = {
            lat: coordObj.lat,
            lng: coordObj.lng,
          };
        } else {
          console.warn("Invalid coordinate values received:", coordObj);
        }
      } catch (parseErr) {
        console.warn("Failed to parse coordinates JSON:", parseErr.message, { received: coordinates });
      }
    }


    // Separate property proof and images
    let images = [];
    let propertyProofFile = null;
    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        if (file.fieldname === 'propertyProof') {
          propertyProofFile = file;
        } else if (["images", "image", "property-photos", "photos"].includes(file.fieldname)) {
          images.push(file);
        }
      }
      if (images.length === 0) images = req.files.filter(f => f.fieldname !== 'propertyProof');
    } else if (req.files && req.files.images) {
      images = req.files.images;
    } else if (req.file) {
      images = [req.file];
    }

    if (!images || images.length === 0) {
      console.log("No images received", { filesPresent: !!req.files, file: !!req.file });
      return res.status(400).json({ error: "At least one image is required" });
    }

    const imageObjs = images.map((file) => ({
      url: file.secure_url || file.path || file.url || file.location || "",
      publicId: file.public_id || file.publicId || file.key || file.filename || "",
    }));

    // Handle property proof
    let propertyProof = null;
    if (propertyProofFile) {
      propertyProof = {
        url: propertyProofFile.secure_url || propertyProofFile.path || propertyProofFile.url || propertyProofFile.location || "",
        publicId: propertyProofFile.public_id || propertyProofFile.publicId || propertyProofFile.key || propertyProofFile.filename || "",
        type: propertyProofFile.mimetype === 'application/pdf' ? 'pdf' : 'image'
      };
    }

    // Construct full address
    const addressParts = [address];
    if (landmark) addressParts.push(`Near ${landmark}`);
    addressParts.push(city, state, pincode);
    const fullAddress = addressParts.filter(Boolean).join(", ");

    // Create property document
    const property = new Property({
      name: `${type} in ${city}`,
      ownerId: req.user.id,
      owner,
      location: city,
      address: fullAddress,
      type,
      subtype,
      beds: parseInt(bedrooms) || undefined,
      baths: parseInt(bathrooms) || undefined,
      furnished: furnishing || "unfurnished",
      description,
      images: imageObjs,
      propertyProof,
      amenities: Array.isArray(amenities)
        ? amenities
        : amenities
        ? [amenities]
        : [],
      map: mapLink || "",
      coordinates: parsedCoordinates,          // ← now correctly saved
      price: parseFloat(price) || undefined,
      status: "Pending",
      isRented: false,
      isVerified: false,
      rating: 0,
      reviews: 0,
      securityDeposit: parseFloat(securityDeposit) || undefined,
      maintenance: parseFloat(maintenance) || undefined,
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      preferredTenants,
      leaseDuration,
      contactNumber,
      alternativeNumber,
      contactEmail,
    });

    // Optional: debug what is about to be saved
    // console.log("Property before save:", property.toObject());

    await property.save();

    // Update owner's property list
    await Owner.findByIdAndUpdate(req.user.id, {
      $push: { propertyIds: property._id },
      $inc: { numProperties: 1 },
    });

    res.status(201).json({
      message: "Property listed successfully",
      property,
    });
  } catch (error) {
    console.error("Error listing property:", error);
    res.status(400).json({
      error: error.message || "Server error while listing property",
    });
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
