// src/components/Login.jsx  (or wherever your Login component is)
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styles from '../assets/css/Login.module.css';
import { AuthContext } from '../context/AuthContext';
import { 
  loginUser, 
  clearError, 
  clearRedirectUrl,
  selectAuthLoading, 
  selectAuthError, 
  selectRedirectUrl 
} from '../store/slices/authSlice';

const initialErrors = { role: '', email: '', password: '' };

export default function Login({ onForgot }) {
  // Redux hooks
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const redirectUrl = useSelector(selectRedirectUrl);

  // Local form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState(initialErrors);

  // THIS IS THE KEY: recalculate isAdmin on every email change
  const isAdmin = email.trim().toLowerCase().endsWith('@admin.com');

  // Clear role error instantly when admin email is detected
  useEffect(() => {
    if (isAdmin) {
      setUserType('');            // clear selection
      setErrors(prev => ({ ...prev, role: '' }));
    }
  }, [isAdmin]);

  // Clear Redux error when component mounts or when user starts typing
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, email, password, userType]);

  // Handle redirect after successful login
  useEffect(() => {
    if (redirectUrl) {
      dispatch(clearRedirectUrl());
      window.location.replace(redirectUrl);
    }
  }, [redirectUrl, dispatch]);

  const validate = () => {
    const e = { ...initialErrors };

    if (!email) e.email = 'Email is required';
    if (!password) e.password = 'Password is required';

    // Only normal users need role
    if (!isAdmin && !userType) {
      e.role = 'Please select your role';
    }

    setErrors(e);
    return Object.values(e).every(x => x === '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Create payload based on user type
    const payload = isAdmin
      ? { email, password }                          // Admin → no userType
      : { email, password, userType };               // Normal user → send userType

    // Dispatch Redux action for login
    dispatch(loginUser(payload));
  };

  return (
    <div className={styles.loginPageRoot}>
      <div className={styles.loginContainer}>
        <h2>{isAdmin ? 'Admin Login' : 'Login'}</h2>

        <form onSubmit={handleSubmit}>
          {/* ==== ROLE SELECTOR – HIDDEN FOR ADMIN ==== */}
          {!isAdmin && (
            <>
              <label>Select Role:</label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className={errors.role ? styles.errorInput : ''}
              >
                <option value="">-- Select Role --</option>
                <option value="tenant">Tenant</option>
                <option value="owner">Owner</option>
                <option value="worker">Worker</option>
              </select>
              {errors.role && <div className={styles.errorText}>{errors.role}</div>}
            </>
          )}

          {/* ==== EMAIL ==== */}
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isAdmin ? 'admin@rentease.com' : 'your@email.com'}
            className={errors.email ? styles.errorInput : ''}
          />
          {errors.email && <div className={styles.errorText}>{errors.email}</div>}

          {/* ==== PASSWORD ==== */}
          <label>Password:</label>
          <div className={styles.passwordContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? styles.errorInput : ''}
            />
            <span
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
            </span>
          </div>
          {errors.password && <div className={styles.errorText}>{errors.password}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Display Redux auth error */}
          {authError && (
            <div className={styles.errorText} style={{ marginTop: '10px', textAlign: 'center' }}>
              {authError}
            </div>
          )}

          <div className={styles.forgotWrapper}>
            <button type="button" className={styles.forgotPassword} onClick={onForgot}>
              Forgot Password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}