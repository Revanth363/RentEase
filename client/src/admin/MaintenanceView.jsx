// src/pages/admin/MaintenanceView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const API_URL = '/api';

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ── Badge ── */
const Badge = ({ value }) => {
  const map = {
    Pending:    { background: '#fff8e1', color: '#f57f17' },
    InProgress: { background: '#e3f2fd', color: '#1565c0' },
    Completed:  { background: '#e8f5e9', color: '#2e7d32' },
    Cancelled:  { background: '#ffebee', color: '#c62828' },
  };
  const s = map[value] || { background: '#f5f5f5', color: '#555' };
  return (
    <span style={{ ...s, padding: '3px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, display: 'inline-block' }}>
      {value}
    </span>
  );
};

/* ── Row ── */
const Row = ({ label, value }) => (
  <p style={{ margin: '12px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
    <strong style={{ fontWeight: 600, color: '#555', minWidth: '160px', display: 'inline-block' }}>{label}</strong>
    <span style={{ color: '#333' }}>{value ?? '—'}</span>
  </p>
);

/* ── Group card ── */
const Group = ({ title, children, fullWidth }) => (
  <div className="mv-detail-group" style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
    <h3>{title}</h3>
    {children}
  </div>
);

/* ════════════════════════════════════════════════
   CSS AS CONST STRING (matching all other admin views)
════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.mv-page {
  font-family: 'Poppins', sans-serif;
  background: #f9f9f9;
  min-height: 100vh;
  color: #333;
}

.mv-wrap {
  width: 100%;
  background: #fff;
  min-height: 100vh;
  overflow: hidden;
}

/* TITLE BAR */
.mv-titlebar {
  background: #ffc107;
  color: #333;
  padding: 22px 36px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* HERO */
.mv-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 36px;
  background: #fffde7;
  border-bottom: 1px solid #ffe082;
  flex-wrap: wrap;
}

.mv-hero-info { flex: 1; min-width: 200px; }
.mv-hero-name { font-size: 22px; font-weight: 700; color: #333; margin-bottom: 4px; }
.mv-hero-badges { display: flex; gap: 8px; flex-wrap: wrap; }

.mv-grid {
  padding: 28px 36px 36px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 22px;
}

/* DETAIL GROUP */
.mv-detail-group {
  background: #fff;
  border-radius: 10px;
  padding: 22px 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  transition: transform 0.2s, box-shadow 0.2s;
}
.mv-detail-group:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.09);
}
.mv-detail-group h3 {
  font-size: 16px;
  font-weight: 600;
  color: #555;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ffc107;
}

/* BUTTONS */
.mv-btn {
  font-family: 'Poppins', sans-serif;
  background: #ffc107;
  color: #333;
  border: none;
  padding: 10px 22px;
  border-radius: 7px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.mv-btn:hover {
  background: #ffca2c;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(255,193,7,0.35);
}
.mv-btn-success {
  background: #28a745;
  color: white;
}
.mv-btn-success:hover {
  background: #218838;
}

/* ACTIONS */
.mv-actions {
  padding: 22px 36px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #fafafa;
}

@media (max-width: 768px) {
  .mv-grid { grid-template-columns: 1fr; padding: 16px; }
  .mv-hero { padding: 16px 20px; }
  .mv-titlebar { padding: 16px 20px; font-size: 18px; }
}
`;

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
const MaintenanceView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/admin/maintenance/${id}`, {
          withCredentials: true,
        });
        setRequest(response.data);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'Maintenance request not found'
            : 'Failed to load details'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchMaintenance();
  }, [id, setIsLoading]);

  const handleComplete = async () => {
    if (!window.confirm('Mark this maintenance request as completed?')) return;

    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/admin/maintenance/${id}/complete`, {}, { withCredentials: true });
      alert('Marked as completed!');
      window.location.reload();
    } catch (err) {
      alert('Failed to complete request');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="pv-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#f44336', fontSize: '16px', fontWeight: 500 }}>{error}</p>
    </div>
  );
  if (!request) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="pv-page">
        <div className="pv-wrap">

          {/* ── TITLE BAR ── */}
          <div className="pv-titlebar">
            <span>Maintenance Request Details</span>
            <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.65, marginLeft: '10px' }}>
              #{request._id?.slice(-8).toUpperCase() || '—'}
            </span>
          </div>

          {/* ── HERO ── */}
          <div className="pv-hero">
            <div className="pv-hero-info">
              <div className="pv-hero-name">
                Maintenance Request #{request._id?.slice(-8).toUpperCase() || '—'}
              </div>
              <div className="pv-hero-badges">
                <Badge value={request.status || 'Pending'} />
                {request.issueType && (
                  <span style={{ background: '#f5f5f5', color: '#555', padding: '3px 10px', borderRadius: '4px', fontSize: '13px' }}>
                    {request.issueType}
                  </span>
                )}
              </div>
            </div>

            {/* Quick meta */}
            <div className="pv-hero-meta">
              {[
                ['Status', request.status || 'Pending'],
                ['Reported', fmt(request.dateReported)],
                ['Scheduled', fmt(request.scheduledDate)],
              ].map(([lbl, val]) => (
                <div key={lbl} className="pv-meta-item">
                  <div className="pv-meta-label">{lbl}</div>
                  <div className="pv-meta-val">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── DETAIL GRID ── */}
          <div className="pv-grid">

            {/* Request Details */}
            <Group title="Request Details">
              <Row label="Request ID" value={request._id} />
              <Row label="Issue Type" value={request.issueType || '—'} />
              <Row label="Status" value={<Badge value={request.status || 'Pending'} />} />
              <Row label="Reported" value={fmt(request.dateReported)} />
              <Row label="Scheduled" value={fmt(request.scheduledDate)} />
              <Row label="Completed" value={fmt(request.completionDate)} />
              <Row label="Description" value={request.description || 'No description'} />
              <Row label="Location" value={request.location || '—'} />
            </Group>

            {/* Property */}
            {request.propertyId?._id && (
              <Group title="Property">
                <Row label="Name" value={
                  <Link to={`/admin/property/${request.propertyId._id}`}
                    style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                    {request.propertyId.name || 'View Property'}
                  </Link>
                } />
                <Row label="Location" value={request.propertyId.location || '—'} />
                <Row label="Address" value={request.propertyId.address || '—'} />
              </Group>
            )}

            {/* Tenant (Reporter) */}
            {request.tenantId?._id && (
              <Group title="Tenant (Reporter)">
                <Row label="Name" value={
                  <Link to={`/admin/user/${request.tenantId._id}/tenant`}
                    style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                    {request.tenantId.firstName} {request.tenantId.lastName}
                  </Link>
                } />
                <Row label="Email" value={request.tenantId.email || '—'} />
                <Row label="Phone" value={request.tenantId.phone || '—'} />
              </Group>
            )}

            {/* Property Owner */}
            {request.propertyId?.owner?._id && (
              <Group title="Property Owner">
                <Row label="Name" value={
                  <Link to={`/admin/user/${request.propertyId.owner._id}/owner`}
                    style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                    {request.propertyId.owner.firstName} {request.propertyId.owner.lastName}
                  </Link>
                } />
                <Row label="Email" value={request.propertyId.owner.email || '—'} />
                <Row label="Phone" value={request.propertyId.owner.phone || '—'} />
              </Group>
            )}

            {/* Assigned Worker */}
            {request.assignedWorkerId?._id && (
              <Group title="Assigned Worker">
                <Row label="Name" value={
                  <Link to={`/admin/user/${request.assignedWorkerId._id}/worker`}
                    style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                    {request.assignedWorkerId.firstName} {request.assignedWorkerId.lastName}
                  </Link>
                } />
                <Row label="Service" value={request.assignedWorkerId.serviceType || '—'} />
              </Group>
            )}

            {/* Actions */}
            <Group title="Actions" fullWidth>
              <div className="mv-actions">
                {request.status !== 'Completed' && (
                  <button className="mv-btn mv-btn-success" onClick={handleComplete}>
                    Mark as Completed
                  </button>
                )}
                <Link to="/admin/maintenance" className="mv-btn">
                  ← Back to Maintenance Requests
                </Link>
              </div>
            </Group>

          </div>

        </div>
      </div>
    </>
  );
};

export default MaintenanceView;