import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const WorkerRegister = () => {
  const navigate = useNavigate();

  // Mock user data (in real app, fetch from auth context or API)
  const [user, setUser] = useState(null); // You can populate this via API or context

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    serviceType: "",
    experience: "",
    description: "",
    price: "",
    availability: "",
    city: "",
    area: "",
    image: null,
    termsAgreement: false,
  });

  const [errors, setErrors] = useState({});
  const [areas, setAreas] = useState([]);

  const areasByCity = {
    delhi: ["karol bagh", "connaught place", "dwarka", "rohini"],
    mumbai: ["andheri", "bandra", "juhu", "colaba"],
    bangalore: ["koramangala", "indiranagar", "whitefield", "jp nagar"],
    chennai: ["t nagar", "anna nagar", "adyar", "mylapore"],
    sricity: ["central", "north", "south"],
  };

  useEffect(() => {
    // Simulate fetching current user profile
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/workers/me");
        const u = res.data.user;
        setUser(u);
        setFormData({
          fullName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
          phone: u.phone || "",
          email: u.email || "",
          serviceType: u.serviceType || "",
          experience: u.experience || "",
          description: u.description || "",
          price: u.price || "",
          availability: u.availability || "",
          city: u.city || "",
          area: u.area || "",
          image: null,
          termsAgreement: false,
        });
        if (u.city) updateAreas(u.city, u.area);
      } catch (err) {
        console.log("Not logged in or no profile yet");
      }
    };
    fetchUser();
  }, []);

  const updateAreas = (selectedCity, preselectArea = null) => {
    const city = selectedCity || formData.city;
    if (!city) {
      setAreas([]);
      setFormData((prev) => ({ ...prev, area: "" }));
      return;
    }
    const cityAreas = areasByCity[city] || [];
    setAreas(cityAreas);
    if (preselectArea && cityAreas.includes(preselectArea)) {
      setFormData((prev) => ({ ...prev, area: preselectArea }));
    } else if (!preselectArea) {
      setFormData((prev) => ({ ...prev, area: "" }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === "city") {
        updateAreas(value);
      }
    }
    // Clear error on change
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = true;
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) newErrors.phone = true;
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = true;
    if (!formData.serviceType) newErrors.serviceType = true;
    if (!formData.experience || formData.experience < 0) newErrors.experience = true;
    if (!formData.description) newErrors.description = true;
    if (!formData.price || formData.price < 1000) newErrors.price = true;
    if (!formData.availability) newErrors.availability = true;
    if (!formData.city) newErrors.city = true;
    if (!formData.area) newErrors.area = true;
    if (!formData.termsAgreement) newErrors.termsAgreement = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Please fill in all required fields correctly.");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== false) {
        data.append(key, formData[key]);
      }
    });

    try {
      await axios.post("/api/workers/register", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Profile updated successfully! Redirecting to dashboard.");
      navigate("/worker_dashboard");
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
      phone: user?.phone || "",
      email: user?.email || "",
      serviceType: user?.serviceType || "",
      experience: user?.experience || "",
      description: user?.description || "",
      price: user?.price || "",
      availability: user?.availability || "",
      city: user?.city || "",
      area: user?.area || "",
      image: null,
      termsAgreement: false,
    });
    setAreas([]);
    setErrors({});
  };

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", paddingTop: "80px" }}>
      <div className="page-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ color: "#000" }}>Worker Profile Update</h1>
          <p style={{ color: "#333" }}>
            Update your profile details below to manage your service on RentEase
          </p>
        </div>

        <div
          className="registration-form-container"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <form id="worker-registration-form" onSubmit={handleSubmit} encType="multipart/form-data">
            {/* Personal Information */}
            <div className="form-section" style={{ marginBottom: "20px" }}>
              <h2 style={{ color: "#000" }}>Personal Information</h2>
              <div className="form-row" style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>Full Name*</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className={errors.fullName ? "error" : ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      borderColor: errors.fullName ? "red" : "#ccc",
                      color: "#000",
                    }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>Phone Number*</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                    className={errors.phone ? "error" : ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      borderColor: errors.phone ? "red" : "#ccc",
                      color: "#000",
                    }}
                  />
                </div>
              </div>
              <div className="form-row" style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "10px" }}>
                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>Email Address*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email address"
                    className={errors.email ? "error" : ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      borderColor: errors.email ? "red" : "#ccc",
                      color: "#000",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="form-section" style={{ marginBottom: "20px" }}>
              <h2 style={{ color: "#000" }}>Service Details</h2>
              <div className="form-row" style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>Service Type*</label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleChange}
                    required
                    className={errors.serviceType ? "error" : ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      borderColor: errors.serviceType ? "red" : "#ccc",
                      color: "#000",
                    }}
                  >
                    <option value="">Select Service Type</option>
                    <option value="Housekeeper">Housekeeper</option>
                    <option value="Cook">Cook</option>
                    <option value="Nanny">Nanny</option>
                    <option value="Gardener">Gardener</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>Years of Experience*</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                    min="0"
                    max="50"
                    className={errors.experience ? "error" : ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      borderColor: errors.experience ? "red" : "#ccc",
                      color: "#000",
                    }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: "10px" }}>
                <div className="form-group full-width" style={{ flex: "100%" }}>
                  <label>Skills & Expertise*</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    required
                    placeholder="Describe your skills and expertise"
                    className={errors.description ? "error" : ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      borderColor: errors.description ? "red" : "#ccc",
                      color: "#000",
                    }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginTop: "10px" }}>
                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>Expected Monthly Salary (₹)*</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="1000"
                    className={errors.price ? "error" : ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      borderColor: errors.price ? "red" : "#ccc",
                      color: "#000",
                    }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>Availability*</label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    required
                    className={errors.availability ? "error" : ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      borderColor: errors.availability ? "red" : "#ccc",
                      color: "#000",
                    }}
                  >
                    <option value="">Select Availability</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="weekends">Weekends Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="form-section" style={{ marginBottom: "20px" }}>
              <h2 style={{ color: "#000" }}>Location Details</h2>
              <div className="form-row" style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>City*</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className={errors.city ? "error" : ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      borderColor: errors.city ? "red" : "#ccc",
                      color: "#000",
                    }}
                  >
                    <option value="">Select City</option>
                    <option value="delhi">Delhi</option>
                    <option value="mumbai">Mumbai</option>
                    <option value="bangalore">Bangalore</option>
                    <option value="chennai">Chennai</option>
                    <option value="sricity">Sricity</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
                  <label>Preferred Area*</label>
                  <select
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    required
                    disabled={!formData.city}
                    className={errors.area ? "error" : ""}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      borderColor: errors.area ? "red" : "#ccc",
                      color: "#000",
                    }}
                  >
                    <option value="">Select Area</option>
                    {areas.map((area) => (
                      <option key={area} value={area}>
                        {area.charAt(0).toUpperCase() + area.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="form-section" style={{ marginBottom: "20px" }}>
              <h2 style={{ color: "#000" }}>Documents</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Recent Photo*</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                  />
                  {user?.image && (
                    <p style={{ color: "#333", marginTop: "8px" }}>
                      Current Photo:{" "}
                      <a href={user.image} target="_blank" rel="noopener noreferrer" style={{ color: "#007bff" }}>
                        View
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="form-section">
              <div className="form-group full-width">
                <div
                  className="agreement-checkbox"
                  style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginTop: "10px" }}
                >
                  <input
                    type="checkbox"
                    id="terms-agreement"
                    name="termsAgreement"
                    checked={formData.termsAgreement}
                    onChange={handleChange}
                    required
                    style={{ width: "18px", height: "18px", marginTop: "2px" }}
                  />
                  <label htmlFor="terms-agreement" style={{ margin: 0, lineHeight: "1.4", color: "#000" }}>
                    I agree to RentEase's{" "}
                    <a href="/termsofservice" style={{ color: "#007bff" }}>
                      Terms & Conditions
                    </a>{" "}
                    and{" "}
                    <a href="/privacy_policy" style={{ color: "#007bff" }}>
                      Privacy Policy
                    </a>
                    *
                  </label>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div
              className="form-actions"
              style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={handleReset}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Clear All
              </button>
              <button
                type="submit"
                className="primary-button"
                style={{
                  backgroundColor: "#ffc109",
                  color: "black",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#218838")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffc109")}
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkerRegister;