import { useEffect, useState } from 'react';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css'; // Updated import
import { fetchAdminWorkerPayments } from '../services/api';

const WorkerPayments = () => {
  const { setIsLoading } = useLoading();
  const [workerPayments, setWorkerPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchAdminWorkerPayments();
        setWorkerPayments(data);
      } catch (err) {
        console.error('Error fetching worker payments:', err);
        setError('Failed to load worker payments. Please try again later.');
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
      <h1 className={styles.h1}>Worker Payments</h1>
      <section id="worker-payments" className={styles.section}>
        <h2 className={styles.h2}>Worker Payments</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th style={{ width: '10%' }}>Paid By</th>
              <th style={{ width: '10%' }}>Received By</th>
              <th style={{ width: '10%' }}>Amount</th>
              <th style={{ width: '10%' }}>Status</th>
              <th style={{ width: '10%' }}>Date</th>
              <th style={{ width: '10%' }}>Method</th>
              <th style={{ width: '10%' }}>Transaction</th>
              <th style={{ width: '20%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workerPayments.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  <a href={`/admin/user/${p.paidById}/tenant`}>
                    {p.paidByName ? p.paidByName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'N/A'}
                  </a>
                </td>
                <td>
                  <a href={`/admin/user/${p.receivedById}/worker`}>
                    {p.receivedByName ? p.receivedByName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'N/A'}
                  </a>
                </td>
                <td>₹{p.amount ? p.amount.toFixed(2) : 'N/A'}</td>
                <td>{p.status || 'N/A'}</td>
                <td>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'}</td>
                <td>{p.paymentMethod ? p.paymentMethod.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'N/A'}</td>
                <td>{p.transactionId ? p.transactionId.replace(/&/g, '&amp;').replace(/>/g, '&gt;') : 'N/A'}</td>
                <td>
                  <div className={styles['action-buttons']}>
                    <a href={`/admin/worker-payment/${p.id}`}>View</a>
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

export default WorkerPayments;