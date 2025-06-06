import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useSelector } from 'react-redux';
import { selectUser, selectAuthLoading } from '../store/slices/authSlice';

export default function SuperAdminLayout() {
  const location = useLocation();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading); // ← critical

  // Show loading while auth is being checked
  if (loading) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Verifying your access...</div>;
  }

  // Only protect if we're actually on superadmin path
  const isSuperAdminPath = location.pathname.startsWith('/superadmin');

  if (isSuperAdminPath) {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (user.userType !== "superadmin") {
      return <Navigate to="/" replace />;
    }
  }

  // All good → show navbar + content
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      <main style={{ padding: '1.5rem 2rem', maxWidth: '1600px', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}