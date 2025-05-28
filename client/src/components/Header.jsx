import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleChevronDown } from "@fortawesome/free-solid-svg-icons";
import styles from "../assets/css/Header.module.css";

const Header = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // ← FIXED: add this state

  const location = useLocation();
  const navigate = useNavigate();

  // Fetch logged-in user on mount and when location changes
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/api/me", {
          withCredentials: true,
        });
        setUser(res.data.user || null);
        setIsAdmin(res.data.admin || false);
      } catch (err) {
        console.error("Session check failed:", err);
        setUser(null);
        setIsAdmin(false);
      }
    };

    checkSession();
  }, []); // Removed location dependency — no need to re-check on every path change

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

  // Logout
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await axios.get("/api/logout", { withCredentials: true });
      setUser(null);
      setIsAdmin(false);
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
        <Link to="/" className={`${styles.navLink} ${isActive("/") ? styles.active : ""}`} onClick={handleLinkClick}>
          Home
        </Link>
        <Link to="/search" className={`${styles.navLink} ${isActive("/search") ? styles.active : ""}`} onClick={handleLinkClick}>
          Properties
        </Link>
        <Link to="/workerDetails" className={`${styles.navLink} ${isActive("/workerDetails") ? styles.active : ""}`} onClick={handleLinkClick}>
          Services
        </Link>
        <Link to="/about_us" className={`${styles.navLink} ${isActive("/about_us") ? styles.active : ""}`} onClick={handleLinkClick}>
          About Us
        </Link>
        <Link to="/contact_us" className={`${styles.navLink} ${isActive("/contact_us") ? styles.active : ""}`} onClick={handleLinkClick}>
          Contact Us
        </Link>
        <Link to="/faq" className={`${styles.navLink} ${isActive("/faq") ? styles.active : ""}`} onClick={handleLinkClick}>
          FAQs
        </Link>
      </nav>

      {/* CTA: Login or User Dropdown */}
      <div className={styles.cta}>
        {user ? (
          <div className={styles.dropdown}>
            <a href="#" className={styles.userGreeting} onClick={toggleDropdown}>
              <span>Hi, {user.firstName}</span>
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
              {isAdmin && (
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