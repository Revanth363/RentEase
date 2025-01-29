import { useEffect, useState } from 'react';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css'; // Updated import
import { fetchAdminMaintenanceRequests, completeMaintenance } from '../services/api';

const MaintenanceRequests = () => {
  const { setIsLoading } = useLoading();
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchAdminMaintenanceRequests();
        setMaintenanceRequests(data);
      } catch (err) {
        console.error('Error fetching maintenance requests:', err);
        setError('Failed to load maintenance requests. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  const handleCompleteMaintenance = async (id) => {
    try {
      const result = await completeMaintenance(id);
      if (result.message) {
        alert('Maintenance request completed');
        setMaintenanceRequests(maintenanceRequests.filter(m => m.id !== id));
      } else {
        alert(result.error || 'Failed to complete maintenance request');
      }
    } catch (error) {
      console.error('Error completing maintenance:', error.message);
      alert('An error occurred while completing the maintenance request');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className={styles.error} style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Maintenance Requests</h1>
      <section id="maintenance-requests" className={styles.section}>
        <h2 className={styles.h2}>Maintenance Requests</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th style={{ width: '10%' }}>Issue</th>
              <th style={{ width: '10%' }}>Property</th>
              <th style={{ width: '10%' }}>Tenant</th>
              <th style={{ width: '10%' }}>Owner</th>
              <th style={{ width: '10%' }}>Location</th>
              <th style={{ width: '10%' }}>Date</th>
              <th style={{ width: '10%' }}>Status</th>
              <th style={{ width: '12%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceRequests && maintenanceRequests.length > 0 ? (
              maintenanceRequests.map(m => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.issueType}</td>
                  <td><a href={`/admin/property/${m.propertyIdStr}`}>{m.propertyName}</a></td>
                  <td><a href={`/admin/user/${m.tenantIdStr}/tenant`}>{m.tenantName}</a></td>
                  <td>{m.ownerName}</td>
                  <td>{m.location}</td>
                  <td>{m.dateReported ? new Date(m.dateReported).toLocaleDateString() : 'N/A'}</td>
                  <td>{m.status}</td>
                  <td>
                    <div className={styles['action-buttons']}>
                      <a href={`/admin/maintenance/${m.id}`}>View</a>
                      {m.status !== 'Completed' && (
                        <button className={styles.success} onClick={() => handleCompleteMaintenance(m.id)}>
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className={styles['no-data']}>No maintenance requests available</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default MaintenanceRequests;