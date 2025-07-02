import React, { useEffect, useState, useRef } from "react";
import * as ownerService from "../services/ownerService";
import "../assets/css/OwnerDashboard.css";
import LoadingSpinner from "../components/LoadingSpinner";
import VerificationStatus from "../components/VerificationStatus";
import { useLoading } from "../LoadingContext";

const sectionToUrl = (section) => {
  switch (section) {
    case "properties": return "/owner_dashboard?section=properties";
    case "tenants": return "/owner_dashboard?section=tenants";
    case "payments": return "/owner_dashboard?section=payments";
    case "maintenance": return "/owner_dashboard?section=maintenance";
    case "complaints": return "/owner_dashboard?section=complaints";
    case "rentUnrentRequests": return "/owner_dashboard?section=rentUnrentRequests";
    case "reports": return "/owner_dashboard?section=reports";
    case "notifications": return "/owner_dashboard?section=notifications";
    case "settings": return "/owner_dashboard?section=settings";
    case "verification": return "/owner_dashboard?section=verification";
    default: return "/owner_dashboard";
  }
};

function getSectionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section") || "properties";
}

const OwnerDashboard = () => {
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const { setIsLoading } = useLoading();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState(getSectionFromUrl());

  // Modals / overlays
  const [showStatusUpdateOverlay, setShowStatusUpdateOverlay] = useState(false);
  const [showDeleteAccountOverlay, setShowDeleteAccountOverlay] = useState(false);
  const [showDeletePropertyOverlay, setShowDeletePropertyOverlay] = useState(false);

  // Form refs
  const settingsFormRef = useRef();

  // Maintenance status update
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");

  // Delete property
  const [propertyToDelete, setPropertyToDelete] = useState(null);

  // Delete account
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");

  // 1. Fetch dashboard data
  useEffect(() => {
    let mounted = true;
    console.log("Fetching owner dashboard...");
    ownerService
      .getOwnerDashboard()
      .then((res) => {
        if (!mounted) return;
        if (res && (res.user || res.success)) {
          setDashboard(res);
        } else {
          setDashboard(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Error fetching dashboard:", err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          setIsLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  // 2. Fetch verification status after dashboard loads
  useEffect(() => {
    if (!dashboard?.user?._id) {
      if (dashboard !== null) setVerificationLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/verification/status?userId=${dashboard.user._id}&userModel=owner`);
        const data = await res.json();
        setVerificationStatus(data.status);
      } catch (err) {
        console.error("Verification status fetch failed", err);
        setVerificationStatus(null);
      } finally {
        setVerificationLoading(false);
      }
    })();
  }, [dashboard]);

  // Log section changes (for debugging)
  useEffect(() => {
    console.log("Current section:", section);
  }, [section]);

  if (loading || verificationLoading) {
    return <LoadingSpinner />;
  }

  if (!dashboard) {
    return (
      <div style={{ padding: 20, marginTop: "100px" }}>
        <p>Unable to load dashboard. Please try refreshing the page.</p>
      </div>
    );
  }

  // Decide which section to show
  const isApproved = verificationStatus === "approved";
  const effectiveSection = isApproved
    ? section
    : ["settings", "verification"].includes(section) ? section : "verification";

  // Destructure dashboard data
  const {
    user = {},
    properties = [],
    tenants = [],
    payments = [],
    paymentSummary = {},
    maintenanceRequests = [],
    complaints = [],
    reports = {},
    notifications = [],
  } = dashboard;

  // Toggle sidebar (mobile)
  const handleToggleMenu = () => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.classList.toggle("ownd-sidebar-open");
    }
  };

  // Notification action handler
  const handleNotificationAction = async (notificationId, action, isUnrentRequest) => {
    try {
      const endpoint = isUnrentRequest
        ? `/api/owner/unrent-requests/${notificationId}/${action}`
        : `/api/owner/notifications/${notificationId}/${action}`;
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        setDashboard((prev) => ({
          ...prev,
          notifications: (prev?.notifications || []).map((n) =>
            n._id === notificationId
              ? { ...n, status: action === "approve" ? "Approved" : "Rejected" }
              : n
          ),
        }));
      }
    } catch (err) {
      console.error("Error handling notification:", err);
    }
  };

  // Maintenance status update
  const handleConfirmUpdateStatus = async () => {
    if (!currentRequestId || !selectedStatus) return;
    try {
      const res = await fetch(`/api/owner/maintenance/${currentRequestId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });
      if (res.ok) {
        setShowStatusUpdateOverlay(false);
        setCurrentRequestId(null);
        setSelectedStatus("");
      }
    } catch (err) {
      console.error("Error updating maintenance status:", err);
    }
  };

  // Delete property
  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      const res = await fetch(`/api/owner/properties/${propertyToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDeletePropertyOverlay(false);
        setPropertyToDelete(null);
        setDashboard((prev) => ({
          ...prev,
          properties: (prev?.properties || []).filter((p) => p._id !== propertyToDelete),
        }));
      }
    } catch (err) {
      console.error("Error deleting property:", err);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) return;
    try {
      const res = await fetch(`/api/owner/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deleteAccountPassword }),
      });
      if (res.ok) {
        setShowDeleteAccountOverlay(false);
        setDeleteAccountPassword("");
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Error deleting account:", err);
    }
  };

  return (
    <>
      <div className="ownd-dashboard-container" style={{ position: "relative", marginTop: "80px" }}>
        <button className="ownd-menu-toggle" onClick={handleToggleMenu}>
          <strong>{">"}</strong>
        </button>

        {/* ─── SIDEBAR ──────────────────────────────────────── */}
        <div className="ownd-sidebar" id="sidebar">
          <h2>Owner Dashboard</h2>
          <ul>
            {isApproved ? (
              <>
                <li
                  className={effectiveSection === "properties" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("properties")}
                >
                  <i className="fa-solid fa-house"></i> My Properties
                </li>
                <li
                  className={effectiveSection === "tenants" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("tenants")}
                >
                  <i className="fa-solid fa-user"></i> My Tenants
                </li>
                <li
                  className={effectiveSection === "payments" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("payments")}
                >
                  <i className="fa-solid fa-hand-holding-dollar"></i> Rent Payments
                </li>
                <li
                  className={effectiveSection === "maintenance" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("maintenance")}
                >
                  <i className="fa-solid fa-screwdriver-wrench"></i> Maintenance Requests
                </li>
                <li
                  className={effectiveSection === "complaints" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("complaints")}
                >
                  <i className="fa-solid fa-message"></i> Complaints
                </li>
                <li
                  className={effectiveSection === "rentUnrentRequests" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("rentUnrentRequests")}
                >
                  <i className="fa-solid fa-key"></i> Rent/Unrent Requests
                </li>
                <li
                  className={effectiveSection === "reports" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("reports")}
                >
                  <i className="fa-solid fa-chart-column"></i> Reports & Analytics
                </li>
                <li
                  className={effectiveSection === "notifications" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("notifications")}
                >
                  <i className="fa-solid fa-bell"></i> Notifications
                </li>
                <li
                  className={effectiveSection === "settings" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("settings")}
                >
                  <i className="fa-solid fa-gears"></i> Settings
                </li>
              </>
            ) : (
              <>
                <li
                  className={effectiveSection === "verification" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("verification")}
                >
                  <i className="fa-solid fa-shield-halved"></i> Verification
                </li>
                <li
                  className={effectiveSection === "settings" ? "ownd-sidebar-active-item" : ""}
                  onClick={() => window.location.href = sectionToUrl("settings")}
                >
                  <i className="fa-solid fa-gears"></i> Settings
                </li>
              </>
            )}
          </ul>
        </div>

        {/* ─── MAIN CONTENT ─────────────────────────────────── */}
        <div className="ownd-main-content">

          {!isApproved && (
            <div className="ownd-unverified-banner">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <div>
                <h3>Your account is not verified</h3>
                <p>Please upload your documents and wait for admin approval to access all features.</p>
              </div>
            </div>
          )}

          {/* Verification Section */}
          <div className={`ownd-section ${effectiveSection === "verification" ? "ownd-active" : ""}`}>
            <h3>Account Verification</h3>
            <VerificationStatus userId={dashboard?.user?._id} userModel="owner" />
          </div>

          {/* Properties Section */}
          <div className={`ownd-section ${effectiveSection === "properties" ? "ownd-active" : ""}`}>
            <h3>My Properties</h3>
            <div className="ownd-prop-container">
              {properties.length > 0 ? (
                properties.map((property) => (
                  <div key={property._id} className="ownd-after-scroll-container" data-property-id={property._id}>
                    <div className="ownd-sc-image-container">
                      <img
                        src={
                          property.images?.length > 0
                            ? (typeof property.images[0] === 'string' ? property.images[0] : property.images[0]?.url)
                            : "/images/default.jpg"
                        }
                        className="ownd-sc-image"
                        alt={property.name || "Property"}
                      />
                    </div>
                    <div className="ownd-main-sen">
                      {property.name || "Untitled Property"}
                    </div>
                    <div className="ownd-sc-text">
                      <div className="ownd-prop-details">
                        <ul>
                          <li><strong>Location:</strong> {property.address || "N/A"}</li>
                          <li><strong>City:</strong> {property.location || "N/A"}</li>
                          <li><strong>Monthly Rent:</strong> ₹{(property.price || 0).toLocaleString()}</li>
                          <li><strong>Current Status:</strong> {property.isRented ? "Rented" : "Vacant"}</li>
                        </ul>
                      </div>
                      <div className="ownd-prop-view">
                        <button
                          className="ownd-prop-button"
                          onClick={() => (window.location.href = `/property?id=${property._id}`)}
                        >
                          Property Details
                        </button>
                        {property.isRented && (
                          <>
                            <button className="ownd-prop-button" onClick={() => window.location.href = sectionToUrl("payments")}>
                              Rent Details
                            </button>
                            <button className="ownd-prop-button" onClick={() => window.location.href = sectionToUrl("complaints")}>
                              View Complaints
                            </button>
                          </>
                        )}
                        <button
                          className="ownd-prop-button ownd-delete-button"
                          onClick={() => {
                            if (property.isRented) {
                              alert("Cannot delete rented property.");
                              return;
                            }
                            setPropertyToDelete(property._id);
                            setShowDeletePropertyOverlay(true);
                          }}
                        >
                          Delete Property
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No properties available.</p>
              )}
            </div>
            <button
              className="ownd-add-button"
              onClick={() => (window.location.href = "/property_listing_page")}
            >
              Add New Property
            </button>
          </div>

          {/* Tenants Section */}
          <div className={`ownd-section ${effectiveSection === "tenants" ? "ownd-active" : ""}`}>
            <h3>My Tenants</h3>
            <div className="messages">
              {tenants.length > 0 ? (
                tenants.map((tenant) => (
                  <div key={tenant._id} className="ownd-tenant-details">
                    <ul>
                      <li><strong>{tenant.firstName} {tenant.lastName}</strong></li>
                      <li><strong>PROPERTY:</strong> <a href={`/property?id=${tenant.propid}`}>{tenant.property || "N/A"}</a></li>
                      <li><strong>Contact:</strong> {tenant.phone || "N/A"}</li>
                      <li><strong>Email:</strong> {tenant.email || "N/A"}</li>
                    </ul>
                    <button className="ownd-msg-button" onClick={() => {
                      if (tenant.phone) window.location.href = `tel:${tenant.phone.replace(/[^0-9]/g, '')}`;
                    }}>
                      Contact Tenant
                    </button>
                  </div>
                ))
              ) : (
                <p>No tenants available.</p>
              )}
            </div>
          </div>

          {/* Payments Section */}
          <div className={`ownd-section ${effectiveSection === "payments" ? "ownd-active" : ""}`}>
            <h3>Rent Payments</h3>
            <p>Monthly Revenue: <strong>₹{(paymentSummary?.monthlyRevenue || 0).toLocaleString()}</strong></p>
            <p>Upcoming Payments: <strong>₹{(paymentSummary?.upcomingPayments || 0).toLocaleString()}</strong></p>

            <div className="ownd-payment-table-container">
              <h4>Recent Transactions</h4>
              <table className="ownd-payment-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tenant</th>
                    <th>Property</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <tr key={payment._id}>
                        <td>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "N/A"}</td>
                        <td>{payment.userName || "N/A"}</td>
                        <td>{payment.property || "N/A"}</td>
                        <td>₹{(payment.amount || 0).toLocaleString()}</td>
                        <td><span className="ownd-status-paid">{payment.status || "N/A"}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5">No transactions available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ownd-payment-summary">
              <div className="ownd-summary-card">
                <h4>Total Revenue</h4>
                <p className="ownd-amount">₹{(paymentSummary?.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="ownd-summary-card">
                <h4>Website Commission</h4>
                <p className="ownd-amount">₹{(paymentSummary?.commission || 0).toLocaleString()}</p>
              </div>
              <div className="ownd-summary-card">
                <h4>Net Income</h4>
                <p className="ownd-amount">₹{(paymentSummary?.netIncome || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Maintenance Section */}
          <div className={`ownd-section ${effectiveSection === "maintenance" ? "ownd-active" : ""}`}>
            <h3>Maintenance Requests</h3>
            <div className="ownd-maintenance-requests">
              {maintenanceRequests.length > 0 ? (
                maintenanceRequests.map((request) => (
                  <div key={request._id} className="ownd-request-card">
                    <div className="ownd-request-header">
                      <h4>{request.issueType || "N/A"}</h4>
                      <span className={`ownd-request-status ownd-${request.status?.toLowerCase().replace(" ", "-") || ""}`}>
                        {request.status || "N/A"}
                      </span>
                    </div>
                    <div className="ownd-request-details">
                      <p><strong>Property:</strong> {request.propertyName || "N/A"}</p>
                      <p><strong>Tenant:</strong> {request.tenantName || "N/A"}</p>
                      <p><strong>Date Submitted:</strong> {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : "N/A"}</p>
                      <p><strong>Description:</strong> {request.description || "N/A"}</p>
                    </div>
                    <div className="ownd-request-actions">
                      <button
                        className="ownd-update-sts"
                        onClick={() => {
                          setCurrentRequestId(request._id);
                          setSelectedStatus(request.status?.toLowerCase().replace(" ", "-") || "pending");
                          setShowStatusUpdateOverlay(true);
                        }}
                      >
                        Update Status
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No maintenance requests available.</p>
              )}
            </div>
          </div>

          {/* Complaints Section */}
          <div className={`ownd-section ${effectiveSection === "complaints" ? "ownd-active" : ""}`}>
            <h3>Tenant Complaints</h3>
            <div className="ownd-complaint-container">
              {complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <div key={complaint._id} className="ownd-res-complaint">
                    <ul>
                      <strong><li>{complaint.property || "N/A"}</li></strong>
                      <ul>
                        <li><strong>Issue:</strong> {complaint.subject || "N/A"}</li>
                        <li><strong>Reported by:</strong> {complaint.reportedBy || "N/A"}</li>
                        <li><strong>Date Reported:</strong> {complaint.dateSubmitted ? new Date(complaint.dateSubmitted).toLocaleDateString() : "N/A"}</li>
                        <li><strong>Current Status:</strong> {complaint.status || "N/A"}</li>
                      </ul>
                    </ul>
                    <button className="ownd-update-sts">Update Current Status</button>
                    <button className="ownd-update-sts" onClick={() => {
                      if (complaint.phone) window.location.href = `tel:${complaint.phone.replace(/[^0-9]/g, '')}`;
                    }}>
                      Contact Tenant
                    </button>
                  </div>
                ))
              ) : (
                <p>No complaints available.</p>
              )}
            </div>
          </div>

          {/* Rent / Unrent Requests */}
          <div className={`ownd-section ${effectiveSection === "rentUnrentRequests" ? "ownd-active" : ""}`}>
            <h3>Rent/Unrent Requests</h3>
            <div className="ownd-notification-container">
              {notifications.filter(n => n.type === "Booking Request" || n.type === "Unrent Request").length > 0 ? (
                notifications
                  .filter(n => n.type === "Booking Request" || n.type === "Unrent Request")
                  .map((notification) => (
                    <div key={notification._id} className="ownd-notification-card">
                      <div className="ownd-notification-header">
                        <h4>{notification.type || "Request"}</h4>
                        <span className={`ownd-notification-status ownd-${(notification.status || "pending").toLowerCase()}`}>
                          {notification.status || "Pending"}
                        </span>
                      </div>
                      <div className="ownd-notification-details">
                        <p><strong>Message:</strong> {notification.message || "N/A"}</p>
                        <p><strong>Recipient:</strong> {notification.recipientName || "N/A"}</p>
                        <p><strong>Property:</strong> {notification.propertyName || "N/A"}</p>
                        <p><strong>Date:</strong> {notification.createdDate ? new Date(notification.createdDate).toLocaleDateString() : "N/A"}</p>
                      </div>
                      {notification.status === "Pending" && (
                        <div className="ownd-notification-actions">
                          <button
                            className="ownd-action-button ownd-approve-button"
                            onClick={() => handleNotificationAction(notification._id, "approve", notification.type === "Unrent Request")}
                          >
                            Approve
                          </button>
                          <button
                            className="ownd-action-button ownd-reject-button"
                            onClick={() => handleNotificationAction(notification._id, "reject", notification.type === "Unrent Request")}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <p>No rent/unrent requests available.</p>
              )}
            </div>
          </div>

          {/* Reports Section */}
          <div className={`ownd-section ${effectiveSection === "reports" ? "ownd-active" : ""}`}>
            <h3>Reports & Analytics</h3>
            <div className="ownd-reports-summary">
              <div className="ownd-report-card">
                <h4>Monthly Revenue</h4>
                <p className="ownd-amount">₹{(reports?.monthlyRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="ownd-report-card">
                <h4>Occupancy Rate</h4>
                <p className="ownd-amount">{reports?.occupancyRate || 0}%</p>
              </div>
              <div className="ownd-report-card">
                <h4>Maintenance Costs</h4>
                <p className="ownd-amount">₹{(reports?.maintenanceCosts || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className={`ownd-section ${effectiveSection === "settings" ? "ownd-active" : ""}`}>
            <h3>Settings</h3>
            <form ref={settingsFormRef}>
              <div className="ownd-settings-section">
                <h4>Change Password</h4>
                <div className="ownd-form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="ownd-settings-section">
                <h4>Notification Preferences</h4>
                <div className="ownd-checkbox-group">
                  <label htmlFor="emailNotifications">Email notifications</label>
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    defaultChecked={user?.notifications?.email || false}
                  />
                </div>
                {/* ... other checkboxes ... */}
              </div>

              <div className="ownd-button-container">
                <button type="submit" className="ownd-settings-button ownd-primary-button">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="ownd-settings-button ownd-secondary-button"
                  onClick={() => settingsFormRef.current?.reset()}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ownd-settings-button ownd-delete-button"
                  onClick={() => setShowDeleteAccountOverlay(true)}
                >
                  Delete Account
                </button>
              </div>
            </form>
          </div>

          {/* Notifications Section */}
          <div className={`ownd-section ${effectiveSection === "notifications" ? "ownd-active" : ""}`}>
            <h3>Notifications</h3>
            <div className="ownd-notification-container">
              {notifications.filter(n =>
                n.type !== "Booking Request" && n.type !== "Unrent Request"
              ).length > 0 ? (
                notifications
                  .filter(n => n.type !== "Booking Request" && n.type !== "Unrent Request")
                  .map((notification) => (
                    <div key={notification._id} className="ownd-notification-card">
                      <div className="ownd-notification-header">
                        <h4>{notification.type || "Notification"}</h4>
                        <span className={`ownd-notification-status ownd-${(notification.status || "pending").toLowerCase()}`}>
                          {notification.status || "Pending"}
                        </span>
                      </div>
                      <div className="ownd-notification-details">
                        <p><strong>Message:</strong> {notification.message || "N/A"}</p>
                        <p><strong>Recipient:</strong> {notification.recipientName || "N/A"}</p>
                        <p><strong>Property:</strong> {notification.propertyName || "N/A"}</p>
                        <p><strong>Date:</strong> {notification.createdDate ? new Date(notification.createdDate).toLocaleDateString() : "N/A"}</p>
                      </div>
                      {(notification.status === "Pending" && notification.type !== "Query") && (
                        <div className="ownd-notification-actions">
                          <button
                            className="ownd-action-button ownd-approve-button"
                            onClick={() => handleNotificationAction(notification._id, "approve", false)}
                          >
                            Approve
                          </button>
                          <button
                            className="ownd-action-button ownd-reject-button"
                            onClick={() => handleNotificationAction(notification._id, "reject", false)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <p>No notifications available.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ─── OVERLAYS ─────────────────────────────────────── */}

      {/* Status Update Overlay */}
      {showStatusUpdateOverlay && (
        <div className="ownd-popup-overlay" style={{ display: "flex" }}>
          <div className="ownd-popup-container">
            <h4>Update Status</h4>
            <div className="ownd-status-options">
              <p>Select new status:</p>
              {["pending", "in-progress", "resolved"].map((val) => (
                <div key={val} className="ownd-status-option">
                  <input
                    type="radio"
                    name="status"
                    id={`status-${val}`}
                    value={val}
                    checked={selectedStatus === val}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  />
                  <label htmlFor={`status-${val}`}>
                    {val === "in-progress" ? "In Progress" : val.charAt(0).toUpperCase() + val.slice(1)}
                  </label>
                </div>
              ))}
            </div>
            <div className="ownd-popup-buttons">
              <button className="ownd-cancel-button" onClick={() => setShowStatusUpdateOverlay(false)}>
                Cancel
              </button>
              <button className="ownd-confirm-button" onClick={handleConfirmUpdateStatus}>
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Property Overlay */}
      {showDeletePropertyOverlay && (
        <div className="ownd-popup-overlay" style={{ display: "flex" }}>
          <div className="ownd-delete-popup-container">
            <h4>Delete Property?</h4>
            <p>Are you sure? This action cannot be undone.</p>
            <div className="ownd-delete-popup-buttons">
              <button
                className="ownd-delete-cancel-button"
                onClick={() => {
                  setShowDeletePropertyOverlay(false);
                  setPropertyToDelete(null);
                }}
              >
                Cancel
              </button>
              <button className="ownd-delete-confirm-button" onClick={handleDeleteProperty}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Overlay */}
      {showDeleteAccountOverlay && (
        <div className="ownd-popup-overlay" style={{ display: "flex" }}>
          <div className="ownd-popup-container">
            <h4>Delete Account?</h4>
            <p>Are you sure? This action cannot be undone. Enter password to confirm.</p>
            <div className="ownd-form-group">
              <label htmlFor="deleteAccountPassword">Password</label>
              <input
                type="password"
                id="deleteAccountPassword"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <div className="ownd-popup-buttons">
              <button
                className="ownd-cancel-button"
                onClick={() => {
                  setShowDeleteAccountOverlay(false);
                  setDeleteAccountPassword("");
                }}
              >
                Cancel
              </button>
              <button className="ownd-confirm-button" onClick={handleDeleteAccount}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OwnerDashboard;