// src/admin/BookingView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoading } from '../context/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchBookingDetails, fetchWorkerBookingDetails, approveBooking, rejectBooking, approveWorkerBooking, declineWorkerBooking } from '../services/api';

const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const money = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

const StatusBadge = ({ status }) => {
  const map = { Active:'badge-green', Pending:'badge-yellow', Terminated:'badge-red',
    Approved:'badge-green', Declined:'badge-red', Rejected:'badge-red', Completed:'badge-blue' };
  return <span className={`badge ${map[status]||'badge-gray'}`}>{status}</span>;
};
const Card = ({ title, accent='#ffc107', children }) => (
  <div className="uv-card">
    {title && <div className="uv-card-header"><span className="uv-card-accent" style={{background:accent}}/><h2 className="uv-card-title">{title}</h2></div>}
    {children}
  </div>
);
const Field = ({ label, value, mono }) => (
  <div className="uv-field">
    <span className="uv-field-label">{label}</span>
    <span className={`uv-field-value${mono?' mono':''}`}>{value??'—'}</span>
  </div>
);
const StatBox = ({ label, value }) => (
  <div className="uv-stat"><span className="uv-stat-value">{value??'—'}</span><span className="uv-stat-label">{label}</span></div>
);
const ULink = ({ to, children }) => <Link to={to} className="uv-link">{children}</Link>;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.uv-root{font-family:'Poppins',sans-serif;background:#f9f9f9;min-height:100vh;color:#333}
.uv-topbar{display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;background:#fff;border-bottom:1px solid #f0f0f0;position:sticky;top:0;z-index:100}
.uv-back{display:inline-flex;align-items:center;gap:.5rem;color:#555;text-decoration:none;font-size:.95rem;font-weight:500;transition:color .2s}
.uv-back:hover{color:#333}
.uv-topbar-actions{display:flex;gap:.75rem}
.uv-btn{padding:.5rem 1.25rem;border-radius:6px;font-family:'Poppins',sans-serif;font-size:.9rem;font-weight:600;cursor:pointer;border:none;transition:all .2s;background:#ffc107;color:#333;text-decoration:none;display:inline-flex;align-items:center}
.uv-btn:hover{background:#ffca2c;transform:translateY(-1px);box-shadow:0 4px 8px rgba(255,193,7,.3)}
.uv-btn-danger{background:#fff;color:#f44336;border:1px solid #f44336}
.uv-btn-danger:hover{background:#f44336;color:#fff;box-shadow:0 4px 8px rgba(244,67,54,.3);transform:translateY(-1px)}
.uv-btn-success{background:#4caf50;color:#fff;border:none}
.uv-btn-success:hover{background:#43a047;box-shadow:0 4px 8px rgba(76,175,80,.3)}
.uv-hero{display:flex;align-items:center;gap:2rem;padding:2rem;background:#fff;border-bottom:1px solid #f0f0f0;flex-wrap:wrap}
.uv-hero-avatar{width:82px;height:82px;border-radius:12px;background:#ffc107;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;border:3px solid #fff;box-shadow:0 3px 10px rgba(255,193,7,.45)}
.uv-avatar-icon{font-size:2.2rem}
.uv-hero-info{flex:1;min-width:200px}
.uv-hero-name-row{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;margin-bottom:.25rem}
.uv-hero-name{font-size:1.75rem;font-weight:700;color:#333;line-height:1.2}
.uv-type-chip{padding:.25rem .85rem;border-radius:5px;font-size:.75rem;font-weight:700;color:#333;background:#ffc107;letter-spacing:.5px;text-transform:uppercase}
.uv-hero-email{font-size:.95rem;color:#777;margin-bottom:.75rem}
.uv-hero-badges{display:flex;gap:.5rem;flex-wrap:wrap}
.uv-hero-meta{display:flex;gap:2rem;flex-wrap:wrap;margin-left:auto}
.uv-hero-meta-item{display:flex;flex-direction:column;gap:.2rem}
.uv-hero-meta-label{font-size:.78rem;color:#aaa;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.uv-hero-meta-val{font-size:.95rem;font-weight:600;color:#333}
.badge{display:inline-flex;align-items:center;padding:.3rem .8rem;border-radius:4px;font-size:.8rem;font-weight:600}
.badge-green{background:#e8f5e9;color:#2e7d32}
.badge-red{background:#ffebee;color:#c62828}
.badge-yellow{background:#fff8e1;color:#f57f17}
.badge-blue{background:#e3f2fd;color:#1565c0}
.badge-gray{background:#f5f5f5;color:#757575}
.uv-layout{display:grid;grid-template-columns:290px 1fr;gap:1.5rem;padding:1.5rem 2rem 3rem;max-width:1400px;margin:0 auto}
@media(max-width:900px){.uv-layout{grid-template-columns:1fr}.uv-hero-meta{margin-left:0}}
.uv-sidebar{display:flex;flex-direction:column;gap:1.25rem}
.uv-main{display:flex;flex-direction:column;gap:1.25rem}
.uv-card{background:#fff;border-radius:10px;border:1px solid #f0f0f0;box-shadow:0 2px 8px rgba(0,0,0,.04);overflow:hidden;transition:transform .2s,box-shadow .2s}
.uv-card:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(0,0,0,.08)}
.uv-card-header{display:flex;align-items:center;gap:.75rem;padding:1.1rem 1.5rem 1rem;border-bottom:1px solid #f5f5f5}
.uv-card-accent{width:4px;height:20px;border-radius:4px;background:#ffc107;flex-shrink:0}
.uv-card-title{font-size:1.05rem;font-weight:600;color:#555}
.uv-card>*:not(.uv-card-header){padding:1.25rem 1.5rem}
.uv-field-stack{display:flex;flex-direction:column;gap:.9rem}
.uv-field{display:flex;flex-direction:column;gap:.25rem}
.uv-field-label{font-size:.8rem;color:#aaa;font-weight:600;text-transform:uppercase;letter-spacing:.4px}
.uv-field-value{font-size:.95rem;color:#333;font-weight:500}
.uv-field-value.mono{font-family:monospace;font-size:.875rem}
.uv-grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1.25rem}
.uv-stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:1px;background:#f5f5f5;border-radius:0 0 8px 8px;overflow:hidden}
.uv-stat{background:#fff;padding:1.1rem 1.25rem;display:flex;flex-direction:column;gap:.3rem}
.uv-stat-value{font-size:1.4rem;font-weight:700;color:#ffc107;line-height:1}
.uv-stat-label{font-size:.82rem;color:#777;font-weight:500}
.uv-link{color:#ffc107;text-decoration:none;font-weight:600;transition:color .2s}
.uv-link:hover{color:#e5ac00;text-decoration:underline}
.uv-empty{color:#aaa;font-style:italic;text-align:center;padding:2rem 0;font-size:.9rem}
.uv-error{display:flex;align-items:center;justify-content:center;height:60vh;font-size:1rem;color:#f44336;font-weight:500}
.uv-quick-links{display:flex;flex-direction:column;gap:.4rem}
.uv-quick-link{color:#555;font-size:.9rem;text-decoration:none;padding:.5rem .75rem;border-radius:7px;display:block;transition:all .2s;font-weight:500}
.uv-quick-link:hover{background:#fff8e1;color:#333}
.uv-actions-bar{display:flex;gap:.75rem;flex-wrap:wrap}
@media(max-width:640px){.uv-hero{padding:1.25rem}.uv-layout{padding:1rem}}
`;

const BookingView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const isWorker = window.location.pathname.includes('worker-booking');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setIsLoading(true);
        const data = isWorker ? await fetchWorkerBookingDetails(id) : await fetchBookingDetails(id);
        setBooking(data);
      } catch { setError('Failed to load booking details.'); }
      finally { setLoading(false); setIsLoading(false); }
    };
    load();
  }, [id, isWorker, setIsLoading]);

  const handleApprove = async () => {
    if (!window.confirm(`Approve this ${isWorker?'service':'property'} booking?`)) return;
    try {
      setIsLoading(true);
      if (isWorker) await approveWorkerBooking(id); else await approveBooking(id);
      alert('Booking approved!'); window.location.reload();
    } catch { alert('Error approving booking.'); }
    finally { setIsLoading(false); }
  };

  const handleReject = async () => {
    if (!window.confirm(`Reject this ${isWorker?'service':'property'} booking?`)) return;
    try {
      setIsLoading(true);
      if (isWorker) await declineWorkerBooking(id); else await rejectBooking(id);
      alert('Booking rejected!'); window.location.reload();
    } catch { alert('Error rejecting booking.'); }
    finally { setIsLoading(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (error)   return <div className="uv-error">{error}</div>;
  if (!booking) return null;

  const tenant  = booking.tenant || booking.tenantId;
  const tenantId = tenant?._id;
  const property = booking.property;
  const worker   = booking.worker;
  const backPath = isWorker ? '/admin/service-bookings' : '/admin/bookings';
  const typeLabel = isWorker ? 'Service Booking' : 'Property Booking';

  return (
    <>
      <style>{CSS}</style>
      <div className="uv-root">

        {/* TOP BAR */}
        <div className="uv-topbar">
          <Link to={backPath} className="uv-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {isWorker ? 'Service Bookings' : 'Bookings'}
          </Link>
          {booking.status === 'Pending' && (
            <div className="uv-topbar-actions">
              <button className="uv-btn uv-btn-success" onClick={handleApprove}>Approve</button>
              <button className="uv-btn uv-btn-danger" onClick={handleReject}>
                {isWorker ? 'Decline' : 'Reject'}
              </button>
            </div>
          )}
        </div>

        {/* HERO */}
        <div className="uv-hero">
          <div className="uv-hero-avatar">
            <span className="uv-avatar-icon">{isWorker ? '🔧' : '📋'}</span>
          </div>
          <div className="uv-hero-info">
            <div className="uv-hero-name-row">
              <h1 className="uv-hero-name">
                {isWorker
                  ? (booking.serviceType || 'Service Booking')
                  : property?._id
                    ? <ULink to={`/admin/property/${property._id}`}>{property.name || 'Property Booking'}</ULink>
                    : (property?.name || 'Property Booking')}
              </h1>
              <span className="uv-type-chip">{typeLabel}</span>
            </div>
            <p className="uv-hero-email">
              {isWorker
                ? (tenant?._id
                    ? <>{<ULink to={`/admin/user/${tenant._id}/tenant`}>{tenant.firstName||''} {tenant.lastName||''}</ULink>}{(booking.tenantAddress||tenant?.location) ? ` · ${booking.tenantAddress||tenant.location}` : ''}</>
                    : (booking.tenantAddress || tenant?.location || '—'))
                : (property?.address || property?.location || '—')}
            </p>
            <div className="uv-hero-badges">
              <StatusBadge status={booking.status}/>
              {isWorker && booking.serviceType && <span className="badge badge-gray">{booking.serviceType}</span>}
            </div>
          </div>
          <div className="uv-hero-meta">
            {[
              ['Booking Date', fmt(booking.bookingDate || booking.createdAt)],
              ['Status', booking.status],
              ['Amount', booking.amount ? money(booking.amount) : (worker?.price ? money(worker.price) : '—')],
            ].map(([lbl,val]) => (
              <div key={lbl} className="uv-hero-meta-item">
                <span className="uv-hero-meta-label">{lbl}</span>
                <span className="uv-hero-meta-val">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LAYOUT */}
        <div className="uv-layout">

          {/* SIDEBAR */}
          <aside className="uv-sidebar">

            <Card title="Booking Summary">
              <div className="uv-field-stack">
                <Field label="Booking ID"    value={<span style={{fontFamily:'monospace',fontSize:'.8rem'}}>{booking._id||booking.id}</span>}/>
                <Field label="Status"        value={<StatusBadge status={booking.status}/>}/>
                <Field label="Booking Date"  value={fmt(booking.bookingDate || booking.createdAt)}/>
                {!isWorker && <>
                  <Field label="Start Date"  value={fmt(booking.startDate)}/>
                  <Field label="End Date"    value={fmt(booking.endDate)}/>
                  <Field label="Amount"      value={money(booking.amount)}/>
                </>}
                {isWorker && <Field label="Service Type" value={booking.serviceType||'—'}/>}
              </div>
            </Card>

            {/* Tenant */}
            <Card title="Tenant">
              {tenantId ? (
                <div className="uv-field-stack">
                  <Field label="Name"  value={<ULink to={`/admin/user/${tenantId}/tenant`}>{tenant.firstName||booking.tenantName} {tenant.lastName||''}</ULink>}/>
                  <Field label="Email" value={tenant.email||'—'}/>
                  <Field label="Phone" value={tenant.phone||'—'}/>
                  {tenant.location && <Field label="Location" value={tenant.location}/>}
                </div>
              ) : <p className="uv-empty">No tenant info available.</p>}
            </Card>

            {/* Actions if pending shown here too */}
            {booking.status === 'Pending' && (
              <Card title="Actions">
                <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
                  <button className="uv-btn uv-btn-success" onClick={handleApprove} style={{justifyContent:'center'}}>✓ Approve Booking</button>
                  <button className="uv-btn uv-btn-danger" onClick={handleReject} style={{justifyContent:'center'}}>✗ {isWorker?'Decline':'Reject'} Booking</button>
                </div>
              </Card>
            )}

            <Card title="Quick Links">
              <div className="uv-quick-links">
                <Link to={backPath} className="uv-quick-link">📋 Back to {isWorker?'Service ':''}Bookings</Link>
                <Link to="/admin" className="uv-quick-link">🏠 Dashboard</Link>
                <Link to="/admin/payments" className="uv-quick-link">💳 Payments</Link>
              </div>
            </Card>

          </aside>

          {/* MAIN */}
          <main className="uv-main">

            <Card title="Booking Overview">
              <div className="uv-stats-row">
                <StatBox label="Status"       value={booking.status}/>
                <StatBox label="Booking Date" value={fmt(booking.bookingDate||booking.createdAt)}/>
                {!isWorker && <StatBox label="Amount" value={money(booking.amount)}/>}
                {isWorker && <StatBox label="Service" value={booking.serviceType||'—'}/>}
              </div>
            </Card>

            {/* Property Info */}
            {!isWorker && (
              <Card title="Property Information">
                {property?._id ? (
                  <div className="uv-grid-3">
                    <Field label="Property" value={<ULink to={`/admin/property/${property._id}`}>{property.name||'View Property'}</ULink>}/>
                    <Field label="Location" value={property.location||'—'}/>
                    <Field label="Address"  value={property.address||'—'}/>
                    <Field label="Rent"     value={money(property.price)}/>
                  </div>
                ) : <p className="uv-empty">No property information available.</p>}
              </Card>
            )}

            {/* Worker Info (service booking) */}
            {isWorker && (
              <Card title="Worker Information">
                {worker?._id ? (
                  <div className="uv-grid-3">
                    <Field label="Worker"       value={<ULink to={`/admin/user/${worker._id}/worker`}>{worker.firstName} {worker.lastName}</ULink>}/>
                    <Field label="Service Type" value={worker.serviceType||'—'}/>
                    <Field label="Rate"         value={money(worker.price)}/>
                    <Field label="Phone"        value={worker.phone||'—'}/>
                    <Field label="Location"     value={worker.location||'—'}/>
                  </div>
                ) : <p className="uv-empty">No worker assigned yet.</p>}
              </Card>
            )}

            {/* Assigned property worker (only for property bookings) */}
            {!isWorker && booking.assignedWorker?._id && (
              <Card title="Assigned Worker">
                <div className="uv-grid-3">
                  <Field label="Name"         value={<ULink to={`/admin/user/${booking.assignedWorker._id}/worker`}>{booking.assignedWorker.firstName} {booking.assignedWorker.lastName}</ULink>}/>
                  <Field label="Service Type" value={booking.assignedWorker.serviceType||'—'}/>
                </div>
              </Card>
            )}

          </main>
        </div>
      </div>
    </>
  );
};

export default BookingView;

