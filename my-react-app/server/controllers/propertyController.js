const Property = require("../models/property");
const formidable = require("formidable");
const fs = require("fs");
const mongoose = require("mongoose");
const Owner = require("../models/owner");

exports.listProperty = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user._id) {
      return res.status(401).json({ error: "Unauthorized: Please log in" });
    }

    // Initialize formidable
    const form = new formidable.Formidable({
      multiples: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB per file
      maxFiles: 10, // Max 10 images
    });

    // Parse form data
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, parsedFields, parsedFiles) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ fields: parsedFields, files: parsedFiles });
      });
    });

    // Log parsed fields and files
    console.log("Parsed form fields:", fields);
    console.log("Parsed files:", files ? Object.keys(files) : files);

    // Extract fields (handle arrays)
    const getField = (field) => (Array.isArray(field) ? field[0] : field);
    const type = getField(fields["property-type"]);
    const subtype = getField(fields["property-subtype"]);
    const bedrooms = getField(fields.bedrooms);
    const bathrooms = getField(fields.bathrooms);
    const furnishing = getField(fields.furnishing);
    const description = getField(fields["property-description"]);
    const address = getField(fields.address);
    const city = getField(fields.city);
    const state = getField(fields.state);
    const pincode = getField(fields.pincode);
    const landmark = getField(fields.landmark);
    const price = getField(fields["rent-amount"]);
    const mapLink = getField(fields["map-link"]);
    const securityDeposit = getField(fields["security-deposit"]);
    const maintenance = getField(fields.maintenance);
    const availableFrom = getField(fields["available-from"]);
    const preferredTenants = getField(fields["preferred-tenants"]);
    const leaseDuration = getField(fields["lease-duration"]);
    const amenities = fields.amenities || [];
    const owner = getField(fields["owner-name"]);
    const contactNumber = getField(fields["contact-number"]);
    const alternativeNumber = getField(fields["alternative-number"]);
    const contactEmail = getField(fields["contact-email"]);

    // Extract and validate images
    const images = files["property-photos"]
      ? Array.isArray(files["property-photos"])
        ? files["property-photos"]
        : [files["property-photos"]]
      : [];

    if (!images || images.length === 0) {
      console.log("No images received");
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Convert files to Base64
    const base64Images = images.map((file, index) => {
      if (!file.mimetype.startsWith("image/")) {
        console.log(`Invalid file at index ${index}:`, file.mimetype);
        throw new Error(`Image ${index + 1} is not a valid image`);
      }
      try {
        const fileContent = fs.readFileSync(file.filepath);
        const base64 = fileContent.toString("base64");
        return `data:${file.mimetype};base64,${base64}`;
      } catch (error) {
        console.error(`Error reading file at index ${index}:`, error);
        throw new Error(`Failed to process image ${index + 1}`);
      }
    });

    // Validate Base64 images
    base64Images.forEach((base64, index) => {
      if (!base64.startsWith("data:image/")) {
        console.log(
          `Invalid Base64 at index ${index}:`,
          base64.substring(0, 50)
        );
        throw new Error(`Image ${index + 1} is not a valid image`);
      }
      const sizeInBytes = Buffer.from(base64.split(",")[1], "base64").length;
      if (sizeInBytes > 5 * 1024 * 1024) {
        throw new Error(`Image ${index + 1} exceeds 5MB limit`);
      }
    });

    // Log Base64 images preview
    console.log(
      "Base64 images preview:",
      base64Images.map((img, i) => ({
        index: i,
        preview: img.substring(0, 30) + "...",
      }))
    );

    // Construct full address
    const addressParts = [address];
    if (landmark) addressParts.push(`Near ${landmark}`);
    addressParts.push(city, state);
    addressParts.push(pincode);
    const fullAddress = addressParts.join(", ");

    const property = new Property({
      name: `${type} in ${city}`,
      ownerId: req.session.user._id,
      owner,
      location: city, // Use city only
      address: fullAddress, // Full address with all details
      type,
      subtype,
      beds: parseInt(bedrooms),
      baths: parseInt(bathrooms),
      furnished: furnishing || "unfurnished",
      description,
      images: base64Images,
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

    // 🚨 FIX: UPDATE OWNER propertyIds
    await Owner.findByIdAndUpdate(req.session.user._id, {
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

    // Delete the property
    await Property.findByIdAndDelete(propertyId);

    // 🚨 FIX: UPDATE OWNER propertyIds
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
