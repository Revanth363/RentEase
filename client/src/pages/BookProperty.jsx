import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "../assets/css/BookProperty.module.css";

const BookProperty = () => {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("id");

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch current user session
  useEffect(() => {
    fetch("/api/check-session", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.user || data.user.userType !== "tenant") {
          navigate(`/login?redirect=/book-property?id=${propertyId}`);
        } else {
          setUser(data.user);
        }
      });
  }, [navigate, propertyId]);

  if (!user) return null; // Wait until user loads

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/bookings/book-property", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          startDate: new Date().toISOString(), // backend requires date
          leaseDuration: 6,
          comments: "",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage("Booking request submitted successfully!");
        setErrorMessage("");

        setTimeout(() => {
          navigate("/tenant/tenant_dashboard");
        }, 1500);
      } else {
        setErrorMessage(result.message || "Booking failed");
        setSubmitMessage("");
      }
    } catch (err) {
      setErrorMessage(err.message);
      setSubmitMessage("");
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={() => navigate(`/property?id=${propertyId}`)}
    >
      <div
        className={styles.popup}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>Book Property</h3>
          <button
            className={styles.closeBtn}
            onClick={() => navigate(`/property?id=${propertyId}`)}
            type="button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* FULL NAME */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              className={styles.input}
              value={`${user.firstName} ${user.lastName}`}
              readOnly
            />
          </div>

          {/* EMAIL */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={user.email}
              readOnly
            />
          </div>

          {/* PHONE */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Phone Number</label>
            <input
              type="tel"
              className={styles.input}
              placeholder="Enter your phone number"
              value={user.phone || ""}
              onChange={(e) => setUser({ ...user, phone: e.target.value })}
            />
          </div>

          {/* BUTTONS */}
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate(`/property?id=${propertyId}`)}
            >
              Cancel
            </button>

            <button type="submit" className={styles.submitBtn}>
              Submit Booking
            </button>
          </div>
        </form>

        {submitMessage && (
          <div className={`${styles.messageContainer} ${styles.successMessage}`}>
            {submitMessage}
          </div>
        )}
        {errorMessage && (
          <div className={`${styles.messageContainer} ${styles.errorMessage}`}>
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookProperty;
