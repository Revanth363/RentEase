// src/pages/admin/UserView.jsx
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';

const API_URL = '/api';

/* ─── tiny helpers ─────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';
const money = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

/* ─── sub-components ───────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    Active: 'badge-green', Suspended: 'badge-red',
    approved: 'badge-green', pending: 'badge-yellow', rejected: 'badge-red',
    Available: 'badge-green', Booked: 'badge-blue', Offline: 'badge-gray',
    Paid: 'badge-green', Overdue: 'badge-red', Failed: 'badge-red', Pending: 'badge-yellow',
  };
  return (
    <span className={`badge ${map[status] || 'badge-gray'}`}>
      {status}
    </span>
  );
};

const Card = ({ title, accent, children, className = '' }) => (
  <div className={`uv-card ${className}`}>
    {title && (
      <div className="uv-card-header">
        <span className="uv-card-accent" style={accent ? { background: accent } : {}} />
        <h2 className="uv-card-title">{title}</h2>
      </div>
    )}
    {children}
  </div>
);

const Field = ({ label, value, mono }) => (
  <div className="uv-field">
    <span className="uv-field-label">{label}</span>
    <span className={`uv-field-value ${mono ? 'mono' : ''}`}>{value ?? '—'}</span>
  </div>
);

const StatBox = ({ label, value, sub }) => (
  <div className="uv-stat">
    <span className="uv-stat-value">{value ?? '—'}</span>
    <span className="uv-stat-label">{label}</span>
    {sub && <span className="uv-stat-sub">{sub}</span>}
  </div>
);

const SectionLink = ({ to, children }) => (
  <Link to={to} className="uv-link">{children}</Link>
);

const PayTable = ({ payments, getLabel, getSub, getLink }) => (
  payments.length === 0 ? (
    <p className="uv-empty">No payment records found.</p>
  ) : (
    <div className="uv-pay-list">
      {payments.map((p) => (
        <div key={p._id} className="uv-pay-item">
          <div className="uv-pay-left">
            <span className="uv-pay-title">{getLabel(p)}</span>
            <span className="uv-pay-sub">{getSub ? getSub(p) : fmt(p.paymentDate)}</span>
          </div>
          <div className="uv-pay-right">
            <span className="uv-pay-amount">{money(p.amount)}</span>
            <StatusBadge status={p.status} />
            {getLink && getLink(p) && (
              <Link to={getLink(p)} className="uv-pay-view">View</Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
);

/* ─── USER TYPE PANELS ─────────────────────────────────────── */

