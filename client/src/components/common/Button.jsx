import React from 'react';
import styles from './Button.module.css';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  className = '',
}) {
  const variantClass = variant === 'secondary' ? styles.btnSecondary : styles.btnPrimary;
  const classes = [
    styles.btn,
    variantClass,
    fullWidth ? styles.btnFull : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      aria-busy={loading}
    >
      {loading ? (
        <span className={styles.btnLoading}>
          <span className={styles.spinner}></span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
