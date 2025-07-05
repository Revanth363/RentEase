// src/pages/admin/MessageView.jsx
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
    New:        { background: '#fff8e1', color: '#f57f17' },
    Read:       { background: '#e8f5e9', color: '#2e7d32' },
    Replied:    { background: '#e3f2fd', color: '#1565c0' },
    Archived:   { background: '#f5f5f5', color: '#555' },
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
   CSS AS CONST STRING (same style as all other admin views)
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

/* ACTIONS */
.mv-actions {
  padding: 22px 36px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #fafafa;
}

.message-text {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #333;
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
const MessageView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/admin/message/${id}`, {
          withCredentials: true,
        });
        setSubmission(response.data);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'Message not found'
            : 'Failed to load message details. Please try again.'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchMessage();
  }, [id, setIsLoading]);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="pv-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#f44336', fontSize: '16px', fontWeight: 500 }}>{error}</p>
    </div>
  );
  if (!submission) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="pv-page">
        <div className="pv-wrap">

          {/* ── TITLE BAR ── */}
          <div className="pv-titlebar">
            <span>Contact Message Details</span>
            <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.65, marginLeft: '10px' }}>
              #{submission._id?.slice(-8).toUpperCase() || '—'}
            </span>
          </div>

          {/* ── HERO ── */}
          <div className="pv-hero">
            <div className="pv-hero-info">
              <div className="pv-hero-name">
                Contact Message #{submission._id?.slice(-8).toUpperCase() || '—'}
              </div>
              <div className="pv-hero-badges">
                {/* You can add status badge here if your model has one */}
              </div>
            </div>

            {/* Quick meta */}
            <div className="pv-hero-meta">
              {[
                ['Submitted', fmt(submission.submittedAt || submission.createdAt)],
                ['Subject', submission.subject || 'No subject'],
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

            {/* Message Details */}
            <Group title="Message Details">
              <Row label="Message ID" value={submission._id} />
              <Row label="Subject" value={submission.subject || 'No subject'} />
              <Row label="Submitted" value={fmt(submission.submittedAt || submission.createdAt)} />
              <Row label="Message" value={
                <div className="message-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {submission.message || 'No message provided'}
                </div>
              } />
            </Group>

            {/* Sender Information */}
            <Group title="Sender Information">
              <Row label="Name" value={submission.name || 'Anonymous'} />
              <Row label="Email" value={submission.email || '—'} />
              <Row label="Phone" value={submission.phone || '—'} />
            </Group>

            {/* Actions */}
            <Group title="Actions" fullWidth>
              <div className="mv-actions">
                <Link to="/admin/contact" className="mv-btn">
                  ← Back to Messages
                </Link>
              </div>
            </Group>

          </div>

        </div>
      </div>
    </>
  );
};

export default MessageView;