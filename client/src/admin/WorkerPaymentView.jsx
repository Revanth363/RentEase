// src/pages/admin/WorkerPaymentView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const API_URL = '/api';

const money = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Badge ── */
const Badge = ({ value }) => {
  const map = {
    Paid:    { background: '#e8f5e9', color: '#2e7d32' },
    Pending: { background: '#fff8e1', color: '#f57f17' },
    Failed:  { background: '#ffebee', color: '#c62828' },
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
  <div className="pv-detail-group" style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
    <h3>{title}</h3>
    {children}
  </div>
);

/* ── Stat pill ── */
const Stat = ({ label, value }) => (
  <div style={{
    background: '#fff8e1', border: '1px solid #ffe082',
    borderRadius: '8px', padding: '16px 22px', textAlign: 'center', minWidth: '130px',
  }}>
    <div style={{ fontSize: '26px', fontWeight: 700, color: '#ffc107', lineHeight: 1 }}>{value ?? '—'}</div>
    <div style={{ fontSize: '13px', color: '#777', marginTop: '6px' }}>{label}</div>
  </div>
);

/* ════════════════════════════════════════════════
   CSS AS CONST STRING (same style as all other admin views)
════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.pv-page {
  font-family: 'Poppins', sans-serif;
  background: #f9f9f9;
  min-height: 100vh;
  color: #333;
}

.pv-wrap {
  width: 100%;
  background: #fff;
  min-height: 100vh;
  overflow: hidden;
}

/* TITLE BAR */
.pv-titlebar {
  background: #ffc107;
  color: #333;
  padding: 22px 36px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* HERO */
.pv-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 36px;
  background: #fffde7;
  border-bottom: 1px solid #ffe082;
  flex-wrap: wrap;
}

.pv-hero-info { flex: 1; min-width: 200px; }
.pv-hero-name { font-size: 22px; font-weight: 700; color: #333; margin-bottom: 4px; }
.pv-hero-badges { display: flex; gap: 8px; flex-wrap: wrap; }

.pv-hero-meta { display: flex; gap: 32px; flex-wrap: wrap; margin-left: auto; }
.pv-meta-item { min-width: 110px; }
.pv-meta-label { font-size: 11px; color: #bbb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.pv-meta-val   { font-size: 14px; font-weight: 600; color: #333; }

/* GRID */
.pv-grid {
  padding: 28px 36px 36px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 22px;
}

/* DETAIL GROUP */
.pv-detail-group {
  background: #fff;
  border-radius: 10px;
  padding: 22px 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  transition: transform 0.2s, box-shadow 0.2s;
}
.pv-detail-group:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.09);
}
.pv-detail-group h3 {
  font-size: 16px;
  font-weight: 600;
  color: #555;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ffc107;
}

/* BUTTONS */
.pv-btn {
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
.pv-btn:hover {
  background: #ffca2c;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(255,193,7,0.35);
}

.pv-actions {
  padding: 22px 36px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #fafafa;
}

@media (max-width: 768px) {
  .pv-grid { grid-template-columns: 1fr; padding: 16px; }
  .pv-hero { padding: 16px 20px; }
  .pv-hero-meta { margin-left: 0; }
  .pv-titlebar { padding: 16px 20px; font-size: 18px; }
}
`;

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
const WorkerPaymentView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkerPayment = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/admin/worker-payment/${id}`, {
          withCredentials: true,
        });
        setPayment(response.data.payment || response.data);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'Worker payment not found'
            : err.response?.status === 401
            ? 'Session expired. Please log in again.'
            : 'Failed to load worker payment details'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchWorkerPayment();
  }, [id, setIsLoading]);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="pv-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#f44336', fontSize: '16px', fontWeight: 500 }}>{error}</p>
    </div>
  );
  if (!payment) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="pv-page">
        <div className="pv-wrap">

          {/* ── TITLE BAR ── */}
          <div className="pv-titlebar">
            <span>Worker Service Payment Details</span>
            <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.65, marginLeft: '10px' }}>#{payment._id}</span>
          </div>

          {/* ── HERO ── */}
          <div className="pv-hero">
            <div className="pv-hero-info">
              <div className="pv-hero-name">
                Worker Payment #{payment._id}
              </div>
              <div className="pv-hero-badges">
                <Badge value={payment.status} />
              </div>
            </div>

            {/* Quick meta */}
            <div className="pv-hero-meta">
              {[
                ['Amount', money(payment.amount)],
                ['Status', payment.status],
                ['Paid On', fmt(payment.paymentDate || payment.createdAt)],
                ['Method', payment.paymentMethod || '—'],
              ].map(([lbl, val]) => (
                <div key={lbl} className="pv-meta-item">
                  <div className="pv-meta-label">{lbl}</div>
                  <div className="pv-meta-val">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── STAT ROW ── */}
          <div style={{ padding: '22px 36px 0', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Stat label="Amount Paid" value={money(payment.amount)} />
            <Stat label="Status" value={payment.status} />
            <Stat label="Paid On" value={fmt(payment.paymentDate || payment.createdAt)} />
            <Stat label="Transaction ID" value={payment.transactionId || '—'} />
          </div>

          {/* ── DETAIL GRID ── */}
          <div className="pv-grid">

            {/* Payment Information */}
            <Group title="Payment Information">
              <Row label="Payment ID" value={payment._id} />
              <Row label="Amount" value={money(payment.amount)} />
              <Row label="Status" value={<Badge value={payment.status} />} />
              <Row label="Paid On" value={fmt(payment.paymentDate || payment.createdAt)} />
              <Row label="Payment Method" value={payment.paymentMethod || '—'} />
              <Row label="Transaction ID" value={payment.transactionId || '—'} />
              {payment.receiptUrl && (
                <Row label="Receipt" value={
                  <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ffc107', fontWeight: 600 }}>
                    View Receipt
                  </a>
                } />
              )}
            </Group>

            {/* Tenant (Paid By) */}
            <Group title="Tenant (Paid By)">
              {payment.tenantId?._id ? (
                <>
                  <Row label="Name" value={
                    <Link to={`/admin/user/${payment.tenantId._id}/tenant`}
                      style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                      {payment.userName || 'View Tenant'}
                    </Link>
                  } />
                </>
              ) : payment.userName ? (
                <Row label="Name" value={payment.userName} />
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic' }}>No tenant information</p>
              )}
            </Group>

            {/* Worker (Received By) */}
            <Group title="Worker (Received By)">
              {payment.workerId?._id ? (
                <>
                  <Row label="Name" value={
                    <Link to={`/admin/user/${payment.workerId._id}/worker`}
                      style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                      {payment.workerName || 'View Worker'}
                    </Link>
                  } />
                </>
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic' }}>No worker information</p>
              )}
            </Group>

            {/* Actions */}
            <Group title="Actions" fullWidth>
              <div className="pv-actions">
                <Link to="/admin/worker-payments" className="pv-btn">
                  ← Back to Worker Payments
                </Link>
              </div>
            </Group>

          </div>

        </div>
      </div>
    </>
  );
};

export default WorkerPaymentView;