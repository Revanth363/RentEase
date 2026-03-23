import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "../services/axiosConfig";
import * as tenantService from "../services/tenantService";
import "../assets/css/TenantDashboard.css";
import LoadingSpinner from "../components/LoadingSpinner";
import CalendarTiles from "../components/CalendarTiles";
import VerificationStatus from "../components/VerificationStatus";
import RazorpayPaymentModal from "../components/RazorpayPaymentModal";
import RazorpayPaymentHistory from "../components/RazorpayPaymentHistory";

const sectionToUrl = (section) => {
  // Map section keys to URLs (adjust as needed)
  switch (section) {
    case "home": return "/tenant/tenant_dashboard?section=home";
    case "rentPayments": return "/tenant/tenant_dashboard?section=rentPayments";
    case "maintenance": return "/tenant/tenant_dashboard?section=maintenance";
    case "complaints": return "/tenant/tenant_dashboard?section=complaints";
    case "movers": return "/tenant/tenant_dashboard?section=movers";
    case "notifications": return "/tenant/tenant_dashboard?section=notifications";
    case "savedListings": return "/tenant/tenant_dashboard?section=savedListings";
    case "rentalHistory": return "/tenant/tenant_dashboard?section=rentalHistory";
    case "settings": return "/tenant/tenant_dashboard?section=settings";
    case "verification": return "/tenant/tenant_dashboard?section=verification";
    default: return "/tenant/tenant_dashboard";
  }
};
const Sidebar = ({ unreadNotificationCount = 0, section = "home" }) => (
  <div className="tntd-sidebar" id="sidebar">
    <h2>Tenant Dashboard</h2>
    <ul>
      <li 
        className={section === "home" ? "tntd-sidebar-active-item" : ""}
        onClick={() => window.location.href = sectionToUrl("home")}
      > 
        <i className="fa-solid fa-house"></i> Home
      </li>
      <li 
        className={section === "rentPayments" ? "tntd-sidebar-active-item" : ""}
        onClick={() => window.location.href = sectionToUrl("rentPayments")}
      > 
        <i className="fa-solid fa-hand-holding-dollar"></i> Rent Payments
      </li>
      <li 
        className={section === "maintenance" ? "tntd-sidebar-active-item" : ""}
        onClick={() => window.location.href = sectionToUrl("maintenance")}
      > 
        <i className="fa-solid fa-screwdriver-wrench"></i> Maintenance Requests
      </li>
      <li 
        className={section === "complaints" ? "tntd-sidebar-active-item" : ""}
        onClick={() => window.location.href = sectionToUrl("complaints")}
      > 
        <i className="fa-solid fa-comments"></i> Complaints
      </li>
      <li 
        className={section === "movers" ? "tntd-sidebar-active-item" : ""}
        onClick={() => window.location.href = sectionToUrl("movers")}
      > 
        <i className="fa-solid fa-users"></i> Domestic Workers
      </li>
      <li 
        className={section === "notifications" ? "tntd-sidebar-active-item" : ""}
        onClick={() => window.location.href = sectionToUrl("notifications")}
      > 
        <i className="fa-solid fa-bell"></i> Notifications
        {unreadNotificationCount > 0 && (
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
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </li>
      <li 
        className={section === "savedListings" ? "tntd-sidebar-active-item" : ""}
        onClick={() => window.location.href = sectionToUrl("savedListings")}
      > 
        <i className="fa-solid fa-bookmark"></i> Saved Listings
      </li>
      <li 
        className={section === "rentalHistory" ? "tntd-sidebar-active-item" : ""}
        onClick={() => window.location.href = sectionToUrl("rentalHistory")}
      > 
        <i className="fa-solid fa-star-half-stroke"></i> Rental History
      </li>
      <li 
        className={section === "settings" ? "tntd-sidebar-active-item" : ""}
        onClick={() => window.location.href = sectionToUrl("settings")}
      > 
        <i className="fa-solid fa-gears"></i> Settings
      </li>
    </ul>
  </div>
);


function getSectionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("section") || "home";
}

const TenantDashboard = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section] = useState(getSectionFromUrl());
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals/forms visibility
  const [showMaintenancePopup, setShowMaintenancePopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showWorkerPaymentPopup, setShowWorkerPaymentPopup] = useState(false);
  const [selectedWorkerForPayment, setSelectedWorkerForPayment] = useState(null);
  const [razorpayPaymentType, setRazorpayPaymentType] = useState(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showUnrentModal, setShowUnrentModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showWorkTrackingModal, setShowWorkTrackingModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [workerWorkHistory, setWorkerWorkHistory] = useState([]);

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
  const [showRatePopup, setShowRatePopup] = useState(false);
  const [rateTargetProperty, setRateTargetProperty] = useState(null);
  const [ratingReviewText, setRatingReviewText] = useState("");

  const normalizeDashboardData = (raw) => {
    const base = raw && raw.success === false ? {} : raw || {};
    const baseUser = base.user || {};

    const normalizedSavedListings = Array.isArray(baseUser.savedListings)
      ? baseUser.savedListings
      : Array.isArray(base.savedListings)
      ? base.savedListings
      : [];

    const normalizedRentalHistory = Array.isArray(base.rentalHistory)
      ? base.rentalHistory
      : Array.isArray(baseUser.rentalHistory)
      ? baseUser.rentalHistory
      : [];

    return {
      ...base,
      user: {
        ...baseUser,
        savedListings: normalizedSavedListings,
      },
      rentalHistory: normalizedRentalHistory,
    };
  };

  // Load dashboard data on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await tenantService.getDashboard?.();
        if (mounted) {
          if (res && res.success) {
            // The backend returns the full data directly, not nested in a 'data' field
            setDashboard(normalizeDashboardData(res));
          } else {
            console.warn("Dashboard response not successful:", res);
            setDashboard(normalizeDashboardData({}));
          }
        }
      } catch (err) {
        console.error("Failed to load tenant dashboard:", err);
        if (mounted) setDashboard(normalizeDashboardData({}));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Recovery fallback: if main payload comes with empty saved listings,
  // fetch directly from debug endpoint to avoid blank UI for valid accounts.
  useEffect(() => {
    const userId = dashboard?.user?._id;
    const savedCount = Array.isArray(dashboard?.user?.savedListings)
      ? dashboard.user.savedListings.length
      : 0;

    if (!userId || savedCount > 0) return;

    (async () => {
      try {
        const res = await axios.get("/tenant/debug/saved-listings", {
          withCredentials: true,
        });

        if (Array.isArray(res?.data?.savedListings) && res.data.savedListings.length > 0) {
          setDashboard((prev) =>
            normalizeDashboardData({
              ...(prev || {}),
              user: {
                ...((prev && prev.user) || {}),
                savedListings: res.data.savedListings,
              },
            })
          );
        }
      } catch (err) {
        console.warn("Saved listings fallback fetch failed:", err?.message || err);
      }
    })();
  }, [dashboard?.user?._id, dashboard?.user?.savedListings?.length]);

  useEffect(() => {
    const userId = dashboard?.user?._id;
    if (userId) {
      (async () => {
        try {
          const res = await axios.get(`/verification/status?userId=${userId}&userModel=tenant`);
          setVerificationStatus(res.data.status);
        } catch {
          setVerificationStatus(null);
        } finally {
          setVerificationLoading(false);
        }
      })();
    } else if (dashboard !== null) {
      setVerificationLoading(false);
    }
  }, [dashboard]);

  // Safe destructuring from dashboard
  const normalizedDashboard = normalizeDashboardData(dashboard);
  const {
    user = {},
    currentProperty = null,
    activeMaintenanceRequests = [],
    completedMaintenanceRequests = [],
    workers = [],
    notifications = [],
    ratings = [],
    rentalHistory = [],
    propertyOwner = null,
    nextPayment = null,
    complaints = [],
  } = normalizedDashboard;
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
  {
    /* Rental History */
  }
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

  const closePaymentPopup = () => {
    setShowPaymentPopup(false);
    setShowRazorpayModal(false);
    setRazorpayPaymentType(null);
  };

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

  const openWorkerPaymentPopup = async (worker) => {
    try {
      // Fetch work history to count completed days
      const res = await tenantService.getWorkHistory(worker._id);
      const workDays = res.data || [];

      // Check if any work has been done
      if (!workDays || workDays.length === 0) {
        alert("No work has been done. No need for payment.");
        return;
      }

      // Calculate payment: number of days * base rate
      const numberOfDays = workDays.length;
      const baseRate = worker.price || 0;
      const calculatedAmount = numberOfDays * baseRate;

      // Store calculated amount temporarily for the form
      setSelectedWorkerForPayment({
        ...worker,
        calculatedDays: numberOfDays,
        calculatedAmount: calculatedAmount,
      });
      setRazorpayPaymentType('worker');
      setShowRazorpayModal(true);
    } catch (err) {
      console.error("Error fetching work history:", err);
      alert("Failed to load work history. Please try again.");
    }
  };
  const closeWorkerPaymentPopup = () => {
    setShowWorkerPaymentPopup(false);
    setSelectedWorkerForPayment(null);
    setShowRazorpayModal(false);
    setRazorpayPaymentType(null);
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

  // Mark unread notifications as read when viewing the notifications section
  useEffect(() => {
    if (section === "notifications" && dashboard?.notifications?.length > 0) {
      const unreadNotifications = dashboard.notifications.filter(
        (n) => n.status === "Pending" && n.read === false
      );
      unreadNotifications.forEach(async (notification) => {
        await handleMarkNotificationRead(notification._id);
      });
    }
  }, [section, dashboard?.notifications]);

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

  const handleDebookWorker = async (workerId) => {
    if (
      !confirm(
        "Are you sure you want to debook this worker? Please ensure you have completed this month's payment before proceeding."
      )
    )
      return;
    try {
      const response = await axios.post(`/workers/debook/${workerId}`);
      const data = response.data;
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
    // Generic review submitter used by current property or rental-history popup
    if (!selectedRating) return alert("Please select a rating");
    const propertyId =
      rateTargetProperty || (currentProperty && currentProperty._id);
    const reviewText =
      ratingReviewText || document.getElementById("review-text")?.value || "";
    if (!propertyId) return alert("No property selected to review");
    try {
      const res = await tenantService.submitReview({
        propertyId,
        rating: selectedRating,
        review: reviewText,
      });
      if (res.success) {
        setDashboard((prev) => {
          // Update ratings array
          const updatedDashboard = {
            ...prev,
            ratings: [res.rating, ...(prev.ratings || [])],
          };
          
          // Also update rental history item with the new rating
          if (prev.rentalHistory) {
            updatedDashboard.rentalHistory = prev.rentalHistory.map((item) => {
              const itemPropId = item.property || item._id;
              if (String(itemPropId) === String(propertyId)) {
                return {
                  ...item,
                  rating: selectedRating,
                };
              }
              return item;
            });
          }
          
          return updatedDashboard;
        });
        setSelectedRating(0);
        setRatingReviewText("");
        setShowRatePopup(false);
        setRateTargetProperty(null);
      } else alert(res.message || "Error");
    } catch (err) {
      console.error(err);
      alert("Error submitting review");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const form = profileFormRef.current;
    const fullname = form["fullname"].value.trim();
    const email = form["email"].value.trim();
    const phone = form["phone"].value.trim();
    const location = form["address"].value.trim();

    const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
    const emailRegex =
      /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\d{10}$/;

    if (!fullname) {
      alert("Full name is required");
      return;
    }
    if (!nameRegex.test(fullname)) {
      alert("Full name must contain only letters");
      return;
    }
    if (!email) {
      alert("Email is required");
      return;
    }
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }
    if (!phone) {
      alert("Phone number is required");
      return;
    }
    if (!phoneRegex.test(phone)) {
      alert("Phone number must be exactly 10 numerical digits");
      return;
    }
    if (!location) {
      alert("Location is required");
      return;
    }

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
        alert("Profile updated successfully");
      } else alert(res.message || "Error updating profile");
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const form = passwordFormRef.current;
    const currentPassword = form["current-password"].value;
    const newPassword = form["new-password"].value;
    const confirmPassword = form["confirm-password"].value;

    // Validation
    if (!currentPassword) {
      alert("Current password is required");
      return;
    }
    if (!newPassword) {
      alert("New password is required");
      return;
    }
    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters long");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      alert("New password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      alert("New password must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      alert("New password must contain at least one number");
      return;
    }
    if (!confirmPassword) {
      alert("Confirm password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await tenantService.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        alert(res.message || "Password changed successfully");
        form.reset();
      } else alert(res.message || "Error changing password");
    } catch (err) {
      console.error(err);
      alert("Error changing password");
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
      // Show server-provided message with better context
      let serverMessage =
        err && err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : err && err.message
          ? err.message
          : "Network error";
      
      // Add additional context for active workers error
      if (err.response?.data?.code === "ACTIVE_WORKERS" && err.response?.data?.activeBookings) {
        serverMessage += `\n\nActive bookings found: ${err.response.data.activeBookings.length}`;
      }
      
      alert(serverMessage);
    }
  };

  const handlePayRent = async () => {
    if (!currentProperty) {
      alert("No property selected");
      return;
    }

    try {
      // Step 1: Initiate Razorpay order
      const initiateRes = await axios.post("/razorpay/initiate-rent-payment", {
        propertyId: currentProperty._id,
        amount: currentProperty.price,
        // Don't send dueDate - let backend calculate it (30 days from today)
      });

      const initiateData = initiateRes.data;

      if (!initiateData.success) {
        alert(initiateData.message || "Failed to initiate payment");
        return;
      }

      // Step 2: Open Razorpay Checkout
      if (!window.Razorpay) {
        alert("Razorpay is not loaded. Please refresh the page.");
        return;
      }

      const options = {
        key: initiateData.payment.razorpayKeyId,
        amount: initiateData.payment.amount * 100,
        currency: "INR",
        order_id: initiateData.payment.orderId,
        name: "FFSD Rental Platform",
        description: `Rent payment to ${propertyOwner?.firstName} ${propertyOwner?.lastName}`,
        handler: async (response) => {
          // Step 3: Verify Payment
          try {
            const verifyRes = await axios.post("/razorpay/verify-rent-payment", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            const verifyData = verifyRes.data;

            if (verifyData.success) {
              Swal.fire({
                icon: "success",
                title: "Payment Successful!",
                text: "Rent payment completed successfully",
                confirmButtonColor: "#3399cc",
              });
              // Refresh dashboard
              window.location.reload();
            } else {
              Swal.fire({
                icon: "error",
                title: "Payment Failed",
                text: verifyData.message || "Failed to verify payment",
              });
            }
          } catch (err) {
            console.error("Error verifying payment:", err);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to verify payment",
            });
          }
        },
        prefill: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          contact: user.phone,
        },
        theme: { color: "#3399cc" },
        modal: {
          ondismiss: async () => {
            // When user closes the payment modal without completing payment
            console.log("Payment cancelled by user");
            try {
              const cancelRes = await axios.post("/razorpay/cancel-rent-payment", {
                orderId: initiateData.payment.orderId,
              });

              const cancelData = cancelRes.data;

              if (cancelData.success) {
                Swal.fire({
                  icon: "info",
                  title: "Payment Cancelled",
                  text: "Your payment has been cancelled. You can initiate a new payment anytime.",
                  confirmButtonColor: "#3399cc",
                });
              } else {
                console.error("Failed to cancel payment:", cancelData.message);
              }
            } catch (err) {
              console.error("Error cancelling payment:", err);
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to process payment",
      });
    }
  };

  const handleCheckAccountStatusAndDelete = async () => {
    try {
      const status = await tenantService.checkAccountStatus();
      if (status.success) {
        setShowDeleteAccountModal(true);
      } else {
        // Check for specific conditions
        if (status.hasActiveRentals && status.hasActiveBookings) {
          alert(
            "Cannot delete account. Please unrent your property and debook your domestic workers first."
          );
        } else if (status.hasActiveRentals) {
          alert(
            "Cannot delete account while renting a property. Please request to unrent first."
          );
        } else if (status.hasActiveBookings) {
          alert(
            "Cannot delete account with active worker bookings. Please debook all workers first."
          );
        } else {
          alert(status.message || "Cannot delete account");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error checking account status. Please try again.");
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
      // Try to get error message from response
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Network error while deleting account";
      alert(errorMessage);
    }
  };

  const openWorkerTrackingModal = async (worker) => {
    try {
      setSelectedWorker(worker);
      const res = await tenantService.getWorkHistory(worker._id);
      if (res.success) {
        setWorkerWorkHistory(res.data || []);
      } else {
        setWorkerWorkHistory([]);
      }
      setShowWorkTrackingModal(true);
    } catch (err) {
      console.error("Error opening work tracking:", err);
      alert("Failed to load work history");
    }
  };

  // Star interactions
  const handleStarHover = (r) => setSelectedRating(r);
  const handleStarClick = (r) => setSelectedRating(r);

  if (loading || verificationLoading) return <LoadingSpinner />;

  const effectiveSection = !verificationLoading && verificationStatus !== "approved"
    ? (["settings", "verification"].includes(section) ? section : "verification")
    : section;

  return (
    <div>
      <div className="tntd-overlay" id="overlay"></div>
      <button
        className="tntd-menu-toggle"
        onClick={() => {
          setSidebarOpen(!sidebarOpen);
          document
            .querySelector(".tntd-sidebar")
            ?.classList.toggle("tntd-active");
        }}
      >
        <strong>{sidebarOpen ? "<" : ">"}</strong>
      </button>
      <div className="tntd-dashboard-container">
        {verificationStatus !== "approved" ? (
          <div className="tntd-sidebar tntd-restricted-sidebar" id="sidebar">
            <h2>Tenant Dashboard</h2>
            <ul>
              <li
                className={effectiveSection === "verification" ? "tntd-sidebar-active-item" : ""}
                onClick={() => window.location.href = sectionToUrl("verification")}
              >
                <i className="fa-solid fa-shield-halved"></i> Verification
              </li>
              <li
                className={effectiveSection === "settings" ? "tntd-sidebar-active-item" : ""}
                onClick={() => window.location.href = sectionToUrl("settings")}
              >
                <i className="fa-solid fa-gears"></i> Settings
              </li>
            </ul>
          </div>
        ) : (
          <Sidebar 
            unreadNotificationCount={notifications?.filter(n => n.status === 'Pending' && n.read === false).length || 0}
            section={section}
          />
        )}
        <div className="tntd-main-content">
          {verificationStatus !== "approved" && (
            <div className="tntd-unverified-banner">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <div>
                <h3>Your account is not verified</h3>
                <p>Please upload your documents and wait for admin approval to access all features.</p>
              </div>
            </div>
          )}

          {verificationStatus !== "approved" && (
            <div
              id="verification"
              className={`tntd-section ${effectiveSection === "verification" ? "tntd-active" : ""}`}
            >
              <h3>Account Verification</h3>
              <VerificationStatus userId={dashboard?.user?._id} userModel="tenant" />
            </div>
          )}

          {/* Home */}
          <div
            id="home"
            className={`tntd-section ${
              effectiveSection === "home" ? "tntd-active" : ""
            }`}
          >
            <h3>
              Welcome, {user.firstName} {user.lastName}
            </h3>
            {currentProperty ? (
              <div className="tntd-property-summary">
                <div className="tntd-property-card" id="home_property_card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div className="tntd-img_container" style={{ flex: '0 0 250px', height: '200px', overflow: 'hidden', borderRadius: '8px' }}>
                    <img
                      src={
                        currentProperty.images && currentProperty.images[0]
                          ? (typeof currentProperty.images[0] === 'string' ? currentProperty.images[0] : currentProperty.images[0]?.url)
                          : "/images/default-property.jpg"
                      }
                      alt="Property"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="tntd-property-details" style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
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
                      <p>
                        <strong>Rental Started:</strong>{" "}
                        {currentProperty.rentalStartDate
                          ? new Date(currentProperty.rentalStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : "—"}
                      </p>
                    </div>
                    <button
                      id="unrent-btn"
                      className="tntd-unrent-btn"
                      onClick={() => setShowUnrentModal(true)}
                      style={{ alignSelf: 'flex-start', marginTop: '12px' }}
                    >
                      Request Unrent
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p>No current property rented.</p>
            )}

            <div className="tntd-quick-stats">
              <div className="tntd-stat-box">
                <h4>Active Maintenance</h4>
                <p>
                  {activeMaintenanceRequests
                    ? activeMaintenanceRequests.length
                    : 0}{" "}
                  Pending Requests
                </p>
              </div>
              <div className="tntd-stat-box">
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
            className={`tntd-section ${
              effectiveSection === "rentPayments" ? "tntd-active" : ""
            }`}
          >
            <h3>Rent Payments</h3>
            {currentProperty ? (
              <div className="tntd-current-rent">
                {nextPayment ? (
                  <p>
                    Next Rent Due: <strong>₹{nextPayment.amount}</strong> on{" "}
                    {nextPayment.dueDate 
                      ? new Date(nextPayment.dueDate).toLocaleDateString('en-IN', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      : "Not set"}
                  </p>
                ) : (
                  <p>No rent due date available.</p>
                )}
                <button
                  className="tntd-pay-buttons"
                  onClick={handlePayRent}
                >
                  Pay Rent
                </button>
              </div>
            ) : (
              <p>No current property rented.</p>
            )}

            <h4>Payment History</h4>
            <RazorpayPaymentHistory
              historyType="tenant-rent"
              className="tntd-payment-history"
              showSummary={false}
            />
          </div>

          {/* Maintenance */}
          <div
            id="maintenance"
            className={`tntd-section ${
              effectiveSection === "maintenance" ? "tntd-active" : ""
            }`}
          >
            <h3>Maintenance Requests</h3>
            <button
              className="tntd-book-button"
              onClick={() => setShowMaintenancePopup(true)}
            >
              Submit New Request
            </button>
            <h4>Active Requests</h4>
            <div className="tntd-maintenance-cards">
              {(activeMaintenanceRequests || []).map((r) => (
                <div className="tntd-maintenance-card" key={r._id}>
                  <div className="tntd-maintenance-header">
                    <h5>{r.issueType || "Unknown"} Issue</h5>
                    <span
                      className={`tntd-status ${
                        r.status
                          ? r.status.toLowerCase().replace(" ", "-")
                          : "tntd-pending"
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
                  <div style={{ margin: '10px 0' }}>
                    <label htmlFor={`status-select-${r._id}`}><strong>Status:</strong> </label>
                    <select
                      id={`status-select-${r._id}`}
                      value={r.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        if (newStatus === r.status) return;
                        const confirmed = window.confirm(`Are you sure you want to change status to '${newStatus}'?`);
                        if (!confirmed) return;
                        const res = await tenantService.updateMaintenanceStatus({ requestId: r._id, status: newStatus });
                        if (res.success) {
                          setDashboard((prev) => ({
                            ...prev,
                            activeMaintenanceRequests: prev.activeMaintenanceRequests.map((req) => req._id === r._id ? { ...req, status: newStatus } : req),
                          }));
                          alert('Status updated successfully.');
                        } else {
                          alert(res.message || 'Error updating status');
                        }
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <h4>Completed Requests</h4>
            <div className="tntd-maintenance-cards">
              {(completedMaintenanceRequests || []).map((r) => (
                <div className="tntd-maintenance-card" key={r._id}>
                  <div className="tntd-maintenance-header">
                    <h5>{r.issueType || "Unknown"} Issue</h5>
                    <span className="tntd-status tntd-completed">
                      Completed
                    </span>
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
            className={`tntd-section ${
              effectiveSection === "complaints" ? "tntd-active" : ""
            }`}
          >
            <h3>Submit a Query / Complaint</h3>
            <form
              className="tntd-query-form"
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
                className="tntd-query-text-input"
                required
              />
              <textarea
                name="complaint-text"
                className="tntd-query-text-input"
                rows={4}
                placeholder="Describe your issue..."
                required
              ></textarea>
              <button type="submit">Submit Complaint</button>
            </form>
            <h4>Previous Complaints</h4>
            <div className="tntd-complaints-history">
              {(complaints || []).map((c) => (
                <div className="tntd-complaint-item" key={c._id}>
                  <div className="tntd-complaint-header">
                    <h5>{c.subject}</h5>
                    <span
                      className={`tntd-status ${
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
            className={`tntd-section ${
              effectiveSection === "movers" ? "tntd-active" : ""
            }`}
          >
            <h4>Your Current Service Providers</h4>
            <div className="tntd-worker-cards">
              {(workers || []).length === 0 ? (
                <div className="tntd-no-workers-message">
                  <p>
                    You don't have any domestic workers assigned yet. Browse the
                    services above to find help.
                  </p>
                </div>
              ) : (
                (workers || []).map((worker, index) => (
                  <div
                    className="tntd-worker-card"
                    data-worker-id={worker._id || `worker_${index}`}
                    key={worker._id || index}
                  >
                    <img
                      src={(typeof worker.image === 'string' ? worker.image : worker.image?.url) || "/resources/default-worker.jpg"}
                      alt="Worker"
                    />
                    <div className="tntd-worker-details">
                      {/* Worker Name as Link */}
                      <h5 className="tntd-worker-name">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/worker/${worker._id}`);
                          }}
                          style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'none' }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {worker.firstName} {worker.lastName}
                        </a>
                      </h5>

                      {/* Service Information */}
                      <div style={{ marginBottom: '12px' }}>
                        <p>
                          <strong>Service:</strong>{" "}
                          <span className="tntd-worker-service">
                            {worker.serviceType || "N/A"}
                          </span>
                        </p>
                        <p>
                          <strong>Schedule:</strong>{" "}
                          <span className="tntd-worker-schedule">
                            {worker.availability || "N/A"}
                          </span>
                        </p>
                        <p>
                          <strong>Fee:</strong> ₹
                          <span className="tntd-worker-fee">
                            {worker.price || "N/A"}
                          </span>
                          <span className="tntd-worker-rate-unit">
                            {worker.rateUnit ? "/" + worker.rateUnit : ""}
                          </span>
                        </p>
                      </div>

                      {/* Experience & Contact */}
                      <div style={{ marginBottom: '12px' }}>
                        <p>
                          <strong>Experience:</strong>{" "}
                          <span className="tntd-worker-experience">
                            {worker.experience
                              ? worker.experience + " years"
                              : "N/A"}
                          </span>
                        </p>
                        <p>
                          <strong>Phone:</strong>{" "}
                          <span className="tntd-worker-phone">
                            {worker.phone || "N/A"}
                          </span>
                        </p>
                      </div>

                      {/* Rating */}
                      <div className="tntd-rating" style={{ marginBottom: '12px' }}>
                        {worker.ratingId && worker.ratingId.average ? (
                          <span className="tntd-worker-rating">
                            {"⭐".repeat(Math.round(worker.ratingId.average))}{" "}
                            {worker.ratingId.average.toFixed(1)}
                          </span>
                        ) : (
                          <span className="tntd-worker-rating">
                            No ratings yet
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="tntd-worker-payment-section" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          className="tntd-pay-worker-btn"
                          onClick={() => openWorkerPaymentPopup(worker)}
                          disabled={worker.paymentStatus === "paid"}
                        >
                          {worker.paymentStatus === "paid"
                            ? "Paid"
                            : "Pay Worker"}
                        </button>
                        <button
                          className="tntd-track-work-btn"
                          onClick={() => openWorkerTrackingModal(worker)}
                        >
                          <i className="fa-solid fa-calendar"></i> Track Work
                        </button>
                        <button
                          className="tntd-debook-worker-btn"
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

            {/* Worker Payment History */}
            <h4 style={{ marginTop: '24px' }}>Worker Payment History</h4>
            <RazorpayPaymentHistory
              historyType="tenant-worker"
              className="tntd-payment-history-table"
              showSummary={false}
            />
          </div>

          {/* Notifications */}
          <div
            id="notifications"
            className={`tntd-section ${
              effectiveSection === "notifications" ? "tntd-active" : ""
            }`}
          >
            <h3>Notifications</h3>
            <div className="tntd-notification-container">
              {notifications && notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    className={`tntd-notification-card ${
                      notification.read ? "tntd-read" : "tntd-unread"
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
                        className={`tntd-notification-status ${
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
                        className="tntd-mark-read-button"
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
            className={`tntd-section ${
              effectiveSection === "savedListings" ? "tntd-active" : ""
            }`}
          >
            <h3>Saved Listings</h3>
            <p>
              You have saved{" "}
              {user.savedListings ? user.savedListings.length : 0} properties
              for future reference.
            </p>
            <div className="tntd-saved-properties">
              {(user.savedListings || []).map((property) => (
                <div
                  className="tntd-property-card"
                  data-property-id={property._id}
                  key={property._id}
                >
                  <div className="tntd-img_container">
                    <img
                      src={
                        property.images && property.images[0]
                          ? (typeof property.images[0] === 'string' ? property.images[0] : property.images[0]?.url)
                          : "/images/default-property.jpg"
                      }
                      alt="Property"
                    />
                  </div>
                  <div className="tntd-property-info">
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
                    <div className="tntd-property-features">
                      <span>{property.subtype || "N/A"}</span>
                      <span>{property.size || "N/A"}</span>
                      <span>{property.furnished || "N/A"}</span>
                    </div>
                    <div className="tntd-card-actions">
                      <button
                        className="tntd-book-button"
                        onClick={() =>
                          (window.location.href = `/book-property?id=${property._id}`)
                        }
                      >
                        Book Now
                      </button>
                      <a
                        className="tntd-view-details tntd-book-button"
                        href={`/property?id=${property._id}`}
                      >
                        View Details
                      </a>
                      <button
                        className="tntd-remove-button"
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

          {/* Rental History */}
          <div
            id="rentalHistory"
            className={`tntd-section ${
              section === "rentalHistory" ? "tntd-active" : ""
            }`}
          >
            <h3>Rental History</h3>
            <div className="tntd-rental-history-cards">
              {(rentalHistory || []).length > 0 ? (
                (rentalHistory || []).map((h, idx) => {
                  const propId = h.property || h._id;
                  const propName =
                    h.propertyName || h.address || "Previous Property";
                  const propAddress = h.address || "N/A";
                  const propImages =
                    h.propertyImages && h.propertyImages.length > 0
                      ? h.propertyImages[0]
                      : "/images/default-property.jpg";
                  const rating = h.rating || null;

                  const hasRated = (ratings || []).some((r) => {
                    const ratedId =
                      r.propertyId &&
                      (r.propertyId._id ? r.propertyId._id : r.propertyId);
                    return (
                      ratedId && propId && String(ratedId) === String(propId)
                    );
                  });

                  return (
                    <div className="tntd-history-card" key={propId || idx}>
                      <div className="tntd-img_container">
                        <img
                          src={propImages}
                          alt={propName}
                          style={{ height: "200px", objectFit: "cover" }}
                        />
                      </div>
                      <div className="tntd-history-header">
                        <h5>{propName}</h5>
                        <p>{propAddress}</p>
                      </div>
                      <div className="tntd-rating">
                        {rating ? (
                          <span className="tntd-history-rating">
                            {"⭐".repeat(Math.round(rating))}{" "}
                            {rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="tntd-history-no-rating">
                            No rating yet
                          </span>
                        )}
                      </div>
                      <div className="tntd-card-actions">
                        <button
                          className="tntd-book-button"
                          onClick={() =>
                            (window.location.href = `/property?id=${propId}`)
                          }
                        >
                          View Details
                        </button>
                        {!hasRated && !rating && (
                          <button
                            className="tntd-book-button"
                            onClick={() => {
                              setRateTargetProperty(propId);
                              setShowRatePopup(true);
                            }}
                          >
                            Rate this property
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>No previous rentals found.</p>
              )}
            </div>

            {showRatePopup && (
              <div className="tntd-overlay-popup">
                <div className="tntd-rate-popup">
                  <h4>Rate this property</h4>
                  <div className="tntd-star-rating">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <span
                        key={r}
                        className={`tntd-star ${
                          selectedRating >= r ? "tntd-active" : ""
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
                  <textarea
                    value={ratingReviewText}
                    onChange={(e) => setRatingReviewText(e.target.value)}
                    rows={4}
                    placeholder="Share your experience..."
                  ></textarea>
                  <div className="tntd-rate-actions">
                    <button
                      className="tntd-book-button"
                      onClick={handleSubmitReview}
                    >
                      Submit
                    </button>
                    <button
                      className="tntd-remove-button"
                      onClick={() => {
                        setShowRatePopup(false);
                        setRateTargetProperty(null);
                        setSelectedRating(0);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ratings */}
          <div
            id="ratings"
            className={`tntd-section ${
              section === "ratings" ? "tntd-active" : ""
            }`}
          >
            <h3>Reviews & Ratings</h3>
            <h4>Your Property Reviews</h4>
            {currentProperty && (
              <div className="tntd-review-form">
                <h5>Review Your Current Property</h5>
                <div className="tntd-star-rating">
                  <span>Rate your experience: </span>
                  <div
                    className="tntd-stars"
                    id="tntd-star-rating"
                    data-property-id={currentProperty._id}
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <span
                        key={r}
                        className={`tntd-star ${
                          selectedRating >= r ? "tntd-active" : ""
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
            <div className="tntd-past-reviews">
              {(ratings || []).map((r) => (
                <div className="tntd-review-card" key={r._id}>
                  <div className="tntd-review-header">
                    <h5>
                      {r.propertyId && r.propertyId.name
                        ? r.propertyId.name
                        : "Unknown Property"}
                    </h5>
                    <div className="tntd-rating">
                      {r.rating ? "⭐".repeat(r.rating) : ""}{" "}
                      {r.rating ? r.rating.toFixed(1) : "N/A"}
                    </div>
                  </div>
                  <p className="tntd-review-date">
                    Reviewed on:{" "}
                    {r.date ? new Date(r.date).toLocaleDateString() : "N/A"}
                  </p>
                  <p className="tntd-review-text">
                    {r.review || "No review provided"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div
            id="settings"
            className={`tntd-section ${
              effectiveSection === "settings" ? "tntd-active" : ""
            }`}
          >
            <h3>Account Settings</h3>
            <div className="tntd-settings-container">
              <div id="tntd-profile-section">
                <h4>Personal Information</h4>
                <form
                  className="tntd-profile-form"
                  id="profile-form"
                  ref={profileFormRef}
                  onSubmit={handleUpdateProfile}
                >
                  <div className="tntd-form-group">
                    <label>Full Name</label>
                    <input
                      name="fullname"
                      id="fullname"
                      defaultValue={user.firstName + user.lastName || ""}
                    />
                  </div>
                  <div className="tntd-form-group">
                    <label>Email Address</label>
                    <input
                      name="email"
                      id="email"
                      defaultValue={user.email || ""}
                    />
                  </div>
                  <div className="tntd-form-group">
                    <label>Phone Number</label>
                    <input
                      name="phone"
                      id="phone"
                      defaultValue={user.phone || ""}
                    />
                  </div>
                  <div className="tntd-form-group">
                    <label>Current Address</label>
                    <textarea
                      name="address"
                      id="address"
                      defaultValue={user.location || ""}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="tntd-settings-submission-class tntd-book-button"
                  >
                    Update Profile
                  </button>
                </form>
              </div>

              <div id="tntd-security-section">
                <h4>Security Settings</h4>
                <form
                  className="tntd-password-form"
                  id="password-form"
                  ref={passwordFormRef}
                  onSubmit={handleChangePassword}
                >
                  <div className="tntd-form-group">
                    <label>Current Password</label>
                    <input name="current-password" type="password" />
                  </div>
                  <div className="tntd-form-group">
                    <label>New Password</label>
                    <input name="new-password" type="password" />
                  </div>
                  <div className="tntd-form-group">
                    <label>Confirm New Password</label>
                    <input name="confirm-password" type="password" />
                  </div>
                  <button
                    type="submit"
                    className="tntd-settings-submission-class tntd-book-button"
                  >
                    Change Password
                  </button>
                </form>
              </div>

              <div id="tntd-preferences-section">
                <h4>Notification Preferences</h4>
                <form className="tntd-notification-form">
                  <div className="tntd-checkbox-group">
                    <label>Email Notifications</label>
                    <input
                      type="checkbox"
                      id="email-notifications"
                      defaultChecked={user.emailNotifications}
                    />
                    <label
                      className="tntd-button"
                      htmlFor="email-notifications"
                    ></label>
                  </div>
                  <div className="tntd-checkbox-group">
                    <label>SMS Notifications</label>
                    <input
                      type="checkbox"
                      id="sms-notifications"
                      defaultChecked={user.smsNotifications}
                    />
                    <label
                      className="tntd-button"
                      htmlFor="sms-notifications"
                    ></label>
                  </div>
                  <div className="tntd-checkbox-group">
                    <label>Rent Due Reminders</label>
                    <input
                      type="checkbox"
                      id="rent-reminders"
                      defaultChecked={user.rentReminders}
                    />
                    <label
                      className="tntd-button"
                      htmlFor="rent-reminders"
                    ></label>
                  </div>
                  <div className="tntd-checkbox-group">
                    <label>Maintenance Updates</label>
                    <input
                      type="checkbox"
                      id="maintenance-updates"
                      defaultChecked={user.maintenanceUpdates}
                    />
                    <label
                      className="tntd-button"
                      htmlFor="maintenance-updates"
                    ></label>
                  </div>
                  <div className="tntd-checkbox-group">
                    <label>New Property Listings</label>
                    <input
                      type="checkbox"
                      id="new-listings"
                      defaultChecked={user.newListings}
                    />
                    <label
                      className="tntd-button"
                      htmlFor="new-listings"
                    ></label>
                  </div>
                  <button
                    type="button"
                    className="tntd-settings-submission-class tntd-book-button"
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

              <div id="tntd-delete-account-section">
                <h4>Delete Account</h4>
                <button
                  className="tntd-settings-submission-class tntd-delete-account-btn tntd-remove-button"
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
        className="tntd-popup-container"
        style={{ display: showMaintenancePopup ? "flex" : "none" }}
      >
        <div className="tntd-popup-content">
          <span
            className="tntd-close-btn"
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
            <div className="tntd-form-group">
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
            <div className="tntd-form-group">
              <label>Description:</label>
              <textarea
                name="description"
                id="description"
                rows={4}
                placeholder="Please describe the issue in detail"
                required
              ></textarea>
            </div>
            <div className="tntd-form-group">
              <label>Location:</label>
              <input
                name="location"
                id="location"
                placeholder="e.g., Kitchen"
                required
              />
            </div>
            <div className="tntd-form-group">
              <label>Preferred Date</label>
              <input name="preferred-date" id="preferred-date" type="date" />
            </div>
            <div className="tntd-form-group">
              <button type="submit" className="tntd-submit-btn">
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Razorpay Payment Modal */}
      <RazorpayPaymentModal
        isOpen={showRazorpayModal}
        onClose={closePaymentPopup}
        paymentType={razorpayPaymentType}
        propertyId={currentProperty?._id}
        ownerId={propertyOwner?._id}
        workerId={selectedWorkerForPayment?._id}
        workingDays={selectedWorkerForPayment?.calculatedDays}
        dailyRate={selectedWorkerForPayment?.price}
        amount={razorpayPaymentType === 'rent' ? currentProperty?.price : selectedWorkerForPayment?.calculatedAmount}
        recipientName={razorpayPaymentType === 'rent' ? propertyOwner?.firstName + ' ' + propertyOwner?.lastName : selectedWorkerForPayment?.firstName + ' ' + selectedWorkerForPayment?.lastName}
        onPaymentSuccess={() => {
          setDashboard((prev) => ({
            ...prev,
            payments: razorpayPaymentType === 'rent' ? [...(prev.payments || [])] : prev.payments,
            workerPayments: razorpayPaymentType === 'worker' ? [...(prev.workerPayments || [])] : prev.workerPayments,
          }));
        }}
      />

      {/* Payment popup */}
      <div
        id="payment-popup-container"
        className="tntd-popup-container"
        style={{ display: showPaymentPopup ? "flex" : "none" }}
      >
        <div className="tntd-popup-content">
          <span className="tntd-close-btn" onClick={closePaymentPopup}>
            ×
          </span>
          <h3>Pay Rent</h3>
          <form
            id="payment-form"
            ref={paymentFormRef}
            onSubmit={handleSubmitPayment}
          >
            <div className="tntd-form-group">
              <label>Rent Amount (₹):</label>
              <input
                name="rent-amount"
                id="rent-amount"
                defaultValue={currentProperty ? currentProperty.price : ""}
                readOnly
              />
            </div>
            <div className="tntd-form-group">
              <label>Payment Method:</label>
              <select name="payment-method" id="payment-method" required>
                <option value="">Select Payment Method</option>
                <option>Credit Card</option>
                <option>Debit Card</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            <div className="tntd-form-group">
              <label>Transaction ID:</label>
              <input
                name="transaction-id"
                id="transaction-id"
                placeholder="Enter transaction ID"
                required
              />
            </div>
            <div className="tntd-form-group">
              <button type="submit" className="tntd-submit-btn">
                Submit Payment
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Worker payment popup */}
      <div
        id="worker-payment-popup"
        className="tntd-popup-container"
        style={{ display: showWorkerPaymentPopup ? "flex" : "none" }}
      >
        <div className="tntd-popup-content">
          <span className="tntd-close-btn" onClick={closeWorkerPaymentPopup}>
            ×
          </span>
          <h3>Pay Worker</h3>
          <form
            id="worker-payment-form"
            ref={workerPaymentFormRef}
            onSubmit={handleWorkerPayment}
          >
            <div className="tntd-form-group">
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
            <div className="tntd-form-group">
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
            <div className="tntd-form-group">
              <label style={{ fontSize: "18px", fontWeight: "bold" }}>
                Total Payment Amount (₹)
              </label>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#2b7cff",
                  padding: "15px",
                  textAlign: "center",
                  backgroundColor: "#f0f5ff",
                  borderRadius: "6px",
                  marginBottom: "10px",
                }}
              >
                ₹{" "}
                {selectedWorkerForPayment
                  ? (
                      selectedWorkerForPayment.calculatedAmount || 0
                    ).toLocaleString()
                  : "0"}
              </div>
              <input
                type="hidden"
                name="payment-amount"
                defaultValue={
                  selectedWorkerForPayment
                    ? selectedWorkerForPayment.calculatedAmount || 0
                    : 0
                }
              />
              <p style={{ fontSize: "12px", color: "#666", margin: "5px 0" }}>
                ({selectedWorkerForPayment?.calculatedDays || 0} days × ₹
                {selectedWorkerForPayment?.price || 0}/day)
              </p>
            </div>
            <div className="tntd-form-group">
              <label>Payment Date:</label>
              <input
                name="payment-date"
                id="payment-date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div className="tntd-form-group">
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
            <div className="tntd-form-group">
              <label>Transaction ID (if applicable):</label>
              <input
                name="worker-transaction-id"
                id="worker-transaction-id"
                placeholder="Enter transaction ID"
              />
            </div>
            <div className="tntd-form-group">
              <label>Notes (optional):</label>
              <textarea
                name="payment-notes"
                id="payment-notes"
                rows={3}
              ></textarea>
            </div>
            <div className="tntd-form-group">
              <button type="submit" className="tntd-submit-btn">
                Submit Payment
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unrent modal */}
      <div
        id="unrent-modal"
        className="tntd-modal"
        style={{ display: showUnrentModal ? "flex" : "none" }}
      >
        <div className="tntd-modal-content">
          <span
            className="tntd-close"
            onClick={() => setShowUnrentModal(false)}
          >
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
            className="tntd-btn tntd-btn-danger"
            onClick={handleRequestUnrent}
          >
            Confirm Unrent
          </button>
        </div>
      </div>

      {/* Delete account modal */}
      <div
        id="delete-account-popup"
        className="tntd-popup-container"
        style={{ display: showDeleteAccountModal ? "flex" : "none" }}
      >
        <div className="tntd-popup-content">
          <span
            className="tntd-close-btn"
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
            <div className="tntd-form-group">
              <label>Password:</label>
              <input name="delete-password" type="password" required />
            </div>
            <div className="tntd-form-group">
              <button type="submit" className="tntd-submit-btn">
                Confirm Deletion
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Work Tracking Modal */}
      {showWorkTrackingModal && selectedWorker && (
        <div className="tntd-modal-overlay">
          <div className="tntd-modal-content">
            <div className="tntd-modal-header">
              <h3>
                Work History - {selectedWorker.firstName}{" "}
                {selectedWorker.lastName}
              </h3>
              <button
                className="tntd-modal-close"
                onClick={() => setShowWorkTrackingModal(false)}
              >
                ×
              </button>
            </div>
            <div className="tntd-modal-body">
              {workerWorkHistory && workerWorkHistory.length > 0 ? (
                <div className="tntd-work-history">
                  <h4>Completed Work Dates:</h4>
                  <CalendarTiles completedDates={workerWorkHistory} />
                </div>
              ) : (
                <p className="tntd-no-work-history">
                  No work history recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDashboard;
