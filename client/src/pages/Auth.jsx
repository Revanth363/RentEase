import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import '../assets/css/Auth.css';

export default function Auth({ initial = 'login' }) {
  const [mode, setMode] = useState(initial === 'register' ? 'register' : 'login');

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
