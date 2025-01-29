import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleChevronDown } from '@fortawesome/free-solid-svg-icons';
import styles from '../assets/css/Header.module.css';

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/check-session', { withCredentials: true });
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user session:', error);
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeNav = () => {
    setIsNavOpen(false);
  };

  const handleLogout = async () => {
    try {
      await axios.get('/api/logout', { withCredentials: true });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isActive = (path) => {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };

  return (
    <div className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.brandid}>RentEase</div>
        <div className={styles.tagline}>Your One-Stop Rental Solution</div>
      </div>

      <button className={styles['nav-toggle']} onClick={toggleNav}>
        ☰
      </button>
      <div className={`${styles.overlay} ${isNavOpen ? styles.active : ''}`} onClick={closeNav}></div>

      <nav className={`${styles['nav-menu']} ${isNavOpen ? styles.active : ''}`}>
        <Link
          to="/"
          className={`${styles['nav-link']} ${isActive('/') ? styles.active : ''}`}
          onClick={closeNav}
        >
          Home
        </Link>
        <Link
          to="/search"
          className={`${styles['nav-link']} ${isActive('/search') ? styles.active : ''}`}
          onClick={closeNav}
        >
          Properties
        </Link>
        <Link
          to="/workerDetails"
          className={`${styles['nav-link']} ${isActive('/workerDetails') ? styles.active : ''}`}
          onClick={closeNav}
        >
          Services
        </Link>
        <Link
          to="/about_us"
          className={`${styles['nav-link']} ${isActive('/about_us') ? styles.active : ''}`}
          onClick={closeNav}
        >
          About Us
        </Link>
        <Link
          to="/contact_us"
          className={`${styles['nav-link']} ${isActive('/contact_us') ? styles.active : ''}`}
          onClick={closeNav}
        >
          Contact Us
        </Link>
        <Link
          to="/faq"
          className={`${styles['nav-link']} ${isActive('/faq') ? styles.active : ''}`}
          onClick={closeNav}
        >
          FAQs
        </Link>
      </nav>

      <div className={styles.cta}>
        {user ? (
          <div className={styles.dropdown}>
            <a href="#" className={styles['user-greeting']} onClick={toggleDropdown}>
              <span>Hi, {user.firstName}</span>
              <FontAwesomeIcon icon={faCircleChevronDown} />
            </a>
            <div
              className={styles['dropdown-content']}
              style={{ display: isDropdownOpen ? 'block' : 'none' }}
            >
              {user.userType === 'tenant' && (
                <Link to="/tenant/tenant_dashboard" onClick={closeNav}>
                  Dashboard
                </Link>
              )}
              {user.userType === 'owner' && (
                <Link to="/owner_dashboard" onClick={closeNav}>
                  Dashboard
                </Link>
              )}
              {user.userType === 'worker' && (
                <Link to="/worker_dashboard" onClick={closeNav}>
                  Dashboard
                </Link>
              )}
              <a href="#" onClick={handleLogout}>
                Logout
              </a>
            </div>
          </div>
        ) : (
          <Link to="/login" className={styles['login-signup']}>Login/SignUp</Link>
        )}
      </div>
    </div>
  );
};

export default Header;