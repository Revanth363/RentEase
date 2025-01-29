import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import '../assets/css/payment-view.css';

const API_URL = '/api';

const WorkerPaymentView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkerPayment = async () => {
      try {
        setLoading(true);
        setIsLoading(true);

        const response = await axios.get(`${API_URL}/admin/worker-payment/${id}`, {
          withCredentials: true,
        });

        // Your controller likely returns { payment: {...} } or direct object
        setPayment(response.data.payment || response.data);
      } catch (err) {
        console.error('Error fetching worker payment:', err);
        setError(
          err.response?.status === 404
            ? 'Worker payment not found'
            : err.response?.status === 401
            ? 'Session expired. Please log in again.'
            : 'Failed to load worker payment details'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    fetchWorkerPayment();
  }, [id, setIsLoading]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;
  if (!payment) return null;

  return (
    <div className="payment-view">
      <h2>Worker Payment Details - #{payment.id}</h2>
      <div className="payment-details">

        <div className="detail-group">
          <h3>Payment Information</h3>
          <p><strong>ID:</strong> {payment.id}</p>
          <p><strong>Amount:</strong> ₹{payment.amount?.toFixed(2) || '0.00'}</p>
          <p><strong>Status:</strong> <span className={`status-${payment.status?.toLowerCase() || ''}`}>{payment.status || 'N/A'}</span></p>
          <p><strong>Paid On:</strong> {payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : 'N/A'}</p>
          <p><strong>Method:</strong> {payment.paymentMethod || 'N/A'}</p>
          <p><strong>Transaction ID:</strong> {payment.transactionId || 'N/A'}</p>
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
          <h3>Tenant (Paid By)</h3>
          {payment.paidBy ? (
            <>
              <p>
                <strong>Name:</strong>{' '}
                <a href={`/admin/user/${payment.paidBy._id}/tenant`}>
                  {payment.paidBy.firstName} {payment.paidBy.lastName}
                </a>
              </p>
              <p><strong>Email:</strong> {payment.paidBy.email}</p>
              <p><strong>Phone:</strong> {payment.paidBy.phone}</p>
            </>
          ) : payment.paidByName ? (
            <p><strong>Name:</strong> {payment.paidByName}</p>
          ) : (
            <p>No tenant information</p>
          )}
        </div>

        <div className="detail-group">
          <h3>Worker (Received By)</h3>
          {payment.receivedBy ? (
            <>
              <p>
                <strong>Name:</strong>{' '}
                <a href={`/admin/user/${payment.receivedBy._id}/worker`}>
                  {payment.receivedBy.firstName} {payment.receivedBy.lastName}
                </a>
              </p>
              <p><strong>Email:</strong> {payment.receivedBy.email}</p>
              <p><strong>Phone:</strong> {payment.receivedBy.phone}</p>
            </>
          ) : payment.receivedByName ? (
            <p><strong>Name:</strong> {payment.receivedByName}</p>
          ) : (
            <p>No worker information</p>
          )}
        </div>

        <div className="detail-group">
          <h3>Actions</h3>
          <div className="action-buttons">
            <a href="/admin/worker-payments" className="btn">
              ← Back to Worker Payments
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WorkerPaymentView;