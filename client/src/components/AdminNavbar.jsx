// src/components/AdminNavbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import styles from '../assets/css/AdminDashboard.module.css';

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/logout', {
        method: 'GET',
        credentials: 'include',
      });
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav className={styles.navbar}>
      {/* Centered Navigation Links */}
      <div className={styles['nav-links']}>
        <Link to="/admin">Overview</Link>
        <Link to="/admin/property-management">Properties</Link>
        <Link to="/admin/user-management">Users</Link>
        <Link to="/admin/service-bookings">Bookings</Link>
        <Link to="/admin/payments">Payments</Link>
        <Link to="/admin/worker-payments">Worker Payments</Link>
        <Link to="/admin/notifications">Notifications</Link>
        <Link to="/admin/maintenance-requests">Maintenance</Link>
        <Link to="/admin/messages">Messages</Link>
      </div>

      {/* LOGOUT BUTTON — Styled only here, no CSS file changes */}
      <button
        onClick={handleLogout}
        style={{
          marginLeft: 'auto',
          padding: '7px 26px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          fontSize: '14.5px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(220, 53, 69, 0.35)',
          transition: 'all 0.2s ease',
          minWidth: '100px',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#c82333';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#dc3545';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.35)';
        }}
      >
        Logout
      </button>
    </nav>
  );
};

export default AdminNavbar;