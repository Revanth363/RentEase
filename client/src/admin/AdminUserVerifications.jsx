// src/admin/AdminUserVerifications.jsx
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLoading } from "../LoadingContext";
import styles from "../assets/css/AdminDashboard.module.css";
import AdminNavbar from "../components/AdminNavbar";
import LoadingSpinner from "../components/LoadingSpinner";

const DOC_TYPE_LABELS = {
  aadhaar: "Aadhaar",
  pan: "PAN Card",
  driving_license: "Driving License",
  college_id: "College ID",
  other_proof: "Other Proof",
  skill_certificate: "Skill Certificate",
  property_proof: "Property Proof",
};

const SKILL_LABELS = {
  cook: "Cook",
  cleaning: "Cleaning",
  gardening: "Gardening",
  caretaker: "Caretaker",
  other: "Other",
};

const USER_MODEL_COLORS = {
  tenant: { bg: "#e8f4fd", color: "#0066cc" },
  owner:  { bg: "#fff3e0", color: "#e65c00" },
  worker: { bg: "#e8f5e9", color: "#2e7d32" },
};

const STATUS_STYLES = {
  pending:  { bg: "#fff3cd", color: "#856404" },
  approved: { bg: "#d4edda", color: "#155724" },
  rejected: { bg: "#f8d7da", color: "#721c24" },
};

