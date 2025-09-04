// src/pages/WorkerRegister.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerWorker, getDashboardData } from "../services/workerService";
import "../assets/css/workerRegister.css";

const WorkerRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    "full-name": "",
    phone: "",
    email: "",
    "service-type": "",
    experience: "",
    description: "",
    price: "",
    availability: "",
    city: "",
    area: "",
    image: null,
    "terms-agreement": false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Area data - matching EJS exactly
  const areasByCity = {
    delhi: ["karol bagh", "connaught place", "dwarka", "rohini"],
    mumbai: ["andheri", "bandra", "juhu", "colaba"],
    bangalore: ["koramangala", "indiranagar", "whitefield", "jp nagar"],
    chennai: ["t nagar", "anna nagar", "adyar", "mylapore"],
    sricity: ["central", "north", "south"],
  };

  // Load current worker profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getDashboardData();
        const user = data.user;

        setCurrentUser(user);

        // Pre-fill form - matching EJS exactly
        setFormData({
          "full-name":
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : "",
          phone: user.phone || "",
          email: user.email || "",
          "service-type": user.serviceType || "",
          experience: user.experience || "",
          description: user.description || "",
          price: user.price || "",
          availability: user.availability || "",
          city: user.city || "",
          area: user.area || "",
          image: null,
          "terms-agreement": false,
        });

        // Set areas if city exists
        if (user.city) {
          const cityKey = user.city.toLowerCase();
          if (areasByCity[cityKey]) {
            setAreas(areasByCity[cityKey]);
          }
        }
      } catch (e) {
        console.error(e);
        console.log("No profile yet or not logged in");
      }
    };
    loadProfile();
  }, [areasByCity]);

  // Update areas based on city - matching EJS updateAreas() function
  const updateAreas = (cityValue) => {
    if (!cityValue) {
      setAreas([]);
      return;
    }

    const cityKey = cityValue.toLowerCase();
    const cityAreas = areasByCity[cityKey] || [];
    setAreas(cityAreas);
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let val;

    if (type === "checkbox") {
      val = checked;
    } else if (type === "file") {
      val = files[0];
    } else {
      val = value;
    }

    setFormData((prev) => ({ ...prev, [name]: val }));

    // Update areas when city changes
    if (name === "city") {
      updateAreas(value);
      setFormData((prev) => ({ ...prev, area: "" })); // Reset area
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validation with regex - matching EJS validation
  const validateForm = () => {
    const newErrors = {};

    // Full name validation
    if (!formData["full-name"] || formData["full-name"].trim() === "") {
      newErrors["full-name"] = "Full name is required";
    }

    // Phone validation - exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    // Service type validation
    if (!formData["service-type"]) {
      newErrors["service-type"] = "Service type is required";
    }

    // Experience validation
    if (!formData.experience) {
      newErrors.experience = "Experience is required";
    } else if (formData.experience < 0 || formData.experience > 50) {
      newErrors.experience = "Experience must be between 0 and 50 years";
    }

    // Description validation
    if (!formData.description || formData.description.trim() === "") {
      newErrors.description = "Skills & Expertise is required";
    }

    // Price validation
    if (!formData.price) {
      newErrors.price = "Expected salary is required";
    }

    // Availability validation
    if (!formData.availability) {
      newErrors.availability = "Availability is required";
    }

    // City validation
    if (!formData.city) {
      newErrors.city = "City is required";
    }

    // Area validation
    if (!formData.area) {
      newErrors.area = "Preferred area is required";
    }

    // Terms agreement validation
    if (!formData["terms-agreement"]) {
      newErrors["terms-agreement"] = "You must agree to Terms & Conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset form - matching EJS resetForm()
  const resetForm = () => {
    setFormData({
      "full-name": "",
      phone: "",
      email: "",
      "service-type": "",
      experience: "",
      description: "",
      price: "",
      availability: "",
      city: "",
      area: "",
      image: null,
      "terms-agreement": false,
    });
    setAreas([]);
    setErrors({});
  };

  // Form submission - matching EJS exactly
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      alert("Please fill in all required fields marked with *");
      return;
    }

    setLoading(true);

    const form = new FormData();

    // Append all form data - matching backend expectations
    Object.keys(formData).forEach((key) => {
      if (key === "image" && formData[key]) {
        form.append(key, formData[key]);
      } else if (key === "terms-agreement") {
        // Backend expects "on" for checked checkboxes
        if (formData[key]) {
          form.append(key, "on");
        }
      } else if (
        key !== "image" &&
        formData[key] !== null &&
        formData[key] !== false &&
        formData[key] !== ""
      ) {
        form.append(key, formData[key]);
      }
    });

    try {
      const response = await registerWorker(form);

      if (response.success) {
        alert("Profile updated successfully! Redirecting to dashboard.");
        navigate("/worker_dashboard");
      } else {
        alert("Error updating profile: " + (response.error || "Unknown error"));
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || "Failed to update profile";
      alert("Error updating profile: " + errorMsg);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="worker-register-page">
      <div className="worker-register-page-container">
        <div className="worker-register-page-header">
          <h1>Worker Profile Update</h1>
          <p>
            Update your profile details below to manage your service on RentEase
          </p>
        </div>

        <div className="worker-register-registration-form-container">
          <form id="worker-registration-form" onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="worker-register-form-section">
              <h2>Personal Information</h2>

              <div className="worker-register-form-row">
                <div className="worker-register-form-group">
                  <label htmlFor="full-name">Full Name*</label>
                  <input
                    type="text"
                    id="full-name"
                    name="full-name"
                    value={formData["full-name"]}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={errors["full-name"] ? "error" : ""}
                  />
                  {errors["full-name"] && (
                    <span className="worker-register-error-message">
                      {errors["full-name"]}
                    </span>
                  )}
                </div>

                <div className="worker-register-form-group">
                  <label htmlFor="phone">Phone Number*</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                    className={errors.phone ? "error" : ""}
                  />
                  {errors.phone && (
                    <span className="worker-register-error-message">
                      {errors.phone}
                    </span>
                  )}
                </div>
              </div>

              <div className="worker-register-form-row">
                <div className="worker-register-form-group">
                  <label htmlFor="email">Email Address*</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className={errors.email ? "error" : ""}
                  />
                  {errors.email && (
                    <span className="worker-register-error-message">
                      {errors.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="worker-register-form-section">
              <h2>Service Details</h2>

              <div className="worker-register-form-row">
                <div className="worker-register-form-group">
                  <label htmlFor="service-type">Service Type*</label>
                  <select
                    id="service-type"
                    name="service-type"
                    value={formData["service-type"]}
                    onChange={handleChange}
                    className={errors["service-type"] ? "error" : ""}
                  >
                    <option value="">Select Service Type</option>
                    <option value="Housekeeper">Housekeeper</option>
                    <option value="Cook">Cook</option>
                    <option value="Nanny">Nanny</option>
                    <option value="Gardener">Gardener</option>
                  </select>
                  {errors["service-type"] && (
                    <span className="worker-register-error-message">
                      {errors["service-type"]}
                    </span>
                  )}
                </div>

                <div className="worker-register-form-group">
                  <label htmlFor="experience">Years of Experience*</label>
                  <input
                    type="number"
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    min="0"
                    max="50"
                    className={errors.experience ? "error" : ""}
                  />
                  {errors.experience && (
                    <span className="worker-register-error-message">
                      {errors.experience}
                    </span>
                  )}
                </div>
              </div>

              <div className="worker-register-form-row">
                <div className="worker-register-form-group full-width">
                  <label htmlFor="description">Skills & Expertise*</label>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your skills and expertise"
                    className={errors.description ? "error" : ""}
                  />
                  {errors.description && (
                    <span className="worker-register-error-message">
                      {errors.description}
                    </span>
                  )}
                </div>
              </div>

              <div className="worker-register-form-row">
                <div className="worker-register-form-group">
                  <label htmlFor="price">Expected Daily Salary (₹)*</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="1000"
                    className={errors.price ? "error" : ""}
                  />
                  {errors.price && (
                    <span className="worker-register-error-message">
                      {errors.price}
                    </span>
                  )}
                </div>

                <div className="worker-register-form-group">
                  <label htmlFor="availability">Availability*</label>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className={errors.availability ? "error" : ""}
                  >
                    <option value="">Select Availability</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="weekends">Weekends Only</option>
                  </select>
                  {errors.availability && (
                    <span className="worker-register-error-message">
                      {errors.availability}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="worker-register-form-section">
              <h2>Location Details</h2>

              <div className="worker-register-form-row">
                <div className="worker-register-form-group">
                  <label htmlFor="city">City*</label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={errors.city ? "error" : ""}
                  >
                    <option value="">Select City</option>
                    <option value="delhi">Delhi</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="bangalore">Bangalore</option>
                    <option value="chennai">Chennai</option>
                    <option value="sricity">Sricity</option>
                  </select>
                  {errors.city && (
                    <span className="worker-register-error-message">
                      {errors.city}
                    </span>
                  )}
                </div>

                <div className="worker-register-form-group">
                  <label htmlFor="area">Preferred Area*</label>
                  <select
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    disabled={!formData.city}
                    className={errors.area ? "error" : ""}
                  >
                    <option value="">
                      {formData.city ? "Select Area" : "First select city"}
                    </option>
                    {areas.map((area) => (
                      <option key={area} value={area}>
                        {area.charAt(0).toUpperCase() + area.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.area && (
                    <span className="worker-register-error-message">
                      {errors.area}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="worker-register-form-section">
              <h2>Documents</h2>

              <div className="worker-register-form-row">
                <div className="worker-register-form-group">
                  <label htmlFor="image">Recent Photo*</label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                  />
                  {currentUser?.image && (
                    <p className="worker-register-current-photo">
                      Current Photo:{" "}
                      <a
                        href={currentUser.image}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="worker-register-form-section">
              <div className="worker-register-form-group full-width">
                <div className="worker-register-agreement-checkbox">
                  <input
                    type="checkbox"
                    id="terms-agreement"
                    name="terms-agreement"
                    checked={formData["terms-agreement"]}
                    onChange={handleChange}
                  />
                  <label htmlFor="terms-agreement">
                    I agree to RentEase's{" "}
                    <a href="/termsofservice">Terms & Conditions</a> and{" "}
                    <a href="/privacy_policy">Privacy Policy</a>*
                  </label>
                </div>
                {errors["terms-agreement"] && (
                  <span className="worker-register-error-message">
                    {errors["terms-agreement"]}
                  </span>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="worker-register-form-actions">
              <button
                type="button"
                className="worker-register-secondary-button"
                onClick={resetForm}
              >
                Clear All
              </button>
              <button
                type="submit"
                className="worker-register-primary-button"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkerRegister;
