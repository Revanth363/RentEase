import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchBookingDetails, approveBooking, rejectBooking } from '../services/api';
import '../assets/css/booking-view.css';

const BookingView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchBookingDetails(id);
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
  }, [id, setIsLoading]);

  const approveBookingAction = async (bookingId) => {
    try {
      setIsLoading(true);
      const result = await approveBooking(bookingId);
      if (result.success) {
        alert('Booking approved successfully!');
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

  const rejectBookingAction = async (bookingId) => {
    try {
      setIsLoading(true);
      const result = await rejectBooking(bookingId);
      if (result.success) {
        alert('Booking rejected successfully!');
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

  return (
    <div className="booking-view" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <h2>Booking Details - {booking._id}</h2>
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
          <h3>User Information</h3>
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
            <h3>Worker Information</h3>
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
                <button className="success" onClick={() => approveBookingAction(booking._id)}>
                  Approve
                </button>
                <button className="danger" onClick={() => rejectBookingAction(booking._id)}>
                  Reject
                </button>
              </>
            )}
            <a href="/admin" className="btn">
              Back to List
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingView;