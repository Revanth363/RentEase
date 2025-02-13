import React from 'react';
import styles from './Select.module.css';

export default function Select({
  id,
  label,
  value,
  onChange,
  options,
  error,
  placeholder = 'Select an option',
  disabled = false,
  required = false,
}) {
  return (
    <div className={styles.selectWrapper}>
      {label && (
        <label htmlFor={id} className={styles.selectLabel}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`${styles.selectField} ${error ? styles.selectError : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={`${id}-error`} className={styles.selectErrorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
