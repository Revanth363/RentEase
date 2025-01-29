import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import '../assets/css/notification-view.css';

const API_URL = '/api';

const MessageView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        setLoading(true);
        setIsLoading(true);

        const response = await axios.get(`${API_URL}/admin/message/${id}`, {
          withCredentials: true,
        });

        setSubmission(response.data);
      } catch (err) {
        console.error('Error fetching contact message:', err);
        setError(
          err.response?.status === 404
            ? 'Message not found'
            : 'Failed to load message details. Please try again.'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    fetchMessage();
  }, [id, setIsLoading]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ textAlign: 'center', padding: '80px', color: '#ef4444', fontSize: '18px' }}>{error}</div>;
  if (!submission) return null;

  const shortId = submission.id?.slice(-8).toUpperCase() || 'N/A';

  return (
    <div className="notification-view">
      <h2>Contact Message Details #{shortId}</h2>

      <div className="notification-details">

        {/* Message Details */}
        <div className="detail-group">
          <h3>Message Details</h3>

          <div className="info-row">
            <strong>Subject:</strong>
            <span>{submission.subject || 'No subject'}</span>
          </div>

          <div className="info-row">
            <strong>Message:</strong>
            <span className="message-text">
              {submission.message || 'No message'}
            </span>
          </div>

          <div className="info-row">
            <strong>Submitted At:</strong>
            <span>{submission.submittedAtFormatted || 'Date not available'}</span>
          </div>
        </div>

        {/* Sender Information */}
        <div className="detail-group">
          <h3>Sender Information</h3>

          <div className="info-row">
            <strong>Name:</strong>
            <span>{submission.name || 'Anonymous'}</span>
          </div>

          <div className="info-row">
            <strong>Email:</strong>
            <span>{submission.email || 'N/A'}</span>
          </div>

          <div className="info-row">
            <strong>Phone:</strong>
            <span>{submission.phone || 'N/A'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="detail-group">
          <h3>Actions</h3>
          <div className="action-buttons">
            <a href="/admin/contact" className="btn">
              Back to Messages
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MessageView;