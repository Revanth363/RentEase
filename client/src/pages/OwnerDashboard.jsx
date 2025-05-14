import React, { useEffect, useState, useRef } from "react";
import * as ownerService from "../services/ownerService";
import "../assets/css/OwnerDashboard.css";
import LoadingSpinner from "../components/LoadingSpinner";
import { useLoading } from "../LoadingContext";

const Sidebar = ({ onSelect, current }) => (
  <div className="ownd-sidebar" id="sidebar">
    <h2>Owner Dashboard</h2>
    <ul>
      <li onClick={() => onSelect("properties")}>
        <i className="fa-solid fa-house"></i> My Properties
      </li>
      <li onClick={() => onSelect("tenants")}>
        <i className="fa-solid fa-user"></i> My Tenants
      </li>
      <li onClick={() => onSelect("payments")}>
        <i className="fa-solid fa-hand-holding-dollar"></i> Rent Payments
      </li>
      <li onClick={() => onSelect("maintenance")}>
        <i className="fa-solid fa-screwdriver-wrench"></i> Maintenance Requests
      </li>
      <li onClick={() => onSelect("complaints")}>
        <i className="fa-solid fa-message"></i> Complaints
      </li>
      <li onClick={() => onSelect("rentUnrentRequests")}>
        <i className="fa-solid fa-key"></i> Rent/Unrent Requests
      </li>
      <li onClick={() => onSelect("reports")}>
        <i className="fa-solid fa-chart-column"></i> Reports & Analytics
      </li>
      <li onClick={() => onSelect("notifications")}>
        <i className="fa-solid fa-bell"></i> Notifications
      </li>
      <li onClick={() => onSelect("settings")}>
        <i className="fa-solid fa-gears"></i> Settings
      </li>
    </ul>
  </div>
);

