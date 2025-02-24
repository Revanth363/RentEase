import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import styles from '../assets/css/WorkerCard.module.css';

export default function WorkerCard({ worker: propWorker = null, detailed = false }) {
  const params = useParams();
  const [worker, setWorker] = useState(propWorker);
  const [loading, setLoading] = useState(detailed && !propWorker);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (detailed && !propWorker) {
      const id = params.id;
      (async () => {
        try {
          const res = await fetch(`/api/workers/${id}`);
          if (!res.ok) throw new Error('Failed to load worker');
          const data = await res.json();
          if (mounted) setWorker(data);
        } catch (err) {
          if (mounted) {
            setError(err.message || 'Failed to load worker');
            console.error('Worker fetch error:', err.message || err);
          }
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    }
    return () => { mounted = false; };
  }, [detailed, propWorker, params.id]);

  // if rendering as detail view
  if (detailed) {
    if (loading) return <main className={styles.root}><p>Loading...</p></main>;
    if (error) return <main className={styles.root}><p className={styles.error}>{error}</p></main>;
    if (!worker) return <main className={styles.root}><p>No worker found</p></main>;

    const img = worker.image || worker.photo || worker.photos?.[0] || '/images/default-worker.jpg';
    return (
      <main className={styles.root}>
        <div className={styles.headerRow}>
          <Link to="/workerDetails" className={styles.backLink}>← Back to services</Link>
          <h1 className={styles.title}>{worker.firstName} {worker.lastName}</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.imageCol}>
            <img src={img} alt={worker.firstName} onError={(e)=>e.currentTarget.src='/images/default-worker.jpg'} />
            <div className={styles.serviceBadge}>{worker.serviceType}</div>
            <div className={styles.ratingBadge}>★ {worker.ratingId?.average ?? worker.rating ?? 'N/A'}</div>
          </div>

          <div className={styles.infoCol}>
            <h2 style={{marginTop:0}}>{worker.serviceType}</h2>

            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:16}}>
              <MapPin size={18} color="#e74c3c" />
              <span style={{ color: '#666', fontSize: 15 }}>{worker.location}</span>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:32}}>
              <div>
                <div style={{fontSize:24, fontWeight:700, color:'#1a1a1a', marginBottom:4}}>
                  {worker.price ? `₹${Number(worker.price).toLocaleString()}` : 'Contact'}
                </div>
                <div style={{fontSize:13, color:'#999'}}>per month</div>
              </div>

              <div>
                <div style={{fontSize:24, fontWeight:700, color:'#1a1a1a', marginBottom:4, display:'flex', alignItems:'center', gap:6}}>
                  <span style={{ color: '#ffc107' }}>★</span> {worker.rating ?? 'N/A'}
                </div>
                <div style={{fontSize:13, color:'#999'}}>rating</div>
              </div>

              <div>
                <div style={{fontSize:24, fontWeight:700, color:'#1a1a1a', marginBottom:4}}>
                  {worker.experience ?? 0} years
                </div>
                <div style={{fontSize:13, color:'#999'}}>experience</div>
              </div>
            </div>

            <div className={styles.actionsRow}>
              <a className={styles.bookBtn} href="/login">Book Now</a>
            </div>

            <div style={{marginTop:32}}>
              <h3 style={{fontSize:18, fontWeight:700, marginBottom:12}}>About</h3>
              <p style={{fontSize:14, color:'#666', lineHeight:1.6, margin:0}}>{worker.description}</p>
            </div>

            <div style={{marginTop:32}}>
              <h3 style={{fontSize:18, fontWeight:700, marginBottom:12}}>Availability</h3>
              <span className={styles.availabilityPill}>
                {worker.isBooked ? 'Unavailable' : 'Available'}
              </span>
            </div>

            {Array.isArray(worker.reviews) && worker.reviews.length > 0 && (
              <div style={{marginTop:32}}>
                <h3 style={{fontSize:18, fontWeight:700, marginBottom:12}}>Reviews</h3>
                <ul style={{paddingLeft:18, margin:0}}>
                  {worker.reviews.map((review, idx) => (
                    <li key={idx} style={{marginBottom:8}}>
                      <span style={{fontWeight:600}}>{review.tenantName || 'Tenant'}:</span> {review.text} {review.rating && <span style={{color:'#ffc107'}}>★ {review.rating}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // default: compact card view used in lists (if this component is reused)
  const id = worker?._id || worker?.id;
  const firstName = worker?.firstName || worker?.name || '';
  const lastName = worker?.lastName || '';
  const fullName = (firstName + ' ' + lastName).trim() || worker?.name || 'Worker';
  const image = worker?.image || worker?.photo || worker?.photos?.[0] || '/images/default-worker.jpg';
  const location = worker?.location || worker?.city || '';
  const price = worker?.price || worker?.rate || worker?.monthlyPrice || '';
  const rating = worker?.ratingId?.average ?? worker?.rating ?? 'N/A';
  const experience = worker?.experience ?? worker?.years ?? 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardImage}>
        <img
          src={image}
          alt={fullName}
          onError={(e) => { e.currentTarget.src = '/images/default-worker.jpg'; }}
        />
        {worker?.serviceType && (
          <div className={styles.serviceBadge}>{worker.serviceType}</div>
        )}
        <div className={styles.ratingBadge}>★ {rating}</div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.workerName}>{fullName}</div>
        {location && <div className={styles.workerLocation}> {location}</div>}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div className={styles.workerPrice}>{price ? `₹${Number(price).toLocaleString()}` : 'Contact'}/month</div>
          <div className={styles.workerExp}>{experience} years</div>
        </div>

        <Link to={`/worker/${id}`} className={styles.viewButton}>
          View Details
        </Link>
      </div>
    </div>
  );
}
