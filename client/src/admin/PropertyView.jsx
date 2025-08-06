// src/admin/PropertyView.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import { fetchPropertyDetails, toggleVerify, deleteProperty } from '../services/api';

const fmt   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const money = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

const StatusBadge = ({ status }) => {
  const map = { Available:'badge-green', Rented:'badge-blue', Pending:'badge-yellow',
    Verified:'badge-green', Unverified:'badge-yellow', Popular:'badge-blue',
    Approved:'badge-green', Rejected:'badge-red', Active:'badge-green' };
  return <span className={`badge ${map[status]||'badge-gray'}`}>{status}</span>;
};

const Card = ({ title, accent='#ffc107', children, className='' }) => (
  <div className={`uv-card ${className}`}>
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
.uv-avatar-img{width:100%;height:100%;object-fit:cover}
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
.uv-grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1.25rem}
.uv-grid-3{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1.25rem}
.uv-stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:1px;background:#f5f5f5;border-radius:0 0 8px 8px;overflow:hidden}
.uv-stat{background:#fff;padding:1.1rem 1.25rem;display:flex;flex-direction:column;gap:.3rem}
.uv-stat-value{font-size:1.4rem;font-weight:700;color:#ffc107;line-height:1}
.uv-stat-label{font-size:.82rem;color:#777;font-weight:500}
.uv-link{color:#ffc107;text-decoration:none;font-weight:600;transition:color .2s}
.uv-link:hover{color:#e5ac00;text-decoration:underline}
.uv-empty{color:#aaa;font-style:italic;text-align:center;padding:2rem 0;font-size:.9rem}
.uv-error{display:flex;align-items:center;justify-content:center;height:60vh;font-size:1rem;color:#f44336;font-weight:500}
.uv-list{display:flex;flex-direction:column;gap:1px;background:#f5f5f5;border-radius:8px;overflow:hidden}
.uv-list-item{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.9rem 1.1rem;background:#fff}
.uv-list-left{display:flex;flex-direction:column;gap:.2rem}
.uv-list-name{font-size:.95rem;font-weight:600;color:#333}
.uv-list-sub{font-size:.82rem;color:#777}
.uv-doc-link{color:#ffc107;font-size:.88rem;text-decoration:none;padding:.4rem .75rem;background:#fff8e1;border-radius:6px;display:block;transition:background .2s;margin-top:4px}
.uv-doc-link:hover{background:#ffecb3}
.uv-quick-links{display:flex;flex-direction:column;gap:.4rem}
.uv-quick-link{color:#555;font-size:.9rem;text-decoration:none;padding:.5rem .75rem;border-radius:7px;display:block;transition:all .2s;font-weight:500}
.uv-quick-link:hover{background:#fff8e1;color:#333}
.uv-images-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px}
.uv-img-thumb{border-radius:8px;overflow:hidden;cursor:pointer;border:1px solid #f0f0f0;aspect-ratio:4/3;transition:transform .2s,box-shadow .2s}
.uv-img-thumb:hover{transform:scale(1.03);box-shadow:0 4px 12px rgba(0,0,0,.12)}
.uv-img-thumb img{width:100%;height:100%;object-fit:cover}
.uv-amenities{display:flex;flex-wrap:wrap;gap:8px}
.uv-amenity{background:#fff8e1;border:1px solid #ffe082;border-radius:20px;padding:4px 14px;font-size:13px;color:#555;font-weight:500}
.uv-actions-bar{padding:1.5rem;display:flex;gap:.75rem;justify-content:flex-end;border-top:1px solid #f0f0f0}
@media(max-width:640px){.uv-hero{padding:1.25rem}.uv-layout{padding:1rem}.uv-stats-row{grid-template-columns:repeat(2,1fr)}}
`;

const PropertyView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [property, setProperty] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const load = async () => {
      try { setLoading(true); setIsLoading(true);
        setProperty(await fetchPropertyDetails(id));
      } catch { setError('Failed to load property details.'); }
      finally { setLoading(false); setIsLoading(false); }
    };
    load();
  }, [id, setIsLoading]);

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      await toggleVerify(id, !property.isVerified);
      setProperty(p => ({ ...p, isVerified: !p.isVerified }));
    } catch { alert('Failed to update verification.'); }
    finally { setIsLoading(false); }
  };

  const handleTogglePopular = async () => {
    try {
      setIsLoading(true);
      const response = await axios.put(`/api/admin/property/${id}/toggle-popular`, 
        { is_popular: !property.is_popular }, 
        { withCredentials: true }
      );
      setProperty(p => ({ ...p, is_popular: response.data.is_popular }));
      alert(response.data.is_popular ? 'Property marked as popular!' : 'Property removed from popular list.');
    } catch (err) { 
      alert(err.response?.data?.error || 'Failed to update popularity.'); 
    }
    finally { setIsLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this property? This cannot be undone.')) return;
    try { setIsLoading(true); await deleteProperty(id); window.location.href = '/admin/property-management'; }
    catch { alert('Failed to delete property.'); }
    finally { setIsLoading(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (error)   return <div className="uv-error">{error}</div>;
  if (!property) return null;

  const images = property.images || [];
  const proof  = property.propertyProof;

  return (
    <>
      <style>{CSS}</style>
      <div className="uv-root">

        {/* TOP BAR */}
        <div className="uv-topbar">
          <Link to="/admin/property-management" className="uv-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Property Management
          </Link>
          <div className="uv-topbar-actions">
            <button 
              className="uv-btn uv-btn-success" 
              onClick={handleTogglePopular}
              disabled={property.isRented || !property.isVerified}
              title={property.isRented ? 'Cannot mark rented property as popular' : !property.isVerified ? 'Property must be verified first' : ''}
            >
              {property.is_popular ? '⭐ Remove from Popular' : '☆ Make Popular'}
            </button>
            <button className={`uv-btn ${property.isVerified ? 'uv-btn-danger' : 'uv-btn-success'}`} onClick={handleVerify}>
              {property.isVerified ? 'Unverify' : 'Verify Listing'}
            </button>
            <button className="uv-btn uv-btn-danger" onClick={handleDelete}>Delete Listing</button>
          </div>
        </div>

        {/* HERO */}
        <div className="uv-hero">
          <div className="uv-hero-avatar">
            {images.length > 0
              ? <img src={typeof images[0]==='string'?images[0]:images[0].url} alt="property" className="uv-avatar-img"/>
              : <span className="uv-avatar-icon">🏠</span>
            }
          </div>
          <div className="uv-hero-info">
            <div className="uv-hero-name-row">
              <h1 className="uv-hero-name">{property.name}</h1>
              {property.type && <span className="uv-type-chip">{property.type}</span>}
            </div>
            <p className="uv-hero-email">📍 {property.address || property.location || '—'}</p>
            <div className="uv-hero-badges">
              <StatusBadge status={property.isRented ? 'Rented' : 'Available'} />
              <StatusBadge status={property.isVerified ? 'Verified' : 'Unverified'} />
              {property.is_popular && <StatusBadge status="Popular"/>}
              {property.subtype && <span className="badge badge-gray">{property.subtype}</span>}
            </div>
          </div>
          <div className="uv-hero-meta">
            {[['Monthly Rent', money(property.price)], ['Beds / Baths', `${property.beds??'—'} / ${property.baths??'—'}`], ['Furnished', property.furnished||'—'], ['Listed On', fmt(property.createdAt)]].map(([lbl,val]) => (
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

            <Card title="Quick Info">
              <div className="uv-field-stack">
                <Field label="Property ID"  value={<span style={{fontFamily:'monospace',fontSize:'.8rem'}}>{property._id||property.id}</span>}/>
                <Field label="Status"       value={<StatusBadge status={property.status||'Pending'}/>}/>
                <Field label="Type"         value={property.type||'—'}/>
                <Field label="Subtype"      value={property.subtype||'—'}/>
                <Field label="Size"         value={property.size||'—'}/>
                <Field label="Floor"        value={property.floor||'—'}/>
                <Field label="Listed On"    value={fmt(property.createdAt)}/>
                <Field label="Last Updated" value={fmt(property.updatedAt)}/>
                {proof?.url && (
                  <a href={proof.url} target="_blank" rel="noopener noreferrer" className="uv-doc-link">
                    📄 View {proof.type==='pdf'?'PDF':'Image'} Proof
                  </a>
                )}
              </div>
            </Card>

            <Card title="Owner">
              {property.owner?._id ? (
                <div className="uv-field-stack">
                  <Field label="Name"  value={<ULink to={`/admin/user/${property.owner._id}/owner`}>{property.owner.firstName} {property.owner.lastName}</ULink>}/>
                  <Field label="Email" value={property.owner.email||'—'}/>
                  <Field label="Phone" value={property.owner.phone||'—'}/>
                </div>
              ) : <p className="uv-empty">No owner linked.</p>}
            </Card>

            <Card title="Current Tenant">
              {property.tenantId?._id ? (
                <div className="uv-field-stack">
                  <Field label="Name"  value={<ULink to={`/admin/user/${property.tenantId._id}/tenant`}>{property.tenantId.firstName} {property.tenantId.lastName}</ULink>}/>
                  <Field label="Email" value={property.tenantId.email||'—'}/>
                  <Field label="Phone" value={property.tenantId.phone||'—'}/>
                  <Field label="Rental Started" value={fmt(property.rentalStartDate)}/>
                </div>
              ) : <p className="uv-empty">Property is currently vacant.</p>}
            </Card>

            <Card title="Quick Links">
              <div className="uv-quick-links">
                <Link to="/admin/property-management" className="uv-quick-link">🏠 All Properties</Link>
                <Link to="/admin/bookings" className="uv-quick-link">📋 Bookings</Link>
                <Link to="/admin/payments" className="uv-quick-link">💳 Payments</Link>
                <Link to="/admin/maintenance" className="uv-quick-link">🔧 Maintenance</Link>
              </div>
            </Card>

          </aside>

          {/* MAIN */}
          <main className="uv-main">

            <Card title="Financial Overview">
              <div className="uv-stats-row">
                <StatBox label="Monthly Rent"      value={money(property.price)}/>
                <StatBox label="Security Deposit"  value={money(property.securityDeposit)}/>
                <StatBox label="Maintenance"       value={money(property.maintenance)}/>
                <StatBox label="Rating"            value={property.rating?`${property.rating} ★`:'—'}/>
                <StatBox label="Reviews"           value={property.reviews??'0'}/>
                <StatBox label="Images"            value={images.length}/>
              </div>
            </Card>

            <Card title="Rental Details">
              <div className="uv-grid-3">
                <Field label="Available From"    value={fmt(property.availableFrom)}/>
                <Field label="Lease Duration"    value={property.leaseDuration?`${property.leaseDuration} months`:'—'}/>
                <Field label="Preferred Tenants" value={property.preferredTenants||'—'}/>
                <Field label="Rental Status"     value={<StatusBadge status={property.isRented?'Rented':'Available'}/>}/>
                <Field label="Verification"      value={<StatusBadge status={property.isVerified?'Verified':'Unverified'}/>}/>
              </div>
            </Card>

            <Card title="Contact Information">
              <div className="uv-grid-3">
                <Field label="Contact Number"     value={property.contactNumber||'—'}/>
                <Field label="Alternative Number" value={property.alternativeNumber||'—'}/>
                <Field label="Contact Email"      value={property.contactEmail||'—'}/>
              </div>
            </Card>

            {property.activeWorkers?.length > 0 && (
              <Card title={`Assigned Workers (${property.activeWorkers.length})`}>
                <div className="uv-list">
                  {property.activeWorkers.map(w => (
                    <div key={w._id} className="uv-list-item">
                      <div className="uv-list-left">
                        <span className="uv-list-name"><ULink to={`/admin/user/${w._id}/worker`}>{w.firstName} {w.lastName}</ULink></span>
                        <span className="uv-list-sub">{w.serviceType||'—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {property.amenities?.length > 0 && (
              <Card title="Amenities">
                <div className="uv-amenities">
                  {(Array.isArray(property.amenities)?property.amenities:property.amenities.split(',')).map((a,i)=>(
                    <span key={i} className="uv-amenity">{a.trim()}</span>
                  ))}
                </div>
              </Card>
            )}

            {property.description && (
              <Card title="Description">
                <p style={{fontSize:'15px',color:'#555',lineHeight:1.75}}>{property.description}</p>
              </Card>
            )}

            {images.length > 0 && (
              <Card title={`Images (${images.length})`}>
                <div className="uv-images-grid">
                  {images.map((img,i)=>{
                    const src=typeof img==='string'?img:img.url;
                    return (
                      <div key={i} className="uv-img-thumb" onClick={()=>setLightbox(i)}>
                        <img src={src} alt={`Property ${i+1}`}/>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

          </main>
        </div>
      </div>

      {/* LIGHTBOX */}
      {lightbox!==null && (
        <div onClick={()=>setLightbox(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,cursor:'zoom-out'}}>
          <img src={typeof images[lightbox]==='string'?images[lightbox]:images[lightbox].url} alt="Preview"
            style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:10,boxShadow:'0 10px 40px rgba(0,0,0,.5)'}} onClick={e=>e.stopPropagation()}/>
          <button onClick={()=>setLightbox(lightbox>0?lightbox-1:images.length-1)} style={{position:'fixed',left:20,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.15)',color:'#fff',border:'none',borderRadius:'50%',width:44,height:44,fontSize:22,cursor:'pointer'}}>‹</button>
          <button onClick={()=>setLightbox(lightbox<images.length-1?lightbox+1:0)} style={{position:'fixed',right:20,top:'50%',transform:'translateY(-50%)',background:'rgba(255,255,255,.15)',color:'#fff',border:'none',borderRadius:'50%',width:44,height:44,fontSize:22,cursor:'pointer'}}>›</button>
          <div style={{position:'fixed',bottom:20,color:'rgba(255,255,255,.6)',fontSize:14}}>{lightbox+1} / {images.length}</div>
        </div>
      )}
    </>
  );
};

export default PropertyView;
