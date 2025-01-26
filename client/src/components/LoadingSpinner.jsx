// client/src/components/LoadingSpinner.jsx
import React from 'react';
import '../assets/css/LoadingSpinner.css'; // Update path to CSS

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

export default LoadingSpinner;