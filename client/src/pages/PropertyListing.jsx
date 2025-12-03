import { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../assets/css/propertylisting.css";

// Define Leaflet icon once — outside render (fixes Vite parsing issues)
const defaultMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const PropertyListing = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
    const [propertyProofFile, setPropertyProofFile] = useState(null);
  const [errors, setErrors] = useState({});
    const [propertyProofError, setPropertyProofError] = useState(false);
  const [coordinates, setCoordinates] = useState(null); // { lat, lng }
  const fileInputRef = useRef(null);

  const handlePropertyProofChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setPropertyProofFile(file);
      setPropertyProofError(false);
    } else {
      setPropertyProofFile(null);
      setPropertyProofError(true);
      alert('Only PDF or image files are allowed for property proof.');
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validImageFiles = files.filter((file) => file.type.startsWith("image/"));
    const newFiles = validImageFiles.filter(
      (file) =>
        !selectedFiles.some(
          (existing) => existing.name === file.name && existing.size === file.size
        )
    );
    const updatedFiles = [...selectedFiles, ...newFiles].slice(0, 10);
    setSelectedFiles(updatedFiles);

    if (updatedFiles.length > 0) {
      setErrors((prev) => ({ ...prev, photos: false }));
    }
    if (updatedFiles.length >= 10 && newFiles.length > 0) {
      alert("Maximum 10 images allowed. Only the first 10 were added.");
    }
  };

  const removeImage = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    let newErrors = {};
    let isValid = true;

    // Validate required fields
    form.querySelectorAll("[required]").forEach((field) => {
      if (field.type === "checkbox" && !field.checked) {
        newErrors[field.name || field.id] = true;
        isValid = false;
      } else if (!field.value.trim()) {
        newErrors[field.name || field.id] = true;
        isValid = false;
      }
    });

    // Photos
    if (selectedFiles.length === 0) {
      newErrors.photos = true;
      isValid = false;
    }
    // Property Proof
    if (!propertyProofFile) {
      setPropertyProofError(true);
      isValid = false;
      alert('Property proof document is required (PDF or image).');
    }

    // Coordinates (location pin)
    if (!coordinates || typeof coordinates.lat !== "number" || typeof coordinates.lng !== "number") {
      newErrors.coordinates = true;
      isValid = false;
    }

    setErrors(newErrors);

    if (!isValid) {
      alert("Please fill in all required fields marked with * (including pinning the location on the map)");
      
      if (newErrors.coordinates) {
        document.querySelector(".map-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        document.querySelector(".pl-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Append files & coordinates
    selectedFiles.forEach((file) => formData.append("images", file));
    if (propertyProofFile) {
      formData.append("propertyProof", propertyProofFile);
    }
    if (coordinates) {
      formData.append("coordinates", JSON.stringify(coordinates));
    }

    try {
      const response = await fetch('/property/list-property', {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        alert("Property listing submitted successfully! Our team will review your listing and it will be live soon.");
        window.location.href = "/owner_dashboard";
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
    setCoordinates(null);
    setErrors({});
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
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
          {/* ── Basic Information ── */}
          <div className="pl-form-section">
            <h2>Basic Information</h2>
            <div className="pl-form-row">
              <div className={`pl-form-group ${errors["property-type"] ? "pl-error" : ""}`}>
                <label htmlFor="property-type">Property Type*</label>
                <select id="property-type" name="property-type" required>
                  <option value="">Select Property Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="villa">Villa</option>
                  <option value="pg">PG/Hostel</option>
                  <option value="commercial">Commercial Space</option>
                </select>
                <span className="pl-error-message">Please select a property type</span>
              </div>

              <div className={`pl-form-group ${errors["property-subtype"] ? "pl-error" : ""}`}>
                <label htmlFor="property-subtype">Property Subtype*</label>
                <select id="property-subtype" name="property-subtype" required>
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
                <span className="pl-error-message">Please select a property subtype</span>
              </div>
            </div>

            <div className="pl-form-row">
              <div className={`pl-form-group ${errors.bedrooms ? "pl-error" : ""}`}>
                <label htmlFor="bedrooms">Bedrooms*</label>
                <select id="bedrooms" name="bedrooms" required>
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5+</option>
                </select>
                <span className="pl-error-message">Please select number of bedrooms</span>
              </div>

              <div className={`pl-form-group ${errors.bathrooms ? "pl-error" : ""}`}>
                <label htmlFor="bathrooms">Bathrooms*</label>
                <select id="bathrooms" name="bathrooms" required>
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4+">4+</option>
                </select>
                <span className="pl-error-message">Please select number of bathrooms</span>
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
              <div className={`pl-form-group pl-full-width ${errors["property-description"] ? "pl-error" : ""}`}>
                <label htmlFor="property-description">Property Description*</label>
                <textarea
                  id="property-description"
                  name="property-description"
                  rows="4"
                  required
                  placeholder="Describe your property in detail, including special features and nearby amenities"
                />
                <span className="pl-error-message">Please provide a property description</span>
              </div>
            </div>
          </div>

          {/* ── Location Details ── */}
          <div className="pl-form-section">
            <h2>Location Details</h2>
            <div className="pl-form-row">
              <div className={`pl-form-group ${errors.address ? "pl-error" : ""}`}>
                <label htmlFor="address">Complete Address*</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  placeholder="Street address"
                />
                <span className="pl-error-message">Please enter the address</span>
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
              <div className={`pl-form-group ${errors.city ? "pl-error" : ""}`}>
                <label htmlFor="city">City*</label>
                <input type="text" id="city" name="city" required placeholder="City" />
                <span className="pl-error-message">Please enter the city</span>
              </div>

              <div className={`pl-form-group ${errors.state ? "pl-error" : ""}`}>
                <label htmlFor="state">State*</label>
                <input type="text" id="state" name="state" required placeholder="State" />
                <span className="pl-error-message">Please enter the state</span>
              </div>

              <div className={`pl-form-group ${errors.pincode ? "pl-error" : ""}`}>
                <label htmlFor="pincode">Pincode*</label>
                <input type="text" id="pincode" name="pincode" required placeholder="Pincode" />
                <span className="pl-error-message">Please enter the pincode</span>
              </div>
            </div>

            {/* Map – only once! */}
            <div className="pl-form-row map-section">
              <div className={`pl-form-group pl-full-width ${errors.coordinates ? "pl-error" : ""}`}>
                <label>
                  Pin Exact Property Location on Map <span style={{ color: "red" }}>*</span>
                </label>
                <p style={{ fontSize: "0.95rem", color: "#555", margin: "8px 0 12px 0", lineHeight: "1.4" }}>
                  Click anywhere on the map or drag the red pin to mark the <strong>exact position</strong> of your property.
                </p>
                <div
                  style={{
                    height: "420px",
                    width: "100%",
                    border: errors.coordinates ? "2px dashed red" : "1px solid #ccc",
                    borderRadius: "6px",
                    overflow: "hidden",
                    marginTop: "4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                >
                  <MapContainer
                    center={coordinates || { lat: 20.5937, lng: 78.9629 }}
                    zoom={coordinates ? 15 : 5}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker
                      coordinates={coordinates}
                      setCoordinates={setCoordinates}
                      setErrors={setErrors}
                    />
                  </MapContainer>
                </div>

                {coordinates && (
                  <small style={{ color: "#2e7d32", marginTop: "10px", display: "block" }}>
                    ✓ Location pinned: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </small>
                )}
                {errors.coordinates && (
                  <span className="pl-error-message" style={{ fontWeight: "600" }}>
                    Please pin the exact location — this field is required
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Rental Details ── */}
          <div className="pl-form-section">
            <h2>Rental Details</h2>
            <div className="pl-form-row">
              <div className={`pl-form-group ${errors["rent-amount"] ? "pl-error" : ""}`}>
                <label htmlFor="rent-amount">Monthly Rent (₹)*</label>
                <input
                  type="number"
                  id="rent-amount"
                  name="rent-amount"
                  required
                  placeholder="e.g., 15000"
                />
                <span className="pl-error-message">Please enter the monthly rent</span>
              </div>

              <div className={`pl-form-group ${errors["security-deposit"] ? "pl-error" : ""}`}>
                <label htmlFor="security-deposit">Security Deposit (₹)*</label>
                <input
                  type="number"
                  id="security-deposit"
                  name="security-deposit"
                  required
                  placeholder="e.g., 30000"
                />
                <span className="pl-error-message">Please enter the security deposit</span>
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
              <div className={`pl-form-group ${errors["available-from"] ? "pl-error" : ""}`}>
                <label htmlFor="available-from">Available From*</label>
                <input type="date" id="available-from" name="available-from" required />
                <span className="pl-error-message">Please select availability date</span>
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

              <div className={`pl-form-group ${errors["lease-duration"] ? "pl-error" : ""}`}>
                <label htmlFor="lease-duration">Minimum Lease Duration*</label>
                <select id="lease-duration" name="lease-duration" required>
                  <option value="">Select</option>
                  <option value="3">3 months</option>
                  <option value="6">6 months</option>
                  <option value="11">11 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                </select>
                <span className="pl-error-message">Please select lease duration</span>
              </div>
            </div>
          </div>

          {/* ── Photos ── */}
          <div className="pl-form-section">
            <h2>Upload Photos (up to 10)</h2>
            <div className={`pl-form-group ${errors.photos ? "pl-error" : ""}`}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <div className="pl-file-upload-button" onClick={openFileDialog}>
                <span>Choose Files</span>
              </div>
              <span className="pl-error-message">Please upload at least one image</span>

              <div className="pl-preview-container">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="pl-preview-item">
                    <img src={URL.createObjectURL(file)} alt={file.name} />
                    <span className="pl-remove-preview" onClick={() => removeImage(index)}>
                      ×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Property Proof ─*/}
          <div className="pl-form-section">
            <h2>Upload Property Proof (PDF or Image)</h2>
            <div className={`pl-form-group ${propertyProofError ? "pl-error" : ""}`}>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handlePropertyProofChange}
                required
              />
              {propertyProofFile && (
                <span style={{ color: '#2e7d32', marginLeft: 8 }}>
                  ✓ {propertyProofFile.name}
                </span>
              )}
              {propertyProofError && (
                <span className="pl-error-message">Please upload a valid property proof (PDF or image).</span>
              )}
            </div>
          </div>

          {/* ── Contact Information ── */}
          <div className="pl-form-section">
            <h2>Contact Information</h2>
            <div className="pl-form-row">
              <div className={`pl-form-group ${errors["owner-name"] ? "pl-error" : ""}`}>
                <label htmlFor="owner-name">Owner Name*</label>
                <input
                  type="text"
                  id="owner-name"
                  name="owner-name"
                  required
                  placeholder="Full Name"
                />
                <span className="pl-error-message">Please enter owner name</span>
              </div>

              <div className={`pl-form-group ${errors["contact-number"] ? "pl-error" : ""}`}>
                <label htmlFor="contact-number">Contact Number*</label>
                <input
                  type="tel"
                  id="contact-number"
                  name="contact-number"
                  required
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                />
                <span className="pl-error-message">Please enter a valid 10-digit contact number</span>
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
              <div className={`pl-form-group pl-full-width ${errors["contact-email"] ? "pl-error" : ""}`}>
                <label htmlFor="contact-email">Email Address*</label>
                <input
                  type="email"
                  id="contact-email"
                  name="contact-email"
                  required
                  placeholder="Email address"
                />
                <span className="pl-error-message">Please enter a valid email address</span>
              </div>
            </div>

            <div className="pl-form-row">
              <div className={`pl-form-group pl-full-width ${errors["terms-agreement"] ? "pl-error" : ""}`}>
                <div className="pl-agreement-checkbox">
                  <input
                    type="checkbox"
                    id="terms-agreement"
                    name="terms-agreement"
                    required
                  />
                  <label htmlFor="terms-agreement">
                    I agree to RentEase's <a href="#">Terms & Conditions</a> and{" "}
                    <a href="#">Privacy Policy</a>*
                  </label>
                </div>
                <span className="pl-error-message">Please agree to the terms and conditions</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pl-form-actions">
            <button type="button" className="pl-secondary-button" onClick={resetForm}>
              Clear All
            </button>
            <button type="submit" className="pl-primary-button">
              Submit Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyListing;

// ── Helper Component ──
function LocationMarker({ coordinates, setCoordinates, setErrors }) {
  useMapEvents({
    click(e) {
      setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
      setErrors((prev) => ({ ...prev, coordinates: false }));
    },
  });

  if (!coordinates) return null;

  return (
    <Marker
      position={coordinates}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          setCoordinates({ lat: latlng.lat, lng: latlng.lng });
          setErrors((prev) => ({ ...prev, coordinates: false }));
        },
      }}
      icon={defaultMarkerIcon}
    />
  );
}