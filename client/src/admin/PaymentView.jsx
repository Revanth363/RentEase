import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import '../assets/css/payment-view.css';

const API_URL = '/api';

const PaymentView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        setIsLoading(true);

        const response = await axios.get(`${API_URL}/admin/payment/${id}`, {
          withCredentials: true,
        });

        setPayment(response.data.payment || response.data); // controller sends { payment: ... }
      } catch (err) {
        console.error('Error fetching payment:', err);
        setError(
          err.response?.status === 404
            ? 'Payment not found'
            : err.response?.status === 401
            ? 'Session expired. Please log in again.'
            : 'Failed to load payment details'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [id, setIsLoading]);

  const refundPayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to refund this payment?')) return;

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API_URL}/admin/payment/${paymentId}/refund`,
        {},
        { withCredentials: true }
      );

      if (response.data.success || response.data.message) {
        alert('Refund initiated successfully');
        window.location.reload();
      }
    } catch (error) {
      alert('Refund failed: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setIsLoading(false);
    }
  };

  const retryPayment = async (paymentId) => {
    if (!window.confirm('Retry this failed payment?')) return;

    try {
      setIsLoading(true);
      const response = await axios.post(
        `${API_URL}/admin/payment/${paymentId}/retry`,
        {},
        { withCredentials: true }
      );

      if (response.data.success || response.data.message) {
        alert('Payment retry initiated');
        window.location.reload();
      }
    } catch (error) {
      alert('Retry failed: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;
  if (!payment) return null;

  return (
    <div className="payment-view-page">
    <div className="payment-view">
      <h2>Payment Details - #{payment.id}</h2>
      <div className="payment-details">

        <div className="detail-group">
          <h3>Payment Information</h3>
          <p><strong>ID:</strong> {payment.id}</p>
          <p><strong>Amount:</strong> ₹{payment.amount?.toFixed(2) || '0.00'}</p>
          <p><strong>Status:</strong> <span className={`status-${payment.status.toLowerCase()}`}>{payment.status}</span></p>
          <p><strong>Date:</strong> {payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}</p>
          <p><strong>Method:</strong> {payment.paymentMethod || 'N/A'}</p>
          <p><strong>Transaction ID:</strong> {payment.transactionId || 'N/A'}</p>
          <p><strong>Due Date:</strong> {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}</p>
          <p>
            <strong>Receipt:</strong>{' '}
            {payment.receiptUrl ? (
              <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                View Receipt
              </a>
            ) : 'N/A'}
          </p>
        </div>

        <div className="detail-group">
          <h3>User Information</h3>
          {payment.user ? (
            <>
              <p><strong>Name:</strong> <a href={`/admin/user/${payment.user._id}/tenant`}>
                {payment.user.firstName} {payment.user.lastName}
              </a></p>
              <p><strong>Email:</strong> {payment.user.email}</p>
              <p><strong>Phone:</strong> {payment.user.phone}</p>
            </>
          ) : payment.userName ? (
            <p><strong>Name:</strong> {payment.userName}</p>
          ) : (
            <p>No user information</p>
          )}
        </div>

        {payment.booking && (
          <div className="detail-group">
            <h3>Related Booking</h3>
            <p><strong>Booking ID:</strong> <a href={`/admin/booking/${payment.booking._id}`}>
              {payment.booking._id}
            </a></p>
            <p><strong>Property:</strong> {payment.booking.propertyName || 'N/A'}</p>
            <p><strong>Dates:</strong> {payment.booking.startDate ? new Date(payment.booking.startDate).toLocaleDateString() : 'N/A'} →{' '}
              {payment.booking.endDate ? new Date(payment.booking.endDate).toLocaleDateString() : 'N/A'}</p>
          </div>
        )}

        <div className="detail-group">
          <h3>Actions</h3>
          <div className="action-buttons">
            {payment.status === 'Completed' && (
              <button className="danger" onClick={() => refundPayment(payment.id)}>
                Refund Payment
              </button>
            )}
            {payment.status === 'Failed' && (
              <button className="success" onClick={() => retryPayment(payment.id)}>
                Retry Payment
              </button>
            )}
            <a href="/admin/payments" className="btn">Back to Payments List</a>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
};

export default PaymentView;