import React from 'react';
import styles from './Input.module.css';

export default function Input({ 
  id, 
  type = 'text', 
  label, 
  value, 
  onChange, 
  error, 
  placeholder,
  disabled = false,
  maxLength,
  required = false,
  autoComplete = 'off'
}) {
  return (
    <div className={styles.inputWrapper}>
      {label && (
        <label htmlFor={id} className={styles.inputLabel}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        required={required}
        autoComplete={autoComplete}
        className={`${styles.inputField} ${error ? styles.inputError : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <span id={`${id}-error`} className={styles.inputErrorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
