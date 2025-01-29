// UserView.jsx
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import '../assets/css/user-view.css';

const API_URL = '/api';  // Same as in your services/api.js

const UserView = () => {
  const { id, userType } = useParams();
  const { setIsLoading } = useLoading();
  const [user, setUser] = useState(null);
  const [tenantProperty, setTenantProperty] = useState(null);
  const [ownerProperties, setOwnerProperties] = useState([]);
  const [workerBookings, setWorkerBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setIsLoading(true);

        // This is the correct endpoint — matches your backend exactly
        const response = await axios.get(
          `${API_URL}/admin/user/${id}/${userType}`,
          { withCredentials: true }
        );

        const data = response.data;

        setUser(data);
        setTenantProperty(data.tenantProperty);
        setOwnerProperties(data.ownerProperties || []);
        setWorkerBookings(data.workerBookings || []);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError(
          err.response?.status === 404
            ? 'User not found'
            : err.response?.status === 401
            ? 'Session expired. Please log in again.'
            : 'Failed to load user details'
        );
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id, userType, setIsLoading]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;
  if (!user) return null;

  // Rest of your JSX stays 100% the same — it will work perfectly now
  return (
    <div className="user-view">
      <h2>
        {userType.charAt(0).toUpperCase() + userType.slice(1)} Details - {user.firstName} {user.lastName}
      </h2>
      <div className="user-details">
        <div className="detail-group">
          <h3>Basic Information</h3>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Address:</strong> {user.address || 'N/A'}</p>
          <p><strong>Status:</strong> {user.status}</p>
          <p><strong>Registered:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        {userType === 'tenant' && tenantProperty && (
          <div className="detail-group">
            <h3>Tenant Information</h3>
            <p><strong>Current Rental:</strong></p>
            <div className="relationship-item">
              <p><strong>Property:</strong> <a href={`/admin/property/${tenantProperty._id}`}>{tenantProperty.name}</a></p>
              <p><strong>Location:</strong> {tenantProperty.location}</p>
              <p><strong>Price:</strong> ₹{tenantProperty.price || 'N/A'}/month</p>
              {tenantProperty.owner && (
                <p><strong>Owner:</strong> <a href={`/admin/user/${tenantProperty.owner._id}/owner`}>
                  {tenantProperty.owner.firstName} {tenantProperty.owner.lastName}
                </a></p>
              )}
            </div>
          </div>
        )}

        {userType === 'owner' && ownerProperties.length > 0 && (
          <div className="detail-group">
            <h3>Owner Properties ({ownerProperties.length})</h3>
            {ownerProperties.map(prop => (
              <div key={prop._id} className="relationship-item">
                <p><strong>Property:</strong> <a href={`/admin/property/${prop._id}`}>{prop.name}</a></p>
                <p><strong>Location:</strong> {prop.location}</p>
                {prop.tenant && (
                  <p><strong>Tenant:</strong> <a href={`/admin/user/${prop.tenant._id}/tenant`}>
                    {prop.tenant.firstName} {prop.tenant.lastName}
                  </a></p>
                )}
                {!prop.tenant && <p><strong>Status:</strong> Available</p>}
              </div>
            ))}
          </div>
        )}

        {userType === 'worker' && workerBookings.length > 0 && (
          <div className="detail-group">
            <h3>Active Clients ({workerBookings.length})</h3>
            {workerBookings.map(booking => (
              <div key={booking._id} className="relationship-item">
                <p><strong>Client:</strong> <a href={`/admin/user/${booking.tenant._id}/tenant`}>
                  {booking.tenant.firstName} {booking.tenant.lastName}
                </a></p>
                <p><strong>Property:</strong> {booking.property.name}</p>
                <p><strong>Location:</strong> {booking.property.location}</p>
              </div>
            ))}
          </div>
        )}

        <div className="detail-group">
          <h3>Actions</h3>
          <a href="/admin" className="btn">← Back to Admin Dashboard</a>
        </div>
      </div>
    </div>
  );
};

export default UserView;