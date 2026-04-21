import React, { useState } from 'react';
import '../assets/css/PolicyPages.css';

export default function Policies() {
  const [activeTab, setActiveTab] = useState('privacy');

  const privacyContent = (
    <div>
      <h1>Privacy Policy</h1>
      <p className="last-updated">Last Updated: April 2026</p>
      <section>
        <h2>1. Introduction</h2>
        <p>Welcome to RentEase. We are committed to protecting your privacy and ensuring you have a positive experience on our platform.</p>
      </section>
      <section>
        <h2>2. Information We Collect</h2>
        <p>We may collect personal data, property information, usage data, and payment information from users.</p>
      </section>
      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use collected information to provide services, process payments, send communications, respond to inquiries, and improve our platform.</p>
      </section>
      <section>
        <h2>4. Data Security</h2>
        <p>We implement appropriate technical and organizational measures to protect your personal data.</p>
      </section>
      <section>
        <h2>5. Contact Us</h2>
        <p><strong>Email:</strong> contact@rentease.com</p>
      </section>
    </div>
  );

  const termsContent = (
    <div>
      <h1>Terms and Conditions</h1>
      <p className="last-updated">Last Updated: April 2026</p>
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using the RentEase website and services, you accept and agree to be bound by the terms of this agreement.</p>
      </section>
      <section>
        <h2>2. Use License</h2>
        <p>Permission is granted to temporarily download materials for personal, non-commercial viewing only.</p>
      </section>
      <section>
        <h2>3. User Responsibilities</h2>
        <p>You agree to provide accurate information, maintain confidentiality, accept account responsibility, and respect other users' rights.</p>
      </section>
      <section>
        <h2>4. Governing Law</h2>
        <p>These terms are governed by the laws of India.</p>
      </section>
      <section>
        <h2>5. Contact Us</h2>
        <p><strong>Email:</strong> contact@rentease.com</p>
      </section>
    </div>
  );

  const policyContent = (
    <div>
      <h1>Website Data Policy</h1>
      <p className="last-updated">Last Updated: April 2026</p>
      <section>
        <h2>1. Website Data Collection</h2>
        <p>Our website uses tracking pixels, browser storage, and similar technologies to enhance your experience and remember your preferences.</p>
      </section>
      <section>
        <h2>2. Types of Data We Collect</h2>
        <ul>
          <li>Essential Data: Required for website functionality and login authentication</li>
          <li>Performance Data: Helps us understand how visitors interact with our website</li>
          <li>Functional Data: Remembers your preferences and settings</li>
          <li>Tracking Data: For analytics and service improvement</li>
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
        <p><strong>Chrome:</strong> Settings → Privacy and security → Site data<br/>
           <strong>Firefox:</strong> Settings → Privacy & Security<br/>
           <strong>Safari:</strong> Settings → Privacy<br/>
           <strong>Edge:</strong> Settings → Privacy</p>
      </section>
      <section>
        <h2>6. Contact Us</h2>
        <p><strong>Email:</strong> contact@rentease.com</p>
      </section>
    </div>
  );

  return (
    <div className="policy-container">
      <div className="policy-content">
        <div style={{ marginBottom: '30px', borderBottom: '2px solid #007bff', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('privacy')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'privacy' ? '#007bff' : '#f0f0f0',
                color: activeTab === 'privacy' ? 'white' : '#333',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'terms' ? '#007bff' : '#f0f0f0',
                color: activeTab === 'terms' ? 'white' : '#333',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => setActiveTab('data')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                backgroundColor: activeTab === 'data' ? '#007bff' : '#f0f0f0',
                color: activeTab === 'data' ? 'white' : '#333',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Data Policy
            </button>
          </div>
        </div>

        <div>
          {activeTab === 'privacy' && privacyContent}
          {activeTab === 'terms' && termsContent}
          {activeTab === 'data' && policyContent}
        </div>
      </div>
    </div>
  );
}
