import { useEffect, useState } from 'react';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css'; // Updated import
import { fetchAdminNotifications, completeTask } from '../services/api';

const Notifications = () => {
  const { setIsLoading } = useLoading();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchAdminNotifications();
        setNotifications(data.filter(n => n.status !== 'Completed'));
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  const handleCompleteTask = async (id) => {
    try {
      const result = await completeTask(id);
      if (result.message) {
        alert('Notification marked as completed');
        setNotifications(notifications.filter(n => n.id !== id));
      } else {
        alert(result.error || 'Failed to complete notification');
      }
    } catch (error) {
      console.error('Error completing notification:', error.message);
      alert('An error occurred while completing the notification');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className={styles.error} style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Notifications</h1>
      <section id="notifications" className={styles.section}>
        <h2 className={styles.h2}>Notifications</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th style={{ width: '10%' }}>Type</th>
              <th style={{ width: '10%' }}>Date</th>
              <th style={{ width: '10%' }}>Status</th>
              <th style={{ width: '30%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.length > 0 ? (
              notifications.map(n => (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td>{n.type}</td>
                  <td>{n.createdDate ? new Date(n.createdDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{n.status}</td>
                  <td>
                    <div className={styles['action-buttons']}>
                      <a href={`/admin/notification/${n.id}`}>View</a>
                      <button className={styles.success} onClick={() => handleCompleteTask(n.id)}>
                        Complete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className={styles['no-data']}>No notifications available</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Notifications;