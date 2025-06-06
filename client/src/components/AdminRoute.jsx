// src/components/AdminRoute.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
  selectUser,
  selectAuthLoading,
} from '../store/slices/authSlice';

export default function AdminRoute({ children }) {
  const loading = useSelector(selectAuthLoading);
  const user = useSelector(selectUser);

  // wait while auth state initializes
  if (loading) return <div>Loading...</div>;

  // require only a normal admin; superadmin is not allowed here
  if (!user || user.userType !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}