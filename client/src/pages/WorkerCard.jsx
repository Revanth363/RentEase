// src/pages/WorkerCard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import styles from '../assets/css/WorkerCard.module.css';
import { useLoading } from '../LoadingContext';

export default function WorkerCard({ worker: propWorker = null, detailed = false }) {
  const params = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(propWorker);
  const [loading, setLoading] = useState(detailed && !propWorker);
  const [error, setError] = useState('');
  const { setIsLoading } = useLoading();

  // 🔥 added: logged in user
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  // 🔥 Booking confirmation modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    preferredDate: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    // fetch session user
    (async () => {
      try {
        const res = await fetch("/api/check-session", { credentials: "include" });
        const data = await res.json();
        setLoggedInUser(data.user || null);
      } catch {
        setLoggedInUser(null);
      }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;

    if (detailed && !propWorker) {
      const id = params.id;
      setLoading(true);
      setIsLoading(true);

      (async () => {
        try {
          const res = await fetch(`/api/workers/${id}`);
          if (!res.ok) throw new Error('Failed to load worker');
          const data = await res.json();
          if (mounted) setWorker(data);
        } catch (err) {
          if (mounted) {
            setError(err.message || 'Failed to load worker');
            console.error('Worker fetch error:', err);
          }
        } finally {
          if (mounted) {
            setLoading(false);
            setIsLoading(false);
          }
        }
      })();
    }

    return () => { mounted = false; };
  }, [detailed, propWorker, params.id, setIsLoading]);


  /* ===========================================================
        BOOK WORKER LOGIC - CONFIRMATION FLOW
  ============================================================ */
  const handleBookClick = (e) => {
    e.preventDefault();

    if (!loggedInUser) {
      alert("Please login as a tenant to book a worker");
      return navigate("/login");
    }

    if (loggedInUser.userType !== "tenant") {
      alert("Only tenants can book a worker");
      return;
    }

    // Show confirmation modal
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setBookingLoading(true);

    try {
      const res = await fetch(`/api/workers/${worker._id}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          serviceType: worker.serviceType,
          preferredDate: bookingDetails.preferredDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to book worker");
        setBookingLoading(false);
        return;
      }

      alert("Booking request sent successfully!");
      setShowBookingModal(false);
      setBookingDetails({ preferredDate: '', description: '' });
      navigate("/tenant/tenant_dashboard");

    } catch (err) {
      alert("Server error while booking");
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = () => {
    setShowBookingModal(false);
    setBookingDetails({ preferredDate: '', description: '' });
  };


  /* -----------------------------------
       DETAILED PAGE VIEW
  ------------------------------------ */
  if (detailed) {
    if (loading)
      return (
        <main className={styles.root}>
          <p style={{ textAlign: 'center', padding: '60px 0', fontSize: '18px' }}>
            Loading worker details...
          </p>
        </main>
      );

    if (error) return <main className={styles.root}><p className={styles.error}>{error}</p></main>;
    if (!worker) return <main className={styles.root}><p>No worker found</p></main>;

    const img = (typeof worker.image === 'string' ? worker.image : worker.image?.url) || worker.photo || worker.photos?.[0] || '/images/default-worker.jpg';

    const availabilityText =
      worker.serviceStatus === "Available" ? "Available" : "Unavailable";

    return (
      <main className={styles.root}>
        <div className={styles.headerRow}>
          <Link to="/workerDetails" className={styles.backLink}>Back to services</Link>
          <h1 className={styles.title}>{worker.firstName} {worker.lastName}</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.imageCol}>
            <img src={img} alt={worker.firstName} onError={(e) => e.currentTarget.src = '/images/default-worker.jpg'} />
            <div className={styles.serviceBadge}>{worker.serviceType}</div>
            <div className={styles.ratingBadge}>★ {worker.ratingId?.average ?? worker.rating ?? 'N/A'}</div>
          </div>

          <div className={styles.infoCol}>
            <h2 style={{ marginTop: 0 }}>{worker.serviceType}</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <MapPin size={18} color="#e74c3c" />
              <span style={{ color: '#666', fontSize: 15 }}>{worker.location}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {worker.price ? `₹${Number(worker.price).toLocaleString()}` : 'Contact'}
                </div>
                <div style={{ fontSize: 13, color: '#999' }}>per day</div>
              </div>
Click
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#ffc107' }}>★</span> {worker.rating ?? 'N/A'}
                </div>
                <div style={{ fontSize: 13, color: '#999' }}>rating</div>
              </div>

              <div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {worker.experience ?? 0} years
                </div>
                <div style={{ fontSize: 13, color: '#999' }}>experience</div>
              </div>
            </div>

            {/* ⭐ ORIGINAL UI UNCHANGED — ONLY LOGIC ADDED */}
            <div className={styles.actionsRow}>
              <a
                className={styles.bookBtn}
                href="#"
                onClick={handleBookClick}
              >
                Book Now
              </a>
            </div>

            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>About</h3>
              <p style={{ color: '#666' }}>
                {worker.description || 'No description available.'}
              </p>
            </div>

            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Availability</h3>
              <span className={styles.availabilityPill}>
                {availabilityText}
              </span>
            </div>
          </div>
        </div>

        {/* 🔥 BOOKING CONFIRMATION MODAL */}
        {showBookingModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '40px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            }}>
              <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Confirm Booking</h2>
              <p style={{ color: '#666', marginBottom: '25px' }}>
                You're about to book <strong>{worker.firstName} {worker.lastName}</strong> for <strong>{worker.serviceType}</strong>
              </p>

              <form onSubmit={handleConfirmBooking}>
                <div style={{ marginBottom: '25px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                    Service Start Date / Joining Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={bookingDetails.preferredDate}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, preferredDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    disabled={bookingLoading}
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      opacity: bookingLoading ? 0.6 : 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: '#ffc107',
                      color: 'black',
                      cursor: bookingLoading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      opacity: bookingLoading ? 0.6 : 1,
                    }}
                  >
                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }


  /* -----------------------------------
       LIST CARD VIEW
  ------------------------------------ */
  if (!worker) return null;

  const id = worker._id || worker.id;
  const fullName = `${worker.firstName || ''} ${worker.lastName || ''}`.trim();
  const image = (typeof worker.image === 'string' ? worker.image : worker.image?.url) || worker.photo || worker.photos?.[0] || '/images/default-worker.jpg';
  const location = worker.location || worker.city || '';
  const price = worker.price || worker.rate || worker.monthlyPrice || '';
  const rating = worker.ratingId?.average ?? worker.rating ?? 'N/A';
  const experience = worker.experience ?? worker.years ?? 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardImage}>
        <img
          src={image}
          alt={fullName}
          onError={(e) => { e.currentTarget.src = '/images/default-worker.jpg'; }}
        />

        {worker.serviceType && (
          <div className={styles.serviceBadge}>{worker.serviceType}</div>
        )}

        <div className={styles.ratingBadge}>★ {rating}</div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.workerName}>{fullName}</div>

        {location && <div className={styles.workerLocation}>📍 {location}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0' }}>
          <div className={styles.workerPrice}>
            {price ? `₹${Number(price).toLocaleString()}` : 'Contact'}/day
          </div>
          <div className={styles.workerExp}>🕒 {experience} years</div>
        </div>

        <Link
          to={`/worker/${id}`}
          className={styles.viewButton}
          style={{ textDecoration: 'none' }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
