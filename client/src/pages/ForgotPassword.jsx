import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../assets/css/ForgotPassword.module.css';

export default function ForgotPassword({ embed = false, onBack, onCreateAccount }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: verify, 3: reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [errors, setErrors] = useState({ email: '', otp: '', pass: '' });
  const [busy, setBusy] = useState(false);

  const validEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(em).toLowerCase());

  const sendOtp = async () => {
    setErrors(e => ({ ...e, email: '' }));
    const cleanEmail = String(email).trim().toLowerCase();
    if (!validEmail(cleanEmail)) {
      setErrors(e => ({ ...e, email: 'Invalid email format' }));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail })
      });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { success: false, error: text || 'Failed to send OTP' }; }
      if (res.ok && data.success) {
        if (data.otp) {
          alert(`OTP Generated\n\nYour OTP is: ${data.otp}\n\nEnter this code in the next step to verify your identity.`);
        }
        setMsg(data.message || 'OTP sent successfully! Enter it below.');
        setStep(2);
      } else {
        setErrors(e => ({ ...e, email: data.error || 'Failed to send OTP' }));
      }
    } catch {
      setErrors(e => ({ ...e, email: 'Server error' }));
    } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    setErrors(e => ({ ...e, otp: '' }));
    const cleanOtp = String(otp).trim();
    if (cleanOtp.length !== 6 || isNaN(Number(cleanOtp))) {
      setErrors(e => ({ ...e, otp: 'OTP must be a 6-digit number' }));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('http://localhost:5000/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: String(email).trim().toLowerCase(), otp: cleanOtp })
      });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { success: false, error: text || 'Verification failed' }; }
      if (res.ok && data.success) {
        setMsg('✅ OTP verified successfully! Now set your new password.');
        setStep(3);
      } else {
        setErrors(e => ({ ...e, otp: data.error || 'Invalid OTP' }));
      }
    } catch {
      setErrors(e => ({ ...e, otp: 'Server error' }));
    } finally { setBusy(false); }
  };

  const resetPassword = async () => {
    setErrors(e => ({ ...e, pass: '' }));
    if (newPassword.length < 8) {
      setErrors(e => ({ ...e, pass: 'Password must be at least 8 characters' }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors(e => ({ ...e, pass: 'Passwords do not match' }));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('http://localhost:5000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: String(email).trim().toLowerCase(), password: newPassword })
      });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { success: false, error: text || 'Failed to reset password' }; }
      if (res.ok && data.success) {
        if (embed && typeof onBack === 'function') {
          setMsg('✅ Password reset successful! Returning to login...');
          setTimeout(() => onBack(), 1200);
        } else {
          setMsg('✅ Password reset successful! Redirecting to login...');
          setTimeout(() => navigate('/login'), 1500);
        }
      } else {
        setErrors(e => ({ ...e, pass: data.error || 'Failed to reset password' }));
      }
    } catch {
      setErrors(e => ({ ...e, pass: 'Server error' }));
    } finally { setBusy(false); }
  };

  const content = (
      <div className={`${styles.forgotCard} ${embed ? styles.forgotEmbed : ''}`}>
        <h2>Forgot Password</h2>
        {step === 1 && (
          <div className={styles.step}>
            <label htmlFor="fp_email">Email</label>
            <input id="fp_email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your registered email" />
            {errors.email && <div className={styles.errorText}>{errors.email}</div>}
            <button className={styles.accent} onClick={sendOtp} disabled={busy}>{busy ? 'Sending...' : 'Send OTP'}</button>
          </div>
        )}
        {step === 2 && (
          <div className={styles.step}>
            <label htmlFor="fp_otp">Enter OTP</label>
            <input id="fp_otp" type="text" value={otp} maxLength={6} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" />
            {errors.otp && <div className={styles.errorText}>{errors.otp}</div>}
            <button className={styles.accent} onClick={verifyOtp} disabled={busy}>{busy ? 'Verifying...' : 'Verify OTP'}</button>
            <button className={styles.linklike} onClick={() => setStep(1)}>&larr; Change email</button>
          </div>
        )}
        {step === 3 && (
          <div className={styles.step}>
            <label htmlFor="fp_new">New Password</label>
            <input id="fp_new" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            <label htmlFor="fp_cnf">Confirm Password</label>
            <input id="fp_cnf" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            {errors.pass && <div className={styles.errorText}>{errors.pass}</div>}
            <button className={styles.accent} onClick={resetPassword} disabled={busy}>{busy ? 'Saving...' : 'Reset Password'}</button>
          </div>
        )}
        {msg && <div className={styles.infoText}>{msg}</div>}
        <div className={styles.footerLinks}>
          {embed ? (
            <>
              <button className={styles.linklike} onClick={() => (onBack ? onBack() : navigate('/login'))}>&larr; Back to Login</button>
              <button className={styles.linklike} onClick={() => (onCreateAccount ? onCreateAccount() : navigate('/register'))}>Create an account</button>
            </>
          ) : (
            <>
              <Link to="/login">&larr; Back to Login</Link>
              <Link to="/register">Create an account</Link>
            </>
          )}
        </div>
      </div>
  );

  if (embed) return content;
  return (
    <div className={styles.forgotPageRoot}>
      {content}
    </div>
  );
}
