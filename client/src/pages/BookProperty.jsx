import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function BookProperty() {
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
      style={styles.overlay}
      onClick={() => navigate(`/property?id=${propertyId}`)}
    >
      <div
        style={styles.popup}
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking popup
      >
        <h3 style={{ textAlign: "center", marginBottom: 20 }}>Book Property</h3>

        <form onSubmit={handleSubmit}>
          {/* FULL NAME */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              value={`${user.firstName} ${user.lastName}`}
              readOnly
              style={styles.input}
            />
          </div>

          {/* EMAIL */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={user.email}
              readOnly
              style={styles.input}
            />
          </div>

          {/* PHONE */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="text"
              value={user.phone}
              readOnly
              style={styles.input}
            />
          </div>

          {/* BUTTONS */}
          <div style={styles.buttons}>
            <button
              type="button"
              style={styles.cancel}
              onClick={() => navigate(`/property?id=${propertyId}`)}
            >
              Cancel
            </button>

            <button type="submit" style={styles.submit}>
              Submit Booking
            </button>
          </div>
        </form>

        {submitMessage && (
          <p style={{ color: "green", textAlign: "center" }}>{submitMessage}</p>
        )}
        {errorMessage && (
          <p style={{ color: "red", textAlign: "center" }}>{errorMessage}</p>
        )}
      </div>
    </div>
  );
}

// CSS Styles
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    background: "white",
    width: "90%",
    maxWidth: 420,
    padding: 20,
    borderRadius: 8,
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
  },
  formGroup: { marginBottom: 15 },
  label: { fontWeight: "bold", marginBottom: 5, display: "block" },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#f0f0f0",
  },
  buttons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancel: {
    padding: "10px 20px",
    background: "#ccc",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
  },
  submit: {
    padding: "10px 20px",
    background: "#ffc107",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    color: "black",
    fontWeight: "600",
  },
};
