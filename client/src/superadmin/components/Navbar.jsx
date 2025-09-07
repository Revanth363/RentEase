// src/superadmin/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { Menu, X, LogOut, BarChart3 } from 'lucide-react';
import { API_URL } from '../../services/api'; // your API base URL
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const navItems = [
    { path: '/superadmin', label: 'Overview' },
    { path: '/superadmin/financial-analytics', label: 'Financial Analytics' },
    { path: '/superadmin/tenant-payments', label: 'Tenant Payments' },
    { path: '/superadmin/owner-earnings', label: 'Owner Earnings' },
    { path: '/superadmin/worker-earnings', label: 'Worker Earnings' },
    { path: '/superadmin/executives', label: 'Executives' },
    { path: '/superadmin/system-settings', label: 'System Settings' },
    { path: '/superadmin/audit-logs', label: 'Audit Logs' },
  ];

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const dispatch = useDispatch();

  // Real logout handler (calls backend /api/logout)
  const handleLogout = async () => {
    // Optional: show confirmation (uncomment if you want)
    // if (!window.confirm('Are you sure you want to logout?')) return;
    try {
      // Use centralized thunk which calls /api/logout and clears local state
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      // If server logout fails, continue to clear client state and navigate
      console.warn('Server logout failed (continuing to clear client state):', error);
    } finally {
      try { document.cookie = 'accessToken=; Max-Age=0; path=/;'; } catch (e) {
        console.error(e);
        // intentionally ignored
      }
      navigate('/login', { replace: true });
    }
  };

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Logo */}
        <Link to="/superadmin" className={styles.logo}>
          <BarChart3 size={28} />
          <span>Super Admin</span>
        </Link>

        {/* Mobile toggle button */}
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Navigation links */}
        <div
          ref={menuRef}
          className={`${styles.navLinks} ${mobileMenuOpen ? styles.mobileOpen : ''}`}
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navLink} ${
                location.pathname === item.path ? styles.active : ''
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          {/* Logout button */}
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}