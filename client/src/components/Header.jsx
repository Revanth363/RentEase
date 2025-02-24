import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../assets/css/Header.css';
import { AuthContext } from '../context/AuthContext';

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { auth } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    // if auth context already loaded, use it
    if (auth && !auth.loading) {
      setUser(auth.user);
      setIsAdmin(!!auth.admin);
      return;
    }
    const fetchUser = async () => {
      try {
        const response = await axios.get('/api/check-session', { withCredentials: true });
        setUser(response.data.user);
        setIsAdmin(!!response.data.admin);
      } catch (error) {
        console.error('Error fetching user session:', error);
        setUser(null);
        setIsAdmin(false);
      }
    };
    fetchUser();
  }, [auth]);

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
    <div id="header">
      <div id="logo">
        <div id="brandid">RentEase</div>
        <div id="tagline">Your One-Stop Rental Solution</div>
      </div>

      <button className="nav-toggle" onClick={toggleNav}>
        ☰
      </button>
      <div id="overlay" className={isNavOpen ? 'active' : ''} onClick={closeNav}></div>

      <nav id="nav-menu" className={isNavOpen ? 'active' : ''}>
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={closeNav}>
          Home
        </Link>
        <Link to="/search" className={`nav-link ${isActive('/search') ? 'active' : ''}`} onClick={closeNav}>
          Properties
        </Link>
        <Link to="/workerDetails" className={`nav-link ${isActive('/workerDetails') ? 'active' : ''}`} onClick={closeNav}>
          Services
        </Link>
        <Link to="/about_us" className={`nav-link ${isActive('/about_us') ? 'active' : ''}`} onClick={closeNav}>
          About Us
        </Link>
        <Link to="/contact_us" className={`nav-link ${isActive('/contact_us') ? 'active' : ''}`} onClick={closeNav}>
          Contact Us
        </Link>
        <Link to="/faq" className={`nav-link ${isActive('/faq') ? 'active' : ''}`} onClick={closeNav}>
          FAQs
        </Link>
      </nav>

      <div className="cta">
        {isAdmin ? (
          <div className="dropdown" id="dropdown">
            <a href="#" className="user-greeting" onClick={toggleDropdown}>
              <span>Admin</span>
              <i className="fa-solid fa-circle-chevron-down"></i>
            </a>
            <div className="dropdown-content" style={{ display: isDropdownOpen ? 'block' : 'none' }}>
              <Link to="/admin/dashboard" onClick={closeNav}>Dashboard</Link>
              <a href="#" onClick={handleLogout}>Logout</a>
            </div>
          </div>
        ) : user ? (
          <div className="dropdown" id="dropdown">
            <a href="#" className="user-greeting" onClick={toggleDropdown}>
              <span>Hi, {user.firstName}</span>
              <i className="fa-solid fa-circle-chevron-down"></i>
            </a>
            <div className="dropdown-content" style={{ display: isDropdownOpen ? 'block' : 'none' }}>
              {user.userType === 'tenant' && (
                <Link to="/tenant/tenant_dashboard" onClick={closeNav}>Dashboard</Link>
              )}
              {user.userType === 'owner' && (
                <Link to="/owner_dashboard" onClick={closeNav}>Dashboard</Link>
              )}
              {user.userType === 'worker' && (
                <Link to="/worker_dashboard" onClick={closeNav}>Dashboard</Link>
              )}
              <a href="#" onClick={handleLogout}>Logout</a>
            </div>
          </div>
        ) : (
          <Link to="/login">Login/SignUp</Link>
        )}
      </div>
    </div>
  );
};

export default Header;