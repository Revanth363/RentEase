// src/admin/NotificationView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoading } from '../context/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import { completeTask } from '../services/api';
import axios from '../services/axiosConfig';
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const StatusBadge = ({ status }) => {
  const map = { Pending:'badge-yellow', Completed:'badge-green', Approved:'badge-green',
    Rejected:'badge-red', Info:'badge-blue' };
  return <span className={`badge ${map[status]||'badge-gray'}`}>{status}</span>;
};
const PriorityBadge = ({ priority }) => {
  const map = { High:'badge-red', Medium:'badge-yellow', Low:'badge-gray', Critical:'badge-red' };
  return priority ? <span className={`badge ${map[priority]||'badge-gray'}`}>{priority}</span> : null;
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
.uv-btn{padding:.5rem 1.25rem;border-radius:6px;font-family:'Poppins',sans-serif;font-size:.9rem;font-weight:600;cursor:pointer;border:none;transition:all .2s;background:#ffc107;color:#333;text-decoration:none;display:inline-flex;align-items:center;gap:.4rem}
.uv-btn:hover{background:#ffca2c;transform:translateY(-1px);box-shadow:0 4px 8px rgba(255,193,7,.3)}
.uv-btn-success{background:#4caf50;color:#fff;border:none}
.uv-btn-success:hover{background:#43a047;box-shadow:0 4px 8px rgba(76,175,80,.3)}
.uv-hero{display:flex;align-items:center;gap:2rem;padding:2rem;background:#fff;border-bottom:1px solid #f0f0f0;flex-wrap:wrap}
.uv-hero-avatar{width:82px;height:82px;border-radius:12px;background:#ffc107;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:2.2rem;border:3px solid #fff;box-shadow:0 3px 10px rgba(255,193,7,.45)}
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
.uv-stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1px;background:#f5f5f5;border-radius:0 0 8px 8px;overflow:hidden}
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
.uv-message-box{background:#f9f9f9;border-radius:8px;padding:1rem;font-size:.95rem;line-height:1.6;color:#444;border:1px solid #f0f0f0}
@media(max-width:640px){.uv-hero{padding:1.25rem}.uv-layout{padding:1rem}}
`;

const NotificationView = () => {
  const { id }             = useParams();
  const { setIsLoading }   = useLoading();
  const [notif, setNotif]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setIsLoading(true);
        const res = await axios.get(`/admin/notification/${id}`, { withCredentials: true });
        setNotif(res.data.notification || res.data);
      } catch { setError('Failed to load notification details.'); }
      finally { setLoading(false); setIsLoading(false); }
    };
    load();
  }, [id, setIsLoading]);

  const handleComplete = async () => {
    if (!window.confirm('Mark this notification as completed?')) return;
    try {
      setIsLoading(true);
      await completeTask(id);
      alert('Notification marked as completed!'); window.location.reload();
    } catch { alert('Error updating notification.'); }
    finally { setIsLoading(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (error)   return <div className="uv-error">{error}</div>;
  if (!notif) return null;

  const recipient    = notif.recipient;
  const worker       = notif.worker;
  const recipientType = (notif.recipientType || recipient?.userType || 'tenant').toLowerCase();
  const isPending    = notif.status === 'Pending';

  const tenantName = notif.tenantName || (recipient && recipientType === 'tenant' ? `${recipient.firstName||''} ${recipient.lastName||''}`.trim() : '—');
  const workerName = notif.workerName || (worker ? `${worker.firstName||''} ${worker.lastName||''}`.trim() : '—');

  return (
    <>
      <style>{CSS}</style>
      <div className="uv-root">

        {/* TOP BAR */}
        <div className="uv-topbar">
          <Link to="/admin/notifications" className="uv-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Notifications
          </Link>
          {isPending && (
            <div className="uv-topbar-actions">
              <button className="uv-btn uv-btn-success" onClick={handleComplete}>Mark as Completed</button>
            </div>
          )}
        </div>

        {/* HERO */}
        <div className="uv-hero">
          <div className="uv-hero-avatar">🔔</div>
          <div className="uv-hero-info">
            <div className="uv-hero-name-row">
              <h1 className="uv-hero-name">{notif.type || 'Notification'}</h1>
              <span className="uv-type-chip">Notification</span>
            </div>
            <p className="uv-hero-email">
              {recipient?._id
                ? <ULink to={`/admin/user/${recipient._id}/${recipientType}`}>{recipient.firstName} {recipient.lastName}</ULink>
                : (notif.tenantName || notif.propertyName || '—')
              }
              {notif.propertyName ? ` · ${notif.propertyName}` : ''}
              {' · '}{fmt(notif.createdAt||notif.updatedAt)}
            </p>
            <div className="uv-hero-badges">
              <StatusBadge status={notif.status}/>
              {notif.priority && <PriorityBadge priority={notif.priority}/>}
              {notif.type     && <span className="badge badge-gray">{notif.type}</span>}
            </div>
          </div>
          <div className="uv-hero-meta">
            {[
              ['Status',   notif.status],
              ['Priority', notif.priority||'—'],
              ['Property', notif.propertyName||'—'],
              ['Created',  fmt(notif.createdAt||notif.updatedAt)],
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

            <Card title="Notification Info">
              <div className="uv-field-stack">
                <Field label="ID"           value={<span style={{fontFamily:'monospace',fontSize:'.8rem'}}>{notif._id||notif.id}</span>}/>
                <Field label="Type"         value={notif.type||'—'}/>
                <Field label="Status"       value={<StatusBadge status={notif.status}/>}/>
                {notif.priority && <Field label="Priority" value={<PriorityBadge priority={notif.priority}/>}/>}
                <Field label="Property"     value={notif.propertyName||'—'}/>
                <Field label="Created"      value={fmt(notif.createdAt||notif.updatedAt)}/>
                <Field label="Recipient"    value={notif.recipientType||recipientType||'—'}/>
              </div>
            </Card>

            {isPending && (
              <Card title="Actions">
                <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
                  <button className="uv-btn uv-btn-success" onClick={handleComplete} style={{justifyContent:'center'}}>✓ Mark as Completed</button>
                </div>
              </Card>
            )}

            <Card title="Quick Links">
              <div className="uv-quick-links">
                <Link to="/admin/notifications" className="uv-quick-link">🔔 All Notifications</Link>
                <Link to="/admin/user-management" className="uv-quick-link">👤 Users</Link>
                <Link to="/admin" className="uv-quick-link">🏠 Dashboard</Link>
              </div>
            </Card>

          </aside>

          {/* MAIN */}
          <main className="uv-main">

            <Card title="Overview">
              <div className="uv-stats-row">
                <StatBox label="Type"     value={notif.type||'—'}/>
                <StatBox label="Status"   value={notif.status}/>
                <StatBox label="Priority" value={notif.priority||'—'}/>
                <StatBox label="Created"  value={fmt(notif.createdAt)}/>
              </div>
            </Card>

            {/* Message */}
            {notif.message && (
              <Card title="Message">
                <div className="uv-message-box">{notif.message}</div>
              </Card>
            )}

            {/* Recipient */}
            <Card title="Recipient">
              {recipient?._id ? (
                <div className="uv-grid-3">
                  <Field label="Name"    value={<ULink to={`/admin/user/${recipient._id}/${recipientType}`}>{recipient.firstName} {recipient.lastName}</ULink>}/>
                  <Field label="Email"   value={recipient.email||'—'}/>
                  <Field label="Type"    value={notif.recipientType||recipientType||'—'}/>
                </div>
              ) : tenantName !== '—' ? (
                <div className="uv-field-stack">
                  <Field label="Recipient Name" value={tenantName}/>
                  <Field label="Type"           value={notif.recipientType||recipientType||'—'}/>
                </div>
              ) : <p className="uv-empty">No recipient information available.</p>}
            </Card>

            {/* Worker (if applicable) */}
            {(worker?._id || workerName !== '—') && (
              <Card title="Related Worker">
                {worker?._id ? (
                  <div className="uv-grid-3">
                    <Field label="Name"         value={<ULink to={`/admin/user/${worker._id}/worker`}>{worker.firstName} {worker.lastName}</ULink>}/>
                    <Field label="Service Type" value={worker.serviceType||'—'}/>
                    <Field label="Phone"        value={worker.phone||'—'}/>
                  </div>
                ) : (
                  <Field label="Worker" value={workerName}/>
                )}
              </Card>
            )}

          </main>
        </div>
      </div>
    </>
  );
};

export default NotificationView;

