// src/pages/admin/BookingView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  fetchBookingDetails, 
  fetchWorkerBookingDetails, 
  approveBooking, 
  rejectBooking,
  approveWorkerBooking,
  declineWorkerBooking 
} from '../services/api';

const money = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Badge ── */
const Badge = ({ value }) => {
  const map = {
    Active:     { background: '#e8f5e9', color: '#2e7d32' },
    Pending:    { background: '#fff8e1', color: '#f57f17' },
    Terminated: { background: '#ffebee', color: '#c62828' },
    Approved:   { background: '#e8f5e9', color: '#2e7d32' },
    Declined:   { background: '#ffebee', color: '#c62828' },
    Completed:  { background: '#e3f2fd', color: '#1565c0' },
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
  <div className="bv-detail-group" style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
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
   CSS AS CONST STRING (same style as UserView & PropertyView)
════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.bv-page {
  font-family: 'Poppins', sans-serif;
  background: #f9f9f9;
  min-height: 100vh;
  color: #333;
}

.bv-wrap {
  width: 100%;
  background: #fff;
  min-height: 100vh;
  overflow: hidden;
}

/* TITLE BAR */
.bv-titlebar {
  background: #ffc107;
  color: #333;
  padding: 22px 36px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* HERO */
.bv-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px 36px;
  background: #fffde7;
  border-bottom: 1px solid #ffe082;
  flex-wrap: wrap;
}

.bv-hero-info { flex: 1; min-width: 200px; }
.bv-hero-name { font-size: 22px; font-weight: 700; color: #333; margin-bottom: 4px; }
.bv-hero-loc  { font-size: 14px; color: #777; margin-bottom: 10px; }
.bv-hero-badges { display: flex; gap: 8px; flex-wrap: wrap; }

.bv-hero-meta { display: flex; gap: 32px; flex-wrap: wrap; margin-left: auto; }
.bv-meta-item { min-width: 110px; }
.bv-meta-label { font-size: 11px; color: #bbb; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.bv-meta-val   { font-size: 14px; font-weight: 600; color: #333; }

/* GRID */
.bv-grid {
  padding: 28px 36px 36px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 22px;
}

/* DETAIL GROUP */
.bv-detail-group {
  background: #fff;
  border-radius: 10px;
  padding: 22px 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  transition: transform 0.2s, box-shadow 0.2s;
}
.bv-detail-group:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.09);
}
.bv-detail-group h3 {
  font-size: 16px;
  font-weight: 600;
  color: #555;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ffc107;
}

/* BUTTONS */
.bv-btn {
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
.bv-btn:hover {
  background: #ffca2c;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(255,193,7,0.35);
}
.bv-btn-success {
  background: #28a745;
  color: white;
}
.bv-btn-success:hover {
  background: #218838;
}
.bv-btn-danger {
  background: #fff;
  color: #f44336;
  border: 1px solid #f44336;
}
.bv-btn-danger:hover {
  background: #f44336;
  color: #fff;
}

/* ACTIONS */
.bv-actions {
  padding: 22px 36px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #fafafa;
}

@media (max-width: 768px) {
  .bv-grid { grid-template-columns: 1fr; padding: 16px; }
  .bv-hero { padding: 16px 20px; }
  .bv-hero-meta { margin-left: 0; }
  .bv-titlebar { padding: 16px 20px; font-size: 18px; }
}
`;

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
const BookingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setIsLoading } = useLoading();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-detect type from URL
  const isWorkerBooking = window.location.pathname.includes('worker-booking');
  const bookingType = isWorkerBooking ? 'worker' : 'property';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        let data;
        if (bookingType === 'worker') {
          data = await fetchWorkerBookingDetails(id);
        } else {
          data = await fetchBookingDetails(id);
        }
        setBooking(data);
      } catch (err) {
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, bookingType, setIsLoading]);

  const handleApprove = async () => {
    try {
      setIsLoading(true);
      let result;
      if (bookingType === 'worker') {
        result = await approveWorkerBooking(id);
      } else {
        result = await approveBooking(id);
      }
      if (result.success || result.message) {
        alert(`${bookingType === 'worker' ? 'Service' : 'Property'} booking approved!`);
        window.location.reload();
      }
    } catch (err) {
      alert('Error approving booking.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading(true);
      let result;
      if (bookingType === 'worker') {
        result = await declineWorkerBooking(id);
      } else {
        result = await rejectBooking(id);
      }
      if (result.success || result.message) {
        alert(`${bookingType === 'worker' ? 'Service' : 'Property'} booking ${bookingType === 'worker' ? 'declined' : 'rejected'}!`);
        window.location.reload();
      }
    } catch (err) {
      alert('Error rejecting booking.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="bv-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#f44336', fontSize: '16px', fontWeight: 500 }}>{error}</p>
    </div>
  );
  if (!booking) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="bv-page">
        <div className="bv-wrap">

          {/* ── TITLE BAR ── */}
          <div className="bv-titlebar">
            <span>{bookingType === 'worker' ? 'Service' : 'Property'} Booking Details</span>
            <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.65, marginLeft: '10px' }}>#{booking._id}</span>
          </div>

          {/* ── HERO ── */}
          <div className="bv-hero">
            <div className="bv-hero-info">
              <div className="bv-hero-name">
                {bookingType === 'worker' 
                  ? `${booking.serviceType || 'Service'} Booking`
                  : booking.propertyName || 'Property Booking'}
              </div>
              <div className="bv-hero-loc">
                {bookingType === 'worker' 
                  ? booking.tenantAddress || booking.tenant?.location || '—'
                  : booking.property?.address || booking.property?.location || '—'}
              </div>
              <div className="bv-hero-badges">
                <Badge value={booking.status} />
                {bookingType === 'worker' && booking.serviceType && (
                  <span style={{ background: '#f5f5f5', color: '#555', padding: '3px 10px', borderRadius: '4px', fontSize: '13px' }}>
                    {booking.serviceType}
                  </span>
                )}
              </div>
            </div>

            {/* Quick meta */}
            <div className="bv-hero-meta">
              {[
                ['Booking Date',  fmt(booking.bookingDate || booking.createdAt)],
                ['Status',        booking.status],
                ['Amount',        booking.amount ? money(booking.amount) : '—'],
              ].map(([lbl, val]) => (
                <div key={lbl} className="bv-meta-item">
                  <div className="bv-meta-label">{lbl}</div>
                  <div className="bv-meta-val">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── STAT ROW ── */}
          <div style={{ padding: '22px 36px 0', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Stat label="Status" value={booking.status} />
            {bookingType === 'property' && <Stat label="Rent Amount" value={money(booking.amount)} />}
            {bookingType === 'worker' && <Stat label="Service Type" value={booking.serviceType} />}
            <Stat label="Booking Date" value={fmt(booking.bookingDate || booking.createdAt)} />
          </div>

          {/* ── DETAIL GRID ── */}
          <div className="bv-grid">

            {/* Booking Info */}
            <Group title="Booking Information">
              <Row label="Booking ID" value={booking._id} />
              <Row label="Status" value={<Badge value={booking.status} />} />
              <Row label="Booking Date" value={fmt(booking.bookingDate || booking.createdAt)} />
              {bookingType === 'property' && (
                <>
                  <Row label="Start Date" value={fmt(booking.startDate)} />
                  <Row label="End Date" value={fmt(booking.endDate)} />
                  <Row label="Amount" value={money(booking.amount)} />
                </>
              )}
              {bookingType === 'worker' && (
                <Row label="Service Type" value={booking.serviceType} />
              )}
            </Group>

            {/* Tenant Info */}
            <Group title="Tenant Information">
              {booking.tenant?._id || booking.tenantId?._id ? (
                <>
                  <Row label="Name" value={
                    <Link to={`/admin/user/${booking.tenant?._id || booking.tenantId?._id}/tenant`}
                      style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                      {booking.tenant?.firstName || booking.tenantName} {booking.tenant?.lastName}
                    </Link>
                  } />
                  <Row label="Email" value={booking.tenant?.email} />
                  <Row label="Phone" value={booking.tenant?.phone} />
                  <Row label="Location" value={booking.tenant?.location || booking.tenantAddress || '—'} />
                </>
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic' }}>No tenant info available</p>
              )}
            </Group>

            {/* Property / Worker Info */}
            {bookingType === 'property' ? (
              <Group title="Property Information">
                <Row label="Name" value={
                  <Link to={`/admin/property/${booking.property?._id || booking.propertyId}`}
                    style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                    {booking.property?.name || booking.propertyName}
                  </Link>
                } />
                <Row label="Location" value={booking.property?.location} />
                <Row label="Address" value={booking.property?.address} />
                <Row label="Price" value={money(booking.property?.price)} />
              </Group>
            ) : (
              <Group title="Worker Information">
                {booking.worker?._id ? (
                  <>
                    <Row label="Name" value={
                      <Link to={`/admin/user/${booking.worker._id}/worker`}
                        style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}>
                        {booking.worker.firstName} {booking.worker.lastName}
                      </Link>
                    } />
                    <Row label="Service Type" value={booking.worker.serviceType} />
                    <Row label="Price" value={money(booking.worker.price)} />
                    <Row label="Phone" value={booking.worker.phone} />
                    <Row label="Location" value={booking.worker.location || '—'} />
                  </>
                ) : (
                  <p style={{ color: '#aaa', fontStyle: 'italic' }}>No worker assigned</p>
                )}
              </Group>
            )}

            {/* Actions */}
            <Group title="Actions" fullWidth>
              <div className="bv-actions">
                {booking.status === 'Pending' && (
                  <>
                    <button className="bv-btn bv-btn-success" onClick={handleApprove}>
                      Approve
                    </button>
                    <button className="bv-btn bv-btn-danger" onClick={handleReject}>
                      {bookingType === 'worker' ? 'Decline' : 'Reject'}
                    </button>
                  </>
                )}
                <Link to={bookingType === 'worker' ? '/admin/service-bookings' : '/admin/bookings'} className="bv-btn">
                  ← Back to List
                </Link>
              </div>
            </Group>

          </div>

        </div>
      </div>
    </>
  );
};

export default BookingView;