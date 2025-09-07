// src/pages/admin/MaintenanceRequests.jsx
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLoading } from "../context/useLoading";
import styles from "../assets/css/AdminDashboard.module.css";
import AdminNavbar from "../components/AdminNavbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchAdminMaintenanceRequests } from "../services/api";

const MaintenanceRequests = () => {
  const { setIsLoading } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Local input state (what user types)
  const [localFilters, setLocalFilters] = useState({
    issueType: searchParams.get("issueType") || "",
    propertyName: searchParams.get("propertyName") || "",
    tenantName: searchParams.get("tenantName") || "",
    ownerName: searchParams.get("ownerName") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 10,
  });

  // Applied filters (only update when "Apply" clicked)
  const [appliedFilters, setAppliedFilters] = useState({ ...localFilters });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setIsLoading(true);
    try {
      const allRequests = await fetchAdminMaintenanceRequests(); // unchanged API call

      let filtered = allRequests;

      // Apply filters only when user clicks "Apply Filters"
      if (appliedFilters.issueType) {
        const term = appliedFilters.issueType.toLowerCase();
        filtered = filtered.filter((r) =>
          r.issueType?.toLowerCase().includes(term)
        );
      }
      if (appliedFilters.propertyName) {
        const term = appliedFilters.propertyName.toLowerCase();
        filtered = filtered.filter((r) =>
          r.propertyName?.toLowerCase().includes(term)
        );
      }
      if (appliedFilters.tenantName) {
        const term = appliedFilters.tenantName.toLowerCase();
        filtered = filtered.filter((r) =>
          r.tenantName?.toLowerCase().includes(term)
        );
      }
      if (appliedFilters.ownerName) {
        const term = appliedFilters.ownerName.toLowerCase();
        filtered = filtered.filter((r) =>
          r.ownerName?.toLowerCase().includes(term)
        );
      }
      if (appliedFilters.fromDate) {
        const from = new Date(appliedFilters.fromDate);
        filtered = filtered.filter(
          (r) => new Date(r.dateReported || r.createdAt) >= from
        );
      }
      if (appliedFilters.toDate) {
        const to = new Date(appliedFilters.toDate);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter(
          (r) => new Date(r.dateReported || r.createdAt) <= to
        );
      }

      const totalCount = filtered.length;
      const start = (appliedFilters.page - 1) * appliedFilters.limit;
      const paginated = filtered.slice(start, start + appliedFilters.limit);

      setRequests(paginated);
      setTotal(totalCount);
    } catch (err) {
      console.error("Error loading requests:", err);
      alert("Failed to load maintenance requests");
      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [appliedFilters, setIsLoading]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const applyFilters = () => {
    const newFilters = { ...localFilters, page: 1 };
    setAppliedFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (newFilters.page === 1) params.delete("page");
    if (newFilters.limit === 10) params.delete("limit");
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    const reset = {
      issueType: "",
      propertyName: "",
      tenantName: "",
      ownerName: "",
      fromDate: "",
      toDate: "",
      page: 1,
      limit: 10,
    };
    setLocalFilters(reset);
    setAppliedFilters(reset);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage) => {
    setAppliedFilters((prev) => ({ ...prev, page: newPage }));
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage);
    setSearchParams(params, { replace: true });
  };

  const handleLimitChange = (limit) => {
    const newLimit = Number(limit);
    setAppliedFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
    const params = new URLSearchParams(searchParams);
    params.set("limit", newLimit);
    params.set("page", "1");
    setSearchParams(params, { replace: true });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Maintenance Requests</h1>
      <AdminNavbar />

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {/* LEFT: Filter Panel */}
        <aside
          style={{
            width: "250px",
            minWidth: "280px",
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            position: "sticky",
            top: "20px",
            height: "fit-content",
            alignSelf: "flex-start",
          }}
        >
          <h3
            style={{ margin: "0 0 20px", color: "#232f3e", fontSize: "18px" }}
          >
            Filters
          </h3>

          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Issue Type
              </label>
              <input
                type="text"
                placeholder="e.g. Electrical, Plumbing"
                value={localFilters.issueType}
                onChange={(e) =>
                  handleFilterChange("issueType", e.target.value)
                }
                style={{
                  width: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Property Name
              </label>
              <input
                type="text"
                placeholder="Search property..."
                value={localFilters.propertyName}
                onChange={(e) =>
                  handleFilterChange("propertyName", e.target.value)
                }
                style={{
                  width: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Tenant Name
              </label>
              <input
                type="text"
                placeholder="Search tenant..."
                value={localFilters.tenantName}
                onChange={(e) =>
                  handleFilterChange("tenantName", e.target.value)
                }
                style={{
                  width: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Owner Name
              </label>
              <input
                type="text"
                placeholder="Search owner..."
                value={localFilters.ownerName}
                onChange={(e) =>
                  handleFilterChange("ownerName", e.target.value)
                }
                style={{
                  width: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                From Date
              </label>
              <input
                type="date"
                value={localFilters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                style={{
                  width: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                To Date
              </label>
              <input
                type="date"
                value={localFilters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                style={{
                  width: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={applyFilters}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#ff9900",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                style={{
                  padding: "12px 16px",
                  background: "#fff",
                  color: "#555",
                  border: "1px solid #d5d9d9",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT: Table + Pagination */}
        <section style={{ flex: 1, minWidth: "0" }}>
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #eaeded",
                background: "#fafafa",
              }}
            >
              <h2 style={{ margin: 0, color: "#232f3e" }}>
                Maintenance Requests ({total.toLocaleString()})
              </h2>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "1500px",
                  tableLayout: "fixed",
                }}
              >
                <thead style={{ background: "#232f3e", color: "white" }}>
                  <tr>
                    <th style={{ width: "100px", padding: "14px 12px" }}>ID</th>
                    <th style={{ width: "180px" }}>Issue Type</th>
                    <th style={{ width: "160px" }}>Property</th>
                    <th style={{ width: "140px" }}>Tenant</th>
                    <th style={{ width: "140px" }}>Owner</th>
                    <th style={{ width: "160px" }}>Location</th>
                    <th style={{ width: "120px" }}>Reported</th>
                    <th style={{ width: "110px" }}>Status</th>
                    <th style={{ width: "300px" }}>Description</th>
                    <th style={{ width: "160px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        style={{
                          textAlign: "center",
                          padding: "60px",
                          color: "#555",
                        }}
                      >
                        No maintenance requests found.
                      </td>
                    </tr>
                  ) : (
                    requests.map((m) => (
                      <tr
                        key={m.id}
                        style={{ borderBottom: "1px solid #eaeded" }}
                      >
                        <td style={{ padding: "14px 12px", fontWeight: "500" }}>
                          {m.id.slice(-8)}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "4px 10px",
                              background: "#fff3cd",
                              color: "#856404",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {m.issueType || "General"}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`/admin/property/${m.propertyIdStr}`}
                            style={{ color: "#0066cc" }}
                          >
                            {m.propertyName}
                          </a>
                        </td>
                        <td>
                          <a
                            href={`/admin/user/${m.tenantIdStr}/tenant`}
                            style={{ color: "#0066cc" }}
                          >
                            {m.tenantName}
                          </a>
                        </td>
                        <td>
                          {m.ownerIdStr ? (
                            <a
                              href={`/admin/user/${m.ownerIdStr}/owner`}
                              style={{ color: "#0066cc" }}
                            >
                              {m.ownerName}
                            </a>
                          ) : (
                            m.ownerName || "N/A"
                          )}
                        </td>
                        <td
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {m.location || "N/A"}
                        </td>
                        <td>
                          {m.dateReported
                            ? new Date(m.dateReported).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "6px 12px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background:
                                m.status === "Completed"
                                  ? "#d4edda"
                                  : m.status === "In Progress"
                                  ? "#fff3cd"
                                  : m.status === "Cancelled"
                                  ? "#f8d7da"
                                  : "#fff3cd",
                              color:
                                m.status === "Completed"
                                  ? "#155724"
                                  : m.status === "In Progress"
                                  ? "#856404"
                                  : m.status === "Cancelled"
                                  ? "#721c24"
                                  : "#856404",
                            }}
                          >
                            {m.status || "Pending"}
                          </span>
                        </td>
                        <td
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "280px",
                          }}
                        >
                          {m.description || "No description"}
                        </td>
                        <td>
                          <div className={styles["action-buttons"]}>
                            <a href={`/admin/maintenance/${m.id}`}>View</a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              style={{
                padding: "16px 20px",
                background: "#fafafa",
                borderTop: "1px solid #eaeded",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ color: "#555" }}>
                Showing {(appliedFilters.page - 1) * appliedFilters.limit + 1}{" "}
                to {Math.min(appliedFilters.page * appliedFilters.limit, total)}{" "}
                of {total} requests
              </div>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <button
                  onClick={() => handlePageChange(appliedFilters.page - 1)}
                  disabled={appliedFilters.page === 1}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d5d9d9",
                    background: "white",
                    borderRadius: "6px",
                  }}
                >
                  Previous
                </button>
                <span
                  style={{
                    padding: "8px 16px",
                    background: "#232f3e",
                    color: "white",
                    borderRadius: "6px",
                  }}
                >
                  Page {appliedFilters.page}
                </span>
                <button
                  onClick={() => handlePageChange(appliedFilters.page + 1)}
                  disabled={appliedFilters.page * appliedFilters.limit >= total}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #d5d9d9",
                    background: "white",
                    borderRadius: "6px",
                  }}
                >
                  Next
                </button>
              </div>
              <select
                value={appliedFilters.limit}
                onChange={(e) => handleLimitChange(e.target.value)}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid #d5d9d9",
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MaintenanceRequests;

