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
    default: return "/owner_dashboard";
  }
};

const Sidebar = () => (
  <div className="ownd-sidebar" id="sidebar">
    <h2>Owner Dashboard</h2>
    <ul>
      <li onClick={() => window.location.href = sectionToUrl("properties")}>
        <i className="fa-solid fa-house"></i> My Properties
      </li>
      <li onClick={() => window.location.href = sectionToUrl("tenants")}>
        <i className="fa-solid fa-user"></i> My Tenants
      </li>
      <li onClick={() => window.location.href = sectionToUrl("payments")}>
        <i className="fa-solid fa-hand-holding-dollar"></i> Rent Payments
      </li>
      <li onClick={() => window.location.href = sectionToUrl("maintenance")}>
        <i className="fa-solid fa-screwdriver-wrench"></i> Maintenance Requests
      </li>
      <li onClick={() => window.location.href = sectionToUrl("complaints")}>
        <i className="fa-solid fa-message"></i> Complaints
      </li>
      <li onClick={() => window.location.href = sectionToUrl("rentUnrentRequests")}>
        <i className="fa-solid fa-key"></i> Rent/Unrent Requests
      </li>
      <li onClick={() => window.location.href = sectionToUrl("reports")}>
        <i className="fa-solid fa-chart-column"></i> Reports & Analytics
      </li>
      <li onClick={() => window.location.href = sectionToUrl("notifications")}>
        <i className="fa-solid fa-bell"></i> Notifications
      </li>
      <li onClick={() => window.location.href = sectionToUrl("settings")}>
        <i className="fa-solid fa-gears"></i> Settings
      </li>
    </ul>
  </div>
);

function getSectionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section") || "properties";
}

const OwnerDashboard = () => {

  const [verificationStatus, setVerificationStatus] = useState(null);
  const { setIsLoading } = useLoading();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState(getSectionFromUrl());

  // Modals/overlays
  const [showStatusUpdateOverlay, setShowStatusUpdateOverlay] = useState(false);
  const [showDeleteAccountOverlay, setShowDeleteAccountOverlay] = useState(false);
  const [showDeletePropertyOverlay, setShowDeletePropertyOverlay] = useState(false);

  // Forms
  const settingsFormRef = useRef();
  const deleteAccountFormRef = useRef();

  // State for maintenance status update
  const [currentStatusElement, setCurrentStatusElement] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");

  // 1️⃣ Fetch dashboard
  useEffect(() => {
    let mounted = true;
    console.log("OwnerDashboard: Fetching dashboard data...");
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
          console.error("OwnerDashboard: Error fetching dashboard:", err);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 2️⃣ Fetch verification AFTER dashboard loads
  useEffect(() => {
    if (dashboard?.user?._id) {
      (async () => {
        try {
          const res = await fetch(`/api/verification/status?userId=${dashboard.user._id}&userModel=owner`);
          const data = await res.json();
          setVerificationStatus(data.status);
        } catch {
          setVerificationStatus(null);
        }
      })();
    }
  }, [dashboard]);

  // Log when section changes
  useEffect(() => {
    console.log("Current section:", section);
  }, [section]);

  // Destructure user and notifications from dashboard
  const user = dashboard?.user || null;
  const notifications = dashboard?.notifications || [];

  // Toggle sidebar menu
  const handleToggleMenu = () => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.classList.toggle("ownd-sidebar-open");
    }
  };

  // Handle notification approve/reject actions
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
      console.error("Error handling notification action:", err);
    }
  };

  // Handle confirm status update for maintenance
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
      console.error("Error updating status:", err);
    }
  };

  // Handle delete property
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

  // Handle delete account
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!dashboard) {
    return (
      <div style={{ padding: 20, marginTop: "100px" }}>
        <p>Unable to load dashboard. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <>
      {verificationStatus !== "approved" ? (
        <div className="ownd-dashboard-blocked">
          <VerificationStatus userId={dashboard?.user?._id} userModel="owner" />
          <div className="ownd-blocked-message">
            <h3>Your account is not verified.</h3>
            <p>
              Please upload your documents and wait for admin approval. Only settings and verification are available until approved.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div
            className="ownd-dashboard-container"
            style={{ position: "relative", marginTop: "80px" }}
          >
            <button className="ownd-menu-toggle" onClick={handleToggleMenu}>
              <strong>{" > "}</strong>
            </button>
            <Sidebar />
            <VerificationStatus userId={dashboard?.user?._id} userModel="owner" />
          </div>

          <div className="ownd-main-content">
            {/* Properties Section */}
            <div className={`ownd-section ${section === "properties" ? "ownd-active" : ""}`}>
              {/* ...existing code... */}
            </div>

            {/* Tenants Section */}
            <div className={`ownd-section ${section === "tenants" ? "ownd-active" : ""}`}>
              {/* ...existing code... */}
            </div>

            {/* Payments Section */}
            <div className={`ownd-section ${section === "payments" ? "ownd-active" : ""}`}>
              {/* ...existing code... */}
            </div>

            {/* Maintenance Section */}
            <div className={`ownd-section ${section === "maintenance" ? "ownd-active" : ""}`}>
              {/* ...existing code... */}
            </div>

            {/* Complaints Section */}
            <div className={`ownd-section ${section === "complaints" ? "ownd-active" : ""}`}>
              {/* ...existing code... */}
            </div>

            {/* Rent/Unrent Requests Section */}
            <div className={`ownd-section ${section === "rentUnrentRequests" ? "ownd-active" : ""}`}>
              {/* ...existing code... */}
            </div>

            {/* Reports Section */}
            <div className={`ownd-section ${section === "reports" ? "ownd-active" : ""}`}>
              {/* ...existing code... */}
            </div>

            {/* Settings Section */}
            <div className={`ownd-section ${section === "settings" ? "ownd-active" : ""}`}>
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
                      name="emailNotifications"
                      defaultChecked={user?.notifications?.email || false}
                    />
                    <label htmlFor="emailNotifications" className="ownd-button"></label>
                  </div>
                  <div className="ownd-checkbox-group">
                    <label htmlFor="smsNotifications">SMS notifications</label>
                    <input
                      type="checkbox"
                      id="smsNotifications"
                      name="smsNotifications"
                      defaultChecked={user?.notifications?.sms || false}
                    />
                    <label htmlFor="smsNotifications" className="ownd-button"></label>
                  </div>
                  <div className="ownd-checkbox-group">
                    <label htmlFor="paymentReminders">Payment reminders</label>
                    <input
                      type="checkbox"
                      id="paymentReminders"
                      name="paymentReminders"
                      defaultChecked={user?.notifications?.payment || false}
                    />
                    <label htmlFor="paymentReminders" className="ownd-button"></label>
                  </div>
                  <div className="ownd-checkbox-group">
                    <label htmlFor="complaintAlerts">Complaint alerts</label>
                    <input
                      type="checkbox"
                      id="complaintAlerts"
                      name="complaintAlerts"
                      defaultChecked={user?.notifications?.complaint || false}
                    />
                    <label htmlFor="complaintAlerts" className="ownd-button"></label>
                  </div>
                  <div className="ownd-checkbox-group">
                    <label htmlFor="maintenanceAlerts">Maintenance alerts</label>
                    <input
                      type="checkbox"
                      id="maintenanceAlerts"
                      name="maintenanceAlerts"
                      defaultChecked={user?.notifications?.maintenance || false}
                    />
                    <label htmlFor="maintenanceAlerts" className="ownd-button"></label>
                  </div>
                </div>

                <div className="ownd-button-container">
                  <button
                    type="submit"
                    id="saveSettingsBtn"
                    className="ownd-settings-button ownd-primary-button"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    id="cancelSettingsBtn"
                    className="ownd-settings-button ownd-secondary-button"
                    onClick={() => settingsFormRef.current?.reset()}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="deleteAccountBtn"
                    className="ownd-settings-button ownd-delete-button"
                    onClick={() => setShowDeleteAccountOverlay(true)}
                  >
                    Delete Account
                  </button>
                </div>
              </form>
            </div>

            {/* Notifications Section */}
            <div className={`ownd-section ${section === "notifications" ? "ownd-active" : ""}`}>
              <h3>Notifications</h3>
              <div className="ownd-notification-container">
                {notifications &&
                notifications.filter(
                  (notification) =>
                    notification.type !== "Booking Request" &&
                    notification.type !== "Unrent Request"
                ).length > 0 ? (
                  notifications
                    .filter(
                      (notification) =>
                        notification.type !== "Booking Request" &&
                        notification.type !== "Unrent Request"
                    )
                    .map((notification) => (
                      <div
                        key={notification._id}
                        className="ownd-notification-card"
                        data-notification-id={notification._id}
                        data-is-unrent={notification.isUnrentRequest || false}
                      >
                        <div className="ownd-notification-header">
                          <h4>{notification.type || "Notification"}</h4>
                          <span
                            className={`ownd-notification-status ownd-${(
                              notification.status || "pending"
                            ).toLowerCase()}`}
                          >
                            {notification.status || "Pending"}
                          </span>
                        </div>
                        <div className="ownd-notification-details">
                          {notification.type === "Query" ? (
                            <>
                              <p>
                                <strong>Query:</strong>
                                <br />
                                {notification.message?.split("\n\n")[0] || "N/A"}
                              </p>
                              <p>
                                <strong>Contact Name:</strong>{" "}
                                {notification.recipientName || "N/A"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p>
                                <strong>Message:</strong>{" "}
                                {notification.message || "N/A"}
                              </p>
                              <p>
                                <strong>Recipient:</strong>{" "}
                                {notification.recipientName || "N/A"}
                              </p>
                            </>
                          )}
                          <p>
                            <strong>Property:</strong>{" "}
                            {notification.propertyName || "N/A"}
                          </p>
                          <p>
                            <strong>Date:</strong>{" "}
                            {notification.createdDate
                              ? new Date(notification.createdDate).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                        {(notification.status === "Pending" &&
                          notification.type !== "Query") ||
                        notification.isUnrentRequest ? (
                          <div className="ownd-notification-actions">
                            <button
                              className="ownd-action-button ownd-approve-button"
                              onClick={() =>
                                handleNotificationAction(
                                  notification._id,
                                  "approve",
                                  notification.isUnrentRequest || false
                                )
                              }
                            >
                              Approve
                            </button>
                            <button
                              className="ownd-action-button ownd-reject-button"
                              onClick={() =>
                                handleNotificationAction(
                                  notification._id,
                                  "reject",
                                  notification.isUnrentRequest || false
                                )
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))
                ) : (
                  <p>No notifications available.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Status Update Overlay */}
      {showStatusUpdateOverlay && (
        <div className="ownd-popup-overlay" style={{ display: "flex" }}>
          <div className="ownd-popup-container">
            <h4 className="ownd-popup-title">Update Status</h4>
            <div className="ownd-status-options">
              <p>Select new status:</p>
              <div className="ownd-status-option">
                <input
                  type="radio"
                  name="status"
                  id="status-pending"
                  value="pending"
                  checked={selectedStatus === "pending"}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                />
                <label htmlFor="status-pending">Pending</label>
              </div>
              <div className="ownd-status-option">
                <input
                  type="radio"
                  name="status"
                  id="status-inprogress"
                  value="in-progress"
                  checked={selectedStatus === "in-progress"}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                />
                <label htmlFor="status-inprogress">In Progress</label>
              </div>
              <div className="ownd-status-option">
                <input
                  type="radio"
                  name="status"
                  id="status-resolved"
                  value="resolved"
                  checked={selectedStatus === "resolved"}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                />
                <label htmlFor="status-resolved">Resolved</label>
              </div>
            </div>
            <div className="ownd-popup-buttons">
              <button
                className="ownd-cancel-button"
                onClick={() => setShowStatusUpdateOverlay(false)}
              >
                Cancel
              </button>
              <button
                className="ownd-confirm-button"
                onClick={handleConfirmUpdateStatus}
              >
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
            <h4 className="ownd-delete-popup-title">Delete Property?</h4>
            <p className="ownd-delete-popup-message">
              Are you sure you want to delete this property? This action cannot be undone.
            </p>
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
              <button
                className="ownd-delete-confirm-button"
                onClick={handleDeleteProperty}
              >
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
            <h4 className="ownd-popup-title">Delete Account?</h4>
            <p className="ownd-popup-message">
              Are you sure you want to delete your account? This action cannot be undone. Please enter your password to confirm.
            </p>
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
              <button
                className="ownd-confirm-button"
                onClick={handleDeleteAccount}
              >
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