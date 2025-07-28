import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import '../assets/css/Auth.css';

export default function Auth({ initial = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get auth state from Redux
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  const [mode, setMode] = useState(initial === 'register' ? 'register' : 'login');

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (user && isAuthenticated) {
      // Redirect to appropriate dashboard based on user type
      if (user.userType === 'tenant') {
        navigate('/tenant/tenant_dashboard', { replace: true });
      } else if (user.userType === 'owner') {
        navigate('/owner_dashboard', { replace: true });
      } else if (user.userType === 'worker') {
        navigate('/worker_dashboard', { replace: true });
      } else if (user.userType === 'admin' || user.userType === 'superadmin') {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, isAuthenticated, navigate]);

  useEffect(() => {
    // Keep mode in sync if route remounts with different initial
    setMode(initial === 'register' ? 'register' : 'login');
  }, [initial]);

  const isLogin = mode === 'login';
  const [showForgot, setShowForgot] = useState(false);

  return (
    <div className={`auth-shell ${isLogin ? 'login-mode' : 'register-mode'}`}>
      {/* Left panel (Login) */}
      <div className={`panel panel-left ${isLogin ? 'active' : 'inactive'}`}>
        <div className="panel-content auth-embed">
          {showForgot ? (
            <ForgotPassword 
              embed 
              onBack={() => setShowForgot(false)} 
              onCreateAccount={() => { setShowForgot(false); setMode('register'); }}
            />
          ) : (
            <Login onForgot={() => setShowForgot(true)} />
          )}
        </div>
        {!isLogin && (
          <div className="panel-overlay">
            <div className="overlay-inner">
              <h2>Welcome back</h2>
              <p>Already have an account? Switch to login.</p>
              <button className="switch-btn" onClick={() => setMode('login')}>Go to Login</button>
            </div>
          </div>
        )}
      </div>

      {/* Right panel (Register) */}
      <div className={`panel panel-right ${!isLogin ? 'active' : 'inactive'}`}>
        <div className="panel-content auth-embed">
          <Register />
        </div>
        {isLogin && (
          <div className="panel-overlay">
            <div className="overlay-inner">
              <h2>Join RentEase</h2>
              <p>New here? Create your account to get started.</p>
              <button className="switch-btn" onClick={() => setMode('register')}>Create Account</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
