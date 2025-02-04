// src/pages/admin/NotificationView.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import '../assets/css/notification-view.css'; // ← Correct scoped CSS

const API_URL = '/api';

const NotificationView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        setLoading(true);
        setIsLoading(true);

        const response = await axios.get(`${API_URL}/admin/notification/${id}`, {
          withCredentials: true,
        });

        setNotification(response.data.notification || response.data);
      } catch (err) {
        console.error('Error fetching notification:', err);
        setError(
          err.response?.status === 404
            ? 'Notification not found'
            : err.response?.status === 401
            ? 'Session expired. Please log in again.'
            : 'Failed to load notification details'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    fetchNotification();
  }, [id, setIsLoading]);

  const completeNotification = async (notificationId) => {
    if (!window.confirm('Mark this notification as completed?')) return;

    try {
      setIsLoading(true);

      const response = await axios.post(
        `${API_URL}/admin/notification/${notificationId}/complete`,
        {},
        { withCredentials: true }
      );

      if (response.data.success || response.data.message) {
        alert('Notification marked as completed!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error completing notification:', error);
      alert('Failed to complete notification');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>
        {error}
      </div>
    );
  if (!notification) return null;

  const status = notification.status || 'Pending';
  const statusClass = `status-${status.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="notification-view-page">
      <div className="notification-view">
        <h2>Notification Details</h2>

        <div className="notification-details">
          <div className="detail-group">
            <h3>Notification Info</h3>
            <p>
              <strong>ID:</strong> {notification._id || notification.id}
            </p>
            <p>
              <strong>Type:</strong> {notification.type || 'General'}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={statusClass}>{status}</span>
            </p>
            <p>
              <strong>Created:</strong>{' '}
              {new Date(notification.createdAt || notification.createdDate).toLocaleString()}
            </p>
            <p>
              <strong>Message:</strong> {notification.message || 'No message'}
            </p>
          </div>

          <div className="detail-group">
            <h3>Recipient</h3>
            {notification.recipient ? (
              <>
                <p>
                  <strong>Name:</strong>{' '}
                  <a
                    href={`/admin/user/${notification.recipient._id}/${notification.recipient.userType?.toLowerCase()}`}
                  >
                    {notification.recipient.firstName} {notification.recipient.lastName}
                  </a>
                </p>
                <p>
                  <strong>Email:</strong> {notification.recipient.email}
                </p>
                <p>
                  <strong>Role:</strong> {notification.recipient.userType || 'N/A'}
                </p>
              </>
            ) : (
              <p>No recipient assigned</p>
            )}
          </div>

          {notification.worker && (
            <div className="detail-group">
              <h3>Related Worker</h3>
              <p>
                <strong>Name:</strong>{' '}
                <a href={`/admin/user/${notification.worker._id}/worker`}>
                  {notification.worker.firstName} {notification.worker.lastName}
                </a>
              </p>
              <p>
                <strong>Service:</strong> {notification.worker.serviceType || 'N/A'}
              </p>
            </div>
          )}

          <div className="detail-group">
            <h3>Actions</h3>
            <div className="action-buttons">
              {status !== 'Completed' && (
                <button
                  className="success"
                  onClick={() => completeNotification(notification._id || notification.id)}
                >
                  Mark as Completed
                </button>
              )}
              <a href="/admin" className="btn">
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationView;