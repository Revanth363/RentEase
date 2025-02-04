import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';
import '../assets/css/maintenance-view.css';

const API_URL = '/api';

const MaintenanceView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        setLoading(true);
        setIsLoading(true);

        const response = await axios.get(`${API_URL}/admin/maintenance/${id}`, {
          withCredentials: true,
        });

        setRequest(response.data);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? 'Maintenance request not found'
            : 'Failed to load details'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    fetchMaintenance();
  }, [id, setIsLoading]);

  const completeMaintenance = async () => {
    if (!window.confirm('Mark as completed?')) return;
    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/admin/maintenance/${id}/complete`, {}, { withCredentials: true });
      alert('Completed!');
      window.location.reload();
    } catch (err) {
      alert('Failed to complete');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
  if (!request) return null;

  const displayId = request.id.slice(-8).toUpperCase();

  return (
    <div className="maintenance-view-page">
    <div className="maintenance-view">
      <h2>Maintenance Request #{displayId}</h2>

      <div className="maintenance-details">

        <div className="detail-group">
          <h3>Request Details</h3>
          <p><strong>Issue Type:</strong> {request.issueType}</p>
          <p><strong>Status:</strong> <span className={`status-pill status-${request.status.toLowerCase()}`}>{request.status}</span></p>
          <p><strong>Reported:</strong> {new Date(request.dateReported).toLocaleString()}</p>
          {request.scheduledDate && <p><strong>Scheduled:</strong> {new Date(request.scheduledDate).toLocaleString()}</p>}
          {request.completionDate && <p><strong>Completed:</strong> {new Date(request.completionDate).toLocaleString()}</p>}
          <p><strong>Description:</strong> {request.description}</p>
          {request.location && <p><strong>Location:</strong> {request.location}</p>}
        </div>

        {request.propertyId && (
          <div className="detail-group">
            <h3>Property</h3>
            <p><strong>Name:</strong> <a href={`/admin/property/${request.propertyId._id}`}>{request.propertyId.name}</a></p>
            <p><strong>Location:</strong> {request.propertyId.location}</p>
            <p><strong>Address:</strong> {request.propertyId.address}</p>
          </div>
        )}

        {request.tenantId && (
          <div className="detail-group">
            <h3>Tenant (Reporter)</h3>
            <p><strong>Name:</strong> <a href={`/admin/user/${request.tenantId._id}/tenant`}>
              {request.tenantId.firstName} {request.tenantId.lastName}
            </a></p>
            <p><strong>Email:</strong> {request.tenantId.email}</p>
            <p><strong>Phone:</strong> {request.tenantId.phone}</p>
          </div>
        )}

        {request.propertyId?.owner && (
          <div className="detail-group">
            <h3>Property Owner</h3>
            <p><strong>Name:</strong> <a href={`/admin/user/${request.propertyId.owner._id}/owner`}>
              {request.propertyId.owner.firstName} {request.propertyId.owner.lastName}
            </a></p>
            <p><strong>Email:</strong> {request.propertyId.owner.email}</p>
            <p><strong>Phone:</strong> {request.propertyId.owner.phone}</p>
          </div>
        )}

        {request.assignedWorkerId && (
          <div className="detail-group">
            <h3>Assigned Worker</h3>
            <p><strong>Name:</strong> <a href={`/admin/user/${request.assignedWorkerId._id}/worker`}>
              {request.assignedWorkerId.firstName} {request.assignedWorkerId.lastName}
            </a></p>
            <p><strong>Service:</strong> {request.assignedWorkerId.serviceType}</p>
          </div>
        )}

        <div className="detail-group">
          <h3>Actions</h3>
          <div className="action-buttons">
            {request.status !== 'Completed' && (
              <button className="success" onClick={completeMaintenance}>
                Mark as Completed
              </button>
            )}
            <a href="/admin/maintenance" className="btn">Back to List</a>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
};

export default MaintenanceView;