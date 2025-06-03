// src/admin/AdminDashboard.jsx  (or wherever your AdminDashboard is)
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately redirect to the properties management page
    navigate('/admin/property-management', { replace: true });
  }, [navigate]);

  // This content is never really seen (only during the tiny redirect moment)
  return null;
  // Alternative: return <div style={{ padding: '100px', textAlign: 'center' }}>Redirecting to Properties...</div>;
};

export default AdminDashboard;