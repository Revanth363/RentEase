// src/components/AdminNavbar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styles from '../assets/css/AdminNavbar.module.css';   // ← this path
import { logoutUser } from '../store/slices/authSlice';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      // Use centralized logout thunk so client-side auth state is cleared
      await dispatch(logoutUser()).unwrap();
    } catch (err) {
      // If the server logout fails, still navigate and ensure client state cleared
      console.warn('Logout thunk failed, navigating anyway:', err);
    } finally {
      navigate('/', { replace: true });
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