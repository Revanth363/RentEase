// src/pages/WorkerDashboard.jsx
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../assets/css/workerDashboard.css";
import CalendarTiles from "../components/CalendarTiles";
import LoadingSpinner from "../components/LoadingSpinner";
import VerificationStatus from "../components/VerificationStatus";
import RazorpayPaymentHistory from "../components/RazorpayPaymentHistory";
import { useLoading } from "../context/useLoading";

import {
  checkBookedStatus,
  deleteAccount,
  deleteService,
  generateWorkOTP,
  getDashboardData,
  getWorkHistory,
  toggleAvailability,
  updateBookingStatus,
  updateSettings,
  verifyWorkOTP,
} from "../services/workerService";

const WorkerDashboard = () => {
    const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const navigate = useNavigate();
  const { setIsLoading } = useLoading();

  const [loading, setLoading] = useState(true);
  function getSectionFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("section") || "services";
  }
  const [activeSection] = useState(getSectionFromUrl());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState({});
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [, setEarnings] = useState({ monthly: 0, pending: 0 });
  const [transactions, setTransactions] = useState([]);
  const [reviews, setReviews] = useState({
    averageRating: 0,
    count: 0,
    items: [],
  });
  const [notifications, setNotifications] = useState([]);

  // Work tracking states
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [workHistory, setWorkHistory] = useState([]);
  const [generatedOTP, setGeneratedOTP] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [, setShowOTPField] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    experience: "",
    availability: "full-time",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    smsNotifications: false,
    bookingAlerts: true,
    paymentAlerts: true,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (user && user._id) {
      (async () => {
        try {
          const res = await axios.get(`/verification/status?userId=${user._id}&userModel=worker`);
          setVerificationStatus(res.data.status);
        } catch {
          setVerificationStatus(null);
        } finally {
          setVerificationLoading(false);
        }
      })();
    } else if (!loading) {
      setVerificationLoading(false);
    }
  }, [user, loading]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await getDashboardData();

      setUser(data.user || {});
      setServices(data.services || []);
      setBookings(data.bookings || []);
      setClients(data.clients || []);
      setEarnings(data.earnings || { monthly: 0, pending: 0 });
      setTransactions(data.transactions || []);
      setReviews(data.reviews || { averageRating: 0, count: 0, items: [] });
      setNotifications(data.notifications || []);

      setFormData({
        firstName: data.user?.firstName || "",
        lastName: data.user?.lastName || "",
        email: data.user?.email || "",
        phone: data.user?.phone || "",
        location: data.user?.location || "",
        experience: data.user?.experience || "",
        availability: data.user?.availability || "full-time",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        emailNotifications: true,
        smsNotifications: false,
        bookingAlerts: true,
        paymentAlerts: true,
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        Swal.fire("Error", "Failed to load dashboard data", "error");
      }
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const showSection = (section) => {
    // Map section to URL and force reload
    const sectionToUrl = (s) => {
      switch (s) {
        case "services": return "/worker_dashboard?section=services";
        case "bookings": return "/worker_dashboard?section=bookings";
        case "clients": return "/worker_dashboard?section=clients";
        case "earnings": return "/worker_dashboard?section=earnings";
        case "transactions": return "/worker_dashboard?section=transactions";
        case "reviews": return "/worker_dashboard?section=reviews";
        case "notifications": return "/worker_dashboard?section=notifications";
        case "settings": return "/worker_dashboard?section=settings";
        case "verification": return "/worker_dashboard?section=verification";
        default: return "/worker_dashboard";
      }
    };
    window.location.href = sectionToUrl(section);
    // setActiveSection(section); // no longer needed
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleToggleAvailability = async () => {
    try {
      await toggleAvailability(user._id);
      Swal.fire("Success", "Availability updated successfully!", "success");
      loadDashboard();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.error || "Failed to update availability",
        "error"
      );
    }
  };

  const handleDeleteService = async () => {
    const result = await Swal.fire({
      title: "Delete Your Service?",
      text: "You can re-register anytime later.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        await deleteService();
        Swal.fire("Deleted!", "Your service has been removed.", "success");
        loadDashboard();
      } catch (err) {
        Swal.fire(
          "Error",
          err.response?.data?.error || "Cannot delete service",
          "error"
        );
      }
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    try {
      await updateBookingStatus(bookingId, status);
      Swal.fire("Success", `Booking ${status.toLowerCase()}!`, "success");
      loadDashboard();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.error || "Failed to update booking",
        "error"
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data } = await checkBookedStatus(user._id);
      if (data.isBooked) {
        return Swal.fire(
          "Cannot Delete",
          "You are currently working for a client.",
          "warning"
        );
      }

      const { value: password } = await Swal.fire({
        title: "Enter Your Password",
        input: "password",
        inputLabel: "Password required to delete account",
        showCancelButton: true,
      });

      if (!password) return;

      const confirm = await Swal.fire({
        title: "Delete Account Permanently?",
        text: "This action cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
      });

      if (confirm.isConfirmed) {
        await deleteAccount(user._id, password);
        Swal.fire("Deleted!", "Your account has been removed.", "success");
        navigate("/logout");
      }
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.error || "Invalid password or server error",
        "error"
      );
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const nameRegex = /^[A-Za-z\s-]+$/;
    const emailRegex =
      /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!formData.firstName) {
      Swal.fire("Validation Error", "First name is required", "error");
      return;
    }
    if (!nameRegex.test(formData.firstName)) {
      Swal.fire(
        "Validation Error",
        "First name must contain only letters, spaces, and hyphens",
        "error"
      );
      return;
    }

    if (!formData.lastName) {
      Swal.fire("Validation Error", "Last name is required", "error");
      return;
    }
    if (!nameRegex.test(formData.lastName)) {
      Swal.fire(
        "Validation Error",
        "Last name must contain only letters, spaces, and hyphens",
        "error"
      );
      return;
    }

    if (!formData.email) {
      Swal.fire("Validation Error", "Email is required", "error");
      return;
    }
    if (!emailRegex.test(formData.email)) {
      Swal.fire(
        "Validation Error",
        "Please enter a valid email address",
        "error"
      );
      return;
    }

    if (!formData.phone) {
      Swal.fire("Validation Error", "Phone number is required", "error");
      return;
    }
    if (!phoneRegex.test(formData.phone)) {
      Swal.fire(
        "Validation Error",
        "Phone number must be exactly 10 digits",
        "error"
      );
      return;
    }

    if (!formData.location) {
      Swal.fire(
        "Validation Error",
        "Service area/location is required",
        "error"
      );
      return;
    }

    if (!formData.experience && formData.experience !== "0") {
      Swal.fire("Validation Error", "Years of experience is required", "error");
      return;
    }
    const expNum = parseFloat(formData.experience);
    if (isNaN(expNum) || expNum < 0) {
      Swal.fire(
        "Validation Error",
        "Experience must be a valid number (0 or greater)",
        "error"
      );
      return;
    }
    if (expNum > 70) {
      Swal.fire(
        "Validation Error",
        "Experience must be 70 years or less",
        "error"
      );
      return;
    }

    // Password validation (only if attempting to change password)
    if (formData.newPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        Swal.fire(
          "Validation Error",
          "Current password is required to change password",
          "error"
        );
        return;
      }
      if (!formData.newPassword) {
        Swal.fire("Validation Error", "New password is required", "error");
        return;
      }
      if (formData.newPassword.length < 8) {
        Swal.fire(
          "Validation Error",
          "New password must be at least 8 characters long",
          "error"
        );
        return;
      }
      if (!/[A-Z]/.test(formData.newPassword)) {
        Swal.fire(
          "Validation Error",
          "New password must contain at least one uppercase letter",
          "error"
        );
        return;
      }
      if (!/[a-z]/.test(formData.newPassword)) {
        Swal.fire(
          "Validation Error",
          "New password must contain at least one lowercase letter",
          "error"
        );
        return;
      }
      if (!/[0-9]/.test(formData.newPassword)) {
        Swal.fire(
          "Validation Error",
          "New password must contain at least one number",
          "error"
        );
        return;
      }
      if (!formData.confirmPassword) {
        Swal.fire("Validation Error", "Confirm password is required", "error");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        Swal.fire("Error", "New passwords do not match", "error");
        return;
      }
    }

    try {
      await updateSettings(formData);
      Swal.fire("Success", "Profile updated successfully!", "success");
      loadDashboard();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.error || "Failed to update profile",
        "error"
      );
    }
  };

  const openWorkTrackingModal = async (client) => {
    setSelectedClient(client);
    setSelectedDate(null);
    setGeneratedOTP(null);
    setOtpInput("");
    setShowOTPField(false);
    try {
      const history = await getWorkHistory(client._id);
      setWorkHistory(history.data || []);
    } catch (err) {
      console.error("Error loading work history:", err);
    }
    setShowWorkModal(true);
  };

  const handleGenerateOTP = async () => {
    if (!selectedDate) {
      Swal.fire("Error", "Please select a date first", "error");
      return;
    }
    try {
      const res = await generateWorkOTP(selectedClient._id, selectedDate);
      setGeneratedOTP(res.otp);
      setShowOTPField(true);
      Swal.fire("Success", "OTP generated and tenant notified!", "success");
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to generate OTP", "error");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpInput || otpInput.length !== 4) {
      Swal.fire("Error", "Please enter a valid 4-digit OTP", "error");
      return;
    }
    try {
      const res = await verifyWorkOTP(
        selectedClient._id,
        selectedDate,
        parseInt(otpInput)
      );
      if (res.success) {
        Swal.fire("Success", "Work marked as completed!", "success");
        setSelectedDate(null);
        setGeneratedOTP(null);
        setOtpInput("");
        setShowOTPField(false);
        // Reload work history
        const history = await getWorkHistory(selectedClient._id);
        setWorkHistory(history.data || []);
      }
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Invalid OTP", "error");
    }
  };

  // Mark notifications as read when viewing the notifications section
  useEffect(() => {
    if (activeSection === "notifications" && notifications?.length > 0) {
      const newNotifications = notifications.filter(n => n.isNew === true);
      newNotifications.forEach(async (notification) => {
        try {
          await axios.post(`/workers/notifications/${notification._id}/read`);
        } catch (err) {
          console.error("Error marking notification as read:", err);
        }
      });

      // Update local state to mark as read
      setNotifications((prev) =>
        prev.map((n) =>
          n.isNew === true ? { ...n, isNew: false, read: true } : n
        )
      );
    }
  }, [activeSection, notifications]);

  if (loading || verificationLoading) {
    return <LoadingSpinner />;
  }

  const effectiveSection = !verificationLoading && verificationStatus !== "approved"
    ? (["settings", "verification"].includes(activeSection) ? activeSection : "verification")
    : activeSection;

  return (
    <div className="wrkd-dashboard-container">
      <button className="wrkd-menu-toggle" onClick={toggleSidebar}>
        <strong>{sidebarOpen ? "<" : ">"}</strong>
      </button>

      {sidebarOpen && (
        <div
          className="wrkd-overlay wrkd-active"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`wrkd-sidebar ${sidebarOpen ? "wrkd-active" : ""}`}>
        <h2>Worker Dashboard</h2>
        <h3>
          {user.firstName} {user.lastName}
        </h3>
        <ul>
          {verificationStatus !== "approved" ? (
            <>
              <li
                className={effectiveSection === "verification" ? "wrkd-sidebar-active-item" : ""}
                onClick={() => showSection("verification")}
              >
                <i className="fas fa-shield-halved"></i> Verification
              </li>
              <li
                className={effectiveSection === "settings" ? "wrkd-sidebar-active-item" : ""}
                onClick={() => showSection("settings")}
              >
                <i className="fas fa-gears"></i> Settings
              </li>
            </>
          ) : (
            <>
              <li 
                className={effectiveSection === "services" ? "wrkd-sidebar-active-item" : ""}
                onClick={() => showSection("services")}
              >
                <i className="fas fa-rectangle-list"></i> My Services
              </li>
              <li 
                className={effectiveSection === "bookings" ? "wrkd-sidebar-active-item" : ""}
                onClick={() => showSection("bookings")}
              >
                <i className="fas fa-clipboard-list"></i> Booking Requests
                {bookings?.filter(b => b.status === 'Pending' || b.isNew === true || b.read === false).length > 0 && (
                  <span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: '#dc3545', color: 'white', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px', minWidth: '24px'}}>
                    {bookings?.filter(b => b.status === 'Pending' || b.isNew === true || b.read === false).length > 99 ? '99+' : bookings?.filter(b => b.status === 'Pending' || b.isNew === true || b.read === false).length}
                  </span>
                )}
              </li>
              <li 
                className={effectiveSection === "clients" ? "wrkd-sidebar-active-item" : ""}
                onClick={() => showSection("clients")}
              >
                <i className="fas fa-users"></i> My Clients
                {clients?.filter(c => c.isNew === true || c.status === 'new').length > 0 && (
                  <span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: '#dc3545', color: 'white', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px', minWidth: '24px'}}>
                    {clients?.filter(c => c.isNew === true || c.status === 'new').length > 99 ? '99+' : clients?.filter(c => c.isNew === true || c.status === 'new').length}
                  </span>
                )}
              </li>
              <li 
                className={effectiveSection === "earnings" ? "wrkd-sidebar-active-item" : ""}
                onClick={() => showSection("earnings")}
              >
                <i className="fas fa-hand-holding-dollar"></i> Earnings
                {transactions?.filter(t => t.isNew === true || t.read === false).length > 0 && (
                  <span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: '#dc3545', color: 'white', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px', minWidth: '24px'}}>
                    {transactions?.filter(t => t.isNew === true || t.read === false).length > 99 ? '99+' : transactions?.filter(t => t.isNew === true || t.read === false).length}
                  </span>
                )}
              </li>
              <li 
                className={effectiveSection === "reviews" ? "wrkd-sidebar-active-item" : ""}
                onClick={() => showSection("reviews")}
              >
                <i className="fas fa-star-half-stroke"></i> Reviews & Ratings
                {reviews?.items?.filter(r => r.isNew === true || r.read === false).length > 0 && (
                  <span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: '#dc3545', color: 'white', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold', marginLeft: '8px', minWidth: '24px'}}>
                    {reviews?.items?.filter(r => r.isNew === true || r.read === false).length > 99 ? '99+' : reviews?.items?.filter(r => r.isNew === true || r.read === false).length}
                  </span>
                )}
              </li>
              <li 
                className={effectiveSection === "notifications" ? "wrkd-sidebar-active-item" : ""}
                onClick={() => showSection("notifications")}
              >
                <i className="fas fa-bell"></i> Notifications
                {notifications?.filter(n => n.isNew === true).length > 0 && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: '#dc3545',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginLeft: '8px',
                    minWidth: '24px'
                  }}>
                    {notifications?.filter(n => n.isNew === true).length > 99 ? '99+' : notifications?.filter(n => n.isNew === true).length}
                  </span>
                )}
              </li>
              <li 
                className={effectiveSection === "settings" ? "wrkd-sidebar-active-item" : ""}
                onClick={() => showSection("settings")}
              >
                <i className="fas fa-gears"></i> Settings
              </li>
            </>
          )}
        </ul>
      </div>

      <div className="wrkd-main-content">
        {verificationStatus !== "approved" && (
          <div className="wrkd-unverified-banner">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <div>
              <h3>Your account is not verified</h3>
              <p>Please upload your documents and wait for admin approval to access all features.</p>
            </div>
          </div>
        )}

        {verificationStatus !== "approved" && (
          <div className={`wrkd-section ${effectiveSection === "verification" ? "wrkd-active" : ""}`}>
            <h3>Account Verification</h3>
            <VerificationStatus userId={user._id} userModel="worker" />
          </div>
        )}

        {/* MY SERVICES */}
        <div
          className={`wrkd-section ${
            activeSection === "services" ? "wrkd-active" : ""
          }`}
        >
          <h3>My Services</h3>
          <div className="wrkd-prop-container">
            {services.length > 0 ? (
              services.map((service) => (
                <div key={service._id || "1"} className="wrkd-gs-container">
                  <div className="wrkd-sc-image-container">
                    <img
                      src={service.image || "/images/default_service.jpg"}
                      alt={service.name}
                      className="wrkd-sc-image"
                    />
                  </div>
                  <div className="wrkd-main-sen">{service.name}</div>
                  <div className="wrkd-sc-text">
                    <ul>
                      <li>
                        <strong>Rate:</strong> ₹{service.price}{" "}
                        {service.rateUnit}
                      </li>
                      <li>
                        <strong>Experience:</strong> {service.experience} years
                      </li>
                      <li>
                        <strong>Status:</strong> {service.serviceStatus}
                      </li>
                    </ul>
                    <div className="wrkd-prop-view">
                      <button className="wrkd-prop-button" onClick={() => navigate(`/worker/${user._id}`)}>
                        Service Details
                      </button>
                      <button className="wrkd-primary-button" onClick={handleToggleAvailability}>
                        Toggle Availability
                      </button>
                      <button className="wrkd-danger-button" onClick={handleDeleteService}>
                        Delete Service
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>
                No service registered.{" "}
                <span
                  style={{
                    color: "blue",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                  onClick={() => navigate("/worker_register")}
                >
                  Add Service
                </span>
              </p>
            )}
          </div>
        </div>

        {/* BOOKINGS */}
        <div
          className={`wrkd-section ${
            effectiveSection === "bookings" ? "wrkd-active" : ""
          }`}
        >
          <h3>My Bookings</h3>
          <div className="wrkd-complaint-container">
            {bookings.length === 0 ? (
              <p>No bookings yet.</p>
            ) : (
              bookings.map((booking) => (
                <div key={booking._id} className="wrkd-res-complaint">
                  <strong>{booking.serviceName || "Service"}</strong>
                  <ul>
                    <li>
                      <strong>Client:</strong> {booking.tenantId?.firstName}{" "}
                      {booking.tenantId?.lastName}
                    </li>
                    <li>
                      <strong>Address:</strong>{" "}
                      {booking.propertyId?.address || "N/A"}
                    </li>
                    <li>
                      <strong>Date:</strong> {booking.date}
                    </li>
                    <li>
                      <strong>Time:</strong> {booking.time}
                    </li>
                    <li>
                      <strong>Service Start Date:</strong>{" "}
                      {booking.preferredDate
                        ? new Date(booking.preferredDate).toLocaleDateString()
                        : "Not specified"}
                    </li>
                    <li>
                      <strong>Status:</strong> {booking.status}
                    </li>
                  </ul>
                  {booking.status === "Pending" && (
                    <>
                      <button
                        className="wrkd-update-sts"
                        onClick={() =>
                          handleBookingAction(booking._id, "Approved")
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="wrkd-update-sts"
                        onClick={() =>
                          handleBookingAction(booking._id, "Declined")
                        }
                        style={{ background: "red" }}
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* CLIENTS */}
        <div
          className={`wrkd-section ${
            effectiveSection === "clients" ? "wrkd-active" : ""
          }`}
        >
          <h3>My Clients ({clients.length})</h3>
          {clients.length === 0 ? (
            <p>No active clients at the moment.</p>
          ) : (
            <div className="wrkd-messages">
              {clients.map((client) => (
                <div key={client._id} className="wrkd-tentant-details">
                  <strong>
                    {client.firstName} {client.lastName}
                  </strong>
                  <ul>
                    <li>
                      <strong>Services:</strong>{" "}
                      {client.services?.join(", ") || "N/A"}
                    </li>
                    <li>
                      <strong>Phone:</strong> {client.phone || "N/A"}
                    </li>
                    <li>
                      <strong>Email:</strong> {client.email || "N/A"}
                    </li>
                    <li>
                      <strong>Address:</strong> {client.address || "No address"}
                    </li>
                    <li>
                      <strong>Location:</strong> {client.location || "N/A"}
                    </li>
                    {client.bookingDate && (
                      <li>
                        <strong>Booked Since:</strong>{" "}
                        {new Date(client.bookingDate).toLocaleDateString()}
                      </li>
                    )}
                  </ul>
                  <button
                    className="wrkd-track-work-btn"
                    onClick={() => openWorkTrackingModal(client)}
                  >
                    <i className="fas fa-calendar"></i> Track Work
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EARNINGS */}
        <div
          className={`wrkd-section ${
            effectiveSection === "earnings" ? "wrkd-active" : ""
          }`}
        >
          <h3>My Earnings</h3>
          <RazorpayPaymentHistory
            historyType="worker-payments"
            className="wrkd-earnings-table"
            showSummary={true}
          />
        </div>

        {/* REVIEWS */}
        <div
          className={`wrkd-section ${
            effectiveSection === "reviews" ? "wrkd-active" : ""
          }`}
        >
          <h3>Reviews & Ratings</h3>
          <p>
            Overall Rating: <strong>{reviews.averageRating || 0}/5</strong> (
            {reviews.count || 0} reviews)
          </p>
          <div className="wrkd-complaint-container">
            {reviews.items?.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              reviews.items.map((review) => (
                <div
                  key={review._id || Math.random()}
                  className="wrkd-res-complaint"
                >
                  <strong>
                    {review.user || "Anonymous"} -{" "}
                    {"★".repeat(review.rating || 0)}
                  </strong>
                  <ul>
                    <li>
                      <strong>Service:</strong> {review.serviceName || "N/A"}
                    </li>
                    <li>
                      <strong>Date:</strong> {review.date || "N/A"}
                    </li>
                    <li>
                      <strong>Comment:</strong> {review.comment || "No comment"}
                    </li>
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div
          className={`wrkd-section ${
            effectiveSection === "notifications" ? "wrkd-active" : ""
          }`}
        >
          <h3>Notifications</h3>
          <div className="wrkd-notification-container">
            {notifications.length === 0 ? (
              <p>No notifications.</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`wrkd-notification-card ${
                    notif.read ? "wrkd-read" : "wrkd-unread"
                  }`}
                >
                  <div className="wrkd-notification-header">
                    <strong>{notif.type || "Info"}</strong>
                  </div>
                  <p>
                    <strong>Message:</strong> {notif.message}
                  </p>
                  {notif.tenantName && (
                    <p>
                      <strong>From:</strong> {notif.tenantName}
                    </p>
                  )}
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(notif.createdDate).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SETTINGS */}
        <div
          className={`wrkd-section ${
            effectiveSection === "settings" ? "wrkd-active" : ""
          }`}
        >
          <h3>Account Settings</h3>
          <form onSubmit={handleSettingsSubmit}>
            <div className="wrkd-settings-container">
              <div className="wrkd-settings-section">
                <h4>Personal Information</h4>
                <div className="wrkd-form-row">
                  <div className="wrkd-form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="wrkd-form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="wrkd-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="wrkd-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="wrkd-settings-section">
                <h4>Worker Information</h4>
                <div className="wrkd-form-group">
                  <label>Service Area (City, Area)</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
                <div className="wrkd-form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) =>
                      setFormData({ ...formData, experience: e.target.value })
                    }
                  />
                </div>
                <div className="wrkd-form-group">
                  <label>Availability</label>
                  <select
                    value={formData.availability}
                    onChange={(e) =>
                      setFormData({ ...formData, availability: e.target.value })
                    }
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="weekends">Weekends Only</option>
                  </select>
                </div>
              </div>

              <div className="wrkd-settings-section">
                <h4>Change Password (Optional)</h4>
                <div className="wrkd-form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="wrkd-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                  />
                </div>
                <div className="wrkd-form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="wrkd-button-container">
              <button
                type="submit"
                className="wrkd-settings-button wrkd-primary-button"
              >
                Save Changes
              </button>
              <button
                type="button"
                className="wrkd-settings-button wrkd-secondary-button"
                onClick={loadDashboard}
              >
                Cancel
              </button>
              <button
                type="button"
                className="wrkd-danger-button"
                onClick={handleDeleteAccount}
              >
                Delete Account
              </button>
            </div>
          </form>
        </div>

        {/* WORK TRACKING MODAL */}
        {showWorkModal && selectedClient && (
          <div
            className="wrkd-modal-overlay"
            onClick={() => setShowWorkModal(false)}
          >
            <div
              className="wrkd-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="wrkd-modal-header">
                <h4>
                  Track Work - {selectedClient.firstName}{" "}
                  {selectedClient.lastName}
                </h4>
                <button
                  className="wrkd-modal-close"
                  onClick={() => setShowWorkModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="wrkd-modal-body">
                {/* Calendar */}
                <div className="wrkd-calendar-section">
                  <h5>Select Work Date</h5>
                  <div className="wrkd-calendar-container">
                    <CalendarTiles
                      selectedDate={selectedDate}
                      onSelect={(dateStr) => {
                        setSelectedDate(dateStr);
                        setGeneratedOTP(null);
                        setOtpInput("");
                        setShowOTPField(false);
                      }}
                      completedDates={workHistory}
                    />
                  </div>
                </div>

                {/* OTP Section */}
                <div className="wrkd-otp-section">
                  <button
                    className={`wrkd-generate-otp-btn ${
                      selectedDate ? "" : "wrkd-disabled"
                    }`}
                    onClick={handleGenerateOTP}
                    disabled={!selectedDate}
                  >
                    Generate OTP
                  </button>

                  {generatedOTP && (
                    <div
                      className="wrkd-otp-info"
                      style={{ marginTop: "15px" }}
                    >
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#333",
                          marginBottom: "10px",
                        }}
                      >
                        OTP has been sent to tenant. Enter it below:
                      </p>
                      <input
                        type="number"
                        inputMode="numeric"
                        maxLength="4"
                        placeholder="Enter 4-digit OTP"
                        value={otpInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.length <= 4) setOtpInput(val);
                        }}
                        className="wrkd-otp-input"
                        style={{
                          width: "100%",
                          padding: "10px",
                          marginBottom: "10px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "16px",
                        }}
                      />
                      <button
                        className="wrkd-verify-otp-btn"
                        onClick={handleVerifyOTP}
                        disabled={otpInput.length !== 4}
                      >
                        Verify OTP
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerDashboard;

