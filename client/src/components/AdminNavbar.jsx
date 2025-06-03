// src/components/AdminNavbar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import styles from '../assets/css/AdminNavbar.module.css';   // ← this path

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
      <div className={styles.logo}>Operations Executive</div>

      <div className={styles.navLinks}>
        

        <NavLink
          to="/admin/property-management"
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Properties
        </NavLink>

        <NavLink
          to="/admin/user-management"
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Users
        </NavLink>

        <NavLink
          to="/admin/service-bookings"
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Bookings
        </NavLink>

        <NavLink
          to="/admin/payments"
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Payments
        </NavLink>

        <NavLink
          to="/admin/worker-payments"
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Worker Payments
        </NavLink>

        <NavLink
          to="/admin/notifications"
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Notifications
        </NavLink>

        <NavLink
          to="/admin/maintenance-requests"
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Maintenance
        </NavLink>

        <NavLink
          to="/admin/messages"
          className={({ isActive }) => 
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          Messages
        </NavLink>

        <button 
          onClick={handleLogout} 
          className={styles.logoutBtn}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default AdminNavbar;