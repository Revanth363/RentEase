import React, { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

const RazorpayPaymentHistory = ({
  historyType,
  className = "",
  showSummary = true,
}) => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    fetchPaymentHistory();
  }, [historyType, page]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      let endpoint = "";
      switch (historyType) {
        case "tenant-rent":
          endpoint = `/api/razorpay/tenant-payment-history?page=${page}&limit=${limit}`;
          break;
        case "tenant-worker":
          endpoint = `/api/razorpay/tenant-worker-payment-history?page=${page}&limit=${limit}`;
          break;
        case "owner-rent":
          endpoint = `/api/razorpay/owner-payment-history?page=${page}&limit=${limit}`;
          break;
        case "worker-payments":
          endpoint = `/api/razorpay/worker-earnings-history?page=${page}&limit=${limit}`;
          break;
        default:
          throw new Error("Invalid history type");
      }

      const response = await fetch(endpoint, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }

      const data = await response.json();

      if (data.success) {
        setPayments(data.data || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        setError(data.message || "Failed to load payment history");
      }
    } catch (err) {
      setError(err.message || "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={`razorpay-payment-history ${className}`}>
      {error && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      {/* Summary */}
      {showSummary && summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "15px",
            marginBottom: "20px",
          }}
        >
          {(historyType === "owner-rent" ||
            historyType === "worker-payments") && (
            <>
              <div style={cardStyle("#f0f5ff")}>
                <h4>Total Amount</h4>
                <p>₹{(summary.totalAmount || 0).toLocaleString()}</p>
              </div>

              <div style={cardStyle("#ffebee")}>
                <h4>Commission</h4>
                <p>₹{(summary.totalCommission || 0).toLocaleString()}</p>
              </div>

              <div style={cardStyle("#e8f5e9")}>
                <h4>Net Amount</h4>
                <p style={{ color: "#2e7d32" }}>
                  ₹{(summary.netAmount || 0).toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Table */}
      {payments.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p, i) => (
                <tr key={i}>
                  <td>
                    {p.paymentDate
                      ? new Date(p.paymentDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>₹{(p.amount || 0).toLocaleString()}</td>
                  <td>{p.status || "Unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No payment history available</p>
      )}
    </div>
  );
};

const cardStyle = (bg) => ({
  backgroundColor: bg,
  padding: "15px",
  borderRadius: "8px",
  textAlign: "center",
});

export default RazorpayPaymentHistory;