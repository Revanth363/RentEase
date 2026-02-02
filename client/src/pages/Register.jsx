import React, { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "../assets/css/Register.module.css";
import {
  signupUser,
  clearError,
  clearRedirectUrl,
  selectAuthLoading,
  selectAuthError,
  selectRedirectUrl,
} from "../store/slices/authSlice";

const nameRegex = /^[A-Za-z\s-]+$/;
const emailRegex = /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[0-9]{10}$/;

export default function Register() {
  // Redux hooks
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const redirectUrl = useSelector(selectRedirectUrl);

  // Local form state
  const [userType, setUserType] = useState("tenant");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [numProperties, setNumProperties] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState({});

  const setFieldTouched = (key) => setTouched((t) => ({ ...t, [key]: true }));

  // Clear Redux error when component mounts or form fields change
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, firstName, lastName, email, phone, location, password, confirmPassword, userType]);

  // Handle redirect after successful registration
  useEffect(() => {
    if (redirectUrl) {
      dispatch(clearRedirectUrl());
      window.location.href = redirectUrl;
    }
  }, [redirectUrl, dispatch]);

  const validate = useMemo(() => {
    const errors = {};
    if (!firstName) errors.firstName = "First name is required";
    else if (!nameRegex.test(firstName))
      errors.firstName = "First name must contain only letters, spaces";

    if (!lastName) errors.lastName = "Last name is required";
    else if (!nameRegex.test(lastName))
      errors.lastName = "Last name must contain only letters, spaces";

    if (!email) errors.email = "Email is required";
    else if (!emailRegex.test(email))
      errors.email =
        "Please enter a valid email address (e.g., user@gmail.com)";

    if (!phone) errors.phone = "Phone number is required";
    else if (!phoneRegex.test(phone))
      errors.phone = "Please enter a valid 10-digit phone number";

    if (!location) errors.location = "Location is required";

    if (userType === "owner") {
      if (numProperties === "" || Number(numProperties) < 1)
        errors.numProperties = "Please enter a valid number of properties";
    }

    if (!password) errors.password = "Password is required";
    else if (password.length < 8)
      errors.password = "Password must be at least 8 characters";
    else if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      errors.password =
        "Password must contain uppercase, lowercase letters, and numbers";
    }

    if (!confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    else if (confirmPassword !== password)
      errors.confirmPassword = "Passwords do not match";

    return errors;
  }, [
    firstName,
    lastName,
    email,
    phone,
    location,
    userType,
    numProperties,
    password,
    confirmPassword,
  ]);

  const isValid = useMemo(() => Object.keys(validate).length === 0, [validate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    // mark all as touched
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      location: true,
      numProperties: true,
      password: true,
      confirmPassword: true,
    });
    if (!isValid) return;

    // Build payload
    const payload = {
      userType,
      firstName,
      lastName,
      email,
      phone,
      location,
      numProperties: userType === "owner" ? numProperties : undefined,
      password,
    };
    Object.keys(payload).forEach(
      (k) => payload[k] === undefined && delete payload[k]
    );

    // Dispatch Redux action for signup
    dispatch(signupUser(payload));
  };

  const show = (key) => touched[key] && validate[key];

  // 🔹 GOOGLE REGISTRATION HANDLER
  const handleGoogleRegister = () => {
    const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").trim();
    const backendBaseUrl = rawBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    const frontendOrigin = window.location.origin;
    window.location.href = `${backendBaseUrl}/auth/google?frontend=${encodeURIComponent(frontendOrigin)}`;
  };

  return (
    <div className={styles.registerPageRoot}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Join RentEase</h1>
          <p>Create your account today</p>
        </div>
        <form id="registerForm" onSubmit={onSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="userType">I am a</label>
            <select
              id="userType"
              name="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="tenant">Tenant/Renter</option>
              <option value="owner">Homeowner/Property Owner</option>
              <option value="worker">Domestic Worker</option>
            </select>
            {/* userType specific errors not shown here */}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup} id="first">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="First name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setFieldTouched("firstName");
                }}
                onBlur={() => setFieldTouched("firstName")}
              />
              {show("firstName") && (
                <div
                  id="firstNameError"
                  className={`${styles.error} ${styles.visible}`}
                >
                  {validate.firstName}
                </div>
              )}
            </div>

            <div className={styles.formGroup} id="last">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setFieldTouched("lastName");
                }}
                onBlur={() => setFieldTouched("lastName")}
              />
              {show("lastName") && (
                <div
                  id="lastNameError"
                  className={`${styles.error} ${styles.visible}`}
                >
                  {validate.lastName}
                </div>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldTouched("email");
              }}
              onBlur={() => setFieldTouched("email")}
            />
            {show("email") && (
              <div
                id="emailError"
                className={`${styles.error} ${styles.visible}`}
              >
                {validate.email}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setFieldTouched("phone");
              }}
              onBlur={() => setFieldTouched("phone")}
            />
            {show("phone") && (
              <div
                id="phoneError"
                className={`${styles.error} ${styles.visible}`}
              >
                {validate.phone}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="location">Primary Location</label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="City, State, Country"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setFieldTouched("location");
              }}
              onBlur={() => setFieldTouched("location")}
            />
            {show("location") && (
              <div
                id="locationError"
                className={`${styles.error} ${styles.visible}`}
              >
                {validate.location}
              </div>
            )}
          </div>

          {userType === "owner" && (
            <div
              id="homeownerFields"
              className={styles.locationFields}
              style={{ display: "block" }}
            >
              <div className={styles.formGroup}>
                <label htmlFor="numProperties">Number of Properties</label>
                <input
                  type="number"
                  id="numProperties"
                  name="numProperties"
                  min="1"
                  placeholder="How many properties do you own?"
                  value={numProperties}
                  onChange={(e) => {
                    setNumProperties(e.target.value);
                    setFieldTouched("numProperties");
                  }}
                  onBlur={() => setFieldTouched("numProperties")}
                />
                {show("numProperties") && (
                  <div
                    id="numPropertiesError"
                    className={`${styles.error} ${styles.visible}`}
                  >
                    {validate.numProperties}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldTouched("password");
                }}
                onBlur={() => setFieldTouched("password")}
              />
              <span
                className={styles.togglePassword}
                onClick={() => setShowPassword((s) => !s)}
              >
                <i
                  className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                />
              </span>
            </div>
            {show("password") && (
              <div
                id="passwordError"
                className={`${styles.error} ${styles.visible}`}
              >
                {validate.password}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles.passwordContainer}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFieldTouched("confirmPassword");
                }}
                onBlur={() => setFieldTouched("confirmPassword")}
              />
              <span
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword((s) => !s)}
              >
                <i
                  className={`fa ${
                    showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                  }`}
                />
              </span>
            </div>
            {show("confirmPassword") && (
              <div
                id="confirmPasswordError"
                className={`${styles.error} ${styles.visible}`}
              >
                {validate.confirmPassword}
              </div>
            )}
          </div>

          <button
            type="submit"
            id="registerButton"
            className={styles.registerBtn}
            disabled={!isValid || loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
          {authError && (
            <div
              id="serverError"
              className={`${styles.error} ${styles.visible}`}
              style={{ marginTop: 8 }}
            >
              {authError}
            </div>
          )}

          {/* 🔹 GOOGLE REGISTRATION BUTTON */}
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              type="button"
              onClick={handleGoogleRegister}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Sign Up with Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