const AdminUserVerifications = () => {
  const { setIsLoading } = useLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const [verifications, setVerifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [localFilters, setLocalFilters] = useState({
    status:    searchParams.get("status")    || "",
    userModel: searchParams.get("userModel") || "",
    search:    searchParams.get("search")    || "",
    page:      Number(searchParams.get("page"))  || 1,
    limit:     Number(searchParams.get("limit")) || 10,
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...localFilters });

  // Modals
  const [docModal,      setDocModal]      = useState(null); // full verification object
  const [rejectModal,   setRejectModal]   = useState(null); // verification _id
  const [rejectReason,  setRejectReason]  = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    setIsLoading(true);
    try {
      const res = await axios.get("/api/admin/verifications/all", { withCredentials: true });
      let data = res.data || [];

      if (appliedFilters.status)
        data = data.filter((v) => v.status === appliedFilters.status);
      if (appliedFilters.userModel)
        data = data.filter((v) => v.userModel === appliedFilters.userModel);
      if (appliedFilters.search) {
        const term = appliedFilters.search.toLowerCase();
        data = data.filter(
          (v) =>
            v.user?.firstName?.toLowerCase().includes(term) ||
            v.user?.lastName?.toLowerCase().includes(term)  ||
            v.user?.email?.toLowerCase().includes(term)
        );
      }

      // Sort: pending first, then approved, then rejected
      const statusOrder = { pending: 0, approved: 1, rejected: 2 };
      data.sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));

      setTotal(data.length);
      const start = (appliedFilters.page - 1) * appliedFilters.limit;
      setVerifications(data.slice(start, start + appliedFilters.limit));
    } catch (err) {
      console.error("Error loading verifications:", err);
      setVerifications([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [appliedFilters, setIsLoading]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const applyFilters = () => {
    const newApplied = { ...localFilters, page: 1 };
    setAppliedFilters(newApplied);
    const params = new URLSearchParams();
    Object.entries(newApplied).forEach(([k, v]) => { if (v) params.set(k, v); });
    setSearchParams(params, { replace: true });
  };

  const resetFilters = () => {
    const reset = { status: "", userModel: "", search: "", page: 1, limit: 10 };
    setLocalFilters(reset);
    setAppliedFilters(reset);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handlePageChange = (newPage) => {
    setAppliedFilters((prev) => ({ ...prev, page: newPage }));
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage);
    setSearchParams(params, { replace: true });
  };

  const handleApprove = async (id) => {
    if (!confirm("Approve this verification?")) return;
    setActionLoading(true);
    try {
      await axios.post(`/api/admin/verifications/${id}/approve`, {}, { withCredentials: true });
      setDocModal(null);
      fetchVerifications();
    } catch { alert("Failed to approve"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) { alert("Please enter a rejection reason."); return; }
    setActionLoading(true);
    try {
      await axios.post(`/api/admin/verifications/${rejectModal}/reject`, { reason: rejectReason }, { withCredentials: true });
      setRejectModal(null);
      setRejectReason("");
      setDocModal(null);
      fetchVerifications();
    } catch { alert("Failed to reject"); }
    finally { setActionLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>User Verifications</h1>
      <AdminNavbar />

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>

        {/* FILTER PANEL */}
        <aside style={{
          width: "260px", minWidth: "260px", background: "white", padding: "24px",
          borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          position: "sticky", top: "20px", height: "fit-content", alignSelf: "flex-start",
        }}>
          <h3 style={{ margin: "0 0 20px", color: "#232f3e", fontSize: "18px" }}>Filters</h3>
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Search Name / Email</label>
              <input
                type="text"
                placeholder="Search user..."
                value={localFilters.search}
                onChange={(e) => setLocalFilters((p) => ({ ...p, search: e.target.value }))}
                style={{ width: "220px", padding: "10px", borderRadius: "8px", border: "1px solid #d5d9d9", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>Status</label>
              <select
                value={localFilters.status}
                onChange={(e) => setLocalFilters((p) => ({ ...p, status: e.target.value }))}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d5d9d9" }}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}>User Type</label>
              <select
                value={localFilters.userModel}
                onChange={(e) => setLocalFilters((p) => ({ ...p, userModel: e.target.value }))}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #d5d9d9" }}
              >
                <option value="">All Types</option>
                <option value="tenant">Tenant</option>
                <option value="owner">Owner</option>
                <option value="worker">Worker</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={applyFilters}
                style={{ flex: 1, padding: "12px", background: "#ff9900", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
              >Apply</button>
              <button
                onClick={resetFilters}
                style={{ padding: "12px 14px", background: "#fff", color: "#555", border: "1px solid #d5d9d9", borderRadius: "8px", cursor: "pointer" }}
              >Reset</button>
            </div>
          </div>
        </aside>

        {/* MAIN TABLE */}
        <section style={{ flex: 1, minWidth: "0" }}>
          <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>

            {/* Table header bar */}
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #eaeded", background: "#fafafa",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <h2 style={{ margin: 0, color: "#232f3e", fontSize: "20px" }}>
                Verifications ({total})
              </h2>
              <span style={{
                padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600",
                background: (STATUS_STYLES[appliedFilters.status] || { bg: "#eee" }).bg,
                color:      (STATUS_STYLES[appliedFilters.status] || { color: "#333" }).color,
              }}>
                {appliedFilters.status
                  ? appliedFilters.status.charAt(0).toUpperCase() + appliedFilters.status.slice(1)
                  : "All"}
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: "900px", tableLayout: "fixed" }}>
                <thead style={{ background: "#232f3e", color: "white" }}>
                  <tr>
                    <th style={{ width: "60px",  padding: "14px 12px" }}>#</th>
                    <th style={{ width: "180px", padding: "14px 12px" }}>User</th>
                    <th style={{ width: "200px", padding: "14px 12px" }}>Email</th>
                    <th style={{ width: "100px", padding: "14px 12px" }}>Type</th>
                    <th style={{ width: "110px", padding: "14px 12px" }}>Status</th>
                    <th style={{ width: "90px",  padding: "14px 12px" }}>Docs</th>
                    <th style={{ width: "120px", padding: "14px 12px" }}>Submitted</th>
                    <th style={{ width: "220px", padding: "14px 12px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center", padding: "60px", color: "#777" }}>
                        No verification requests found.
                      </td>
                    </tr>
                  ) : verifications.map((v, i) => {
                    const umc = USER_MODEL_COLORS[v.userModel] || { bg: "#eee", color: "#333" };
                    const sc  = STATUS_STYLES[v.status]        || { bg: "#eee", color: "#333" };
                    return (
                      <tr key={v._id} style={{ borderBottom: "1px solid #eaeded" }}>
                        <td style={{ padding: "14px 12px", color: "#777", fontSize: "13px" }}>
                          {(appliedFilters.page - 1) * appliedFilters.limit + i + 1}
                        </td>
                        <td style={{ padding: "14px 12px", fontWeight: "600", color: "#232f3e" }}>
                          {v.user?.firstName} {v.user?.lastName}
                        </td>
                        <td style={{ padding: "14px 12px", color: "#0066cc", fontSize: "13px" }}>
                          {v.user?.email || "—"}
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: "12px", fontSize: "12px",
                            fontWeight: "600", background: umc.bg, color: umc.color, textTransform: "capitalize",
                          }}>{v.userModel}</span>
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <span style={{
                            padding: "4px 10px", borderRadius: "12px", fontSize: "12px",
                            fontWeight: "600", background: sc.bg, color: sc.color, textTransform: "capitalize",
                          }}>{v.status}</span>
                        </td>
                        <td style={{ padding: "14px 12px", fontWeight: "600", color: "#232f3e" }}>
                          {v.documents?.length || 0} file{v.documents?.length !== 1 ? "s" : ""}
                        </td>
                        <td style={{ padding: "14px 12px", fontSize: "13px", color: "#555" }}>
                          {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ padding: "14px 12px" }}>
                          <div className={styles["action-buttons"]}>
                            <button
                              onClick={() => setDocModal(v)}
                              style={{ padding: "6px 12px", background: "#007bff", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                            >View Docs</button>
                            {v.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(v._id)}
                                  style={{ padding: "6px 12px", background: "#28a745", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                                >Approve</button>
                                <button
                                  onClick={() => setRejectModal(v._id)}
                                  style={{ padding: "6px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                                >Reject</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              padding: "16px 20px", background: "#fafafa", borderTop: "1px solid #eaeded",
              display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px",
            }}>
              <div style={{ color: "#555" }}>
                Showing {(appliedFilters.page - 1) * appliedFilters.limit + 1} to{" "}
                {Math.min(appliedFilters.page * appliedFilters.limit, total)} of {total}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={() => handlePageChange(appliedFilters.page - 1)} disabled={appliedFilters.page === 1}
                  style={{ padding: "8px 12px", border: "1px solid #d5d9d9", background: "white", borderRadius: "6px", cursor: "pointer" }}>
                  Previous
                </button>
                <span style={{ padding: "8px 16px", background: "#232f3e", color: "white", borderRadius: "6px" }}>
                  Page {appliedFilters.page}
                </span>
                <button onClick={() => handlePageChange(appliedFilters.page + 1)} disabled={appliedFilters.page * appliedFilters.limit >= total}
                  style={{ padding: "8px 12px", border: "1px solid #d5d9d9", background: "white", borderRadius: "6px", cursor: "pointer" }}>
                  Next
                </button>
              </div>
              <select value={appliedFilters.limit}
                onChange={(e) => {
                  const lim = Number(e.target.value);
                  setAppliedFilters((p) => ({ ...p, limit: lim, page: 1 }));
                }}
                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #d5d9d9" }}>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </section>
      </div>

      {/* VIEW DOCUMENTS MODAL */}
      {docModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDocModal(null); }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, padding: "20px",
          }}
        >
          <div style={{
            background: "white", borderRadius: "14px", width: "100%", maxWidth: "780px",
            maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #eaeded",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "#232f3e", borderRadius: "14px 14px 0 0",
            }}>
              <div>
                <h3 style={{ margin: 0, color: "white", fontSize: "18px" }}>
                  {docModal.user?.firstName} {docModal.user?.lastName}
                </h3>
                <p style={{ margin: "4px 0 0", color: "#aaa", fontSize: "13px" }}>
                  {docModal.user?.email} · <span style={{ textTransform: "capitalize" }}>{docModal.userModel}</span>
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{
                  padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600",
                  background: (STATUS_STYLES[docModal.status] || { bg: "#eee" }).bg,
                  color:      (STATUS_STYLES[docModal.status] || { color: "#333" }).color,
                }}>
                  {docModal.status?.charAt(0).toUpperCase() + docModal.status?.slice(1)}
                </span>
                <button onClick={() => setDocModal(null)}
                  style={{ background: "transparent", border: "none", color: "white", fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>
                  ×
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: "24px" }}>
              {docModal.rejectionReason && (
                <div style={{
                  background: "#fff5f5", border: "1px solid #ffc0c0", borderRadius: "8px",
                  padding: "12px 16px", marginBottom: "20px",
                }}>
                  <strong style={{ color: "#c0392b" }}>Rejection Reason:</strong>{" "}
                  <span style={{ color: "#721c24" }}>{docModal.rejectionReason}</span>
                </div>
              )}

              <h4 style={{ margin: "0 0 16px", color: "#232f3e" }}>
                Submitted Documents ({docModal.documents?.length || 0})
              </h4>

              {!docModal.documents?.length ? (
                <p style={{ color: "#777" }}>No documents uploaded.</p>
              ) : (
                <div style={{ display: "grid", gap: "20px" }}>
                  {docModal.documents.map((doc, idx) => {
                    const isPdf   = /\.pdf$/i.test(doc.url);
                    const isImage = !isPdf && (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(doc.url) || doc.url?.includes("/image/") || doc.url?.includes("/upload/"));
                    return (
                      <div key={idx} style={{ border: "1px solid #e0e0e0", borderRadius: "10px", overflow: "hidden", background: "#fafafa" }}>

                        {/* Doc card header */}
                        <div style={{
                          padding: "12px 16px", background: "#f4f4f4", borderBottom: "1px solid #e0e0e0",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <span style={{ fontSize: "20px" }}>{isPdf ? "📄" : "🖼️"}</span>
                            <div>
                              <strong style={{ fontSize: "14px" }}>
                                Document {idx + 1}
                                {doc.type && ` — ${DOC_TYPE_LABELS[doc.type] || doc.type.replace("_", " ")}`}
                              </strong>
                              {doc.skillType && (
                                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#777" }}>
                                  Skill: {SKILL_LABELS[doc.skillType] || doc.skillType}
                                </p>
                              )}
                            </div>
                          </div>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer"
                            style={{ padding: "8px 16px", background: "#0066cc", color: "white", borderRadius: "6px", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>
                            Open ↗
                          </a>
                        </div>

                        {/* Preview area */}
                        {isImage ? (
                          <div style={{ padding: "16px", textAlign: "center", background: "#fff" }}>
                            <img
                              src={doc.url}
                              alt={`Document ${idx + 1}`}
                              style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain", borderRadius: "6px", border: "1px solid #e0e0e0" }}
                            />
                          </div>
                        ) : isPdf ? (
                          <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff" }}>
                            <p style={{ marginBottom: "20px", color: "#444", fontSize: "15px", lineHeight: "1.5" }}>
                              For security and compatibility reasons,<br />
                              PDFs are best viewed in a new browser tab.
                            </p>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-block",
                                padding: "14px 36px",
                                background: "#1e88e5",
                                color: "white",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontSize: "16px",
                                fontWeight: "600",
                                boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                                transition: "all 0.2s"
                              }}
                            >
                              Open PDF in New Tab ↗
                            </a>
                            <p style={{ marginTop: "20px", fontSize: "13px", color: "#777" }}>
                              (You can also right-click → "Save link as..." to download)
                            </p>
                          </div>
                        ) : (
                          <div style={{ padding: "40px 20px", textAlign: "center", color: "#777", background: "#fff" }}>
                            Preview not available for this file type.<br />
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>
                              Open file directly ↗
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action buttons — only for pending */}
              {docModal.status === "pending" && (
                <div style={{
                  display: "flex", gap: "16px", marginTop: "32px",
                  paddingTop: "24px", borderTop: "1px solid #eee", justifyContent: "flex-end",
                }}>
                  <button disabled={actionLoading} onClick={() => setRejectModal(docModal._id)}
                    style={{ padding: "12px 32px", background: "#dc3545", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "15px", cursor: "pointer" }}>
                    Reject
                  </button>
                  <button disabled={actionLoading} onClick={() => handleApprove(docModal._id)}
                    style={{ padding: "12px 40px", background: "#28a745", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "15px", cursor: "pointer" }}>
                    {actionLoading ? "Processing..." : "Approve"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT REASON MODAL */}
      {rejectModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setRejectModal(null); setRejectReason(""); } }}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000,
          }}
        >
          <div style={{
            background: "white", borderRadius: "12px", width: "100%", maxWidth: "420px",
            padding: "28px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <h3 style={{ margin: "0 0 8px", color: "#232f3e" }}>Reject Verification</h3>
            <p style={{ margin: "0 0 20px", color: "#777", fontSize: "14px" }}>
              Please provide a reason. The user will see this message.
            </p>
            <textarea
              placeholder="e.g. Document is blurry / Invalid ID provided..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              style={{
                width: "100%", padding: "12px", borderRadius: "8px",
                border: "1px solid #d5d9d9", fontSize: "14px",
                resize: "vertical", boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "12px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                style={{ padding: "12px 24px", border: "1px solid #d5d9d9", background: "white", borderRadius: "8px", cursor: "pointer", fontWeight: "500" }}>
                Cancel
              </button>
              <button
                disabled={actionLoading || !rejectReason.trim()}
                onClick={handleReject}
                style={{
                  padding: "12px 32px", background: "#dc3545", color: "white",
                  border: "none", borderRadius: "8px", fontWeight: "600",
                  cursor: rejectReason.trim() ? "pointer" : "not-allowed",
                  opacity: rejectReason.trim() ? 1 : 0.6,
                }}>
                {actionLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserVerifications;