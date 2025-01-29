import { useEffect, useState } from 'react';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css'; // Updated import
import { fetchAdminMessages } from '../services/api';

const Messages = () => {
  const { setIsLoading } = useLoading();
  const [contactSubmissions, setContactSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchAdminMessages();
        setContactSubmissions(data);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className={styles.error} style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Contact Us Messages</h1>
      <section id="messages" className={styles.section}>
        <h2 className={styles.h2}>Contact Us Messages</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '10%' }}>ID</th>
              <th style={{ width: '20%' }}>Name</th>
              <th style={{ width: '20%' }}>Email</th>
              <th style={{ width: '15%' }}>Phone</th>
              <th style={{ width: '15%' }}>Subject</th>
              <th style={{ width: '20%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contactSubmissions && contactSubmissions.length > 0 ? (
              contactSubmissions.map(s => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.phone || 'N/A'}</td>
                  <td>{s.subject}</td>
                  <td>
                    <div className={styles['action-buttons']}>
                      <a href={`/admin/message/${s.id}`}>View</a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={styles['no-data']}>No messages available</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Messages;