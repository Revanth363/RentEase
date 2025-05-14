import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "../assets/css/Login.module.css";
import {
  loginUser,
  clearError,
  clearRedirectUrl,
  selectAuthLoading,
  selectAuthError,
  selectRedirectUrl,
} from "../store/slices/authSlice";

const initialErrors = { role: "", email: "", password: "" };

export default function Login({ onForgot }) {
  const dispatch = useDispatch();

  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const redirectUrl = useSelector(selectRedirectUrl);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState(initialErrors);

  // Admin detection
  const isAdmin = email.trim().toLowerCase().endsWith("@admin.com");

  useEffect(() => {
    if (isAdmin) {
      setUserType("");
      setErrors((prev) => ({ ...prev, role: "" }));
    }
  }, [isAdmin]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, email, password, userType]);

  useEffect(() => {
    if (redirectUrl) {
      dispatch(clearRedirectUrl());
      window.location.replace(redirectUrl);
    }
  }, [redirectUrl, dispatch]);

  const validate = () => {
    const e = { ...initialErrors };

    if (!email) e.email = "Email is required";
    if (!password) e.password = "Password is required";
    if (!isAdmin && !userType) e.role = "Please select your role";

    setErrors(e);
    return Object.values(e).every((x) => x === "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = isAdmin
      ? { email, password }
      : { email, password, userType };

    dispatch(loginUser(payload));
  };

  // 🔹 GOOGLE LOGIN HANDLER (REDIRECT BASED)
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div className={styles.loginPageRoot}>
      <div className={styles.loginContainer}>
        <h2>{isAdmin ? "Admin Login" : "Login"}</h2>

        <form onSubmit={handleSubmit}>
          {/* ROLE SELECTOR */}
          {!isAdmin && (
            <>
              <label>Select Role:</label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className={errors.role ? styles.errorInput : ""}
              >
                <option value="">-- Select Role --</option>
                <option value="tenant">Tenant</option>
                <option value="owner">Owner</option>
                <option value="worker">Worker</option>
              </select>
              {errors.role && (
                <div className={styles.errorText}>{errors.role}</div>
              )}
            </>
          )}

          {/* EMAIL */}
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={
              isAdmin ? "admin@rentease.com" : "your@email.com"
            }
            className={errors.email ? styles.errorInput : ""}
          />
          {errors.email && (
            <div className={styles.errorText}>{errors.email}</div>
          )}

          {/* PASSWORD */}
          <label>Password:</label>
          <div className={styles.passwordContainer}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? styles.errorInput : ""}
            />
            <span
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              <i
                className={`fa-solid ${
                  showPassword ? "fa-eye-slash" : "fa-eye"
                }`}
              />
            </span>
          </div>
          {errors.password && (
            <div className={styles.errorText}>{errors.password}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* REDUX ERROR */}
          {authError && (
            <div
              className={styles.errorText}
              style={{ marginTop: "10px", textAlign: "center" }}
            >
              {authError}
            </div>
          )}

          {/* FORGOT PASSWORD */}
          <div className={styles.forgotWrapper}>
            <button
              type="button"
              className={styles.forgotPassword}
              onClick={onForgot}
            >
              Forgot Password?
            </button>
          </div>

          {/* 🔹 GOOGLE LOGIN BUTTON */}
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Continue with Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
