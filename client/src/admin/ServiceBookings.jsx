import { useEffect, useState } from 'react';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css'; // Updated import
import { fetchAdminBookings, approveBooking, rejectBooking } from '../services/api';

const ServiceBookings = () => {
  const { setIsLoading } = useLoading();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchAdminBookings();
        setBookings(data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  const handleApproveBooking = async (id) => {
    try {
      const result = await approveBooking(id);
      if (result.message) {
        alert('Booking approved successfully');
        setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Active' } : b));
      } else {
        alert(result.error || 'Failed to approve booking');
      }
    } catch (error) {
      console.error('Error approving booking:', error.message);
      alert('An error occurred while approving the booking');
    }
  };

  const handleRejectBooking = async (id) => {
    if (window.confirm('Are you sure you want to reject this booking?')) {
      try {
        const result = await rejectBooking(id);
        if (result.message) {
          alert('Booking rejected successfully');
          setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Terminated' } : b));
        } else {
          alert(result.error || 'Failed to reject booking');
        }
      } catch (error) {
        console.error('Error rejecting booking:', error.message);
        alert('An error occurred while rejecting the booking');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className={styles.error} style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Bookings</h1>
      <section id="service-bookings" className={styles.section}>
        <h2 className={styles.h2}>Bookings</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th style={{ width: '12%' }}>Tenant</th>
              <th style={{ width: '12%' }}>Property</th>
              <th style={{ width: '12%' }}>Worker</th>
              <th style={{ width: '8%' }}>Status</th>
              <th style={{ width: '8%' }}>Booked</th>
              <th style={{ width: '8%' }}>Start</th>
              <th style={{ width: '8%' }}>End</th>
              <th style={{ width: '8%' }}>Amount</th>
              <th style={{ width: '16%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td><a href={`/admin/user/${b.userId}/tenant`}>{b.userName}</a></td>
                <td><a href={`/admin/property/${b.propertyIdStr}`}>{b.propertyName}</a></td>
                <td>
                  {b.workerId ? (
                    <a href={`/admin/user/${b.workerId}/worker`}>{b.workerName}</a>
                  ) : (
                    'None Assigned'
                  )}
                </td>
                <td>{b.status}</td>
                <td>{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : 'N/A'}</td>
                <td>{b.startDate ? new Date(b.startDate).toLocaleDateString() : 'N/A'}</td>
                <td>{b.endDate ? new Date(b.endDate).toLocaleDateString() : 'N/A'}</td>
                <td>₹{b.price ? b.price.toFixed(2) : 'N/A'}</td>
                <td>
                  <div className={styles['action-buttons']}>
                    <a href={`/admin/booking/${b.id}`}>View</a>
                    {b.status === 'Pending' && (
                      <>
                        <button className={styles.success} onClick={() => handleApproveBooking(b.id)}>
                          Approve
                        </button>
                        <button className={styles.danger} onClick={() => handleRejectBooking(b.id)}>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default ServiceBookings;