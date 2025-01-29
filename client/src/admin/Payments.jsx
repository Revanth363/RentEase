import { useEffect, useState } from 'react';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css'; // Updated import
import { fetchAdminPayments, refundPayment, retryPayment } from '../services/api';

const Payments = () => {
  const { setIsLoading } = useLoading();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchAdminPayments();
        setPayments(data);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payments. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  const handleRefundPayment = async (id) => {
    if (window.confirm('Are you sure you want to issue a refund for this payment?')) {
      try {
        const result = await refundPayment(id);
        if (result.message) {
          alert(result.message || 'Refund processed successfully');
          setPayments(payments.map(p => p.id === id ? { ...p, status: 'Refunded' } : p));
        } else {
          alert(result.error || 'Failed to process refund');
        }
      } catch (error) {
        console.error('Error processing refund:', error.message);
        alert('An error occurred while processing the refund');
      }
    }
  };

  const handleRetryPayment = async (id) => {
    try {
      const result = await retryPayment(id);
      if (result.message) {
        alert(result.message || 'Payment retry initiated');
        setPayments(payments.map(p => p.id === id ? { ...p, status: 'Pending' } : p));
      } else {
        alert(result.error || 'Failed to retry payment');
      }
    } catch (error) {
      console.error('Error retrying payment:', error.message);
      alert('An error occurred while retrying the payment');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className={styles.error} style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Payments and Transactions</h1>
      <section id="payments" className={styles.section}>
        <h2 className={styles.h2}>Payments and Transactions</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th style={{ width: '10%' }}>User</th>
              <th style={{ width: '10%' }}>Amount</th>
              <th style={{ width: '10%' }}>Status</th>
              <th style={{ width: '10%' }}>Date</th>
              <th style={{ width: '10%' }}>Method</th>
              <th style={{ width: '10%' }}>Transaction</th>
              <th style={{ width: '20%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td><a href={`/admin/user/${p.user}/tenant`}>{p.userName || 'N/A'}</a></td>
                <td>₹{p.amount?.toFixed(2)}</td>
                <td>{p.status}</td>
                <td>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'}</td>
                <td>{p.paymentMethod || 'N/A'}</td>
                <td>{p.transactionId || 'N/A'}</td>
                <td>
                  <div className={styles['action-buttons']}>
                    <a href={`/admin/payment/${p.id}`}>View</a>
                    {p.status === 'Completed' && (
                      <button className={styles.danger} onClick={() => handleRefundPayment(p.id)}>
                        Refund
                      </button>
                    )}
                    {p.status === 'Failed' && (
                      <button className={styles.success} onClick={() => handleRetryPayment(p.id)}>
                        Retry
                      </button>
                    )}
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

export default Payments;