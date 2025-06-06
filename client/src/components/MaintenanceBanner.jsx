// client/src/components/MaintenanceBanner.jsx
import React from 'react';
import styles from './MaintenanceBanner.module.css';

export default function MaintenanceBanner({ message }) {
  return (
    <div className={styles.bannerContainer}>
      <div className={styles.bannerCard}>
        <h1>Site Under Maintenance</h1>
        <p>{message || 'Sorry for the inconvenience, we will be back shortly.'}</p>
      </div>
    </div>
  );
}
