import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchPropertyDetails } from '../services/api';
import '../assets/css/admin.css';

const PropertyView = () => {
  const { id } = useParams();
  const { setIsLoading } = useLoading();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchPropertyDetails(id);
        setProperty(data);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError('Failed to load property details. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, setIsLoading]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;
  if (!property) return null;

  return (
    <div className="property-view" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <h2>Property Details - {property.name}</h2>
      <div className="property-details">
        <div className="detail-group">
          <h3>Basic Information</h3>
          <p><strong>ID:</strong> {property._id}</p>
          <p><strong>Name:</strong> {property.name}</p>
          <p>
            <strong>Owner:</strong>{' '}
            {property.owner && property.owner._id ? (
              <a href={`/admin/user/${property.owner._id}/owner`}>
                {property.owner.firstName} {property.owner.lastName}
              </a>
            ) : (
              'N/A'
            )}
          </p>
          <p><strong>Owner Email:</strong> {property.owner && property.owner.email ? property.owner.email : 'N/A'}</p>
          <p><strong>Location:</strong> {property.location}</p>
          <p><strong>Address:</strong> {property.address}</p>
          <p><strong>Type:</strong> {property.type}</p>
          <p><strong>Subtype:</strong> {property.subtype}</p>
        </div>
        <div className="detail-group">
          <h3>Rental Information</h3>
          <p><strong>Status:</strong> {property.status}</p>
          <p><strong>Rented:</strong> {property.isRented ? 'Yes' : 'No'}</p>
          {property.tenantId && property.tenantId._id ? (
            <>
              <p>
                <strong>Tenant:</strong>{' '}
                <a href={`/admin/user/${property.tenantId._id}/tenant`}>
                  {property.tenantId.firstName} {property.tenantId.lastName}
                </a>
              </p>
              <p><strong>Tenant Email:</strong> {property.tenantId.email}</p>
            </>
          ) : (
            <p><strong>Tenant:</strong> Available</p>
          )}
          <p><strong>Price:</strong> ₹{Number(property.price).toFixed(2)}</p>
          <p><strong>Security Deposit:</strong> ₹{Number(property.securityDeposit).toFixed(2)}</p>
          <p><strong>Maintenance:</strong> ₹{Number(property.maintenance).toFixed(2)}</p>
          <p><strong>Available From:</strong> {new Date(property.availableFrom).toLocaleDateString()}</p>
          <p><strong>Lease Duration:</strong> {property.leaseDuration} months</p>
        </div>
        <div className="detail-group">
          <h3>Property Details</h3>
          <p><strong>Beds:</strong> {property.beds}</p>
          <p><strong>Baths:</strong> {property.baths}</p>
          <p><strong>Furnished:</strong> {property.furnished}</p>
          <p><strong>Amenities:</strong> {Array.isArray(property.amenities) ? property.amenities.join(', ') : property.amenities}</p>
          <p><strong>Description:</strong> {property.description}</p>
        </div>
        <div className="detail-group">
          <h3>Contact Information</h3>
          <p><strong>Contact Number:</strong> {property.contactNumber}</p>
          <p><strong>Alternative Number:</strong> {property.alternativeNumber}</p>
          <p><strong>Email:</strong> {property.contactEmail}</p>
        </div>
        <div className="detail-group">
          <h3>Verification Status</h3>
          <p><strong>Verified:</strong> {property.isVerified ? 'Yes' : 'No'}</p>
          <p><strong>Created:</strong> {new Date(property.createdAt).toLocaleDateString()}</p>
          <p><strong>Updated:</strong> {new Date(property.updatedAt).toLocaleDateString()}</p>
        </div>
        {property.images && property.images.length > 0 && (
          <div className="detail-group">
            <h3>Images</h3>
            <div className="image-gallery" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
              {property.images.map((img, index) => (
                <img 
                  key={index} 
                  src={typeof img === 'string' ? img : img.url} 
                  alt="Property Image" 
                  style={{ maxWidth: '100%', margin: '10px' }} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="action-buttons">
        <a href="/admin" className="btn">
          Back to List
        </a>
      </div>
    </div>
  );
};

export default PropertyView;