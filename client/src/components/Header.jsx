import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  logoutUser,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
} from "../store/slices/authSlice"; // adjust path if needed

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleChevronDown } from "@fortawesome/free-solid-svg-icons";
import styles from "../assets/css/Header.module.css";

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Read auth state from Redux (single source of truth)
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);

  // Toggle mobile menu
  const toggleNav = () => setIsNavOpen((prev) => !prev);
  const closeNav = () => setIsNavOpen(false);

  // Toggle user dropdown
  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen((prev) => !prev);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = () => setIsDropdownOpen(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isDropdownOpen]);

  // Logout using Redux action
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await dispatch(logoutUser()).unwrap(); // unwrap to handle errors if needed
      setIsDropdownOpen(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Check active link
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Close nav/dropdown on link click
  const handleLinkClick = () => {
    setIsNavOpen(false);
    setIsDropdownOpen(false);
  };

  return (
    <header className={styles.header}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.brandid}>RentEase</div>
        <div className={styles.tagline}>Your One-Stop Rental Solution</div>
      </div>

      {/* Hamburger Button (Mobile) */}
      <button
        className={styles.navToggle}
        onClick={toggleNav}
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      {/* Overlay (Mobile) */}
      <div
        className={`${styles.overlay} ${isNavOpen ? styles.active : ""}`}
        onClick={closeNav}
      />

      {/* Navigation Menu */}
      <nav className={`${styles.navMenu} ${isNavOpen ? styles.active : ""}`}>
        <Link
          to="/"
          className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`}
          onClick={handleLinkClick}
        >
          Home
        </Link>
        <Link
          to="/search"
          className={`${styles.navLink} ${isActive("/search") ? styles.active : ""}`}
          onClick={handleLinkClick}
        >
          Properties
        </Link>
        <Link
          to="/workerDetails"
          className={`${styles.navLink} ${isActive("/workerDetails") ? styles.active : ""}`}
          onClick={handleLinkClick}
        >
          Services
        </Link>
        <Link
          to="/about_us"
          className={`${styles.navLink} ${isActive("/about_us") ? styles.active : ""}`}
          onClick={handleLinkClick}
        >
          About Us
        </Link>
        <Link
          to="/contact_us"
          className={`${styles.navLink} ${isActive("/contact_us") ? styles.active : ""}`}
          onClick={handleLinkClick}
        >
          Contact Us
        </Link>
        <Link
          to="/faq"
          className={`${styles.navLink} ${isActive("/faq") ? styles.active : ""}`}
          onClick={handleLinkClick}
        >
          FAQs
        </Link>
      </nav>

      {/* CTA: Login or User Dropdown */}
      <div className={styles.cta}>
        {loading ? (
          <div className={styles.loginBtn}>Loading...</div>
        ) : user && isAuthenticated ? (
          <div className={styles.dropdown}>
            <a href="#" className={styles.userGreeting} onClick={toggleDropdown}>
              <span>Hi, {user.firstName || "User"}</span>
              <FontAwesomeIcon icon={faCircleChevronDown} className={styles.icon} />
            </a>

            <div className={styles.dropdownContent} style={{ display: isDropdownOpen ? "block" : "none" }}>
              {user.userType === "tenant" && (
                <Link to="/tenant/tenant_dashboard" onClick={handleLinkClick}>
                  Dashboard
                </Link>
              )}
              {user.userType === "owner" && (
                <Link to="/owner_dashboard" onClick={handleLinkClick}>
                  Dashboard
                </Link>
              )}
              {user.userType === "worker" && (
                <Link to="/worker_dashboard" onClick={handleLinkClick}>
                  Dashboard
                </Link>
              )}
              {(user.userType === "admin" || user.userType === "superadmin") && (
                <Link to="/admin" onClick={handleLinkClick}>
                  Admin Panel
                </Link>
              )}
              <a href="#" onClick={handleLogout}>
                Logout
              </a>
            </div>
          </div>
        ) : (
          <Link to="/login" className={styles.loginBtn} onClick={handleLinkClick}>
            Login/SignUp
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;