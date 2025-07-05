// src/pages/admin/PropertyView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchPropertyDetails } from '../services/api';

const money = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Badge ── */
const Badge = ({ value }) => {
  const map = {
    Available:  { background: '#e8f5e9', color: '#2e7d32' },
    Rented:     { background: '#e3f2fd', color: '#1565c0' },
    Yes:        { background: '#e8f5e9', color: '#2e7d32' },
    No:         { background: '#ffebee', color: '#c62828' },
    Verified:   { background: '#e8f5e9', color: '#2e7d32' },
    Unverified: { background: '#fff8e1', color: '#f57f17' },
    Pending:    { background: '#fff8e1', color: '#f57f17' },
    Approved:   { background: '#e8f5e9', color: '#2e7d32' },
    Rejected:   { background: '#ffebee', color: '#c62828' },
    Popular:    { background: '#e3f2fd', color: '#1565c0' },
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
   CSS AS CONST STRING (exactly like UserView)
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

.pv-hero-thumb {
  width: 110px;
  height: 90px;
  border-radius: 10px;
  overflow: hidden;
  background: #fff8e1;
  border: 2px solid #ffe082;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pv-hero-thumb img { width: 100%; height: 100%; object-fit: cover; }
.pv-hero-thumb-placeholder { font-size: 2.5rem; }

.pv-hero-info { flex: 1; min-width: 200px; }
.pv-hero-name { font-size: 22px; font-weight: 700; color: #333; margin-bottom: 4px; }
.pv-hero-loc  { font-size: 14px; color: #777; margin-bottom: 10px; }
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
.pv-btn-danger {
  background: #fff;
  color: #f44336;
  border: 1px solid #f44336;
}
.pv-btn-danger:hover {
  background: #f44336;
  color: #fff;
  box-shadow: 0 4px 10px rgba(244,67,54,0.3);
}

/* PROOF LINK */
.pv-proof-link {
  color: #ffc107;
  font-weight: 600;
  text-decoration: none;
}
.pv-proof-link:hover {
  text-decoration: underline;
}

/* WORKER LINKS */
.pv-worker-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}
.pv-worker-item {
  background: #fff8e1;
  border: 1px solid #ffe082;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
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
const PropertyView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [property, setProperty] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchPropertyDetails(id);
        setProperty(data);
      } catch (err) {
        setError('Failed to load property details. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, setIsLoading]);

  if (loading) return <LoadingSpinner />;
  if (error)   return (
    <div className="pv-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ color: '#f44336', fontSize: '16px', fontWeight: 500 }}>{error}</p>
    </div>
  );
  if (!property) return null;

  const images = property.images || [];
  const proof = property.propertyProof;

  return (
    <>
      <style>{CSS}</style>
      <div className="pv-page">
        <div className="pv-wrap">

          {/* ── TITLE BAR ── */}
          <div className="pv-titlebar">
            <span>Property Details</span>
            <span style={{ fontSize: '13px', fontWeight: 400, opacity: 0.65, marginLeft: '10px' }}>#{property._id}</span>
          </div>

          {/* ── HERO ── */}
          <div className="pv-hero">
            {/* Thumbnail */}
            <div className="pv-hero-thumb">
              {images.length > 0
                ? <img src={typeof images[0] === 'string' ? images[0] : images[0].url} alt="property" />
                : <span className="pv-hero-thumb-placeholder">🏠</span>
              }
            </div>

            {/* Name / badges / meta */}
            <div className="pv-hero-info">
              <div className="pv-hero-name">{property.name}</div>
              <div className="pv-hero-loc">📍 {property.address || property.location}</div>
              <div className="pv-hero-badges">
                <Badge value={property.isRented ? 'Rented' : 'Available'} />
                <Badge value={property.isVerified ? 'Verified' : 'Unverified'} />
                {property.status && <Badge value={property.status} />}
                {property.is_popular && <Badge value="Popular" />}
                {property.type && (
                  <span style={{ background: '#f5f5f5', color: '#555', padding: '3px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
                    {property.type}
                  </span>
                )}
                {property.subtype && (
                  <span style={{ background: '#f5f5f5', color: '#555', padding: '3px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
                    {property.subtype}
                  </span>
                )}
              </div>
            </div>

            {/* Quick meta */}
            <div className="pv-hero-meta">
              {[
                ['Monthly Rent',  money(property.price)],
                ['Beds / Baths',  `${property.beds ?? '—'} / ${property.baths ?? '—'}`],
                ['Size',          property.size || '—'],
                ['Available From', fmt(property.availableFrom)],
                ['Listed On',     fmt(property.createdAt)],
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
            <Stat label="Monthly Rent"      value={money(property.price)} />
            <Stat label="Security Deposit"  value={money(property.securityDeposit)} />
            <Stat label="Maintenance"       value={money(property.maintenance)} />
            <Stat label="Rating"            value={property.rating ? `${property.rating} ★` : '—'} />
            <Stat label="Reviews"           value={property.reviews || '0'} />
            <Stat label="Images"            value={images.length} />
          </div>

          {/* ── DETAIL GRID ── */}
          <div className="pv-grid">

            {/* Basic Info */}
            <Group title="Basic Information">
              <Row label="Property Name" value={property.name} />
              <Row label="Type"          value={property.type} />
              <Row label="Subtype"       value={property.subtype} />
              <Row label="Location"      value={property.location} />
              <Row label="Full Address"  value={property.address} />
              <Row label="Furnished"     value={property.furnished} />
              <Row label="Beds"          value={property.beds} />
              <Row label="Baths"         value={property.baths} />
              <Row label="Size"          value={property.size || '—'} />
              <Row label="Floor"         value={property.floor || '—'} />
            </Group>

            {/* Rental Info */}
            <Group title="Rental Information">
              <Row label="Status"           value={<Badge value={property.status || 'Unknown'} />} />
              <Row label="Rented"           value={<Badge value={property.isRented ? 'Yes' : 'No'} />} />
              <Row label="Monthly Rent"     value={money(property.price)} />
              <Row label="Security Deposit" value={money(property.securityDeposit)} />
              <Row label="Maintenance"      value={money(property.maintenance)} />
              <Row label="Available From"   value={fmt(property.availableFrom)} />
              <Row label="Lease Duration"   value={property.leaseDuration ? `${property.leaseDuration} months` : '—'} />
              <Row label="Preferred Tenants" value={property.preferredTenants || '—'} />
            </Group>

            {/* Owner */}
            <Group title="Owner">
              {property.owner?._id ? (
                <>
                  <Row label="Name"  value={
                    <Link to={`/admin/user/${property.owner._id}/owner`}
                      style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                      {property.owner.firstName} {property.owner.lastName}
                    </Link>
                  } />
                  <Row label="Email" value={property.owner.email} />
                  <Row label="Phone" value={property.owner.phone || '—'} />
                </>
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic', marginTop: '10px', fontSize: '15px' }}>No owner linked.</p>
              )}
            </Group>

            {/* Tenant */}
            <Group title="Tenant">
              {property.tenantId?._id ? (
                <>
                  <Row label="Name"  value={
                    <Link to={`/admin/user/${property.tenantId._id}/tenant`}
                      style={{ color: '#ffc107', fontWeight: 600, textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                      {property.tenantId.firstName} {property.tenantId.lastName}
                    </Link>
                  } />
                  <Row label="Email" value={property.tenantId.email} />
                  <Row label="Phone" value={property.tenantId.phone || '—'} />
                </>
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic', marginTop: '10px', fontSize: '15px' }}>No tenant — property is available.</p>
              )}
            </Group>

            {/* Contact */}
            <Group title="Contact Information">
              <Row label="Contact Number"     value={property.contactNumber} />
              <Row label="Alternative Number" value={property.alternativeNumber} />
              <Row label="Contact Email"      value={property.contactEmail} />
            </Group>

            {/* Verification & Proof */}
            <Group title="Verification & Proof">
              <Row label="Verified"    value={<Badge value={property.isVerified ? 'Verified' : 'Unverified'} />} />
              <Row label="Listed On"   value={fmt(property.createdAt)} />
              <Row label="Last Updated" value={fmt(property.updatedAt)} />
              {proof?.url && (
                <Row label="Property Proof" value={
                  <a href={proof.url} target="_blank" rel="noopener noreferrer" className="pv-proof-link">
                    View {proof.type === 'pdf' ? 'PDF' : 'Image'} Proof
                  </a>
                } />
              )}
            </Group>

            {/* Active Workers */}
            {property.activeWorkers?.length > 0 && (
              <Group title="Assigned Workers" fullWidth>
                <div className="pv-worker-list">
                  {property.activeWorkers.map((w, i) => (
                    <Link key={i} to={`/admin/user/${w._id}/worker`} className="pv-worker-item">
                      {w.firstName} {w.lastName} ({w.serviceType || '—'})
                    </Link>
                  ))}
                </div>
              </Group>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <Group title="Amenities">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                  {(Array.isArray(property.amenities) ? property.amenities : property.amenities.split(',')).map((a, i) => (
                    <span key={i} style={{
                      background: '#fff8e1', border: '1px solid #ffe082',
                      borderRadius: '20px', padding: '4px 14px',
                      fontSize: '13px', color: '#555', fontWeight: 500,
                    }}>
                      {a.trim()}
                    </span>
                  ))}
                </div>
              </Group>
            )}

            {/* Description */}
            {property.description && (
              <Group title="Description" fullWidth>
                <p style={{ fontSize: '15px', color: '#555', lineHeight: 1.75, marginTop: '6px' }}>
                  {property.description}
                </p>
              </Group>
            )}

            {/* Images */}
            {images.length > 0 && (
              <Group title={`Images (${images.length})`} fullWidth>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginTop: '8px' }}>
                  {images.map((img, i) => {
                    const src = typeof img === 'string' ? img : img.url;
                    return (
                      <div key={i} onClick={() => setLightbox(i)} style={{
                        borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                        border: '1px solid #f0f0f0', aspectRatio: '4/3',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <img src={src} alt={`Property ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    );
                  })}
                </div>
              </Group>
            )}

          </div>

          {/* ── ACTIONS ── */}
          <div style={{
            padding: '22px 36px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex', gap: '12px', justifyContent: 'flex-end',
            background: '#fafafa',
          }}>
            <Link to="/admin" className="pv-btn">← Back to Dashboard</Link>
            <button className="pv-btn pv-btn-danger">Remove Listing</button>
          </div>

        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox !== null && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, cursor: 'zoom-out',
        }}>
          <img
            src={typeof images[lightbox] === 'string' ? images[lightbox] : images[lightbox].url}
            alt="Preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          />
          <button onClick={() => setLightbox(lightbox > 0 ? lightbox - 1 : images.length - 1)}
            style={{ position: 'fixed', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '50%', width: '44px', height: '44px', fontSize: '20px', cursor: 'pointer' }}>
            ‹
          </button>
          <button onClick={() => setLightbox(lightbox < images.length - 1 ? lightbox + 1 : 0)}
            style={{ position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: '50%', width: '44px', height: '44px', fontSize: '20px', cursor: 'pointer' }}>
            ›
          </button>
          <div style={{ position: 'fixed', bottom: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyView;