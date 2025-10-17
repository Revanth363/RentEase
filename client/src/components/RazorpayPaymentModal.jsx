import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "../services/axiosConfig";

const RazorpayPaymentModal = ({
  isOpen,
  onClose,
  paymentType, // "rent" or "worker"
  propertyId,
  ownerId,
  workerId,
  workingDays,
  dailyRate,
  amount,
  recipientName,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const initiatePayment = async () => {
    try {
      setLoading(true);

      let response;
      if (paymentType === "rent") {
        // Initiate rent payment
        response = await axios.post("/razorpay/initiate-rent-payment", {
          propertyId,
          ownerId,
          amount: parseInt(amount),
        }, { withCredentials: true });
      } else if (paymentType === "worker") {
        // Initiate worker payment
        response = await axios.post("/razorpay/initiate-worker-payment", {
          workerId,
          workingDays: parseInt(workingDays),
          dailyRate: parseInt(dailyRate),
          }),
        });
      }

      const data = response.data;

      if (!data.success) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Failed to initiate payment",
        });
        setLoading(false);
        return;
      }

      openRazorpayCheckout(data);
    } catch (err) {
      console.error("Error initiating payment:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to process payment",
      });
      setLoading(false);
    }
  };

  const openRazorpayCheckout = (data) => {
    if (!window.Razorpay) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Razorpay is not loaded. Please refresh and try again.",
      });
      setLoading(false);
      return;
    }

    const options = {
      key: data.payment.razorpayKeyId,
      amount: data.payment.amount * 100, // Convert to paise
      currency: data.payment.currency || "INR",
      order_id: data.payment.orderId,
      name: "FFSD Rental Platform",
      description:
        paymentType === "rent"
          ? `Rent payment to ${recipientName}`
          : `Payment to worker ${recipientName}`,
      handler: async (response) => {
        await verifyPayment(response);
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      theme: {
        color: "#3399cc",
      },
      modal: {
        ondismiss: async () => {
          // Handle payment cancellation when user closes modal
          try {
            const cancelEndpoint = paymentType === "rent" 
              ? "/api/razorpay/cancel-rent-payment" 
              : "/api/razorpay/cancel-worker-payment";

            const cancelRes = await fetch(cancelEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                orderId: data.payment.orderId,
              }),
            });

            const cancelData = await cancelRes.json();

            if (cancelData.success) {
              Swal.fire({
                icon: "info",
                title: "Payment Cancelled",
                text: "Your payment has been cancelled. You can initiate a new payment anytime.",
                confirmButtonColor: "#3399cc",
              });
            } else {
              console.warn("Failed to mark payment as cancelled:", cancelData.message);
            }
          } catch (err) {
            console.error("Error cancelling payment:", err);
          }
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setLoading(false);
  };

  const verifyPayment = async (response) => {
    try {
      setLoading(true);

      console.log('🔍 Verifying payment with Razorpay response:', response);

      let verifyResponse;
      if (paymentType === "rent") {
        console.log('📤 Sending rent payment verification to backend...');
        verifyResponse = await axios.post("/razorpay/verify-rent-payment", {
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }, { withCredentials: true });
      } else if (paymentType === "worker") {
        console.log('📤 Sending worker payment verification to backend...');
        verifyResponse = await axios.post("/razorpay/verify-worker-payment", {
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }, { withCredentials: true });
      }

      console.log('📥 Response received:', verifyResponse.status, verifyResponse.statusText);

      const verifyData = verifyResponse.data;

      console.log('✅ Verification response data:', verifyData);

      if (verifyData.success) {
        console.log('✅ Payment verification successful!');
        Swal.fire({
          icon: "success",
          title: "Payment Successful!",
          text:
            paymentType === "rent"
              ? "Rent payment completed successfully"
              : "Worker payment completed successfully",
          confirmButtonColor: "#3399cc",
        });

        if (onPaymentSuccess) {
          onPaymentSuccess(verifyData);
        }

        onClose();
      } else {
        console.error('❌ Payment verification failed:', verifyData.message);
        Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: verifyData.message || "Failed to verify payment",
        });
      }
    } catch (err) {
      console.error("❌ Error verifying payment:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to verify payment - " + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="tntd-popup-container"
      style={{
        display: "flex",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="tntd-popup-content" style={{ maxWidth: "500px" }}>
        <span
          className="tntd-close-btn"
          onClick={onClose}
          style={{ cursor: "pointer" }}
        >
          ×
        </span>

        <h3>
          {paymentType === "rent"
            ? "Pay Rent via Razorpay"
            : "Pay Worker via Razorpay"}
        </h3>

        <div className="tntd-form-group" style={{ marginTop: "20px" }}>
          <label>Recipient:</label>
          <input
            type="text"
            value={recipientName}
            readOnly
            style={{
              width: "100%",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>

        {paymentType === "rent" && (
          <div className="tntd-form-group">
            <label>Rent Amount (₹):</label>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#2b7cff",
                padding: "15px",
                textAlign: "center",
                backgroundColor: "#f0f5ff",
                borderRadius: "6px",
              }}
            >
              ₹ {parseInt(amount).toLocaleString()}
            </div>
          </div>
        )}

        {paymentType === "worker" && (
          <>
            <div className="tntd-form-group">
              <label>Working Days:</label>
              <input
                type="text"
                value={workingDays}
                readOnly
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div className="tntd-form-group">
              <label>Daily Rate (₹):</label>
              <input
                type="text"
                value={dailyRate}
                readOnly
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
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
                ₹ {(parseInt(workingDays) * parseInt(dailyRate)).toLocaleString()}
              </div>
              <p style={{ fontSize: "12px", color: "#666", margin: "5px 0" }}>
                ({workingDays} days × ₹{dailyRate}/day)
              </p>
            </div>
          </>
        )}

        <div
          className="tntd-form-group"
          style={{ marginTop: "20px", textAlign: "center" }}
        >
          <button
            onClick={initiatePayment}
            disabled={loading}
            style={{
              backgroundColor: "#3399cc",
              color: "white",
              padding: "12px 24px",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "bold",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Processing..." : "Pay with Razorpay"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              backgroundColor: "#ccc",
              color: "#333",
              padding: "12px 24px",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "16px",
              marginLeft: "10px",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            borderRadius: "4px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          <p>
            💳 <strong>Secure Payment:</strong> Your payment is secured by
            Razorpay's encryption. We never store your card details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPaymentModal;
