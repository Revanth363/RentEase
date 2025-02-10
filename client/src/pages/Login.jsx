import React, { useState } from 'react';
import styles from '../assets/css/Login.module.css';

const initialErrors = { role: '', email: '', password: '' };

export default function Login({ onForgot }) {
	// Form state
	const [userType, setUserType] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState(initialErrors);
	const [serverError, setServerError] = useState('');
	const [loading, setLoading] = useState(false);

	const validateLogin = () => {
		const e = { ...initialErrors };
		// Role is optional now so admins can login using the normal form.
		if (!email) e.email = 'Email is required';
		if (!password) e.password = 'Password is required';
		setErrors(e);
		// don't require role (e.role will be empty string)
		return !e.email && !e.password;
	};

	const handleSubmit = async (ev) => {
		ev.preventDefault();
		setServerError('');
		if (!validateLogin()) return;
		setLoading(true);
		try {
			const res = await fetch('http://localhost:5000/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ userType, email, password })
			});
			const text = await res.text();
			let data;
			try { data = JSON.parse(text); } catch { data = { raw: text }; }
			if (res.ok && data.success) {
				window.location.href = data.redirectUrl || '/';
			} else {
				setServerError(data.error || 'Login failed');
				if (data.raw) console.warn('Non-JSON response displayed directly');
			}
		} catch (err) {
			console.error('Login network error:', err);
			setServerError('Network error. Please check if the server is running on port 5000.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.loginPageRoot}>
			<div className={styles.loginContainer}>
				<h2>Login</h2>
				<form id="loginForm" onSubmit={handleSubmit}>
					<label htmlFor="loginUserType">Select Role:</label>
					<select
						id="loginUserType"
						name="userType"
						value={userType}
						onChange={e => setUserType(e.target.value)}
					>
						<option value="" disabled>-- Select Role --</option>
						<option value="tenant">Tenant</option>
						<option value="owner">Owner</option>
						<option value="worker">Worker</option>
					</select>
					{errors.role && <div id="roleError" className={styles.errorText} style={{ display: 'block' }}>{errors.role}</div>}

					<label htmlFor="loginEmail">Email or username:</label>
					<input
						type="text"
						id="loginEmail"
						name="email"
						placeholder="Email or username"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>
					{errors.email && <div id="emailError" className={styles.errorText} style={{ display: 'block' }}>{errors.email}</div>}

					<label htmlFor="loginPassword">Password:</label>
					<div className={styles.passwordContainer}>
						<input
							type={showPassword ? 'text' : 'password'}
							id="loginPassword"
							name="password"
							placeholder="Enter your password"
							value={password}
							onChange={e => setPassword(e.target.value)}
							required
						/>
						<span
							className={styles.togglePassword}
							onClick={() => setShowPassword(prev => !prev)}
							title={showPassword ? 'Hide password' : 'Show password'}
						>
							<i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
						</span>
					</div>
					{errors.password && <div id="passwordError" className={styles.errorText} style={{ display: 'block' }}>{errors.password}</div>}

					{serverError && (
						<div className={styles.errorText} style={{ display: 'block', textAlign: 'center' }}>{serverError}</div>
					)}

					<button type="submit" id="loginBtn" disabled={loading}>
						{loading ? 'Logging in...' : 'Login'}
					</button>

					<div className={styles.forgotWrapper}>
						<button
							type="button"
							className={styles.forgotPassword}
							onClick={onForgot}
						>
							Forgot Password?
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
