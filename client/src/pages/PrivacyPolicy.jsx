import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/PolicyPage.css';

export default function PrivacyPolicy() {
  return (
    <div className="policy-wrapper">
      <div className="policy-whole-container">
        <div className="policy-container">
          <div className="policy-header">
            <h1>Privacy Policy</h1>
            <p className="policy-date">Last Updated: April 2026</p>
          </div>

          <div className="policy-content">

        <section>
          <h2>1. Introduction</h2>
          <p>
            Welcome to RentEase. We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect on the site includes:</p>
          <ul>
            <li>
              <strong>Personal Data:</strong> Name, email address, phone number, physical address, payment information, and other details you provide when registering or using our services.
            </li>
            <li>
              <strong>Property Information:</strong> Details about properties you list, including photos, descriptions, pricing, and occupancy information.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact with our platform, including IP address, browser type, pages visited, and time spent on pages.
            </li>
            <li>
              <strong>Payment Information:</strong> Transaction details processed through secure payment gateways (we do not store full credit card details).
            </li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>RentEase uses the collected information for various purposes:</p>
          <ul>
            <li>To provide, maintain, and improve our services</li>
            <li>To process payments and prevent fraudulent transactions</li>
            <li>To send transactional emails and service updates</li>
            <li>To respond to your inquiries and customer support requests</li>
            <li>To personalize your experience and recommend relevant services</li>
            <li>To comply with legal obligations and enforce our terms of service</li>
            <li>To conduct research and analytics to improve our platform</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
          </p>
        </section>

        <section>
          <h2>5. Information Sharing</h2>
          <p>
            We do not sell, trade, or transfer your personally identifiable information to outside parties except in the following cases:
          </p>
          <ul>
            <li>To trusted service providers who assist us in operating our website and conducting our business</li>
            <li>When required by law or to protect the rights and safety of RentEase, our users, or the public</li>
            <li>With your explicit consent for specific purposes</li>
          </ul>
        </section>

        <section>
          <h2>6. Your Privacy Rights</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li>Right to access your personal data</li>
            <li>Right to correct inaccurate data</li>
            <li>Right to request deletion of your data</li>
            <li>Right to opt-out of marketing communications</li>
            <li>Right to data portability</li>
          </ul>
          <p>To exercise any of these rights, please contact us at contact@rentease.com.</p>
        </section>

        <section>
          <h2>7. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience on our platform. You can control cookie settings through your browser preferences. For more information, see our Cookie Policy.
          </p>
        </section>

        <section>
          <h2>8. Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites. This Privacy Policy only applies to our website. We are not responsible for the privacy practices of external sites and encourage you to review their privacy policies.
          </p>
        </section>

        <section>
          <h2>9. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> contact@rentease.com<br />
            <strong>Address:</strong> Sri City, Andhra Pradesh, India<br />
            <strong>Phone:</strong> +91 9949169887
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

