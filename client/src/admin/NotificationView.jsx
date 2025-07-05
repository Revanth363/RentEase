// src/pages/admin/NotificationView.jsx
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
    Completed:  { background: '#e8f5e9', color: '#2e7d32' },
    Approved:   { background: '#e8f5e9', color: '#2e7d32' },
    Urgent:     { background: '#ffebee', color: '#c62828' },
    General:    { background: '#e3f2fd', color: '#1565c0' },
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
  <div className="nv-detail-group" style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
    <h3>{title}</h3>
    {children}
  </div>
);

/* ════════════════════════════════════════════════
   CSS AS CONST STRING (same style as all other admin views)
════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.nv-page {
  font-family: 'Poppins', sans-serif;
  background: #f9f9f9;
  min-height: 100vh;
  color: #333;
}

.nv-wrap {
  width: 100%;
  background: #fff;
  min-height: 100vh;
  overflow: hidden;
}

/* TITLE BAR */
.nv-titlebar {
  background: #ffc107;
  color: #333;
  padding: 22px 36px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* HERO */
.nv-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 36px;
  background: #fffde7;
  border-bottom: 1px solid #ffe082;
  flex-wrap: wrap;
}

.nv-hero-info { flex: 1; min-width: 200px; }
.nv-hero-name { font-size: 22px; font-weight: 700; color: #333; margin-bottom: 4px; }
.nv-hero-badges { display: flex; gap: 8px; flex-wrap: wrap; }

.nv-grid {
  padding: 28px 36px 36px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 22px;
}

/* DETAIL GROUP */
.nv-detail-group {
  background: #fff;
  border-radius: 10px;
  padding: 22px 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  transition: transform 0.2s, box-shadow 0.2s;
}
.nv-detail-group:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.09);
}
.nv-detail-group h3 {
  font-size: 16px;
  font-weight: 600;
  color: #555;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ffc107;
}

/* BUTTONS */
.nv-btn {
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
.nv-btn:hover {
  background: #ffca2c;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(255,193,7,0.35);
}
.nv-btn-success {
  background: #28a745;
  color: white;
}
.nv-btn-success:hover {
  background: #218838;
}

/* ACTIONS */
.nv-actions {
  padding: 22px 36px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #fafafa;
}

@media (max-width: 768px) {
  .nv-grid { grid-template-columns: 1fr; padding: 16px; }
  .nv-hero { padding: 16px 20px; }
  .nv-titlebar { padding: 16px 20px; font-size: 18px; }
}
`;

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
const NotificationView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/admin/notification/${id}`, {
          withCredentials: true,
        });
        setNotification(response.data.notification || response.data);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'Notification not found'
            : err.response?.status === 401
            ? 'Session expired. Please log in again.'
            : 'Failed to load notification details'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchNotification();
  }, [id, setIsLoading]);

  const handleComplete = async () => {
    if (!window.confirm('Mark this notification as completed?')) return;

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API_URL}/admin/notification/${notification._id}/complete`,
        {},
        { withCredentials: true }
      );

      if (response.data.success || response.data.message) {
        alert('Notification marked as completed!');
        window.location.reload();
      }
    } catch (err) {
      alert('Failed to complete notification');
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
  if (!notification) return null;

  const status = notification.status || 'Pending';

  return (
    <>
      <style>{CSS}</style>
      <div className="pv-page">
        <div className="pv-wrap">

          {/* ── TITLE BAR ── */}
          <div className="pv-titlebar">
            <span>Notification Details</span>
            <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.65, marginLeft: '10px' }}>#{notification._id}</span>
          </div>

          {/* ── HERO ── */}
          <div className="pv-hero">
            <div className="pv-hero-info">
              <div className="pv-hero-name">
                {notification.type || 'General'} Notification
              </div>
              <div className="pv-hero-badges">
                <Badge value={status} />
                {notification.type && (
                  <span style={{ background: '#f5f5f5', color: '#555', padding: '3px 10px', borderRadius: '4px', fontSize: '13px' }}>
                    {notification.type}
                  </span>
                )}
              </div>
            </div>

            {/* Quick meta */}
            <div className="pv-hero-meta">
              {[
                ['Status', status],
                ['Created', fmt(notification.createdAt)],
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

            {/* Notification Information */}
            <Group title="Notification Information">
              <Row label="Notification ID" value={notification._id} />
              <Row label="Type" value={notification.type || 'General'} />
              <Row label="Status" value={<Badge value={status} />} />
              <Row label="Created" value={fmt(notification.createdAt)} />
              <Row label="Message" value={notification.message || 'No message provided'} />
            </Group>

            {/* Recipient */}
            <Group title="Recipient">
              {notification.recipient?._id ? (
                <>
                  <Row label="Name" value={
                    <Link to={`/admin/user/${notification.recipient._id}/${notification.recipient.userType?.toLowerCase() || 'user'}`}
                      style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                      {notification.recipient.firstName} {notification.recipient.lastName}
                    </Link>
                  } />
                  <Row label="Email" value={notification.recipient.email || '—'} />
                  <Row label="Role" value={notification.recipient.userType || 'User'} />
                </>
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic' }}>No recipient assigned</p>
              )}
            </Group>

            {/* Related Worker (if any) */}
            {notification.worker?._id && (
              <Group title="Related Worker">
                <Row label="Name" value={
                  <Link to={`/admin/user/${notification.worker._id}/worker`}
                    style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                    {notification.worker.firstName} {notification.worker.lastName}
                  </Link>
                } />
                <Row label="Service" value={notification.worker.serviceType || '—'} />
              </Group>
            )}

            {/* Actions */}
            <Group title="Actions" fullWidth>
              <div className="nv-actions">
                {status !== 'Completed' && (
                  <button className="nv-btn nv-btn-success" onClick={handleComplete}>
                    Mark as Completed
                  </button>
                )}
                <Link to="/admin" className="nv-btn">
                  ← Back to Dashboard
                </Link>
              </div>
            </Group>

          </div>

        </div>
      </div>
    </>
  );
};

export default NotificationView;