const OwnerDashboard = () => {
  const { setIsLoading } = useLoading();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("properties");

  // Modals/overlays
  const [showStatusUpdateOverlay, setShowStatusUpdateOverlay] = useState(false);
  const [showDeleteAccountOverlay, setShowDeleteAccountOverlay] =
    useState(false);
  const [showDeletePropertyOverlay, setShowDeletePropertyOverlay] =
    useState(false);

  // Forms
  const settingsFormRef = useRef();
  const deleteAccountFormRef = useRef();

  // State for maintenance status update
  const [currentStatusElement, setCurrentStatusElement] = useState(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");

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

  // Log when section changes
  useEffect(() => {
    console.log("Current section:", section);
  }, [section]);

  if (loading) {
    return <LoadingSpinner />;
  }
  if (!dashboard)
    return (
      <div style={{ padding: 20, marginTop: "100px" }}>
        <p>Unable to load dashboard. Please try refreshing the page.</p>
      </div>
    );

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

  // Handle section display
  const handleShowSection = (sectionId) => {
    console.log("Showing section:", sectionId);
    setSection(sectionId);
    if (window.innerWidth <= 768) {
      const sidebar = document.querySelector(".ownd-sidebar");
      const menuButton = document.querySelector(".ownd-menu-toggle");
      if (sidebar) sidebar.classList.remove("ownd-active");
      if (menuButton) menuButton.innerHTML = "<strong>></strong>";
    }
  };

  // Handle toggle menu
  const handleToggleMenu = () => {
    const sidebar = document.querySelector(".ownd-sidebar");
    const menuButton = document.querySelector(".ownd-menu-toggle");
    if (sidebar) {
      sidebar.classList.toggle("ownd-active");
      if (sidebar.classList.contains("ownd-active")) {
        if (menuButton) menuButton.innerHTML = "<strong><</strong>";
      } else {
        if (menuButton) menuButton.innerHTML = "<strong>></strong>";
      }
    }
  };

  // Delete property handler
  const handleShowDeleteConfirmation = (propertyId, isRented) => {
    if (isRented) {
      alert("Cannot delete this property because it is currently rented.");
      return;
    }
    setPropertyToDelete(propertyId);
    setShowDeletePropertyOverlay(true);
  };

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;
    try {
      const res = await ownerService.deleteProperty(propertyToDelete);
      if (res.success) {
        setDashboard((prev) => ({
          ...prev,
          properties: prev.properties.filter((p) => p._id !== propertyToDelete),
        }));
        setShowDeletePropertyOverlay(false);
        setPropertyToDelete(null);
        alert("Property successfully deleted!");
      } else {
        alert("Failed to delete property: " + (res.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("An error occurred while deleting the property.");
    }
  };

  // Maintenance request status update
  const handleUpdateMaintenanceStatus = (requestId) => {
    setCurrentRequestId(requestId);
    const currentStatus = maintenanceRequests
      .find((r) => r._id === requestId)
      ?.status.toLowerCase()
      .replace(" ", "-");
    setSelectedStatus(currentStatus || "pending");
    setShowStatusUpdateOverlay(true);
  };

  const handleConfirmUpdateStatus = async () => {
    if (!currentRequestId || !selectedStatus) return;

    let formattedStatus;
    switch (selectedStatus) {
      case "pending":
        formattedStatus = "Pending";
        break;
      case "in-progress":
        formattedStatus = "In Progress";
        break;
      case "resolved":
        formattedStatus = "Resolved";
        break;
      default:
        formattedStatus = selectedStatus;
    }

    try {
      const res = await ownerService.updateMaintenanceRequestStatus({
        requestId: currentRequestId,
        status: formattedStatus,
      });

      if (res.success) {
        setDashboard((prev) => ({
          ...prev,
          maintenanceRequests: prev.maintenanceRequests.map((r) =>
            r._id === currentRequestId ? { ...r, status: formattedStatus } : r
          ),
        }));
        setShowStatusUpdateOverlay(false);
        setCurrentRequestId(null);
      } else {
        alert("Failed to update status: " + res.message);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("An error occurred while updating the status.");
    }
  };

  // Contact tenant handler
  const handleContactTenant = (tenantPhone) => {
    if (tenantPhone) {
      const phoneNumber = tenantPhone.replace(/[^0-9]/g, "");
      if (phoneNumber) {
        window.location.href = "tel:" + phoneNumber;
      } else {
        alert("Could not find a valid phone number for this tenant");
      }
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      alert("Please enter your password");
      return;
    }

    try {
      const res = await ownerService.deleteOwnerAccount({
        password: deleteAccountPassword,
      });
      if (res.success) {
        alert("Account deleted successfully!");
        window.location.href = "/login";
      } else {
        alert(res.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting the account.");
    }
  };

  // Settings form handler
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    const form = settingsFormRef.current;

    const formData = {
      firstName: form["firstName"]?.value?.trim() || "",
      lastName: form["lastName"]?.value?.trim() || "",
      email: form["email"]?.value?.trim() || "",
      phone: form["phone"]?.value?.trim() || "",
      location: form["location"]?.value?.trim() || "",
      accountNo: form["accountNo"]?.value?.trim() || "",
      upiid: form["upiid"]?.value?.trim() || "",
      numProperties: form["numProperties"]?.value?.trim() || "",
      emailNotifications:
        document.getElementById("emailNotifications")?.checked.toString() ||
        "false",
      smsNotifications:
        document.getElementById("smsNotifications")?.checked.toString() ||
        "false",
      paymentReminders:
        document.getElementById("paymentReminders")?.checked.toString() ||
        "false",
      complaintAlerts:
        document.getElementById("complaintAlerts")?.checked.toString() ||
        "false",
      maintenanceAlerts:
        document.getElementById("maintenanceAlerts")?.checked.toString() ||
        "false",
      currentPassword: form["currentPassword"]?.value || "",
      newPassword: form["newPassword"]?.value || "",
      confirmPassword: form["confirmPassword"]?.value || "",
    };

    // Validation

    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    const emailRegex =
      /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\d{10}$/;

    if (!formData.firstName) {
      alert("First name is required");
      return;
    }
    if (!nameRegex.test(formData.firstName)) {
      alert("First name must contain only letters");
      return;
    }

    if (!formData.lastName) {
      alert("Last name is required");
      return;
    }
    if (!nameRegex.test(formData.lastName)) {
      alert("Last name must contain only letters");
      return;
    }

    if (!formData.email) {
      alert("Email is required");
      return;
    }
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!formData.phone) {
      alert("Phone number is required");
      return;
    }
    if (!phoneRegex.test(formData.phone)) {
      alert("Phone number must be exactly 10 numerical digits");
      return;
    }

    if (!formData.location) {
      alert("Location is required");
      return;
    }

    // Password validation (only if attempting to change password)
    if (formData.newPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        alert("Current password is required to change password");
        return;
      }
      if (!formData.newPassword) {
        alert("New password is required");
        return;
      }
      if (formData.newPassword.length < 8) {
        alert("New password must be at least 8 characters long");
        return;
      }
      if (!/[A-Z]/.test(formData.newPassword)) {
        alert("New password must contain at least one uppercase letter");
        return;
      }
      if (!/[a-z]/.test(formData.newPassword)) {
        alert("New password must contain at least one lowercase letter");
        return;
      }
      if (!/[0-9]/.test(formData.newPassword)) {
        alert("New password must contain at least one number");
        return;
      }
      if (!formData.confirmPassword) {
        alert("Confirm password is required");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }
    }

    try {
      const res = await ownerService.updateOwnerSettings(formData);
      if (res.success) {
        alert("Settings updated successfully!");
        setDashboard((prev) => ({
          ...prev,
          user: { ...prev.user, ...formData },
        }));
      } else {
        alert(res.message || "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("An error occurred while updating settings.");
    }
  };

  // Handle notification actions
  const handleNotificationAction = async (
    notificationId,
    action,
    isUnrentRequest
  ) => {
    let bodyData;

    if (isUnrentRequest) {
      bodyData = {
        unrentRequestId: notificationId,
        action: action,
      };
      try {
        const res = await ownerService.approveUnrentProperty(bodyData);
        if (res.success) {
          alert(
            `Unrent request ${
              action === "approve" ? "approved" : "rejected"
            } successfully!`
          );
          window.location.reload();
        } else {
          alert(`Failed to ${action} unrent request: ${res.message}`);
        }
      } catch (error) {
        console.error("Error handling unrent request:", error);
        alert(`Failed to process the request: ${error.message}`);
      }
    } else {
      bodyData = {
        notificationId: notificationId,
        action: action,
      };
      try {
        const res = await ownerService.handleNotificationAction(bodyData);
        if (res.success) {
          setDashboard((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) =>
              n._id === notificationId
                ? {
                    ...n,
                    status: action === "approve" ? "Approved" : "Rejected",
                  }
                : n
            ),
          }));
          alert(
            `Notification ${
              action === "approve" ? "approved" : "rejected"
            } successfully!`
          );
        } else {
          alert(`Failed to ${action} notification: ${res.message}`);
        }
      } catch (error) {
        console.error("Error handling notification action:", error);
        alert(`Failed to process the request: ${error.message}`);
      }
    }
  };

  return (
    <div
      className="ownd-dashboard-container"
      style={{ position: "relative", marginTop: "80px" }}
    >
      <button className="ownd-menu-toggle" onClick={handleToggleMenu}>
        <strong>{" > "}</strong>
      </button>

      <Sidebar onSelect={handleShowSection} current={section} />

      <div className="ownd-main-content">
        {/* Properties Section */}
        <div
          className={`ownd-section ${
            section === "properties" ? "ownd-active" : ""
          }`}
        >
          <h3>My Properties</h3>
          <div className="ownd-prop-container">
            {properties && properties.length > 0 ? (
              properties.map((property) => (
                <div
                  key={property._id}
                  className="ownd-after-scroll-container"
                  data-property-id={property._id}
                >
                  <div className="ownd-sc-image-container">
                    <img
                      src={
                        property.images && Array.isArray(property.images) && property.images.length > 0
                          ? (typeof property.images[0] === 'string' 
                              ? property.images[0] 
                              : property.images[0]?.url)
                          : "/images/default.jpg"
                      }
                      className="ownd-sc-image"
                      alt={property.name}
                    />
                  </div>
                  <div className="ownd-main-sen">
                    {property.name || "Untitled Property"}
                  </div>
                  <div className="ownd-sc-text">
                    <div className="ownd-prop-details">
                      <ul>
                        <li>
                          <strong>Location:</strong> {property.address || "N/A"}
                        </li>
                        <li>
                          <strong>City:</strong> {property.location || "N/A"}
                        </li>
                        <li>
                          <strong>Monthly Rent:</strong> ₹
                          {(property.price || 0).toLocaleString()}
                        </li>
                        <li>
                          <strong>Current Status:</strong>{" "}
                          {property.isRented ? "Rented" : "Vacant"}
                        </li>
                      </ul>
                    </div>
                    <div className="ownd-prop-view">
                      <button
                        className="ownd-prop-button"
                        onClick={() =>
                          (window.location.href = `/property?id=${property._id}`)
                        }
                      >
                        Property Details
                      </button>
                      {property.isRented === true && (
                        <>
                          <button
                            className="ownd-prop-button"
                            onClick={() => handleShowSection("payments")}
                          >
                            Rent Details
                          </button>
                          <button
                            className="ownd-prop-button"
                            onClick={() => handleShowSection("complaints")}
                          >
                            View Complaints
                          </button>
                        </>
                      )}
                      <button
                        className="ownd-prop-button ownd-delete-button"
                        onClick={() =>
                          handleShowDeleteConfirmation(
                            property._id,
                            property.isRented
                          )
                        }
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
        <div
          className={`ownd-section ${
            section === "tenants" ? "ownd-active" : ""
          }`}
        >
          <h3>My Tenants</h3>
          <div className="messages">
            {tenants && tenants.length > 0 ? (
              tenants.map((tenant) => (
                <div key={tenant._id} className="ownd-tenant-details">
                  <ul>
                    <li>
                      <strong>
                        {tenant.firstName || ""} {tenant.lastName || ""}
                      </strong>
                    </li>
                    <li>
                      <strong>PROPERTY:</strong>
                      <a href={`/property?id=${tenant.propid}`}>
                        {tenant.property || "N/A"}
                      </a>
                    </li>
                    <li>
                      <strong>Contact:</strong> {tenant.phone || "N/A"}
                    </li>
                    <li>
                      <strong>Email:</strong> {tenant.email || "N/A"}
                    </li>
                  </ul>
                  <button
                    className="ownd-msg-button"
                    onClick={() => handleContactTenant(tenant.phone)}
                  >
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
        <div
          className={`ownd-section ${
            section === "payments" ? "ownd-active" : ""
          }`}
        >
          <h3>Rent Payments</h3>
          <p>
            Monthly Revenue:{" "}
            <strong>
              ₹{(paymentSummary?.monthlyRevenue || 0).toLocaleString()}
            </strong>
          </p>
          <p>
            Upcoming Payments:{" "}
            <strong>
              ₹{(paymentSummary?.upcomingPayments || 0).toLocaleString()}
            </strong>
          </p>

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
                {payments && payments.length > 0 ? (
                  payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>
                        {payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td>{payment.userName || "N/A"}</td>
                      <td>{payment.property || "N/A"}</td>
                      <td>₹{(payment.amount || 0).toLocaleString()}</td>
                      <td>
                        <span className="ownd-status-paid">
                          {payment.status || "N/A"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No transactions available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ownd-payment-summary">
            <div className="ownd-summary-card">
              <h4>Total Revenue</h4>
              <p className="ownd-amount">
                ₹{(paymentSummary?.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="ownd-period">Last 2 Months</p>
            </div>
            <div className="ownd-summary-card">
              <h4>Website Commission</h4>
              <p className="ownd-amount">
                ₹{(paymentSummary?.commission || 0).toLocaleString()}
              </p>
              <p className="ownd-period">5% of Revenue</p>
            </div>
            <div className="ownd-summary-card">
              <h4>Net Income</h4>
              <p className="ownd-amount">
                ₹{(paymentSummary?.netIncome || 0).toLocaleString()}
              </p>
              <p className="ownd-period">After Commission</p>
            </div>
          </div>
        </div>

        {/* Maintenance Section */}
        <div
          className={`ownd-section ${
            section === "maintenance" ? "ownd-active" : ""
          }`}
        >
          <h3>Maintenance Requests</h3>
          <div className="ownd-maintenance-requests">
            {maintenanceRequests && maintenanceRequests.length > 0 ? (
              maintenanceRequests.map((request) => (
                <div
                  key={request._id}
                  className="ownd-request-card"
                  data-request-id={request._id}
                >
                  <div className="ownd-request-header">
                    <h4>{request.issueType || "N/A"}</h4>
                    <span
                      className={`ownd-request-status ownd-${(
                        request.status || ""
                      )
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {request.status || "N/A"}
                    </span>
                  </div>
                  <div className="ownd-request-details">
                    <p>
                      <strong>Property:</strong> {request.propertyName || "N/A"}
                    </p>
                    <p>
                      <strong>Tenant:</strong> {request.tenantName || "N/A"}
                    </p>
                    <p>
                      <strong>Date Submitted:</strong>{" "}
                      {request.scheduledDate
                        ? new Date(request.scheduledDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Description:</strong>{" "}
                      {request.description || "N/A"}
                    </p>
                  </div>
                  <div className="ownd-request-actions">
                    <button
                      className="ownd-update-sts"
                      onClick={() => handleUpdateMaintenanceStatus(request._id)}
                    >
                      Update Status
                    </button>
                    <button
                      className="ownd-update-sts"
                      onClick={() => handleUpdateMaintenanceStatus(request._id)}
                    >
                      Mark Resolved
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
        <div
          className={`ownd-section ${
            section === "complaints" ? "ownd-active" : ""
          }`}
        >
          <h3>Tenant Complaints</h3>
          <div className="ownd-complaint-container">
            {complaints && complaints.length > 0 ? (
              complaints.map((complaint) => (
                <div key={complaint._id} className="ownd-res-complaint">
                  <ul>
                    <strong>
                      <li>{complaint.property || "N/A"}</li>
                    </strong>
                    <ul>
                      <li>
                        <strong>Issue:</strong> {complaint.subject || "N/A"}
                      </li>
                      <li>
                        <strong>Reported by:</strong>{" "}
                        {complaint.reportedBy || "N/A"}
                      </li>
                      <li>
                        <strong>Date Reported:</strong>{" "}
                        {complaint.dateSubmitted
                          ? new Date(
                              complaint.dateSubmitted
                            ).toLocaleDateString()
                          : "N/A"}
                      </li>
                      <li>
                        <strong>Current Status:</strong>{" "}
                        {complaint.status || "N/A"}
                      </li>
                    </ul>
                  </ul>
                  <button className="ownd-update-sts">
                    Update Current Status
                  </button>
                  <button
                    className="ownd-update-sts"
                    onClick={() => handleContactTenant(complaint.phone)}
                  >
                    Contact Tenant
                  </button>
                </div>
              ))
            ) : (
              <p>No complaints available.</p>
            )}
          </div>
        </div>

        {/* Rent/Unrent Requests Section */}
        <div
          className={`ownd-section ${
            section === "rentUnrentRequests" ? "ownd-active" : ""
          }`}
        >
          <h3>Rent/Unrent Requests</h3>
          <div className="ownd-notification-container">
            {notifications &&
            notifications.filter(
              (notification) =>
                notification.type === "Booking Request" ||
                notification.type === "Unrent Request"
            ).length > 0 ? (
              notifications
                .filter(
                  (notification) =>
                    notification.type === "Booking Request" ||
                    notification.type === "Unrent Request"
                )
                .map((notification) => (
                  <div
                    key={notification._id}
                    className="ownd-notification-card"
                    data-notification-id={notification._id}
                    data-is-unrent={notification.isUnrentRequest || false}
                  >
                    <div className="ownd-notification-header">
                      <h4>{notification.type || "Request"}</h4>
                      <span
                        className={`ownd-notification-status ownd-${(
                          notification.status || "pending"
                        ).toLowerCase()}`}
                      >
                        {notification.status || "Pending"}
                      </span>
                    </div>
                    <div className="ownd-notification-details">
                      <p>
                        <strong>Message:</strong>{" "}
                        {notification.message || "N/A"}
                      </p>
                      <p>
                        <strong>Recipient:</strong>{" "}
                        {notification.recipientName || "N/A"}
                      </p>
                      <p>
                        <strong>Property:</strong>{" "}
                        {notification.propertyName || "N/A"}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {notification.createdDate
                          ? new Date(
                              notification.createdDate
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    {notification.status === "Pending" ? (
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
              <p>No rent/unrent requests available.</p>
            )}
          </div>
        </div>

        {/* Reports Section */}
        <div
          className={`ownd-section ${
            section === "reports" ? "ownd-active" : ""
          }`}
        >
          <h3>Reports & Analytics</h3>
          <div className="ownd-reports-summary">
            <div className="ownd-report-card">
              <h4>Monthly Revenue</h4>
              <p className="ownd-amount">
                ₹{(reports?.monthlyRevenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="ownd-report-card">
              <h4>Occupancy Rate</h4>
              <p className="ownd-amount">{reports?.occupancyRate || 0}%</p>
            </div>
            <div className="ownd-report-card">
              <h4>Maintenance Costs</h4>
              <p className="ownd-amount">
                ₹{(reports?.maintenanceCosts || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div
          className={`ownd-section ${
            section === "settings" ? "ownd-active" : ""
          }`}
        >
          <h3>Account Settings</h3>
          <form
            id="settingsForm"
            ref={settingsFormRef}
            onSubmit={handleSettingsSubmit}
          >
            <div className="ownd-settings-container">
              <div className="ownd-settings-section">
                <h4>Personal Information</h4>
                <div className="ownd-form-row">
                  <div className="ownd-form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      placeholder="First name"
                      defaultValue={user?.firstName || ""}
                    />
                  </div>
                  <div className="ownd-form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder="Last name"
                      defaultValue={user?.lastName || ""}
                    />
                  </div>
                </div>
                <div className="ownd-form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    defaultValue={user?.email || ""}
                  />
                </div>
                <div className="ownd-form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone number"
                    defaultValue={user?.phone || ""}
                  />
                </div>
              </div>

              <div className="ownd-settings-section">
                <h4>Owner Information</h4>
                <div className="ownd-form-group">
                  <label htmlFor="location">Primary Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    placeholder="City, State, Country"
                    defaultValue={user?.location || ""}
                  />
                </div>
                <div className="ownd-form-group">
                  <label htmlFor="numProperties">Number of Properties</label>
                  <input
                    type="text"
                    id="numProperties"
                    name="numProperties"
                    placeholder="How many properties do you own?"
                    defaultValue={user?.numProperties || ""}
                  />
                </div>
                <div className="ownd-form-group">
                  <label htmlFor="accountNo">Payment Information</label>
                  <input
                    type="text"
                    id="accountNo"
                    name="accountNo"
                    placeholder="Bank Account Number"
                    defaultValue={user?.accountNo || ""}
                  />
                </div>
                <div className="ownd-form-group">
                  <label htmlFor="upiid">UPI ID</label>
                  <input
                    type="text"
                    id="upiid"
                    name="upiid"
                    placeholder="Your UPI ID"
                    defaultValue={user?.upiid || ""}
                  />
                </div>
              </div>

              <div className="ownd-settings-section">
                <h4>Change Password</h4>
                <div className="ownd-form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    placeholder="Current password"
                  />
                </div>
                <div className="ownd-form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    placeholder="New password"
                  />
                </div>
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
                  <label htmlFor="emailNotifications">
                    Email notifications
                  </label>
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    name="emailNotifications"
                    defaultChecked={user?.notifications?.email || false}
                  />
                  <label
                    htmlFor="emailNotifications"
                    className="ownd-button"
                  ></label>
                </div>
                <div className="ownd-checkbox-group">
                  <label htmlFor="smsNotifications">SMS notifications</label>
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    name="smsNotifications"
                    defaultChecked={user?.notifications?.sms || false}
                  />
                  <label
                    htmlFor="smsNotifications"
                    className="ownd-button"
                  ></label>
                </div>
                <div className="ownd-checkbox-group">
                  <label htmlFor="paymentReminders">Payment reminders</label>
                  <input
                    type="checkbox"
                    id="paymentReminders"
                    name="paymentReminders"
                    defaultChecked={user?.notifications?.payment || false}
                  />
                  <label
                    htmlFor="paymentReminders"
                    className="ownd-button"
                  ></label>
                </div>
                <div className="ownd-checkbox-group">
                  <label htmlFor="complaintAlerts">Complaint alerts</label>
                  <input
                    type="checkbox"
                    id="complaintAlerts"
                    name="complaintAlerts"
                    defaultChecked={user?.notifications?.complaint || false}
                  />
                  <label
                    htmlFor="complaintAlerts"
                    className="ownd-button"
                  ></label>
                </div>
                <div className="ownd-checkbox-group">
                  <label htmlFor="maintenanceAlerts">Maintenance alerts</label>
                  <input
                    type="checkbox"
                    id="maintenanceAlerts"
                    name="maintenanceAlerts"
                    defaultChecked={user?.notifications?.maintenance || false}
                  />
                  <label
                    htmlFor="maintenanceAlerts"
                    className="ownd-button"
                  ></label>
                </div>
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
        <div
          className={`ownd-section ${
            section === "notifications" ? "ownd-active" : ""
          }`}
        >
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
                          ? new Date(
                              notification.createdDate
                            ).toLocaleDateString()
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
              Are you sure you want to delete this property? This action cannot
              be undone.
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
              Are you sure you want to delete your account? This action cannot
              be undone. Please enter your password to confirm.
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
    </div>
  );
};

export default OwnerDashboard;
