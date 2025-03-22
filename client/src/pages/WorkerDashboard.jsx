// src/pages/WorkerDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../assets/css/workerDashboard.css";

const WorkerDashboard = () => {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("services");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState({});
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [earnings, setEarnings] = useState({ monthly: 0, pending: 0 });
  const [transactions, setTransactions] = useState([]);
  const [reviews, setReviews] = useState({ averageRating: 0, count: 0, items: [] });
  const [notifications, setNotifications] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", location: "", experience: "",
    availability: "full-time", currentPassword: "", newPassword: "", confirmPassword: "",
    emailNotifications: true, smsNotifications: false, bookingAlerts: true, paymentAlerts: true,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get("/api/worker/dashboard", { withCredentials: true });
      const data = res.data;

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
        emailNotifications: data.user?.emailNotifications ?? true,
        smsNotifications: data.user?.smsNotifications ?? false,
        bookingAlerts: data.user?.bookingAlerts ?? true,
        paymentAlerts: data.user?.paymentAlerts ?? true,
      });
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
    }
  };

  const showSection = (section) => {
    setActiveSection(section);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleToggleAvailability = async () => {
    try {
      const res = await axios.post(`/api/workers/${user._id}/toggle`);
      Swal.fire("Success", `Service is now ${res.data.serviceStatus}`, "success");
      fetchDashboardData();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Failed", "error");
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
        await axios.post("/api/workers/delete-service");
        Swal.fire("Deleted!", "Service removed.", "success");
        fetchDashboardData();
      } catch (err) {
        Swal.fire("Error", err.response?.data?.error || "Failed", "error");
      }
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await axios.post(`/api/workers/bookings/${bookingId}/status`, { status });
      Swal.fire("Success", `Booking ${status.toLowerCase()}!`, "success");
      fetchDashboardData();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Failed", "error");
    }
  };

  const deleteAccount = async () => {
    try {
      const { data } = await axios.get(`/api/workers/check-booked/${user._id}`);
      if (data.isBooked) {
        return Swal.fire("Cannot Delete", "You are currently working for a client.", "warning");
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
        text: "This cannot be undone!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
      });

      if (confirm.isConfirmed) {
        await axios.delete(`/api/workers/delete-account/${user._id}`, { data: { password } });
        Swal.fire("Deleted", "Account removed.", "success");
        navigate("/logout");
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Failed", "error");
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      Swal.fire("Error", "New passwords do not match", "error");
      return;
    }
    try {
      await axios.post("/api/workers/update-settings", formData);
      Swal.fire("Success", "Settings updated!", "success");
      fetchDashboardData();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Failed", "error");
    }
  };

  return (
    <div className="worker-dashboard-container">

      <button className="worker-dashboard-menu-toggle" onClick={toggleSidebar}>
        <strong>{sidebarOpen ? "←" : "→"}</strong>
      </button>

      {sidebarOpen && (
        <div className="worker-dashboard-overlay active" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`worker-dashboard-sidebar ${sidebarOpen ? "active" : ""}`}>
        <h2>Worker Dashboard</h2>
        <h2>{user.firstName} {user.lastName}</h2>
        <ul>
          <li onClick={() => showSection("services")}><i className="fas fa-rectangle-list"></i> My Services</li>
          <li onClick={() => showSection("bookings")}><i className="fas fa-clipboard-list"></i> My Bookings</li>
          <li onClick={() => showSection("clients")}><i className="fas fa-users"></i> My Clients</li>
          <li onClick={() => showSection("earnings")}><i className="fas fa-hand-holding-dollar"></i> Earnings</li>
          <li onClick={() => showSection("reviews")}><i className="fas fa-star-half-stroke"></i> Reviews & Ratings</li>
          <li onClick={() => showSection("notifications")}><i className="fas fa-bell"></i> Notifications</li>
          <li onClick={() => showSection("settings")}><i className="fas fa-gears"></i> Settings</li>
        </ul>
      </div>

      <div className="worker-dashboard-main-content">

        {/* MY SERVICES */}
        <div className={`worker-dashboard-section ${activeSection === "services" ? "active" : ""}`}>
          <h3>My Services</h3>
          <div className="worker-dashboard-prop-container">
            {services.length > 0 ? services.map(service => (
              <div key={service._id} className="worker-dashboard-gs-container">
                <div className="worker-dashboard-sc-image-container">
                  <img src={service.image || "/images/default_service.jpg"} alt={service.name} className="worker-dashboard-sc-image" />
                </div>
                <div className="worker-dashboard-main-sen">{service.name}</div>
                <div className="worker-dashboard-sc-text">
                  <div className="worker-dashboard-prop-details">
                    <ul>
                      <li><strong>Rate :</strong> ₹{service.price} {service.rateUnit}</li>
                      <li><strong>Experience :</strong> {service.experience} years</li>
                      <li><strong>Status :</strong> {service.serviceStatus}</li>
                    </ul>
                  </div>
                  <div className="worker-dashboard-prop-view">
                    <button className="worker-dashboard-prop-button" onClick={() => navigate(`/service/${user._id}`)}>
                      Service Details
                    </button>
                    <button className="worker-dashboard-prop-button" onClick={handleToggleAvailability}>
                      Toggle Availability
                    </button>
                    <button className="worker-dashboard-prop-button" onClick={handleDeleteService}>
                      Delete Service
                    </button>
                  </div>
                </div>
              </div>
            )) : <p>No services available. Update your profile to add a service.</p>}
          </div>
          <button className="worker-dashboard-add-button" onClick={() => navigate("/worker_register")}>
            Update Profile
          </button>
        </div>

        {/* BOOKINGS */}
        <div className={`worker-dashboard-section ${activeSection === "bookings" ? "active" : ""}`}>
          <h3>My Bookings</h3>
          <div className="worker-dashboard-complaint-container">
            {bookings.map(booking => (
              <div key={booking._id} className="worker-dashboard-res-complaint">
                <ul>
                  <strong><li>{booking.serviceName || "Service"}</li></strong>
                  <ul>
                    <li><strong>Client:</strong> {booking.tenantId?.firstName} {booking.tenantId?.lastName}</li>
                    <li><strong>Address:</strong> {booking.propertyId?.address}</li>
                    <li><strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}</li>
                    <li><strong>Time:</strong> {booking.time}</li>
                    <li><strong>Status:</strong> {booking.status}</li>
                  </ul>
                </ul>
                {booking.status === "Pending" && (
                  <>
                    <button className="worker-dashboard-update-sts" onClick={() => updateBookingStatus(booking._id, "Approved")}>Accept</button>
                    <button className="worker-dashboard-update-sts" onClick={() => updateBookingStatus(booking._id, "Declined")}>Decline</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CLIENTS */}
        <div className={`worker-dashboard-section ${activeSection === "clients" ? "active" : ""}`}>
          <h3>My Clients</h3>
          {clients.length === 0 ? (
            <div className="worker-dashboard-no-clients-message">
              <p>You currently have no active clients.</p>
              <p>When tenants book your services and you approve them, they will appear here.</p>
            </div>
          ) : (
            <div className="worker-dashboard-messages">
              {clients.map(client => (
                <div key={client._id} className="worker-dashboard-tentant-details">
                  <ul>
                    <li><strong>{client.firstName} {client.lastName}</strong></li>
                    <li><strong>Services:</strong> {client.services?.join(", ") || "N/A"}</li>
                    <li><strong>Contact:</strong> {client.phone || "N/A"}</li>
                    <li><strong>Email:</strong> {client.email || "N/A"}</li>
                    {client.bookingDate && <li><strong>Booked Since:</strong> {new Date(client.bookingDate).toLocaleDateString()}</li>}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EARNINGS */}
        <div className={`worker-dashboard-section ${activeSection === "earnings" ? "active" : ""}`}>
          <h3>My Earnings</h3>
          <p>This Month's Earnings: <strong>₹{earnings.monthly || 0}</strong></p>
          <p>Pending Payments: <strong>₹{earnings.pending || 0}</strong></p>
          <div className="worker-dashboard-complaint-container">
            {transactions.map(tx => (
              <div key={tx._id} className="worker-dashboard-res-complaint">
                <ul>
                  <strong><li>{tx.title}</li></strong>
                  <ul>
                    <li><strong>Service:</strong> {tx.serviceName}</li>
                    <li><strong>Client:</strong> {tx.clientName}</li>
                    <li><strong>{tx.period ? "Period" : "Date"}:</strong> {tx.period || tx.date}</li>
                    <li><strong>Amount:</strong> ₹{tx.amount}</li>
                    <li><strong>Status:</strong> {tx.status}</li>
                  </ul>
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* REVIEWS */}
        <div className={`worker-dashboard-section ${activeSection === "reviews" ? "active" : ""}`}>
          <h3>Reviews & Ratings</h3>
          <p>Overall Rating: <strong>{reviews.averageRating || 0}/5</strong> ({reviews.count || 0} reviews)</p>
          <div className="worker-dashboard-complaint-container">
            {reviews.items?.map(review => (
              <div key={review._id} className="worker-dashboard-res-complaint">
                <ul>
                  <strong><li>{review.user} - {"★".repeat(review.rating)}</li></strong>
                  <ul>
                    <li><strong>Service:</strong> {review.serviceName}</li>
                    <li><strong>Date:</strong> {new Date(review.date).toLocaleDateString()}</li>
                    <li><strong>Comment:</strong> {review.comment}</li>
                  </ul>
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className={`worker-dashboard-section ${activeSection === "notifications" ? "active" : ""}`}>
          <h3>Notifications</h3>
          <div className="worker-dashboard-notification-container">
            {notifications.map(notif => (
              <div key={notif._id} className={`worker-dashboard-notification-card ${notif.read ? "read" : "unread"}`}>
                <div className="worker-dashboard-notification-header">
                  <strong>{notif.type || "Notification"}</strong>
                </div>
                <p><strong>Message:</strong> {notif.message}</p>
                {notif.tenantName && <p><strong>From:</strong> {notif.tenantName}</p>}
                <p><strong>Date:</strong> {new Date(notif.createdDate).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SETTINGS */}
        <div className={`worker-dashboard-section ${activeSection === "settings" ? "active" : ""}`}>
          <h3>Account Settings</h3>
          <form onSubmit={handleSettingsSubmit}>
            <div className="worker-dashboard-settings-container">
              <div className="worker-dashboard-settings-section">
                <h4>Personal Information</h4>
                <div className="worker-dashboard-form-row">
                  <div className="worker-dashboard-form-group">
                    <label>First Name</label>
                    <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  </div>
                  <div className="worker-dashboard-form-group">
                    <label>Last Name</label>
                    <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                  </div>
                </div>
                <div className="worker-dashboard-form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="worker-dashboard-form-group">
                  <label>Phone Number</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="worker-dashboard-settings-section">
                <h4>Worker Information</h4>
                <div className="worker-dashboard-form-group">
                  <label>Service Area</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="worker-dashboard-form-group">
                  <label>Years of Experience</label>
                  <input type="number" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} />
                </div>
                <div className="worker-dashboard-form-group">
                  <label>Availability</label>
                  <select value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})}>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="weekends">Weekends Only</option>
                  </select>
                </div>
              </div>

              <div className="worker-dashboard-settings-section">
                <h4>Change Password</h4>
                <div className="worker-dashboard-form-group">
                  <label>Current Password</label>
                  <input type="password" value={formData.currentPassword} onChange={e => setFormData({...formData, currentPassword: e.target.value})} />
                </div>
                <div className="worker-dashboard-form-group">
                  <label>New Password</label>
                  <input type="password" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} />
                </div>
                <div className="worker-dashboard-form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                </div>
              </div>

              <div className="worker-dashboard-settings-section">
                <h4>Notification Preferences</h4>
                <div className="worker-dashboard-checkbox-group">
                  <label>Email notifications</label>
                  <input type="checkbox" checked={formData.emailNotifications} onChange={e => setFormData({...formData, emailNotifications: e.target.checked})} />
                  <label className="worker-dashboard-button"></label>
                </div>
                <div className="worker-dashboard-checkbox-group">
                  <label>SMS notifications</label>
                  <input type="checkbox" checked={formData.smsNotifications} onChange={e => setFormData({...formData, smsNotifications: e.target.checked})} />
                  <label className="worker-dashboard-button"></label>
                </div>
                <div className="worker-dashboard-checkbox-group">
                  <label>New booking alerts</label>
                  <input type="checkbox" checked={formData.bookingAlerts} onChange={e => setFormData({...formData, bookingAlerts: e.target.checked})} />
                  <label className="worker-dashboard-button"></label>
                </div>
                <div className="worker-dashboard-checkbox-group">
                  <label>Payment alerts</label>
                  <input type="checkbox" checked={formData.paymentAlerts} onChange={e => setFormData({...formData, paymentAlerts: e.target.checked})} />
                  <label className="worker-dashboard-button"></label>
                </div>
              </div>
            </div>

            <div className="worker-dashboard-button-container">
              <button type="submit" className="worker-dashboard-settings-button worker-dashboard-primary-button">Save Changes</button>
              <button type="button" className="worker-dashboard-settings-button worker-dashboard-secondary-button" onClick={fetchDashboardData}>Cancel</button>
              <button type="button" className="worker-dashboard-danger-button" onClick={deleteAccount}>Delete Account</button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default WorkerDashboard;