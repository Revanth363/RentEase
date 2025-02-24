import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../assets/css/Login.module.css';
import { AuthContext } from '../context/AuthContext';

const initialErrors = { role: '', email: '', password: '' };

export default function Login({ onForgot }) {
	const [userType, setUserType] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [errors, setErrors] = useState(initialErrors);
	const [serverError, setServerError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { setAuth } = useContext(AuthContext);

	const validateLogin = () => {
		const e = { ...initialErrors };
		if (!email) e.email = 'Email is required';
		if (!password) e.password = 'Password is required';
		setErrors(e);
		return !e.email && !e.password;
	};

	const handleSubmit = async (ev) => {
		ev.preventDefault();
		setServerError('');
		if (!validateLogin()) return;
		setLoading(true);
		try {
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ userType, email, password })
			});
			const data = await res.json().catch(() => ({}));
			if (res.ok) {
				// Update global auth context and navigate
				setAuth({ user: data.user || null, admin: !!data.admin, loading: false });
				navigate(data.redirectUrl || '/');
			} else {
				setServerError(data.error || 'Login failed');
			}
		} catch (err) {
			console.error('Login network error:', err);
			setServerError('Network error. Please ensure the server is running.');
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
						<option value="">-- Select Role (optional) --</option>
						<option value="tenant">Tenant</option>
						<option value="owner">Owner</option>
						<option value="worker">Worker</option>
					</select>
					{errors.role && <div id="roleError" className={styles.errorText}>{errors.role}</div>}

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
					{errors.email && <div id="emailError" className={styles.errorText}>{errors.email}</div>}

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
					{errors.password && <div id="passwordError" className={styles.errorText}>{errors.password}</div>}

					{serverError && (
						<div className={styles.errorText} style={{ textAlign: 'center' }}>{serverError}</div>
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
