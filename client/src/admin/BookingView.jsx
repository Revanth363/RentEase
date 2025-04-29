import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import '../assets/css/booking-view.css';

const BookingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setIsLoading } = useLoading();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Auto-detect booking type from URL path
  const isWorkerBooking = window.location.pathname.includes('worker-booking');
  const bookingType = isWorkerBooking ? 'worker' : 'property';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        
        // Determine which API to call based on booking type
        let data;
        if (bookingType === 'worker') {
          data = await fetchWorkerBookingDetails(id);
        } else {
          data = await fetchBookingDetails(id);
        }
        
        setBooking(data);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, bookingType, setIsLoading]);

  const handleApprove = async (bookingId) => {
    try {
      setIsLoading(true);
      let result;
      
      if (bookingType === 'worker') {
        result = await approveWorkerBooking(bookingId);
      } else {
        result = await approveBooking(bookingId);
      }
      
      if (result.message || result.success) {
        alert(`${bookingType === 'worker' ? 'Service' : 'Property'} booking approved successfully!`);
        window.location.reload();
      } else {
        alert('An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (bookingId) => {
    try {
      setIsLoading(true);
      let result;
      
      if (bookingType === 'worker') {
        result = await declineWorkerBooking(bookingId);
      } else {
        result = await rejectBooking(bookingId);
      }
      
      if (result.message || result.success) {
        alert(`${bookingType === 'worker' ? 'Service' : 'Property'} booking ${bookingType === 'worker' ? 'declined' : 'rejected'} successfully!`);
        window.location.reload();
      } else {
        alert('An error occurred. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;
  if (!booking) return null;

  // Render for Property Booking
  if (bookingType === 'property') {
    return (
      <div className="booking-view-page">
        <div className="booking-view" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
          <h2>Property Booking Details - {booking.id || booking._id}</h2>
          <div className="booking-details">
            <div className="detail-group">
              <h3>Booking Information</h3>
              <p><strong>Status:</strong> {booking.status}</p>
              <p><strong>Booking Date:</strong> {new Date(booking.bookingDate).toLocaleString()}</p>
              <p><strong>Start Date:</strong> {new Date(booking.startDate).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(booking.endDate).toLocaleDateString()}</p>
              <p><strong>Amount:</strong> ₹{booking.amount ? booking.amount.toFixed(2) : 'N/A'}</p>
            </div>
            
            <div className="detail-group">
              <h3>Tenant Information</h3>
              <p>
                <strong>Name:</strong>{' '}
                <a href={`/admin/user/${booking.user._id}/tenant`}>
                  {booking.user.firstName} {booking.user.lastName}
                </a>
              </p>
              <p><strong>Email:</strong> {booking.user.email}</p>
              <p><strong>Phone:</strong> {booking.user.phone}</p>
            </div>
            
            <div className="detail-group">
              <h3>Property Information</h3>
              <p>
                <strong>Name:</strong>{' '}
                <a href={`/admin/property/${booking.property._id}`}>{booking.property.name}</a>
              </p>
              <p><strong>Location:</strong> {booking.property.location}</p>
              <p><strong>Address:</strong> {booking.property.address}</p>
              <p><strong>Price:</strong> ₹{booking.property.price ? booking.property.price.toFixed(2) : 'N/A'}</p>
            </div>
            
            {booking.assignedWorker && (
              <div className="detail-group">
                <h3>Assigned Worker</h3>
                <p>
                  <strong>Name:</strong>{' '}
                  <a href={`/admin/user/${booking.assignedWorker._id}/worker`}>
                    {booking.assignedWorker.firstName} {booking.assignedWorker.lastName}
                  </a>
                </p>
                <p><strong>Service Type:</strong> {booking.assignedWorker.serviceType}</p>
              </div>
            )}
            
            <div className="detail-group">
              <h3>Actions</h3>
              <div className="action-buttons">
                {booking.status === 'Pending' && (
                  <>
                    <button className="success" onClick={() => handleApprove(booking.id || booking._id)}>
                      Approve
                    </button>
                    <button className="danger" onClick={() => handleReject(booking.id || booking._id)}>
                      Reject
                    </button>
                  </>
                )}
                <button 
                  className="btn" 
                  onClick={() => navigate('/admin/service-bookings')}
                  style={{ background: '#6c757d', color: 'white', border: 'none' }}
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render for Worker/Service Booking
  return (
    <div className="booking-view-page">
      <div className="booking-view" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        <h2>Service Booking Details - {booking.id || booking._id}</h2>
        <div className="booking-details">
          <div className="detail-group">
            <h3>Booking Information</h3>
            <p><strong>Status:</strong> {booking.status}</p>
            <p><strong>Service Type:</strong> {booking.serviceType}</p>
            <p><strong>Booking Date:</strong> {new Date(booking.bookingDate).toLocaleString()}</p>
          </div>
          
          <div className="detail-group">
            <h3>Tenant Information</h3>
            {booking.tenant ? (
              <>
                <p>
                  <strong>Name:</strong>{' '}
                  <a href={`/admin/user/${booking.tenant._id}/tenant`}>
                    {booking.tenant.firstName} {booking.tenant.lastName}
                  </a>
                </p>
                <p><strong>Email:</strong> {booking.tenant.email}</p>
                <p><strong>Phone:</strong> {booking.tenant.phone}</p>
                <p><strong>Location:</strong> {booking.tenant.location || 'N/A'}</p>
              </>
            ) : (
              <>
                <p><strong>Name:</strong> {booking.tenantName || 'N/A'}</p>
                <p><strong>Address:</strong> {booking.tenantAddress || 'N/A'}</p>
              </>
            )}
          </div>
          
          <div className="detail-group">
            <h3>Worker Information</h3>
            {booking.worker ? (
              <>
                <p>
                  <strong>Name:</strong>{' '}
                  <a href={`/admin/user/${booking.worker._id}/worker`}>
                    {booking.worker.firstName} {booking.worker.lastName}
                  </a>
                </p>
                <p><strong>Service Type:</strong> {booking.worker.serviceType}</p>
                <p><strong>Price:</strong> ₹{booking.worker.price ? booking.worker.price.toFixed(2) : 'N/A'}</p>
                <p><strong>Phone:</strong> {booking.worker.phone}</p>
                <p><strong>Location:</strong> {booking.worker.location || 'N/A'}</p>
              </>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No worker assigned yet</p>
            )}
          </div>
          
          <div className="detail-group">
            <h3>Actions</h3>
            <div className="action-buttons">
              {booking.status === 'Pending' && (
                <>
                  <button className="success" onClick={() => handleApprove(booking.id || booking._id)}>
                    Approve
                  </button>
                  <button className="danger" onClick={() => handleReject(booking.id || booking._id)}>
                    Decline
                  </button>
                </>
              )}
              <button 
                className="btn" 
                onClick={() => navigate('/admin/service-bookings')}
                style={{ background: '#6c757d', color: 'white', border: 'none' }}
              >
                Back to List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingView;