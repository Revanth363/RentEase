import React, { useEffect } from 'react';
import styles from './Alert.module.css';

export default function Alert({ type = 'info', message, onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const typeClass = {
    success: styles.alertSuccess,
    error: styles.alertError,
    warning: styles.alertWarning,
    info: styles.alertInfo,
  }[type];

  return (
    <div className={`${styles.alert} ${typeClass}`} role="alert">
      <span className={styles.alertIcon}>{icons[type]}</span>
      <span className={styles.alertMessage}>{message}</span>
      {onClose && (
        <button
          className={styles.alertClose}
          onClick={onClose}
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  );
}
