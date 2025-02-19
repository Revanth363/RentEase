// src/components/Login.jsx  (or wherever your Login component is)
import React, { useState, useEffect } from 'react';
import styles from '../assets/css/Login.module.css';

const initialErrors = { role: '', email: '', password: '' };

export default function Login({ onForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState(initialErrors);
  const [loading, setLoading] = useState(false);

  // THIS IS THE KEY: recalculate isAdmin on every email change
  const isAdmin = email.trim().toLowerCase().endsWith('@admin.com');

  // Clear role error instantly when admin email is detected
  useEffect(() => {
    if (isAdmin) {
      setUserType('');            // clear selection
      setErrors(prev => ({ ...prev, role: '' }));
    }
  }, [isAdmin]);

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

    setLoading(true);

    try {
      const payload = isAdmin
        ? { email, password }                          // Admin → no userType
        : { email, password, userType };               // Normal user → send userType

      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert('Login successful!');
        window.location.replace(data.redirectUrl); // Cleaner redirect, no history back
      } else {
        alert('Login failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setLoading(false);
    }
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