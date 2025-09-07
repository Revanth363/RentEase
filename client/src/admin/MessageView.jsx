// src/admin/MessageView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoading } from '../context/useLoading';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const API = '/api';
const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', {
  day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
}) : '—';

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

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
.uv-root{font-family:'Poppins',sans-serif;background:#f9f9f9;min-height:100vh;color:#333}
.uv-topbar{display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;background:#fff;border-bottom:1px solid #f0f0f0;position:sticky;top:0;z-index:100}
.uv-back{display:inline-flex;align-items:center;gap:.5rem;color:#555;text-decoration:none;font-size:.95rem;font-weight:500;transition:color .2s}
.uv-back:hover{color:#333}
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
.badge-gray{background:#f5f5f5;color:#757575}
.badge-blue{background:#e3f2fd;color:#1565c0}
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
.uv-message-body{background:#f9f9f9;border-radius:8px;padding:1.25rem;font-size:.97rem;line-height:1.75;color:#444;border:1px solid #f0f0f0;white-space:pre-wrap}
.uv-reply-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.6rem 1.25rem;border-radius:6px;background:#ffc107;color:#333;font-weight:600;font-size:.9rem;text-decoration:none;border:none;cursor:pointer;transition:all .2s}
.uv-reply-btn:hover{background:#ffca2c;transform:translateY(-1px);box-shadow:0 4px 8px rgba(255,193,7,.3)}
@media(max-width:640px){.uv-hero{padding:1.25rem}.uv-layout{padding:1rem}}
`;

const MessageView = () => {
  const { id }             = useParams();
  const { setIsLoading }   = useLoading();
  const [msg, setMsg]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setIsLoading(true);
        const res = await axios.get(`${API}/admin/message/${id}`, { withCredentials: true });
        setMsg(res.data.submission || res.data.contact || res.data);
      } catch { setError('Failed to load message details.'); }
      finally { setLoading(false); setIsLoading(false); }
    };
    load();
  }, [id, setIsLoading]);

  if (loading) return <LoadingSpinner />;
  if (error)   return <div className="uv-error">{error}</div>;
  if (!msg) return null;

  const submittedAt = fmt(msg.submittedAt || msg.createdAt);
  const subject     = msg.subject || 'No Subject';
  const name        = msg.name    || 'Anonymous';

  return (
    <>
      <style>{CSS}</style>
      <div className="uv-root">

        {/* TOP BAR */}
        <div className="uv-topbar">
          <Link to="/admin/messages" className="uv-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Messages
          </Link>
          {msg.email && (
            <a href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(subject)}`} className="uv-reply-btn">
              ✉ Reply
            </a>
          )}
        </div>

        {/* HERO */}
        <div className="uv-hero">
          <div className="uv-hero-avatar">✉️</div>
          <div className="uv-hero-info">
            <div className="uv-hero-name-row">
              <h1 className="uv-hero-name">{subject}</h1>
              <span className="uv-type-chip">Message</span>
            </div>
            <p className="uv-hero-email">{name} · {msg.email||'—'}</p>
            <div className="uv-hero-badges">
              <span className="badge badge-blue">Contact Form</span>
              {msg.phone && <span className="badge badge-gray">{msg.phone}</span>}
            </div>
          </div>
          <div className="uv-hero-meta">
            {[
              ['Sender',    name],
              ['Email',     msg.email||'—'],
              ['Submitted', submittedAt],
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

            <Card title="Sender Info">
              <div className="uv-field-stack">
                <Field label="Name"      value={name}/>
                <Field label="Email"     value={msg.email||'—'}/>
                <Field label="Phone"     value={msg.phone||'—'}/>
                <Field label="Submitted" value={submittedAt}/>
              </div>
            </Card>

            {msg.email && (
              <Card title="Actions">
                <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
                  <a
                    href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(subject)}`}
                    className="uv-reply-btn"
                    style={{justifyContent:'center'}}
                  >
                    ✉ Reply to Sender
                  </a>
                </div>
              </Card>
            )}

            <Card title="Quick Links">
              <div className="uv-quick-links">
                <Link to="/admin/messages" className="uv-quick-link">✉ All Messages</Link>
                <Link to="/admin"          className="uv-quick-link">🏠 Dashboard</Link>
              </div>
            </Card>

          </aside>

          {/* MAIN */}
          <main className="uv-main">

            <Card title="Message Overview">
              <div className="uv-stats-row">
                <StatBox label="From"      value={name}/>
                <StatBox label="Subject"   value={subject}/>
                <StatBox label="Submitted" value={msg.submittedAtFormatted || submittedAt}/>
              </div>
            </Card>

            {/* Contact Details */}
            <Card title="Contact Details">
              <div className="uv-grid-3">
                <Field label="Full Name" value={name}/>
                <Field label="Email"     value={msg.email||'—'}/>
                <Field label="Phone"     value={msg.phone||'—'}/>
                <Field label="Subject"   value={subject}/>
                <Field label="Submitted" value={msg.submittedAtFormatted || submittedAt}/>
              </div>
            </Card>

            {/* Message Body */}
            <Card title="Message">
              {msg.message
                ? <div className="uv-message-body">{msg.message}</div>
                : <p className="uv-empty">No message content.</p>
              }
            </Card>

          </main>
        </div>
      </div>
    </>
  );
};

export default MessageView;