const TenantPanel = ({ user, tenantProperty, rentPayments = [], workerPmts = [] }) => (
  <>
    {/* Core Stats */}
    <Card title="Overview" accent="#ffc107">
      <div className="uv-stats-row">
        <StatBox label="Complaints Filed" value={user.complaintsCount ?? user.complaintIds?.length ?? 0} />
        <StatBox label="Maintenance Requests" value={user.maintenanceCount ?? user.maintenanceRequestIds?.length ?? 0} />
        <StatBox label="Saved Listings" value={user.savedListings?.length ?? 0} />
        <StatBox label="Rental History" value={user.rentalHistoryIds?.length ?? 0} />
        <StatBox label="Workers Booked" value={user.domesticWorkerId?.length ?? 0} />
      </div>
    </Card>

    {/* Payment Summary */}
    <Card title="Payment Summary" accent="#ffc107">
      <div className="uv-grid-3">
        <Field label="Total Paid" value={money(user.totalPaid)} />
        <Field label="Last Payment Date" value={fmt(user.lastPaymentDate)} />
        <Field label="Outstanding Dues" value={money(user.outstandingDues)} />
        <Field label="Payment Status" value={user.paymentStatus ? <StatusBadge status={user.paymentStatus} /> : '—'} />
        <Field label="Lease Start" value={fmt(user.leaseStart)} />
        <Field label="Lease End" value={fmt(user.leaseEnd)} />
      </div>
    </Card>

    {/* Current Rental */}
    <Card title="Current Rental" accent="#ffc107">
      {tenantProperty ? (
        <div className="uv-relation-block">
          <div className="uv-relation-primary">
            <SectionLink to={`/admin/property/${tenantProperty._id}`}>
              {tenantProperty.name}
            </SectionLink>
            <span className="uv-relation-tag">{tenantProperty.location}</span>
          </div>
          <div className="uv-grid-3">
            <Field label="Monthly Rent" value={money(tenantProperty.price)} />
            <Field label="Property Type" value={tenantProperty.type || '—'} />
            {tenantProperty.owner && (
              <Field
                label="Owner"
                value={
                  <SectionLink to={`/admin/user/${tenantProperty.owner._id}/owner`}>
                    {tenantProperty.owner.firstName} {tenantProperty.owner.lastName}
                  </SectionLink>
                }
              />
            )}
          </div>
        </div>
      ) : (
        <p className="uv-empty">No active rental property.</p>
      )}
    </Card>

    {/* Workers Booked */}
    {user.bookedWorkers?.length > 0 && (
      <Card title="Domestic Workers" accent="#ffc107">
        <div className="uv-list">
          {user.bookedWorkers.map((w) => (
            <div key={w._id} className="uv-list-item">
              <div className="uv-list-left">
                <span className="uv-list-name">
                  <SectionLink to={`/admin/user/${w._id}/worker`}>
                    {w.firstName} {w.lastName}
                  </SectionLink>
                </span>
                <span className="uv-list-sub">{w.serviceType}</span>
              </div>
              <StatusBadge status={w.serviceStatus || 'Available'} />
            </div>
          ))}
        </div>
      </Card>
    )}

    {/* Notification Preferences */}
    <Card title="Notification Preferences" accent="#ffc107">
      <div className="uv-prefs">
        {[
          ['Email Notifications', user.emailNotifications],
          ['SMS Notifications', user.smsNotifications],
          ['Rent Reminders', user.rentReminders],
          ['Maintenance Updates', user.maintenanceUpdates],
          ['New Listings', user.newListings],
        ].map(([label, val]) => (
          <div key={label} className="uv-pref-item">
            <span className={`uv-pref-dot ${val ? 'on' : 'off'}`} />
            <span>{label}</span>
            <span className="uv-pref-val">{val ? 'On' : 'Off'}</span>
          </div>
        ))}
      </div>
    </Card>

    {/* Rent Payments to Owner */}
    <Card title={`Rent Payments (${rentPayments.length})`} accent="#ffc107">
      <PayTable
        payments={rentPayments}
        getLabel={(p) => p.propertyName || '—'}
        getSub={(p) => fmt(p.paymentDate)}
        getLink={(p) => `/admin/payment/${p._id}`}
      />
    </Card>

    {workerPmts.length > 0 && (
      <Card title={`Worker Payments (${workerPmts.length})`} accent="#ffc107">
        <PayTable
          payments={workerPmts}
          getLabel={(p) => p.workerName || '—'}
          getSub={(p) => `${p.serviceType} · ${fmt(p.paymentDate)}`}
          getLink={(p) => p.workerId ? `/admin/user/${p.workerId}/worker` : null}
        />
      </Card>
    )}
  </>
);

