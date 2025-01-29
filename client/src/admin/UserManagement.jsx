import { useEffect, useState } from 'react';
import { useLoading } from '../LoadingContext';
import LoadingSpinner from '../components/LoadingSpinner';
import styles from '../assets/css/AdminDashboard.module.css'; // Updated import
import { fetchAdminUsers, deleteUser, suspendUser } from '../services/api';

const UserManagement = () => {
  const { setIsLoading } = useLoading();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setIsLoading(true);
        const data = await fetchAdminUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setIsLoading]);

  const handleDeleteUser = async (id, userType) => {
    if (window.confirm(`Are you sure you want to delete this ${userType}? This action cannot be undone.`)) {
      try {
        console.log(`Deleting user with ID: ${id}, userType: ${userType}`);
        const result = await deleteUser(id, userType);
        if (result.message) {
          alert(result.message || 'User deleted successfully');
          setUsers(users.filter(u => u.id !== id));
        } else {
          alert(result.message || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error.message);
        alert('An error occurred while deleting the user');
      }
    }
  };

  const handleSuspendUser = async (id, userType, status) => {
    try {
      console.log(`Updating user status: ID: ${id}, userType: ${userType}, status: ${status}`);
      const result = await suspendUser(id, userType, status);
      if (result.message) {
        alert(result.message || `User ${status === 'Active' ? 'activated' : 'suspended'} successfully`);
        setUsers(users.map(u => u.id === id ? { ...u, status } : u));
      } else {
        alert(result.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error.message);
      alert('An error occurred while updating user status');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className={styles.error} style={{ textAlign: 'center', padding: '50px', color: '#ef4444' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>User Management</h1>
      <section id="user-management" className={styles.section}>
        <h2 className={styles.h2}>User Management</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th style={{ width: '10%' }}>Name</th>
              <th style={{ width: '8%' }}>Role</th>
              <th style={{ width: '10%' }}>Email</th>
              <th style={{ width: '10%' }}>Phone</th>
              <th style={{ width: '10%' }}>Address</th>
              <th style={{ width: '8%' }}>Registered</th>
              <th style={{ width: '8%' }}>Status</th>
              <th style={{ width: '8%' }}>Bookings</th>
              <th style={{ width: '8%' }}>Service</th>
              <th style={{ width: '8%' }}>Exp</th>
              <th style={{ width: '8%' }}>Properties</th>
              <th style={{ width: '8%' }}>Owner/House</th>
              <th style={{ width: '8%' }}>Account</th>
              <th style={{ width: '8%' }}>UPI</th>
              <th style={{ width: '18%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.userType}</td>
                <td>{u.email}</td>
                <td>{u.phone}</td>
                <td>{u.address || 'N/A'}</td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>{u.status}</td>
                <td>{u.tenantBookings || u.clientCount || 'N/A'}</td>
                <td>{u.serviceType || 'N/A'}</td>
                <td>{u.experience ? u.experience + ' yrs' : 'N/A'}</td>
                <td>{u.numProperties || u.propertyCount || 'N/A'}</td>
                <td>{u.ownerName || 'N/A'}</td>
                <td>{u.accountNo || 'N/A'}</td>
                <td>{u.upiid || 'N/A'}</td>
                <td>
                  <div className={styles['action-buttons']}>
                    <a href={`/admin/user/${u.id}/${u.userType}`}>View</a>
                    <button
                      className={styles.success}
                      onClick={() => handleSuspendUser(u.id, u.userType, u.status === 'Active' ? 'Suspended' : 'Active')}
                    >
                      {u.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      className={styles.danger}
                      onClick={() => handleDeleteUser(u.id, u.userType)}
                    >
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

export default UserManagement;