import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/PolicyPage.css';

export default function DataPolicy() {
  return (
    <div className="policy-wrapper">
      <div className="policy-whole-container">
        <div className="policy-container">
          <div className="policy-header">
            <h1>Website Data Policy</h1>
            <p className="policy-date">Last Updated: April 2026</p>
          </div>

          <div className="policy-content">
            <section>
              <h2>1. Website Data Collection</h2>
              <p>Our website uses tracking pixels, browser storage, and similar technologies to enhance your experience and remember your preferences.</p>
            </section>

            <section>
              <h2>2. Types of Data We Collect</h2>
              <ul>
                <li><strong>Essential Data:</strong> Required for website functionality and login authentication</li>
                <li><strong>Performance Data:</strong> Helps us understand how visitors interact with our website</li>
                <li><strong>Functional Data:</strong> Remembers your preferences and settings</li>
                <li><strong>Tracking Data:</strong> For analytics and service improvement</li>
              </ul>
            </section>

            <section>
              <h2>3. Third-Party Services</h2>
              <p>We use Google Analytics, Payment Processors, Social Media Platforms, and Cloudinary. These providers have their own data policies.</p>
            </section>

            <section>
              <h2>4. How to Control Data Collection</h2>
              <p>You can control data collection through your browser settings. Most browsers allow you to accept all, only essential, or block data collection.</p>
            </section>

            <section>
              <h2>5. Browser Settings</h2>
              <p>
                <strong>Chrome:</strong> Settings → Privacy and security → Site data<br />
                <strong>Firefox:</strong> Settings → Privacy & Security<br />
                <strong>Safari:</strong> Settings → Privacy<br />
                <strong>Edge:</strong> Settings → Privacy, search, and services
              </p>
            </section>

            <section>
              <h2>6. Contact Us</h2>
              <p>
                <strong>Email:</strong> contact@rentease.com<br />
                <strong>Phone:</strong> +91 9949169887<br />
                <strong>Address:</strong> Sri City, Andhra Pradesh, India
              </p>
            </section>
          </div>

          <Link to="/" className="policy-btn policy-primary-btn">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
