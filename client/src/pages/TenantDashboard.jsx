import React, { useEffect, useState, useRef } from "react";
import * as tenantService from "../services/tenantService";
import "../assets/css/TenantDashboard.css";

const Sidebar = ({ onSelect, current }) => (
  <div className="sidebar" id="sidebar">
    <h2>Tenant Dashboard</h2>
    <ul>
      <li onClick={() => onSelect("home")}>
        <i className="fa-solid fa-house"></i> Home
      </li>

      <li onClick={() => onSelect("rentPayments")}>
        <i className="fa-solid fa-hand-holding-dollar"></i> Rent Payments
      </li>

      <li onClick={() => onSelect("maintenance")}>
        <i className="fa-solid fa-screwdriver-wrench"></i> Maintenance
      </li>

      <li onClick={() => onSelect("complaints")}>
        <i className="fa-solid fa-comments"></i> Complaints
      </li>

      <li onClick={() => onSelect("movers")}>
        <i className="fa-solid fa-users"></i> Domestic Workers
      </li>

      <li onClick={() => onSelect("notifications")}>
        <i className="fa-solid fa-bell"></i> Notifications
      </li>

      <li onClick={() => onSelect("savedListings")}>
        <i className="fa-solid fa-bookmark"></i> Saved Listings
      </li>

      <li onClick={() => onSelect("ratings")}>
        <i className="fa-solid fa-star-half-stroke"></i> Reviews & Ratings
      </li>

      <li onClick={() => onSelect("settings")}>
        <i className="fa-solid fa-gears"></i> Settings
      </li>
    </ul>
  </div>
);

const TenantDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("home");

  // Modals/forms visibility
  const [showMaintenancePopup, setShowMaintenancePopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showWorkerPaymentPopup, setShowWorkerPaymentPopup] = useState(false);
  const [selectedWorkerForPayment, setSelectedWorkerForPayment] =
    useState(null);
  const [showUnrentModal, setShowUnrentModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Forms
  const maintFormRef = useRef();
  const complaintFormRef = useRef();
  const paymentFormRef = useRef();
  const workerPaymentFormRef = useRef();
  const profileFormRef = useRef();
  const passwordFormRef = useRef();
  const deleteAccountFormRef = useRef();

  // Rating
  const [selectedRating, setSelectedRating] = useState(0);

  useEffect(() => {
    let mounted = true;
    tenantService
      .getDashboard()
      .then((res) => {
        if (!mounted) return;
        if (res && res.success) {
          setDashboard(res);
        } else {
          setDashboard(res);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return <div style={{ padding: 20 }}>Loading tenant dashboard...</div>;
  if (!dashboard)
    return <div style={{ padding: 20 }}>Unable to load dashboard.</div>;

  const {
    user = {},
    currentProperty,
    propertyOwner,
    activeMaintenanceRequests = [],
    completedMaintenanceRequests = [],
    notifications = [],
    workers = [],
    payments = [],
    workerPayments = [],
    ratings = [],
  } = dashboard;

  // Handlers
  const handleSubmitMaintenance = async (e) => {
    e.preventDefault();
    const form = maintFormRef.current;
    const issueType = form["issue-type"].value;
    const description = form["description"].value;
    const location = form["location"].value;
    const preferredDate = form["preferred-date"].value;
    try {
      const res = await tenantService.submitMaintenance({
        issueType,
        description,
        location,
        preferredDate,
      });
      if (res.success) {
        setDashboard((prev) => ({
          ...prev,
          activeMaintenanceRequests: [
            res.request,
            ...(prev.activeMaintenanceRequests || []),
          ],
        }));
        setShowMaintenancePopup(false);
      } else {
        alert(res.message || "Error submitting request");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting request");
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    const form = complaintFormRef.current;
    const category = form["category"].value;
    const subject = form["subject"].value;
    const description = form["complaint-text"].value;
    try {
      const res = await tenantService.submitComplaint({
        category,
        subject,
        description,
      });
      if (res.success) {
        setDashboard((prev) => ({
          ...prev,
          complaints: [res.complaint, ...(prev.complaints || [])],
        }));
        form.reset();
      } else alert(res.message || "Error");
    } catch (err) {
      console.error(err);
      alert("Error");
    }
  };

  const openPaymentPopup = () => setShowPaymentPopup(true);
  const closePaymentPopup = () => setShowPaymentPopup(false);

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const form = paymentFormRef.current;
    const amount = form["rent-amount"].value;
    const paymentMethod = form["payment-method"].value;
    const transactionId = form["transaction-id"].value;
    try {
      const res = await tenantService.submitPayment({
        amount,
        paymentMethod,
        transactionId,
      });
      if (res.success) {
        setDashboard((prev) => ({
          ...prev,
          payments: [res.payment, ...(prev.payments || [])],
        }));
        closePaymentPopup();
      } else alert(res.message || "Error");
    } catch (err) {
      console.error(err);
      alert("Error");
    }
  };

  const openWorkerPaymentPopup = (worker) => {
    setSelectedWorkerForPayment(worker);
    setShowWorkerPaymentPopup(true);
  };
  const closeWorkerPaymentPopup = () => {
    setShowWorkerPaymentPopup(false);
    setSelectedWorkerForPayment(null);
  };

  const handleWorkerPayment = async (e) => {
    e.preventDefault();
    const form = workerPaymentFormRef.current;
    const workerId = form["worker-id"].value;
    const amount = form["payment-amount"].value;
    const paymentDate = form["payment-date"].value;
    const paymentMethod = form["worker-payment-method"].value;
    const transactionId = form["worker-transaction-id"].value || "N/A";
    try {
      const res = await tenantService.submitWorkerPayment({
        workerId,
        amount,
        paymentDate,
        paymentMethod,
        transactionId,
      });
      if (res.success) {
        setDashboard((prev) => ({
          ...prev,
          workerPayments: [res.payment, ...(prev.workerPayments || [])],
        }));
        closeWorkerPaymentPopup();
      } else alert(res.message || "Error");
    } catch (err) {
      console.error(err);
      alert("Error");
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      const res = await tenantService.markNotificationRead(id);
      if (res.success) {
        setDashboard((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n._id === id ? { ...n, read: true } : n
          ),
        }));
      } else alert(res.message || "Error");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSavedProperty = async (propertyId) => {
    try {
      const res = await tenantService.toggleSavedProperty(propertyId, "remove");
      if (res.success) {
        setDashboard((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            savedListings: (prev.user.savedListings || []).filter(
              (p) => p._id !== propertyId
            ),
          },
        }));
      } else alert(res.message || "Error");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDebookWorker = async (workerId, btnRef) => {
    if (
      !confirm(
        "Are you sure you want to debook this worker? Please ensure you have completed this month's payment before proceeding."
      )
    )
      return;
    try {
      const response = await fetch(`/api/workers/debook/${workerId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message || "Worker debooked");
        setDashboard((prev) => ({
          ...prev,
          workers: (prev.workers || []).filter((w) => w._id !== workerId),
        }));
      } else {
        alert(data.message || data.error || "Error");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedRating) return alert("Please select a rating");
    const reviewText = document.getElementById("review-text")?.value || "";
    try {
      const res = await tenantService.submitReview({
        propertyId: currentProperty._id,
        rating: selectedRating,
        review: reviewText,
      });
      if (res.success) {
        setDashboard((prev) => ({
          ...prev,
          ratings: [res.rating, ...(prev.ratings || [])],
        }));
        document.getElementById("review-text").value = "";
        setSelectedRating(0);
      } else alert(res.message || "Error");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const form = profileFormRef.current;
    const fullname = form["fullname"].value.trim();
    const email = form["email"].value.trim();
    const phone = form["phone"].value.trim();
    const location = form["address"].value.trim();
    const parts = fullname.split(" ").filter((p) => p);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";
    try {
      const res = await tenantService.updateProfile({
        firstName,
        lastName,
        email,
        phone,
        location,
      });
      if (res.success) {
        setDashboard((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            firstName: res.user.firstName,
            lastName: res.user.lastName,
            email: res.user.email,
            phone: res.user.phone,
            location: res.user.location,
          },
        }));
        alert("Profile updated");
      } else alert(res.message || "Error");
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const form = passwordFormRef.current;
    const currentPassword = form["current-password"].value;
    const newPassword = form["new-password"].value;
    const confirmPassword = form["confirm-password"].value;
    if (newPassword !== confirmPassword) return alert("Passwords do not match");
    try {
      const res = await tenantService.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        alert(res.message || "Password changed");
        form.reset();
      } else alert(res.message || "Error");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestUnrent = async () => {
    const reason = document.getElementById("unrent-reason")?.value || "";
    try {
      const res = await tenantService.requestUnrent(reason);
      if (res.success) {
        alert(res.message || "Unrent requested");
        setShowUnrentModal(false);
      } else alert(res.message || "Error");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckRecentPayment = async () => {
    try {
      const res = await tenantService.checkRecentPayment();
      if (res.success && !res.recentPayment) {
        setShowPaymentPopup(true);
      } else alert(res.message || "You have already paid this month");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckAccountStatusAndDelete = async () => {
    try {
      const status = await tenantService.checkAccountStatus();
      if (status.success) {
        setShowDeleteAccountModal(true);
      } else alert(status.message || "Cannot delete account");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const form = deleteAccountFormRef.current;
    const password = form ? form["delete-password"].value : null;
    if (!password) return alert("Please enter your password to confirm");
    try {
      const res = await tenantService.deleteAccount(password);
      if (res.success) {
        // Redirect to homepage after account deletion
        window.location.href = "/";
      } else {
        alert(res.message || "Unable to delete account");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      alert("Network error while deleting account");
    }
  };

  // Star interactions
  const handleStarHover = (r) => setSelectedRating(r);
  const handleStarClick = (r) => setSelectedRating(r);

  return (
    <div>
      <div className="overlay" id="overlay"></div>
      <button
        className="menu-toggle"
        onClick={() =>
          document.querySelector(".sidebar")?.classList.toggle("active")
        }
      >
        <strong>&gt;</strong>
      </button>
      <div className="dashboard-container">
        <Sidebar onSelect={setSection} current={section} />
        <div className="main-content">
          {/* Home */}
          <div
            id="home"
            className={`section ${section === "home" ? "active" : ""}`}
          >
            <h3>
              Welcome, {user.firstName} {user.lastName}
            </h3>
            {currentProperty ? (
              <div className="property-summary">
                <div className="property-card" id="home_property_card">
                  <div className="img_container">
                    <img
                      src={
                        currentProperty.images && currentProperty.images[0]
                          ? currentProperty.images[0]
                          : "/images/default-property.jpg"
                      }
                      alt="Property"
                    />
                  </div>
                  <div className="property-details">
                    <p>
                      <strong>Property:</strong> {currentProperty.subtype || ""}{" "}
                      {currentProperty.name || "N/A"}
                    </p>
                    <p>
                      <strong>Address:</strong>{" "}
                      {currentProperty.address || "N/A"}
                    </p>
                    <p>
                      <strong>Owner:</strong>{" "}
                      {propertyOwner
                        ? `${propertyOwner.firstName} ${propertyOwner.lastName}`
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Contact:</strong>{" "}
                      {propertyOwner ? propertyOwner.email : "N/A"}
                    </p>
                    <p>
                      <strong>Monthly Rent:</strong> ₹
                      {currentProperty.price || "N/A"}
                    </p>
                  </div>
                  <button
                    id="unrent-btn"
                    className="unrent-btn"
                    onClick={() => setShowUnrentModal(true)}
                  >
                    Request Unrent
                  </button>
                </div>
              </div>
            ) : (
              <p>No current property rented.</p>
            )}

            <div className="quick-stats">
              <div className="stat-box">
                <h4>Active Maintenance</h4>
                <p>
                  {activeMaintenanceRequests
                    ? activeMaintenanceRequests.length
                    : 0}{" "}
                  Pending Requests
                </p>
              </div>
              <div className="stat-box">
                <h4>Saved Properties</h4>
                <p>
                  {user.savedListings ? user.savedListings.length : 0}{" "}
                  Properties
                </p>
              </div>
            </div>
          </div>

          {/* Rent Payments */}
          <div
            id="rentPayments"
            className={`section ${section === "rentPayments" ? "active" : ""}`}
          >
            <h3>Rent Payments</h3>
            {currentProperty ? (
              <div className="current-rent">
                {dashboard.nextPayment ? (
                  <p>
                    Next Rent Due:{" "}
                    <strong>₹{dashboard.nextPayment.amount}</strong> on{" "}
                    {new Date(
                      dashboard.nextPayment.dueDate
                    ).toLocaleDateString()}
                  </p>
                ) : (
                  <p>No rent due date available.</p>
                )}
                <button
                  className="pay-buttons"
                  onClick={handleCheckRecentPayment}
                >
                  Pay Rent
                </button>
              </div>
            ) : (
              <p>No current property rented.</p>
            )}

            <h4>Payment History</h4>
            <table className="payment-history">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {(payments || []).map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.paymentDate
                        ? new Date(p.paymentDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>₹{p.amount}</td>
                    <td>{p.paymentMethod}</td>
                    <td className={(p.status || "").toLowerCase()}>
                      {p.status}
                    </td>
                    <td>
                      <a href={p.receiptUrl || "#"}>View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Maintenance */}
          <div
            id="maintenance"
            className={`section ${section === "maintenance" ? "active" : ""}`}
          >
            <h3>Maintenance Requests</h3>
            <button
              className="book-button"
              onClick={() => setShowMaintenancePopup(true)}
            >
              Submit New Request
            </button>
            <h4>Active Requests</h4>
            <div className="maintenance-cards">
              {(activeMaintenanceRequests || []).map((r) => (
                <div className="maintenance-card" key={r._id}>
                  <div className="maintenance-header">
                    <h5>{r.issueType || "Unknown"} Issue</h5>
                    <span
                      className={`status ${
                        r.status
                          ? r.status.toLowerCase().replace(" ", "-")
                          : "pending"
                      }`}
                    >
                      {r.status || "Pending"}
                    </span>
                  </div>
                  <p>
                    <strong>Date Reported:</strong>{" "}
                    {r.scheduledDate
                      ? new Date(r.scheduledDate).toLocaleDateString()
                      : r.dateReported
                      ? new Date(r.dateReported).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Description:</strong> {r.description}
                  </p>
                  <p>
                    <strong>Location:</strong> {r.location}
                  </p>
                  <p>
                    <strong>Assigned To:</strong>{" "}
                    {r.assignedTo || "Awaiting assignment"}
                  </p>
                  <button className="small-button">Update</button>
                </div>
              ))}
            </div>
            <h4>Completed Requests</h4>
            <div className="maintenance-cards">
              {(completedMaintenanceRequests || []).map((r) => (
                <div className="maintenance-card" key={r._id}>
                  <div className="maintenance-header">
                    <h5>{r.issueType || "Unknown"} Issue</h5>
                    <span className="status completed">Completed</span>
                  </div>
                  <p>
                    <strong>Date Reported:</strong>{" "}
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Date Completed:</strong>{" "}
                    {r.updatedAt
                      ? new Date(r.updatedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Description:</strong> {r.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Complaints */}
          <div
            id="complaints"
            className={`section ${section === "complaints" ? "active" : ""}`}
          >
            <h3>Submit a Query / Complaint</h3>
            <form
              className="query-form"
              id="complaint-form"
              ref={complaintFormRef}
              onSubmit={handleSubmitComplaint}
            >
              <select name="category" required>
                <option value="" disabled defaultValue>
                  {" "}
                  Select Category
                </option>
                <option value="rent">Rent Related</option>
                <option value="property">Property Issues</option>
                <option value="neighbor">Neighbor Complaints</option>
                <option value="service">Service Quality</option>
                <option value="other">Other</option>
              </select>
              <input
                name="subject"
                type="text"
                placeholder="Subject"
                className="query-text-input"
                required
              />
              <textarea
                name="complaint-text"
                className="query-text-input"
                rows={4}
                placeholder="Describe your issue..."
                required
              ></textarea>
              <button type="submit">Submit Complaint</button>
            </form>
            <h4>Previous Complaints</h4>
            <div className="complaints-history">
              {(dashboard.complaints || []).map((c) => (
                <div className="complaint-item" key={c._id}>
                  <div className="complaint-header">
                    <h5>{c.subject}</h5>
                    <span
                      className={`status ${
                        c.status
                          ? c.status.toLowerCase().replace(" ", "-")
                          : "open"
                      }`}
                    >
                      {c.status || "Open"}
                    </span>
                  </div>
                  <p>
                    <strong>Date:</strong>{" "}
                    {c.dateSubmitted
                      ? new Date(c.dateSubmitted).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p>
                    <strong>Description:</strong> {c.description}
                  </p>
                  {c.response && (
                    <p>
                      <strong>Response:</strong> {c.response}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Movers / Workers */}
          <div
            id="movers"
            className={`section ${section === "movers" ? "active" : ""}`}
          >
            <h3>Domestic Worker Services</h3>
            <div className="service-categories">
              <div className="service-category">
                <h4>Cleaning Services</h4>
                <p>Professional house cleaning</p>
                <button
                  className="book-button"
                  onClick={() =>
                    (window.location.href = "/workerDetails?service=cleaning")
                  }
                >
                  Find Cleaners
                </button>
              </div>
              <div className="service-category">
                <h4>Cooking Services</h4>
                <p>Skilled cooks for daily meals</p>
                <button
                  className="book-button"
                  onClick={() =>
                    (window.location.href = "/workerDetails?service=cooking")
                  }
                >
                  Find Cooks
                </button>
              </div>
              <div className="service-category">
                <h4>Laundry Services</h4>
                <p>Washing and ironing services</p>
                <button
                  className="book-button"
                  onClick={() =>
                    (window.location.href = "/workerDetails?service=laundry")
                  }
                >
                  Find Help
                </button>
              </div>
            </div>
            <h4>Your Current Service Providers</h4>
            <div className="worker-cards">
              {(workers || []).length === 0 ? (
                <div className="no-workers-message">
                  <p>
                    You don't have any domestic workers assigned yet. Browse the
                    services above to find help.
                  </p>
                </div>
              ) : (
                (workers || []).map((worker, index) => (
                  <div
                    className="worker-card"
                    data-worker-id={worker._id || `worker_${index}`}
                    key={worker._id || index}
                  >
                    <img
                      src={worker.image || "/resources/default-worker.jpg"}
                      alt="Worker"
                    />
                    <div className="worker-details">
                      <h5 className="worker-name">
                        {worker.firstName} {worker.lastName}
                      </h5>
                      <p>
                        <strong>Service:</strong>{" "}
                        <span className="worker-service">
                          {worker.serviceType || "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong>Schedule:</strong>{" "}
                        <span className="worker-schedule">
                          {worker.availability || "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong>Fee:</strong> ₹
                        <span className="worker-fee">
                          {worker.price || "N/A"}
                        </span>
                        <span className="worker-rate-unit">
                          {worker.rateUnit ? "/" + worker.rateUnit : ""}
                        </span>
                      </p>
                      <p>
                        <strong>Experience:</strong>{" "}
                        <span className="worker-experience">
                          {worker.experience
                            ? worker.experience + " years"
                            : "N/A"}
                        </span>
                      </p>
                      <p>
                        <strong>Phone:</strong>{" "}
                        <span className="worker-phone">
                          {worker.phone || "N/A"}
                        </span>
                      </p>
                      <div className="rating">
                        {worker.ratingId && worker.ratingId.average ? (
                          <span className="worker-rating">
                            {"⭐".repeat(Math.round(worker.ratingId.average))}{" "}
                            {worker.ratingId.average.toFixed(1)}
                          </span>
                        ) : (
                          <span className="worker-rating">No ratings yet</span>
                        )}
                      </div>
                      <div className="worker-payment-section">
                        <h6>Payment</h6>
                        <button
                          className="pay-worker-btn"
                          onClick={() => openWorkerPaymentPopup(worker)}
                          disabled={worker.paymentStatus === "paid"}
                        >
                          {worker.paymentStatus === "paid"
                            ? "Paid"
                            : "Pay Worker"}
                        </button>
                        <button
                          className="debook-worker-btn"
                          onClick={() => handleDebookWorker(worker._id)}
                        >
                          Debook
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <h4>Worker Payment History</h4>
            <table className="payment-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Worker</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody id="worker-payment-history-body">
                {(workerPayments || []).map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.paymentDate
                        ? new Date(p.paymentDate).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>{p.workerName}</td>
                    <td>{p.serviceType}</td>
                    <td>₹{p.amount}</td>
                    <td>{p.paymentMethod}</td>
                    <td className={(p.status || "").toLowerCase()}>
                      {p.status}
                    </td>
                    <td>
                      <a href={p.receiptUrl || "#"}>View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notifications */}
          <div
            id="notifications"
            className={`section ${section === "notifications" ? "active" : ""}`}
          >
            <h3>Notifications</h3>
            <div className="notification-container">
              {notifications && notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    className={`notification-card ${
                      notification.read ? "read" : "unread"
                    }`}
                    key={notification._id}
                    data-notification-id={notification._id}
                  >
                    <p>
                      <strong>From:</strong>{" "}
                      {notification.workerName ||
                        notification.propertyName ||
                        "System"}
                    </p>
                    <p>
                      <strong>Message:</strong> {notification.message}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(notification.createdDate).toLocaleString()}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`notification-status ${
                          notification.status &&
                          notification.status.toLowerCase()
                        }`}
                      >
                        {notification.status}
                      </span>
                    </p>
                    <p>
                      <strong>Read:</strong>{" "}
                      {notification.read ? "Read" : "Unread"}
                    </p>
                    {!notification.read && (
                      <button
                        className="mark-read-button"
                        onClick={() =>
                          handleMarkNotificationRead(notification._id)
                        }
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No notifications available.</p>
              )}
            </div>
          </div>

          {/* Saved Listings */}
          <div
            id="savedListings"
            className={`section ${section === "savedListings" ? "active" : ""}`}
          >
            <h3>Saved Listings</h3>
            <p>
              You have saved{" "}
              {user.savedListings ? user.savedListings.length : 0} properties
              for future reference.
            </p>
            <div className="saved-properties">
              {(user.savedListings || []).map((property) => (
                <div
                  className="property-card"
                  data-property-id={property._id}
                  key={property._id}
                >
                  <div className="img_container">
                    <img
                      src={
                        property.images && property.images[0]
                          ? property.images[0]
                          : "/images/default-property.jpg"
                      }
                      alt="Property"
                    />
                  </div>
                  <div className="property-info">
                    <h4>{property.name || "N/A"}</h4>
                    <p>
                      <strong>Location:</strong> {property.location || "N/A"}
                    </p>
                    <p>
                      <strong>Rent:</strong> ₹{property.price || "N/A"}/month
                    </p>
                    <p>
                      <strong>Available From:</strong>{" "}
                      {property.availableFrom
                        ? new Date(property.availableFrom).toLocaleDateString()
                        : "Immediate"}
                    </p>
                    <div className="property-features">
                      <span>{property.subtype || "N/A"}</span>
                      <span>{property.size || "N/A"}</span>
                      <span>{property.furnished || "N/A"}</span>
                    </div>
                    <div className="card-actions">
                      <button
                        className="book-button"
                        onClick={() =>
                          (window.location.href = `/book-property?id=${property._id}`)
                        }
                      >
                        Book Now
                      </button>
                      <a
                        className="view-details book-button"
                        href={`/property?id=${property._id}`}
                      >
                        View Details
                      </a>
                      <button
                        className="remove-button"
                        onClick={() => handleRemoveSavedProperty(property._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {(!user.savedListings || user.savedListings.length === 0) && (
                <p>
                  No saved properties yet. Browse properties to save your
                  favorites!
                </p>
              )}
            </div>
          </div>

          {/* Ratings */}
          <div
            id="ratings"
            className={`section ${section === "ratings" ? "active" : ""}`}
          >
            <h3>Reviews & Ratings</h3>
            <h4>Your Property Reviews</h4>
            {currentProperty && (
              <div className="review-form">
                <h5>Review Your Current Property</h5>
                <div className="star-rating">
                  <span>Rate your experience: </span>
                  <div
                    className="stars"
                    id="star-rating"
                    data-property-id={currentProperty._id}
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <span
                        key={r}
                        className={`star ${
                          selectedRating >= r ? "active" : ""
                        }`}
                        onMouseEnter={() => handleStarHover(r)}
                        onClick={() => handleStarClick(r)}
                      >
                        <i
                          className={
                            selectedRating >= r ? "fas fa-star" : "far fa-star"
                          }
                        ></i>
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  id="review-text"
                  rows={4}
                  placeholder="Share your experience living here..."
                ></textarea>
                <button
                  type="button"
                  id="review-submission"
                  onClick={handleSubmitReview}
                >
                  Submit Review
                </button>
              </div>
            )}
            <h4>Past Reviews</h4>
            <div className="past-reviews">
              {(ratings || []).map((r) => (
                <div className="review-card" key={r._id}>
                  <div className="review-header">
                    <h5>
                      {r.propertyId && r.propertyId.name
                        ? r.propertyId.name
                        : "Unknown Property"}
                    </h5>
                    <div className="rating">
                      {r.rating ? "⭐".repeat(r.rating) : ""}{" "}
                      {r.rating ? r.rating.toFixed(1) : "N/A"}
                    </div>
                  </div>
                  <p className="review-date">
                    Reviewed on:{" "}
                    {r.date ? new Date(r.date).toLocaleDateString() : "N/A"}
                  </p>
                  <p className="review-text">
                    {r.review || "No review provided"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div
            id="settings"
            className={`section ${section === "settings" ? "active" : ""}`}
          >
            <h3>Account Settings</h3>
            <div className="settings-container">
              <div id="profile-section">
                <h4>Personal Information</h4>
                <form
                  className="profile-form"
                  id="profile-form"
                  ref={profileFormRef}
                  onSubmit={handleUpdateProfile}
                >
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      name="fullname"
                      id="fullname"
                      defaultValue={`${user.firstName || ""} ${
                        user.lastName || ""
                      }`}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      name="email"
                      id="email"
                      defaultValue={user.email || ""}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      name="phone"
                      id="phone"
                      defaultValue={user.phone || ""}
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Address</label>
                    <textarea
                      name="address"
                      id="address"
                      defaultValue={user.location || ""}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="settings-submission-class book-button"
                  >
                    Update Profile
                  </button>
                </form>
              </div>

              <div id="security-section">
                <h4>Security Settings</h4>
                <form
                  className="password-form"
                  id="password-form"
                  ref={passwordFormRef}
                  onSubmit={handleChangePassword}
                >
                  <div className="form-group">
                    <label>Current Password</label>
                    <input name="current-password" type="password" />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input name="new-password" type="password" />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input name="confirm-password" type="password" />
                  </div>
                  <button
                    type="submit"
                    className="settings-submission-class book-button"
                  >
                    Change Password
                  </button>
                </form>
              </div>

              <div id="preferences-section">
                <h4>Notification Preferences</h4>
                <form className="notification-form">
                  <div className="checkbox-group">
                    <label>Email Notifications</label>
                    <input
                      type="checkbox"
                      id="email-notifications"
                      defaultChecked={user.emailNotifications}
                    />
                    <label
                      className="button"
                      htmlFor="email-notifications"
                    ></label>
                  </div>
                  <div className="checkbox-group">
                    <label>SMS Notifications</label>
                    <input
                      type="checkbox"
                      id="sms-notifications"
                      defaultChecked={user.smsNotifications}
                    />
                    <label
                      className="button"
                      htmlFor="sms-notifications"
                    ></label>
                  </div>
                  <div className="checkbox-group">
                    <label>Rent Due Reminders</label>
                    <input
                      type="checkbox"
                      id="rent-reminders"
                      defaultChecked={user.rentReminders}
                    />
                    <label className="button" htmlFor="rent-reminders"></label>
                  </div>
                  <div className="checkbox-group">
                    <label>Maintenance Updates</label>
                    <input
                      type="checkbox"
                      id="maintenance-updates"
                      defaultChecked={user.maintenanceUpdates}
                    />
                    <label
                      className="button"
                      htmlFor="maintenance-updates"
                    ></label>
                  </div>
                  <div className="checkbox-group">
                    <label>New Property Listings</label>
                    <input
                      type="checkbox"
                      id="new-listings"
                      defaultChecked={user.newListings}
                    />
                    <label className="button" htmlFor="new-listings"></label>
                  </div>
                  <button
                    type="button"
                    className="settings-submission-class book-button"
                    onClick={async () => {
                      const payload = {
                        emailNotifications: document.getElementById(
                          "email-notifications"
                        ).checked,
                        smsNotifications:
                          document.getElementById("sms-notifications").checked,
                        rentReminders:
                          document.getElementById("rent-reminders").checked,
                        maintenanceUpdates: document.getElementById(
                          "maintenance-updates"
                        ).checked,
                        newListings:
                          document.getElementById("new-listings").checked,
                      };
                      try {
                        const res = await tenantService.updateNotificationPrefs(
                          payload
                        );
                        if (res.success) {
                          alert("Preferences updated");
                          setDashboard((prev) => ({
                            ...prev,
                            user: { ...prev.user, ...res.user },
                          }));
                        } else alert(res.message || "Error");
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    Save Preferences
                  </button>
                </form>
              </div>

              <div id="delete-account-section">
                <h4>Delete Account</h4>
                <button
                  className="settings-submission-class delete-account-btn remove-button"
                  onClick={handleCheckAccountStatusAndDelete}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance request popup */}
      <div
        id="maintenance-request-popup"
        className="popup-container"
        style={{ display: showMaintenancePopup ? "flex" : "none" }}
      >
        <div className="popup-content">
          <span
            className="close-btn"
            onClick={() => setShowMaintenancePopup(false)}
          >
            ×
          </span>
          <h3>Submit Maintenance Request</h3>
          <form
            id="maintenance-request-form"
            ref={maintFormRef}
            onSubmit={handleSubmitMaintenance}
          >
            <div className="form-group">
              <label>Issue Type:</label>
              <select name="issue-type" id="issue-type" required>
                <option value="">Select an issue type</option>
                <option>Plumbing</option>
                <option>Electrical</option>
                <option>HVAC</option>
                <option>Appliance</option>
                <option>Structural</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                id="description"
                rows={4}
                placeholder="Please describe the issue in detail"
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label>Location:</label>
              <input
                name="location"
                id="location"
                placeholder="e.g., Kitchen"
                required
              />
            </div>
            <div className="form-group">
              <label>Preferred Date</label>
              <input name="preferred-date" id="preferred-date" type="date" />
            </div>
            <div className="form-group">
              <button type="submit" className="submit-btn">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Payment popup */}
      <div
        id="payment-popup-container"
        className="popup-container"
        style={{ display: showPaymentPopup ? "flex" : "none" }}
      >
        <div className="popup-content">
          <span className="close-btn" onClick={closePaymentPopup}>
            ×
          </span>
          <h3>Pay Rent</h3>
          <form
            id="payment-form"
            ref={paymentFormRef}
            onSubmit={handleSubmitPayment}
          >
            <div className="form-group">
              <label>Rent Amount (₹):</label>
              <input
                name="rent-amount"
                id="rent-amount"
                defaultValue={currentProperty ? currentProperty.price : ""}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Payment Method:</label>
              <select name="payment-method" id="payment-method" required>
                <option value="">Select Payment Method</option>
                <option>Credit Card</option>
                <option>Debit Card</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Transaction ID:</label>
              <input
                name="transaction-id"
                id="transaction-id"
                placeholder="Enter transaction ID"
                required
              />
            </div>
            <div className="form-group">
              <button type="submit" className="submit-btn">
                Submit Payment
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Worker payment popup */}
      <div
        id="worker-payment-popup"
        className="popup-container"
        style={{ display: showWorkerPaymentPopup ? "flex" : "none" }}
      >
        <div className="popup-content">
          <span className="close-btn" onClick={closeWorkerPaymentPopup}>
            ×
          </span>
          <h3>Pay Worker</h3>
          <form
            id="worker-payment-form"
            ref={workerPaymentFormRef}
            onSubmit={handleWorkerPayment}
          >
            <div className="form-group">
              <label>Worker Name:</label>
              <input
                name="worker-name"
                id="worker-name"
                defaultValue={
                  selectedWorkerForPayment
                    ? `${selectedWorkerForPayment.firstName} ${selectedWorkerForPayment.lastName}`
                    : ""
                }
                readOnly
              />
              <input
                type="hidden"
                name="worker-id"
                defaultValue={
                  selectedWorkerForPayment ? selectedWorkerForPayment._id : ""
                }
              />
            </div>
            <div className="form-group">
              <label>Service Type:</label>
              <input
                name="service-type"
                id="service-type"
                defaultValue={
                  selectedWorkerForPayment
                    ? selectedWorkerForPayment.serviceType
                    : ""
                }
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Payment Amount (₹):</label>
              <input
                name="payment-amount"
                id="payment-amount"
                defaultValue={
                  selectedWorkerForPayment ? selectedWorkerForPayment.price : ""
                }
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Payment Date:</label>
              <input
                name="payment-date"
                id="payment-date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="form-group">
              <label>Payment Method:</label>
              <select
                name="worker-payment-method"
                id="worker-payment-method"
                required
              >
                <option value="">Select Payment Method</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Digital Wallet</option>
              </select>
            </div>
            <div className="form-group">
              <label>Transaction ID (if applicable):</label>
              <input
                name="worker-transaction-id"
                id="worker-transaction-id"
                placeholder="Enter transaction ID"
              />
            </div>
            <div className="form-group">
              <label>Notes (optional):</label>
              <textarea
                name="payment-notes"
                id="payment-notes"
                rows={3}
              ></textarea>
            </div>
            <div className="form-group">
              <button type="submit" className="submit-btn">
                Submit Payment
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unrent modal */}
      <div
        id="unrent-modal"
        className="modal"
        style={{ display: showUnrentModal ? "flex" : "none" }}
      >
        <div className="modal-content">
          <span className="close" onClick={() => setShowUnrentModal(false)}>
            &times;
          </span>
          <h4>Unrent Property</h4>
          <p>Are you sure you want to request to unrent this property?</p>
          <textarea
            id="unrent-reason"
            placeholder="Reason (optional)"
            style={{ width: "100%", marginBottom: 10 }}
          ></textarea>
          <button
            id="confirm-unrent"
            className="btn btn-danger"
            onClick={handleRequestUnrent}
          >
            Confirm Unrent
          </button>
        </div>
      </div>

      {/* Delete account modal */}
      <div
        id="delete-account-popup"
        className="popup-container"
        style={{ display: showDeleteAccountModal ? "flex" : "none" }}
      >
        <div className="popup-content">
          <span
            className="close-btn"
            onClick={() => setShowDeleteAccountModal(false)}
          >
            ×
          </span>
          <h3>Confirm Account Deletion</h3>
          <p>
            This action will permanently delete your account and all associated
            data. Please enter your password to confirm.
          </p>
          <form
            id="delete-account-form"
            ref={deleteAccountFormRef}
            onSubmit={handleDeleteAccount}
          >
            <div className="form-group">
              <label>Password:</label>
              <input name="delete-password" type="password" required />
            </div>
            <div className="form-group">
              <button type="submit" className="submit-btn">
                Confirm Deletion
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;
