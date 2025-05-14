// src/pages/admin/PropertyManagement.jsx
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLoading } from "../LoadingContext";
import styles from "../assets/css/AdminDashboard.module.css";
import AdminNavbar from "../components/AdminNavbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { API_URL } from "../services/api";

const PropertyManagement = () => {
  const { setIsLoading } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get("search") || "",
    ownerName: searchParams.get("ownerName") || "",
    type: searchParams.get("type") || "",
    isRented: searchParams.get("isRented") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    status: searchParams.get("status") || "",
    verified: searchParams.get("verified") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
    page: Number(searchParams.get("page")) || 1,
    limit: Number(searchParams.get("limit")) || 25,
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...localFilters });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/property-management`, {
        withCredentials: true,
        params: appliedFilters, // This sends all filters to backend
      });

      setProperties(res.data.properties || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Error loading properties:", err);
      alert("Failed to load properties");
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [appliedFilters, setIsLoading]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const applyFilters = () => {
    const newApplied = { ...localFilters, page: 1 };
    setAppliedFilters(newApplied);

    const params = new URLSearchParams();
    Object.keys(newApplied).forEach((key) => {
      if (newApplied[key]) params.set(key, newApplied[key]);
    });
    if (newApplied.page === 1) params.delete("page");
    if (newApplied.limit === 25) params.delete("limit");
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    const reset = {
      search: "",
      ownerName: "",
      type: "",
      isRented: "",
      minPrice: "",
      maxPrice: "",
      status: "",
      verified: "",
      fromDate: "",
      toDate: "",
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
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage);
    setSearchParams(params, { replace: true });
  };

  const handleLimitChange = (newLimit) => {
    const limit = Number(newLimit);
    setAppliedFilters((prev) => ({ ...prev, limit, page: 1 }));
    setLocalFilters((prev) => ({ ...prev, limit, page: 1 }));
    const params = new URLSearchParams(searchParams);
    params.set("limit", limit);
    params.set("page", "1");
    setSearchParams(params, { replace: true });
  };

  const handleVerify = async (id, current) => {
    if (
      !confirm(
        `Are you sure you want to ${
          current ? "unverify" : "verify"
        } this property?`
      )
    )
      return;
    try {
      await axios.post(
        `${API_URL}/admin/property/verify/${id}`,
        { isVerified: !current },
        { withCredentials: true }
      );
      alert("Verification updated!");
      fetchProperties();
    } catch (err) {
      alert("Failed to update verification");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this property permanently? This cannot be undone."))
      return;
    try {
      await axios.delete(`${API_URL}/admin/property/delete/${id}`, {
        withCredentials: true,
      });
      alert("Property deleted!");
      fetchProperties();
    } catch (err) {
      alert("Failed to delete property");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Property Management</h1>
      <AdminNavbar />

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {/* Filters */}
        <aside
          style={{
            width: "300px",
            minWidth: "300px",
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

          <div style={{ display: "grid", gap: "18px" }}>
            {/* Search (Name / Location) */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                  color: "#111",
                }}
              >
                Search (Name / Location)
              </label>
              <input
                type="text"
                placeholder="Search property or location..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                style={{
                  width: "278px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Owner Name */}
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
                  width: "278px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            {/* Property Type */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Property Type
              </label>
              <select
                value={localFilters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              >
                <option value="">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="PG">PG</option>
                <option value="Flat">Flat</option>
              </select>
            </div>

            {/* Rented Status */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Rented Status
              </label>
              <select
                value={localFilters.isRented}
                onChange={(e) => handleFilterChange("isRented", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              >
                <option value="">All</option>
                <option value="true">Rented</option>
                <option value="false">Available</option>
              </select>
            </div>

            {/* Price Range */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    fontWeight: "500",
                  }}
                >
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="Min"
                  value={localFilters.minPrice}
                  onChange={(e) =>
                    handleFilterChange("minPrice", e.target.value)
                  }
                  style={{
                    width: "120px",
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
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="Max"
                  value={localFilters.maxPrice}
                  onChange={(e) =>
                    handleFilterChange("maxPrice", e.target.value)
                  }
                  style={{
                    width: "130px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #d5d9d9",
                  }}
                />
              </div>
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
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              >
                <option value="">All Status</option>
                <option value="Available">Available</option>
                <option value="Rented">Rented</option>
                <option value="Under Maintenance">Under Maintenance</option>
              </select>
            </div>

            {/* Verification */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Verification
              </label>
              <select
                value={localFilters.verified}
                onChange={(e) => handleFilterChange("verified", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>

            {/* Date: From */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Listed From
              </label>
              <input
                type="date"
                value={localFilters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                style={{
                  width: "278px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #d5d9d9",
                }}
              />
            </div>

            {/* Date: To */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontWeight: "500",
                }}
              >
                Listed To
              </label>
              <input
                type="date"
                value={localFilters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                style={{
                  width: "278px",
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
                  fontSize: "14px",
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
                  fontSize: "14px",
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </aside>

        {/* Table */}
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
                Properties ({Number(total).toLocaleString()})
              </h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: "1600px",
                  tableLayout: "fixed",
                }}
              >
                <thead style={{ background: "#232f3e", color: "white" }}>
                  <tr>
                    <th style={{ width: "80px", padding: "14px 12px" }}>ID</th>
                    <th style={{ width: "180px" }}>Name</th>
                    <th style={{ width: "140px" }}>Owner</th>
                    <th style={{ width: "160px" }}>Location</th>
                    <th style={{ width: "100px" }}>Type</th>
                    <th style={{ width: "100px" }}>Status</th>
                    <th style={{ width: "80px" }}>Rented</th>
                    <th style={{ width: "120px" }}>Price</th>
                    <th style={{ width: "110px" }}>Created</th>
                    <th style={{ width: "100px" }}>Verified</th>
                    <th style={{ width: "240px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 ? (
                    <tr>
                      <td
                        colSpan="11"
                        style={{
                          textAlign: "center",
                          padding: "60px",
                          color: "#555",
                        }}
                      >
                        No properties found.
                      </td>
                    </tr>
                  ) : (
                    properties.map((p) => (
                      <tr
                        key={p._id}
                        style={{ borderBottom: "1px solid #eaeded" }}
                      >
                        <td style={{ padding: "14px 12px" }}>
                          {p._id.slice(-6)}
                        </td>
                        <td style={{ fontWeight: "500" }}>{p.name}</td>
                        <td>
                          <a
                            href={`/admin/user/${p.ownerId}/owner`}
                            style={{ color: "#0066cc" }}
                          >
                            {p.ownerName}
                          </a>
                        </td>
                        <td>{p.location}</td>
                        <td>
                          <span
                            style={{
                              padding: "4px 8px",
                              background: "#e6f7ff",
                              color: "#0066cc",
                              borderRadius: "4px",
                            }}
                          >
                            {p.type}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background:
                                p.status === "Available"
                                  ? "#d4edda"
                                  : p.status === "Rented"
                                  ? "#fff3cd"
                                  : "#f8d7da",
                              color:
                                p.status === "Available"
                                  ? "#155724"
                                  : p.status === "Rented"
                                  ? "#856404"
                                  : "#721c24",
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td>{p.isRented ? "Yes" : "No"}</td>
                        <td style={{ fontWeight: "600" }}>
                          ₹{p.price?.toLocaleString()}
                        </td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              background: p.isVerified ? "#d4edda" : "#f8d7da",
                              color: p.isVerified ? "#155724" : "#721c24",
                            }}
                          >
                            {p.isVerified ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <div className={styles["action-buttons"]}>
                            <a
                              href={`/admin/property/${p._id}`}
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
                            <a
                              href={`/property?id=${p._id}`}
                              style={{
                                background: "#17a2b8",
                                padding: "6px 10px",
                                color: "white",
                                borderRadius: "6px",
                                textDecoration: "none",
                                fontSize: "12px",
                              }}
                            >
                              Site
                            </a>
                            <button
                              onClick={() => handleVerify(p._id, p.isVerified)}
                              className={
                                p.isVerified ? styles.danger : styles.success
                              }
                            >
                              {p.isVerified ? "Unverify" : "Verify"}
                            </button>
                            <button
                              onClick={() => handleDelete(p._id)}
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
                of {total}
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

export default PropertyManagement;
