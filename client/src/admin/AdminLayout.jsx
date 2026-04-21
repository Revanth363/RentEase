// src/admin/AdminLayout.jsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectAuthLoading } from '../store/slices/authSlice';
import AdminNavbar from '../components/AdminNavbar';
import styles from '../assets/css/AdminLayout.module.css';

/**
 * AdminLayout - Persistent wrapper for all admin pages
 * This component keeps the header fixed while only the page content changes
 * when navigating between admin routes.
 */
export default function AdminLayout() {
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);

  // Redirect if not authorized
  if (loading) {
    return (
      <div className={styles.container}>
        <AdminNavbar />
        <div className={styles.content}>
          <div className={styles.loadingMessage}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user || user.userType !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.layoutContainer}>
      {/* Header - Persistent across page changes */}
      <header className={styles.headerFixed}>
        <AdminNavbar />
      </header>

      {/* Main Content Area - Changes when routes change */}
      <main className={styles.contentArea}>
        <Outlet />
      </main>
    </div>
  );
}
