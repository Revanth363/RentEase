// src/components/AdminRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/check-session', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setIsAdmin(data.admin))
      .catch(() => setIsAdmin(false));
  }, []);

  if (isAdmin === null) return <div>Loading...</div>;
  if (!isAdmin) return <Navigate to="/login" replace />;

  return children;
}