// src/pages/admin/UserManagement.jsx
import axios from 'axios';
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLoading } from "../LoadingContext";
import styles from "../assets/css/AdminDashboard.module.css";
import AdminNavbar from "../components/AdminNavbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchAdminUsers } from "../services/api";

const UserManagement = () => {
  const { setIsLoading } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Local filter state (not synced to URL until Apply is clicked)
  const [localFilters, setLocalFilters] = useState({
    name: searchParams.get("name") || "",
    email: searchParams.get("email") || "",
    phone: searchParams.get("phone") || "",
    role: searchParams.get("role") || "",
    status: searchParams.get("status") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
    address: searchParams.get("address") || "",
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 25,
  });

  // Current applied filters (used for fetching)
  const [appliedFilters, setAppliedFilters] = useState({ ...localFilters });

  // Fetch users based on applied filters
  // Inside UserManagement.jsx → replace fetchUsers function
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(appliedFilters).forEach((key) => {
        if (appliedFilters[key]) params.append(key, appliedFilters[key]);
      });

      const res = await fetchAdminUsers(`?${params.toString()}`);

      // SAFE HANDLING — supports both old & new backend
      if (res && res.users) {
        setUsers(res.users);
        setTotal(res.total ?? res.users.length);
      } else if (Array.isArray(res)) {
        setUsers(res);
        setTotal(res.length);
      } else {
        setUsers([]);
        setTotal(0);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load users");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [appliedFilters, setIsLoading]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Apply filters: sync local → applied → URL
  const applyFilters = () => {
    const newApplied = { ...localFilters, page: 1 }; // reset to page 1
    setAppliedFilters(newApplied);

    const newParams = new URLSearchParams();
    Object.keys(newApplied).forEach((key) => {
      if (newApplied[key]) newParams.set(key, newApplied[key]);
    });
    // Remove empty params
    if (!newApplied.page || newApplied.page === 1) newParams.delete("page");
    if (!newApplied.limit || newApplied.limit === 25) newParams.delete("limit");

    setSearchParams(newParams, { replace: true });
  };

  const resetFilters = () => {
    const reset = {
      name: "",
      email: "",
      phone: "",
      role: "",
      status: "",
      fromDate: "",
      toDate: "",
      address: "",
      page: 1,
      limit: 25,
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
    setLocalFilters((prev) => ({ ...prev, page: newPage }));

    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage);
    setSearchParams(newParams, { replace: true });
  };

  const handleLimitChange = (newLimit) => {
    const limit = Number(newLimit);
    setAppliedFilters((prev) => ({ ...prev, limit, page: 1 }));
    setLocalFilters((prev) => ({ ...prev, limit, page: 1 }));

    const newParams = new URLSearchParams(searchParams);
    newParams.set("limit", limit);
    newParams.set("page", "1");
    setSearchParams(newParams, { replace: true });
  };

const handleSuspend = async (userId, userType, currentStatus) => {
  if (!confirm(`Are you sure you want to ${currentStatus === 'Active' ? 'suspend' : 'activate'} this user?`)) return;

  try {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    
    await axios.post(
      `/api/admin/user/status/${userId}/${userType.toLowerCase()}`,
      { status: newStatus },
      { withCredentials: true }
    );

    alert('Status updated successfully!');
    fetchUsers(); // Refresh list
  } catch (err) {
    console.error('Suspend error:', err.response?.data || err);
    alert('Failed to update status');
  }
};

const handleDelete = async (userId, userType) => {
  if (!confirm('Delete this user permanently? This cannot be undone.')) return;

  try {
    await axios.delete(
      `/api/admin/user/delete/${userId}/${userType.toLowerCase()}`,
      { withCredentials: true }
    );

    alert('User deleted successfully');
    fetchUsers();
  } catch (err) {
    console.error('Delete error:', err.response?.data || err);
    alert('Failed to delete user');
  }
};


if (loading) {
    return <LoadingSpinner />;
  }
  

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>User Management</h1>
      <AdminNavbar />

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {/* LEFT: Filter Panel */}
        <aside
          style={{
            width: "150px",
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
            {/* Name */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                  color: "#111",
                }}
              >
                Name
              </label>
              <input
                type="text"
                placeholder="Search name..."
                value={localFilters.name}
                onChange={(e) => handleFilterChange("name", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Email
              </label>
              <input
                type="text"
                placeholder="Search email..."
                value={localFilters.email}
                onChange={(e) => handleFilterChange("email", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            {/* Phone */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Phone
              </label>
              <input
                type="text"
                placeholder="Search phone..."
                value={localFilters.phone}
                onChange={(e) => handleFilterChange("phone", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            {/* Role */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Role
              </label>
              <select
                value={localFilters.role}
                onChange={(e) => handleFilterChange("role", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "284px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              >
                <option value="">All Roles</option>
                <option value="tenant">Tenant</option>
                <option value="owner">Owner</option>
                <option value="worker">Worker</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Status
              </label>
              <select
                value={localFilters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "284px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Registered From
              </label>
              <input
                type="date"
                value={localFilters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "260px",
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
                Registered To
              </label>
              <input
                type="date"
                value={localFilters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            {/* Address */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Address (contains)
              </label>
              <input
                type="text"
                placeholder="Search address..."
                value={localFilters.address}
                onChange={(e) => handleFilterChange("address", e.target.value)}
                style={{
                  width: "100%",
                  maxWidth: "260px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            {/* Buttons */}
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
                Users ({Number(total || 0).toLocaleString()})
              </h2>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "1400px",
                  tableLayout: "fixed",
                }}
              >
                <thead style={{ background: "#232f3e", color: "white" }}>
                  <tr>
                    <th style={{ width: "80px", padding: "14px 12px" }}>ID</th>
                    <th style={{ width: "140px" }}>Name</th>
                    <th style={{ width: "100px" }}>Role</th>
                    <th style={{ width: "180px" }}>Email</th>
                    <th style={{ width: "120px" }}>Phone</th>
                    <th style={{ width: "160px" }}>Address</th>
                    <th style={{ width: "110px" }}>Registered</th>
                    <th style={{ width: "90px" }}>Status</th>
                    <th style={{ width: "200px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        style={{
                          textAlign: "center",
                          padding: "60px",
                          color: "#555",
                        }}
                      >
                        No users found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        style={{ borderBottom: "1px solid #eaeded" }}
                      >
                        <td style={{ padding: "14px 12px" }}>{u.id}</td>
                        <td>
                          {u.firstName} {u.lastName}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background: "#e6f7ff",
                              color: "#0066cc",
                            }}
                          >
                            {u.userType}
                          </span>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {u.address || "N/A"}
                        </td>
                        <td>
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background:
                                u.status === "Active" ? "#d4edda" : "#f8d7da",
                              color:
                                u.status === "Active" ? "#155724" : "#721c24",
                            }}
                          >
                            {u.status || "N/A"}
                          </span>
                        </td>
                        <td>
                          <div className={styles["action-buttons"]}>
                            <a
                              href={`/admin/user/${u.id}/${u.userType}`}
                              style={{
                                background: "#007bff",
                                padding: "6px 10px",
                                color: "white",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "12px",
                              }}
                            >
                              View
                            </a>
                            <button
                              onClick={() =>
                                handleSuspend(u.id, u.userType, u.status)
                              }
                              className={
                                u.status === "Active"
                                  ? styles.danger
                                  : styles.success
                              }
                            >
                              {u.status === "Active" ? "Suspend" : "Activate"}
                            </button>
                            <button
                              onClick={() => handleDelete(u.id, u.userType)}
                              className={styles.danger}
                            >
                              Delete
                            </button>
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
                of {total} users
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

export default UserManagement;