const OwnerPanel = ({ user, ownerProperties, ownerPayments = [] }) => (
  <>
    {/* Stats */}
    <Card title="Overview" accent="#ffc107">
      <div className="uv-stats-row">
        <StatBox label="Properties Owned" value={ownerProperties.length} />
        <StatBox label="Active Tenants" value={user.tenantIds?.length ?? 0} />
        <StatBox label="Complaints" value={user.complaintsCount ?? user.complaintIds?.length ?? 0} />
        <StatBox label="Maintenance Reqs" value={user.maintenanceCount ?? user.maintenanceRequestIds?.length ?? 0} />
        <StatBox label="Rental Agreements" value={user.rentalAgreementIds?.length ?? 0} />
      </div>
    </Card>

    {/* Payment Summary */}
    <Card title="Revenue Summary" accent="#ffc107">
      <div className="uv-grid-3">
        <Field label="Total Revenue Received" value={money(user.totalRevenue)} />
        <Field label="Last Payment Received" value={fmt(user.lastPaymentDate)} />
        <Field label="Pending Payments" value={money(user.pendingPayments)} />
        <Field label="Account Number" value={user.accountNo ? `••••${user.accountNo.slice(-4)}` : '—'} mono />
        <Field label="UPI ID" value={user.upiid ? `${user.upiid.slice(0, 4)}••••` : '—'} mono />
      </div>
    </Card>

    {/* Properties List */}
    <Card title={`Properties (${ownerProperties.length})`} accent="#ffc107">
      {ownerProperties.length > 0 ? (
        <div className="uv-list">
          {ownerProperties.map((prop) => (
            <div key={prop._id} className="uv-list-item uv-list-item--block">
              <div className="uv-list-left">
                <span className="uv-list-name">
                  <SectionLink to={`/admin/property/${prop._id}`}>{prop.name}</SectionLink>
                </span>
                <span className="uv-list-sub">{prop.location} · {money(prop.price)}/month</span>
              </div>
              <div className="uv-list-right">
                {prop.tenant ? (
                  <div className="uv-tenant-chip">
                    <span className="dot-green" />
                    <SectionLink to={`/admin/user/${prop.tenant._id}/tenant`}>
                      {prop.tenant.firstName} {prop.tenant.lastName}
                    </SectionLink>
                  </div>
                ) : (
                  <span className="uv-vacant">Vacant</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="uv-empty">No properties listed yet.</p>
      )}
    </Card>

    {/* Notification Preferences */}
    <Card title="Notification Preferences" accent="#ffc107">
      <div className="uv-prefs">
        {[
          ['Email', user.notifications?.email],
          ['SMS', user.notifications?.sms],
          ['Payment Alerts', user.notifications?.payment],
          ['Complaint Alerts', user.notifications?.complaint],
          ['Maintenance Alerts', user.notifications?.maintenance],
        ].map(([label, val]) => (
          <div key={label} className="uv-pref-item">
            <span className={`uv-pref-dot ${val ? 'on' : 'off'}`} />
            <span>{label}</span>
            <span className="uv-pref-val">{val ? 'On' : 'Off'}</span>
          </div>
        ))}
      </div>
    </Card>

    {/* Payment History by Property */}
    <Card title={`Payment History (${ownerPayments.length})`} accent="#ffc107">
      <PayTable
        payments={ownerPayments}
        getLabel={(p) => p.propertyName || '—'}
        getSub={(p) => `${p.tenantName} · ${fmt(p.paymentDate)}`}
        getLink={(p) => `/admin/payment/${p._id}`}
      />
    </Card>
  </>
);

const WorkerPanel = ({ user, workerBookings, receivedPayments = [] }) => (
  <>
    {/* Stats */}
    <Card title="Overview" accent="#ffc107">
      <div className="uv-stats-row">
        <StatBox label="Total Bookings" value={user.bookingIds?.length ?? 0} />
        <StatBox label="Clients Served" value={user.clientIds?.length ?? 0} />
        <StatBox label="Active Now" value={workerBookings.length} />
        <StatBox label="Rating" value={user.avgRating ? `${user.avgRating}/5` : '—'} sub={user.ratingCount ? `${user.ratingCount} reviews` : ''} />
        <StatBox label="Complaints" value={user.complaintsCount ?? 0} />
      </div>
    </Card>

    {/* Service Details */}
    <Card title="Service Details" accent="#ffc107">
      <div className="uv-grid-3">
        <Field label="Service Type" value={user.serviceType} />
        <Field label="Experience" value={user.experience ? `${user.experience} years` : '—'} />
        <Field label="Rate" value={user.price ? `${money(user.price)} / ${user.rateUnit || 'unit'}` : '—'} />
        <Field label="Availability" value={user.availability || '—'} />
        <Field label="Service Area" value={user.area || user.location || '—'} />
        <Field label="Booking Status" value={<StatusBadge status={user.isBooked ? 'Booked' : 'Available'} />} />
        <Field label="Service Status" value={<StatusBadge status={user.serviceStatus || 'Available'} />} />
      </div>
      {user.description && (
        <div className="uv-bio">
          <span className="uv-field-label">Bio / Description</span>
          <p className="uv-bio-text">{user.description}</p>
        </div>
      )}
    </Card>

    {/* Active Clients */}
    <Card title={`Active Clients (${workerBookings.length})`} accent="#ffc107">
      {workerBookings.length > 0 ? (
        <div className="uv-list">
          {workerBookings.map((booking) => (
            <div key={booking._id} className="uv-list-item uv-list-item--block">
              <div className="uv-list-left">
                <span className="uv-list-name">
                  <SectionLink to={`/admin/user/${booking.tenant._id}/tenant`}>
                    {booking.tenant.firstName} {booking.tenant.lastName}
                  </SectionLink>
                </span>
                {booking.property && (
                  <span className="uv-list-sub">
                    {booking.property.name} · {booking.property.location}
                  </span>
                )}
              </div>
              <span className="badge badge-blue">Active</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="uv-empty">No active bookings.</p>
      )}
    </Card>

    {/* Payments Received */}
    <Card title={`Payments Received (${receivedPayments.length})`} accent="#ffc107">
      <PayTable
        payments={receivedPayments}
        getLabel={(p) => p.tenantName || '—'}
        getSub={(p) => `${user.serviceType || 'Service'} · ${fmt(p.paymentDate)}`}
        getLink={(p) => `/admin/payment/${p._id}`}
      />
    </Card>
  </>
);

/* ─── MAIN COMPONENT ───────────────────────────────────────── */
const UserView = () => {
  const { id, userType } = useParams();
  const { setIsLoading } = useLoading();
  const [user, setUser]                 = useState(null);
  const [tenantProperty, setTenantProperty]           = useState(null);
  const [ownerProperties, setOwnerProperties]         = useState([]);
  const [workerBookings, setWorkerBookings]            = useState([]);
  const [ownerPayments, setOwnerPayments]              = useState([]);
  const [tenantRentPayments, setTenantRentPayments]    = useState([]);
  const [tenantWorkerPayments, setTenantWorkerPayments] = useState([]);
  const [workerReceivedPayments, setWorkerReceivedPayments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const res  = await axios.get(`${API_URL}/admin/user/${id}/${userType}`, { withCredentials: true });
        const data = res.data;
        setUser(data);
        setTenantProperty(data.tenantProperty || null);
        setOwnerProperties(data.ownerProperties || []);
        setWorkerBookings(data.workerBookings || []);
        setOwnerPayments(data.ownerPayments || []);
        setTenantRentPayments(data.tenantRentPayments || []);
        setTenantWorkerPayments(data.tenantWorkerPayments || []);
        setWorkerReceivedPayments(data.workerPayments || []);
      } catch (err) {
        setError(
          err.response?.status === 404 ? 'User not found.'
          : err.response?.status === 401 ? 'Session expired. Please log in again.'
          : 'Failed to load user details.'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id, userType, setIsLoading]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <div className="uv-error">{error}</div>;
  if (!user)   return null;

  const isTenant = userType === 'tenant';
  const isOwner  = userType === 'owner';
  const isWorker = userType === 'worker';

  const typeLabel = userType.charAt(0).toUpperCase() + userType.slice(1);

  const typeAccent = "#ffc107";

  return (
    <>
      <style>{CSS}</style>
      <div className="uv-root">

        {/* ── TOP BAR ── */}
        <div className="uv-topbar">
          <Link to="/admin/user-management" className="uv-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Dashboard
          </Link>
          <div className="uv-topbar-actions">
            <button className="uv-btn uv-btn-danger">Suspend Account</button>
          </div>
        </div>

        {/* ── HERO HEADER ── */}
        <div className="uv-hero" style={{ '--accent': typeAccent }}>
          <div className="uv-hero-avatar">
            {user.image?.url
              ? <img src={user.image.url} alt="avatar" className="uv-avatar-img" />
              : <span className="uv-avatar-initials">{user.firstName?.[0]}{user.lastName?.[0]}</span>
            }
          </div>
          <div className="uv-hero-info">
            <div className="uv-hero-name-row">
              <h1 className="uv-hero-name">{user.firstName} {user.lastName}</h1>
              <span className="uv-type-chip" style={{ background: typeAccent }}>{typeLabel}</span>
            </div>
            <p className="uv-hero-email">{user.email}</p>
            <div className="uv-hero-badges">
              <StatusBadge status={user.status || 'Active'} />
              {user.verificationStatus && <StatusBadge status={user.verificationStatus} />}
              {isWorker && <StatusBadge status={user.serviceStatus || 'Available'} />}
            </div>
          </div>
          <div className="uv-hero-meta">
            <div className="uv-hero-meta-item">
              <span className="uv-hero-meta-label">Registered</span>
              <span className="uv-hero-meta-val">{fmt(user.createdAt)}</span>
            </div>
            <div className="uv-hero-meta-item">
              <span className="uv-hero-meta-label">Last Login</span>
              <span className="uv-hero-meta-val">{fmtDT(user.lastLogin)}</span>
            </div>
            <div className="uv-hero-meta-item">
              <span className="uv-hero-meta-label">User ID</span>
              <span className="uv-hero-meta-val mono">{user._id}</span>
            </div>
          </div>
        </div>

        {/* ── LAYOUT ── */}
        <div className="uv-layout">

          {/* LEFT SIDEBAR – always-visible basic info */}
          <aside className="uv-sidebar">
            <Card title="Contact Info" accent={typeAccent}>
              <div className="uv-field-stack">
                <Field label="Phone" value={user.phone} />
                <Field label="Location" value={user.location} />
                {isWorker && <Field label="Service Area" value={user.area || '—'} />}
              </div>
            </Card>

            {/* Verification docs */}
            <Card title="Verification" accent={typeAccent}>
              <div className="uv-field-stack">
                <Field label="KYC Status" value={<StatusBadge status={user.verificationStatus || 'pending'} />} />
                {user.documents?.length > 0 && (
                  <div className="uv-doc-list">
                    {user.documents.map((doc) => (
                      <a key={doc._id || doc.url} href={doc.url} target="_blank" rel="noreferrer" className="uv-doc-link">
                        📄 {doc.type || 'Document'}
                      </a>
                    ))}
                  </div>
                )}
                {(!user.documents || user.documents.length === 0) && (
                  <p className="uv-empty" style={{ padding: '0.5rem 0' }}>No documents uploaded.</p>
                )}
              </div>
            </Card>

            {/* Flags / warnings */}
            {user.flags?.length > 0 && (
              <Card title="⚠️ Flags / Warnings" accent="#ef4444">
                <div className="uv-flags">
                  {user.flags.map((f, i) => (
                    <div key={i} className="uv-flag-item">
                      <span className="uv-flag-reason">{f.reason}</span>
                      <span className="uv-flag-date">{fmt(f.date)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick links */}
            <Card title="Quick Links" accent={typeAccent}>
              <div className="uv-quick-links">
                <Link to={`/admin/complaints?userId=${user._id}`} className="uv-quick-link">
                  🚨 View Complaints
                </Link>
                <Link to={`/admin/maintenance?userId=${user._id}`} className="uv-quick-link">
                  🔧 Maintenance Requests
                </Link>
                <Link to={`/admin/payments?userId=${user._id}`} className="uv-quick-link">
                  💳 Payment History
                </Link>
                {(isOwner || isTenant) && (
                  <Link to={`/admin/agreements?userId=${user._id}`} className="uv-quick-link">
                    📋 Rental Agreements
                  </Link>
                )}
              </div>
            </Card>
          </aside>

          {/* MAIN CONTENT – type-specific */}
          <main className="uv-main">
            {isTenant && <TenantPanel user={user} tenantProperty={tenantProperty} rentPayments={tenantRentPayments} workerPmts={tenantWorkerPayments} />}
            {isOwner  && <OwnerPanel  user={user} ownerProperties={ownerProperties} ownerPayments={ownerPayments} />}
            {isWorker && <WorkerPanel user={user} workerBookings={workerBookings} receivedPayments={workerReceivedPayments} />}
          </main>
        </div>
      </div>
    </>
  );
};

/* ─── PASTE THIS AS THE CSS CONST IN YOUR UserView.jsx ─── */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.uv-root {
  font-family: 'Poppins', sans-serif;
  background: #f9f9f9;
  min-height: 100vh;
  color: #333;
}

/* TOP BAR */
.uv-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}
.uv-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #555;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s;
}
.uv-back:hover { color: #333; }
.uv-topbar-actions { display: flex; gap: 0.75rem; }
.uv-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.uv-btn-danger {
  background: #fff;
  color: #f44336;
  border: 1px solid #f44336;
}
.uv-btn-danger:hover {
  background: #f44336;
  color: #fff;
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
}

/* HERO */
.uv-hero {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem 2rem 1.75rem;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
}
.uv-hero-avatar {
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: #ffc107;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border: 3px solid #fff;
  box-shadow: 0 3px 10px rgba(255, 193, 7, 0.45);
}
.uv-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.uv-avatar-initials { color: #333; font-size: 1.6rem; font-weight: 700; letter-spacing: 1px; }

.uv-hero-info { flex: 1; min-width: 200px; }
.uv-hero-name-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.25rem; }
.uv-hero-name { font-size: 1.75rem; font-weight: 700; color: #333; line-height: 1.2; }
.uv-type-chip {
  padding: 0.25rem 0.85rem;
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #333;
  background: #ffc107;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.uv-hero-email { font-size: 0.95rem; color: #777; margin-bottom: 0.75rem; }
.uv-hero-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.uv-hero-meta { display: flex; gap: 2rem; flex-wrap: wrap; margin-left: auto; }
.uv-hero-meta-item { display: flex; flex-direction: column; gap: 0.2rem; }
.uv-hero-meta-label { font-size: 0.78rem; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.uv-hero-meta-val { font-size: 0.95rem; font-weight: 600; color: #333; }

/* BADGES */
.badge { display: inline-flex; align-items: center; padding: 0.3rem 0.8rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
.badge-green  { background: #e8f5e9; color: #2e7d32; }
.badge-red    { background: #ffebee; color: #c62828; }
.badge-yellow { background: #fff8e1; color: #f57f17; }
.badge-blue   { background: #e3f2fd; color: #1565c0; }
.badge-gray   { background: #f5f5f5; color: #757575; }

/* LAYOUT */
.uv-layout {
  display: grid;
  grid-template-columns: 290px 1fr;
  gap: 1.5rem;
  padding: 1.5rem 2rem 3rem;
  max-width: 1400px;
  margin: 0 auto;
}
@media (max-width: 900px) {
  .uv-layout { grid-template-columns: 1fr; }
  .uv-hero-meta { margin-left: 0; }
}

/* SIDEBAR */
.uv-sidebar { display: flex; flex-direction: column; gap: 1.25rem; }

/* MAIN */
.uv-main { display: flex; flex-direction: column; gap: 1.25rem; }

/* CARD */
.uv-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.uv-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}
.uv-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.1rem 1.5rem 1rem;
  border-bottom: 1px solid #f5f5f5;
}
.uv-card-accent {
  width: 4px;
  height: 20px;
  border-radius: 4px;
  background: #ffc107;
  flex-shrink: 0;
}
.uv-card-title { font-size: 1.05rem; font-weight: 600; color: #555; }
.uv-card > *:not(.uv-card-header) { padding: 1.25rem 1.5rem; }
.uv-card > .uv-card-header + * { padding-top: 1.25rem; }

/* FIELDS */
.uv-field-stack { display: flex; flex-direction: column; gap: 0.9rem; }
.uv-field { display: flex; flex-direction: column; gap: 0.25rem; }
.uv-field-label { font-size: 0.8rem; color: #aaa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
.uv-field-value { font-size: 0.95rem; color: #333; font-weight: 500; }
.uv-field-value.mono { font-family: monospace; font-size: 0.875rem; }

/* INFO GRID */
.uv-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.25rem;
}

/* STATS */
.uv-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1px;
  background: #f5f5f5;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}
.uv-stat {
  background: #fff;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.uv-stat-value { font-size: 1.75rem; font-weight: 700; color: #ffc107; line-height: 1; }
.uv-stat-label { font-size: 0.85rem; color: #777; font-weight: 500; }
.uv-stat-sub   { font-size: 0.78rem; color: #aaa; }

/* RELATION BLOCK */
.uv-relation-primary { margin-bottom: 1rem; }
.uv-relation-primary .uv-link { font-size: 1.1rem; font-weight: 700; }
.uv-relation-tag { display: inline-block; margin-left: 0.5rem; font-size: 0.82rem; color: #777; }

/* LIST */
.uv-list { display: flex; flex-direction: column; gap: 1px; background: #f5f5f5; border-radius: 8px; overflow: hidden; }
.uv-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.1rem;
  background: #fff;
}
.uv-list-item--block { align-items: flex-start; }
.uv-list-left { display: flex; flex-direction: column; gap: 0.2rem; }
.uv-list-right { flex-shrink: 0; }
.uv-list-name { font-size: 0.95rem; font-weight: 600; color: #333; }
.uv-list-sub  { font-size: 0.82rem; color: #777; }

.uv-tenant-chip { display: flex; align-items: center; gap: 0.4rem; }
.dot-green { width: 8px; height: 8px; border-radius: 50%; background: #4caf50; flex-shrink: 0; }
.uv-vacant { font-size: 0.82rem; color: #aaa; font-style: italic; }

/* LINK */
.uv-link { color: #ffc107; text-decoration: none; font-weight: 600; transition: color 0.2s; }
.uv-link:hover { color: #e5ac00; text-decoration: underline; }

/* PREFS */
.uv-prefs { display: flex; flex-direction: column; gap: 0.65rem; }
.uv-pref-item { display: flex; align-items: center; gap: 0.65rem; font-size: 0.9rem; color: #333; }
.uv-pref-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.uv-pref-dot.on  { background: #4caf50; }
.uv-pref-dot.off { background: #e0e0e0; }
.uv-pref-val { margin-left: auto; font-size: 0.8rem; color: #777; font-weight: 600; }

/* BIO */
.uv-bio { margin-top: 1rem; border-top: 1px solid #f5f5f5; padding-top: 1rem; }
.uv-bio-text { font-size: 0.9rem; color: #555; line-height: 1.65; margin-top: 0.35rem; }

/* DOCS */
.uv-doc-list { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; }
.uv-doc-link { color: #ffc107; font-size: 0.88rem; text-decoration: none; padding: 0.4rem 0.75rem; background: #fff8e1; border-radius: 6px; display: block; transition: background 0.2s; }
.uv-doc-link:hover { background: #ffecb3; }

/* QUICK LINKS */
.uv-quick-links { display: flex; flex-direction: column; gap: 0.4rem; }
.uv-quick-link { color: #555; font-size: 0.9rem; text-decoration: none; padding: 0.5rem 0.75rem; border-radius: 7px; display: block; transition: all 0.2s; font-weight: 500; }
.uv-quick-link:hover { background: #fff8e1; color: #333; }

/* FLAGS */
.uv-flags { display: flex; flex-direction: column; gap: 0.5rem; }
.uv-flag-item { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.6rem 0.75rem; background: #fff5f5; border-left: 3px solid #f44336; border-radius: 4px; }
.uv-flag-reason { font-size: 0.88rem; font-weight: 500; color: #c62828; }
.uv-flag-date   { font-size: 0.78rem; color: #aaa; }

/* EMPTY / ERROR */
.uv-empty { color: #aaa; font-style: italic; text-align: center; padding: 2rem 0; font-size: 0.9rem; }
.uv-error { display: flex; align-items: center; justify-content: center; height: 60vh; font-size: 1rem; color: #f44336; font-weight: 500; }

/* PAYMENT TABLE */
.uv-pay-list { display:flex; flex-direction:column; gap:1px; background:#f5f5f5; border-radius:8px; overflow:hidden; }
.uv-pay-item { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.9rem 1.1rem; background:#fff; flex-wrap:wrap; }
.uv-pay-left { display:flex; flex-direction:column; gap:.2rem; min-width:0; flex:1; }
.uv-pay-title { font-size:.95rem; font-weight:600; color:#333; }
.uv-pay-sub { font-size:.82rem; color:#777; }
.uv-pay-right { display:flex; align-items:center; gap:.6rem; flex-shrink:0; }
.uv-pay-amount { font-size:1rem; font-weight:700; color:#333; }
.uv-pay-view { font-size:.78rem; color:#ffc107; text-decoration:none; font-weight:600; padding:.2rem .55rem; border:1px solid #ffc107; border-radius:4px; transition:all .2s; }
.uv-pay-view:hover { background:#ffc107; color:#333; }

@media (max-width: 640px) {
  .uv-hero { padding: 1.25rem; }
  .uv-layout { padding: 1rem; }
  .uv-stats-row { grid-template-columns: repeat(2, 1fr); }
}
`;

export default UserView;