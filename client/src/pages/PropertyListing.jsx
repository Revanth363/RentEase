import { useRef, useState } from "react";
import "../assets/css/propertylisting.css";

const PropertyListing = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validImageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    const newFiles = validImageFiles.filter(
      (file) =>
        !selectedFiles.some(
          (existing) =>
            existing.name === file.name && existing.size === file.size
        )
    );

    const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 10);
    setSelectedFiles(updatedFiles);

    // Clear error if images exist
    if (updatedFiles.length > 0) {
      setErrors((prev) => ({ ...prev, photos: false }));
    }

    if (updatedFiles.length >= 10 && newFiles.length > 0) {
      alert("Maximum 10 images allowed. Only the first 10 were added.");
    }
  };

  const removeImage = (index) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    let newErrors = {};
    let isValid = true;

    // Check required fields
    form.querySelectorAll("[required]").forEach((field) => {
      if (field.type === "checkbox" && !field.checked) {
        newErrors[field.name || field.id] = true;
        isValid = false;
      } else if (!field.value.trim()) {
        newErrors[field.name || field.id] = true;
        isValid = false;
      }
    });

    // Check photos
    if (selectedFiles.length === 0) {
      newErrors.photos = true;
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      alert("Please fill in all required fields marked with *");
      const firstError = document.querySelector(".pl-form-group.pl-error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Append images
    selectedFiles.forEach((file) => {
      formData.append("property-photos", file);
    });

    try {
      const response = await fetch("/api/property/list-property", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          "Property listing submitted successfully! Our team will review your listing and it will be live soon."
        );

        window.location.href = "/owner_dashboard"; // redirect after success
      } else {
        alert(result.error || "Error listing property");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error submitting form. Please try again.");
    }
  };

  const resetForm = () => {
    document.getElementById("property-listing-form").reset();
    setSelectedFiles([]);
    setErrors({});
  };

  const openFileDialog = () => {
    fileInputRef.current.click();
  };

  return (
    <>
      <div className="pl-page-container">
        <div className="pl-page-header">
          <h1>List Your Property</h1>
          <p>Complete the form below to list your property on RentEase</p>
        </div>

        <div className="pl-listing-form-container">
          <form
            id="property-listing-form"
            onSubmit={handleSubmit}
            encType="multipart/form-data"
          >
            {/* Basic Information */}
            <div className="pl-form-section">
              <h2>Basic Information</h2>
              <div className="pl-form-row">
                <div
                  className={`pl-form-group ${
                    errors["property-type"] ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="property-type">Property Type*</label>
                  <select id="property-type" name="property-type" required>
                    <option value="">Select Property Type</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="pg">PG/Hostel</option>
                    <option value="commercial">Commercial Space</option>
                  </select>
                  <span className="pl-error-message">
                    Please select a property type
                  </span>
                </div>
                <div
                  className={`pl-form-group ${
                    errors["property-subtype"] ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="property-subtype">Property Subtype*</label>
                  <select
                    id="property-subtype"
                    name="property-subtype"
                    required
                  >
                    <option value="">Select Property Subtype</option>
                    <option value="1bhk">1 BHK</option>
                    <option value="2bhk">2 BHK</option>
                    <option value="3bhk">3 BHK</option>
                    <option value="4bhk">4 BHK</option>
                    <option value="duplex">Duplex</option>
                    <option value="box">Box Type</option>
                    <option value="studio">Studio</option>
                    <option value="other">Other</option>
                  </select>
                  <span className="pl-error-message">
                    Please select a property subtype
                  </span>
                </div>
              </div>

              <div className="pl-form-row">
                <div
                  className={`pl-form-group ${
                    errors.bedrooms ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="bedrooms">Bedrooms*</label>
                  <select id="bedrooms" name="bedrooms" required>
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                  <span className="pl-error-message">
                    Please select number of bedrooms
                  </span>
                </div>
                <div
                  className={`pl-form-group ${
                    errors.bathrooms ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="bathrooms">Bathrooms*</label>
                  <select id="bathrooms" name="bathrooms" required>
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4+">4+</option>
                  </select>
                  <span className="pl-error-message">
                    Please select number of bathrooms
                  </span>
                </div>
                <div className="pl-form-group">
                  <label htmlFor="furnishing">Furnishing Status</label>
                  <select id="furnishing" name="furnishing">
                    <option value="">Select</option>
                    <option value="unfurnished">Unfurnished</option>
                    <option value="semi-furnished">Semi-Furnished</option>
                    <option value="fully-furnished">Fully Furnished</option>
                  </select>
                </div>
              </div>

              <div className="pl-form-row">
                <div
                  className={`pl-form-group pl-full-width ${
                    errors["property-description"] ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="property-description">
                    Property Description*
                  </label>
                  <textarea
                    id="property-description"
                    name="property-description"
                    rows="4"
                    required
                    placeholder="Describe your property in detail, including special features and nearby amenities"
                  ></textarea>
                  <span className="pl-error-message">
                    Please provide a property description
                  </span>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="pl-form-section">
              <h2>Location Details</h2>
              <div className="pl-form-row">
                <div
                  className={`pl-form-group ${
                    errors.address ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="address">Complete Address*</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    placeholder="Street address"
                  />
                  <span className="pl-error-message">
                    Please enter the address
                  </span>
                </div>
                <div className="pl-form-group">
                  <label htmlFor="landmark">Landmark</label>
                  <input
                    type="text"
                    id="landmark"
                    name="landmark"
                    placeholder="Nearby landmark for easy navigation"
                  />
                </div>
              </div>

              <div className="pl-form-row">
                <div
                  className={`pl-form-group ${errors.city ? "pl-error" : ""}`}
                >
                  <label htmlFor="city">City*</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    placeholder="City"
                  />
                  <span className="pl-error-message">
                    Please enter the city
                  </span>
                </div>
                <div
                  className={`pl-form-group ${errors.state ? "pl-error" : ""}`}
                >
                  <label htmlFor="state">State*</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    required
                    placeholder="State"
                  />
                  <span className="pl-error-message">
                    Please enter the state
                  </span>
                </div>
                <div
                  className={`pl-form-group ${
                    errors.pincode ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="pincode">Pincode*</label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    required
                    placeholder="Pincode"
                  />
                  <span className="pl-error-message">
                    Please enter the pincode
                  </span>
                </div>
              </div>

              <div className="pl-form-row">
                <div className="pl-form-group pl-full-width">
                  <label htmlFor="map-link">Google Maps Embed Link</label>
                  <input
                    type="url"
                    id="map-link"
                    name="map-link"
                    placeholder="Paste Google Maps embed link (e.g., https://www.google.com/maps/embed?..."
                  />
                </div>
              </div>
            </div>

            {/* Rental Details */}
            <div className="pl-form-section">
              <h2>Rental Details</h2>
              <div className="pl-form-row">
                <div
                  className={`pl-form-group ${
                    errors["rent-amount"] ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="rent-amount">Monthly Rent (₹)*</label>
                  <input
                    type="number"
                    id="rent-amount"
                    name="rent-amount"
                    required
                    placeholder="e.g., 15000"
                  />
                  <span className="pl-error-message">
                    Please enter the monthly rent
                  </span>
                </div>
                <div
                  className={`pl-form-group ${
                    errors["security-deposit"] ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="security-deposit">
                    Security Deposit (₹)*
                  </label>
                  <input
                    type="number"
                    id="security-deposit"
                    name="security-deposit"
                    required
                    placeholder="e.g., 30000"
                  />
                  <span className="pl-error-message">
                    Please enter the security deposit
                  </span>
                </div>
                <div className="pl-form-group">
                  <label htmlFor="maintenance">Maintenance Charges (₹)</label>
                  <input
                    type="number"
                    id="maintenance"
                    name="maintenance"
                    placeholder="e.g., 1500"
                  />
                </div>
              </div>

              <div className="pl-form-row">
                <div
                  className={`pl-form-group ${
                    errors["available-from"] ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="available-from">Available From*</label>
                  <input
                    type="date"
                    id="available-from"
                    name="available-from"
                    required
                  />
                  <span className="pl-error-message">
                    Please select availability date
                  </span>
                </div>
                <div className="pl-form-group">
                  <label htmlFor="preferred-tenants">Preferred Tenants</label>
                  <select id="preferred-tenants" name="preferred-tenants">
                    <option value="any">Any</option>
                    <option value="family">Family</option>
                    <option value="bachelors">Bachelors</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <div
                  className={`pl-form-group ${
                    errors["lease-duration"] ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="lease-duration">
                    Minimum Lease Duration*
                  </label>
                  <select id="lease-duration" name="lease-duration" required>
                    <option value="">Select</option>
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="11">11 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                  </select>
                  <span className="pl-error-message">
                    Please select lease duration
                  </span>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="pl-form-section">
              <h2>Amenities & Facilities</h2>
              <div className="pl-amenities-grid">
                {[
                  "parking",
                  "lift",
                  "Balcony",
                  "security",
                  "gym",
                  "swimming-pool",
                  "children-play-area",
                  "club-house",
                  "gated-community",
                  "wifi",
                  "ac",
                  "gas-pipeline",
                ].map((amenity) => (
                  <div key={amenity} className="pl-amenity-checkbox">
                    <input
                      type="checkbox"
                      id={amenity}
                      name="amenities"
                      value={amenity}
                    />
                    <label htmlFor={amenity}>
                      {amenity === "ac"
                        ? "Water supply"
                        : amenity.charAt(0).toUpperCase() +
                          amenity.slice(1).replace(/-/g, " ")}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div className="pl-form-section">
              <h2>Property Photos</h2>
              <div className="pl-form-row">
                <div
                  className={`pl-form-group pl-full-width ${
                    errors.photos ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="property-photos">
                    Upload Photos (Max 10)*
                  </label>
                  <div className="pl-file-upload-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="property-photos"
                      name="property-photos"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <div
                      className="pl-file-upload-button"
                      onClick={openFileDialog}
                    >
                      <span>Choose Files</span>
                    </div>
                  </div>
                  <span className="pl-error-message">
                    Please upload at least one image
                  </span>
                  <div className="pl-preview-container">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="pl-preview-item">
                        <img src={URL.createObjectURL(file)} alt={file.name} />
                        <span
                          className="pl-remove-preview"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="pl-form-section">
              <h2>Contact Information</h2>
              <div className="pl-form-row">
                <div
                  className={`pl-form-group ${
                    errors["owner-name"] ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="owner-name">Owner Name*</label>
                  <input
                    type="text"
                    id="owner-name"
                    name="owner-name"
                    required
                    placeholder="Full Name"
                  />
                  <span className="pl-error-message">
                    Please enter owner name
                  </span>
                </div>
                <div
                  className={`pl-form-group ${
                    errors["contact-number"] ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="contact-number">Contact Number*</label>
                  <input
                    type="tel"
                    id="contact-number"
                    name="contact-number"
                    required
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                  />
                  <span className="pl-error-message">
                    Please enter a valid 10-digit contact number
                  </span>
                </div>
                <div className="pl-form-group">
                  <label htmlFor="alternative-number">Alternative Number</label>
                  <input
                    type="tel"
                    id="alternative-number"
                    name="alternative-number"
                    placeholder="Alternative contact number"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>
              <div className="pl-form-row">
                <div
                  className={`pl-form-group pl-full-width ${
                    errors["contact-email"] ? "pl-error" : ""
                  }`}
                >
                  <label htmlFor="contact-email">Email Address*</label>
                  <input
                    type="email"
                    id="contact-email"
                    name="contact-email"
                    required
                    placeholder="Email address"
                  />
                  <span className="pl-error-message">
                    Please enter a valid email address
                  </span>
                </div>
              </div>
              <div className="pl-form-row">
                <div
                  className={`pl-form-group pl-full-width ${
                    errors["terms-agreement"] ? "pl-error" : ""
                  }`}
                >
                  <div className="pl-agreement-checkbox">
                    <input
                      type="checkbox"
                      id="terms-agreement"
                      name="terms-agreement"
                      required
                    />
                    <label htmlFor="terms-agreement">
                      I agree to RentEase's <a href="#">Terms & Conditions</a>{" "}
                      and <a href="#">Privacy Policy</a>*
                    </label>
                  </div>
                  <span className="pl-error-message">
                    Please agree to the terms and conditions
                  </span>
                </div>
              </div>
            </div>

            <div className="pl-form-actions">
              <button
                type="button"
                className="pl-secondary-button"
                onClick={resetForm}
              >
                Clear All
              </button>
              <button type="submit" className="pl-primary-button">
                Submit Listing
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PropertyListing;
