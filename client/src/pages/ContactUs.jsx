import { useState } from "react";

import "../assets/css/ContactUs.css"; 

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [modal, setModal] = useState({ show: false, message: "", type: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setModal({ show: true, message: "Please enter your name." });
      return;
    }
    if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      setModal({
        show: true,
        message: "Name can only contain letters and spaces.",
      });
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(formData.email)) {
      setModal({
        show: true,
        message: "Please enter a valid Gmail address (e.g., example@gmail.com)",
        type: "error",
      });
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      setModal({
        show: true,
        message: "Please enter a valid 10-digit phone number",
        type: "error",
      });
      return;
    }

    setModal({
      show: true,
      message: "Submitting your message...",
      type: "loading",
    });

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/submit-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setModal({
          show: true,
          message: "Thank you! We will get back to you shortly.",
          type: "success",
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      } else {
        setModal({
          show: true,
          message: result.error || "Submission failed. Please try again.",
          type: "error",
        });
      }
    } catch (_e) {
      console.error(_e);
      setModal({
        show: true,
        message: "Network error. Is your backend running on port 3000?",
        type: "error",
      });
    }
  };

  const closeModal = () => setModal({ show: false, message: "", type: "" });

  return (
    <>
      {/* THIS IS THE ONLY CHANGE – wraps everything safely */}
      <div className="contact-us-page-wrapper">
        <div className="whole_container">
          <div className="container">
            <div className="contact-section">
              {/* Contact Info */}
              <div className="contact-info">
                <h2>Get in Touch</h2>
                <div className="info-item">
                  <h3>Address</h3>
                  <p>Sri City, Andhra Pradesh, India</p>
                  <p>194025</p>
                </div>
                <div className="info-item">
                  <h3>Phone</h3>
                  <p>Customer Support: +91 9949169887</p>
                  <p>Business Inquiries: +91 890-765-4321</p>
                </div>
                <div className="info-item">
                  <h3>Email</h3>
                  <p>contact@rentease.com</p>
                </div>
                <div className="info-item">
                  <h3>Office Hours</h3>
                  <p>Monday to Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 10:00 AM - 4:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="contact-form">
                <h2>Send us a Message</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10 digits only"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className="form-control"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Your Message</label>
                    <textarea
                      id="message"
                      name="message"
                      className="form-control"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <button type="submit" className="btn">
                    Submit Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* YOUR ORIGINAL MODAL – 100% untouched */}
        <div
          className="modal"
          style={{ display: modal.show ? "flex" : "none" }}
        >
          <div className="modal-content">
            <span className="close-button" onClick={closeModal}>
              ×
            </span>
            <p
              style={{
                color:
                  modal.type === "success"
                    ? "green"
                    : modal.type === "error"
                    ? "red"
                    : "#333",
                fontWeight: "bold",
              }}
            >
              {modal.message}
            </p>
          </div>
        </div>
      </div>{" "}
      {/* ← end of .contact-us-page-wrapper */}
    </>
  );
};

export default ContactUs;
