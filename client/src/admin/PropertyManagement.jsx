import { useEffect, useState } from 'react';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css'; // Updated import
import { fetchAdminProperties, deleteProperty, toggleVerify } from '../services/api';

const PropertyManagement = () => {
  const { setIsLoading } = useLoading();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchAdminProperties();
        setProperties(data);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  const handleDeleteProperty = async (id) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      try {
        console.log(`Deleting property with ID: ${id}`);
        const result = await deleteProperty(id);
        if (result.message) {
          alert(result.message || 'Property deleted successfully');
          setProperties(properties.filter(p => p._id !== id));
        } else {
          alert(result.message || 'Failed to delete property');
        }
      } catch (error) {
        console.error('Error deleting property:', error.message);
        alert('An error occurred while deleting the property');
      }
    }
  };

  const handleToggleVerify = async (id, isVerified) => {
    console.log(`Toggling verification for property ID: ${id}, isVerified: ${isVerified}`);
    try {
      const result = await toggleVerify(id, isVerified);
      if (result.message) {
        alert(`Property ${isVerified ? 'verified' : 'unverified'} successfully`);
        setProperties(properties.map(p => p._id === id ? { ...p, isVerified } : p));
      } else {
        console.error('Toggle verify failed:', result.message);
        alert(`Failed to update verification status: ${result.message}`);
      }
    } catch (error) {
      console.error('Toggle verify error:', error);
      alert('Error updating verification status');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className={styles.error} style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Property Management</h1>
      <section id="property-management" className={styles.section}>
        <h2 className={styles.h2}>Property Management</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th style={{ width: '10%' }}>Name</th>
              <th style={{ width: '10%' }}>Owner</th>
              <th style={{ width: '10%' }}>Location</th>
              <th style={{ width: '8%' }}>Type</th>
              <th style={{ width: '8%' }}>Subtype</th>
              <th style={{ width: '8%' }}>Status</th>
              <th style={{ width: '8%' }}>Rented</th>
              <th style={{ width: '10%' }}>Tenant</th>
              <th style={{ width: '10%' }}>Workers</th>
              <th style={{ width: '8%' }}>Price</th>
              <th style={{ width: '8%' }}>Created</th>
              <th style={{ width: '8%' }}>Updated</th>
              <th style={{ width: '8%' }}>Verified</th>
              <th style={{ width: '20%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td><a href={`/admin/user/${p.ownerIdStr}/owner`}>{p.ownerName}</a></td>
                <td>{p.location}</td>
                <td>{p.type}</td>
                <td>{p.subtype}</td>
                <td>{p.status}</td>
                <td>{p.isRented ? 'Yes' : 'No'}</td>
                <td>
                  {p.tenantIdStr ? (
                    <a href={`/admin/user/${p.tenantIdStr}/tenant`}>{p.tenantName}</a>
                  ) : (
                    'Available'
                  )}
                </td>
                <td>{p.activeWorkers?.length ? p.activeWorkers.map(w => w.name).join(', ') : 'None'}</td>
                <td>₹{p.price ? Number(p.price).toFixed(2) : 'N/A'}</td>
                <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'N/A'}</td>
                <td>{p.isVerified ? 'Yes' : 'No'}</td>
                <td>
                  <div className={styles['action-buttons']}>
                    <a href={`/admin/property/${p.id}`}>View</a>
                    <a href={`/property?id=${p.id}`}>Site</a>
                    <button
                      className={styles.success}
                      onClick={() => handleToggleVerify(p._id, !p.isVerified)}
                    >
                      {p.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                    <button className={styles.danger} onClick={() => handleDeleteProperty(p._id)}>
                      Delete
                    </button>
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

export default PropertyManagement;