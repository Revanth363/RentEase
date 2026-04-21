import React from 'react';
import '../assets/css/PolicyPages.css';

export default function CookiePolicy() {
  return (
    <div className="policy-container">
      <div className="policy-content">
        <h1>Cookie Policy</h1>
        <p className="last-updated">Last Updated: April 2026</p>

        <section>
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your computer or mobile device when you visit our website. They allow us to remember your preferences and enhance your browsing experience. Cookies may be either "persistent" cookies or "session" cookies.
          </p>
        </section>

        <section>
          <h2>2. Types of Cookies We Use</h2>
          
          <h3>Essential Cookies</h3>
          <p>
            These cookies are necessary for the website to function properly and cannot be disabled. They enable basic functions like page navigation, login authentication, and access to secure areas of our website.
          </p>

          <h3>Performance and Analytics Cookies</h3>
          <p>
            These cookies help us understand how visitors interact with our website. They collect information about pages visited, time spent on pages, and any errors encountered. This data helps us optimize website performance and user experience.
          </p>

          <h3>Functional Cookies</h3>
          <p>
            These cookies remember your preferences and settings, such as language preference, theme selection, and login credentials. They enhance your experience by providing personalized functionality.
          </p>

          <h3>Marketing and Tracking Cookies</h3>
          <p>
            These cookies are used to track your activity across websites for targeted advertising purposes. They may be set by us or by third-party advertising partners.
          </p>
        </section>

        <section>
          <h2>3. Third-Party Cookies</h2>
          <p>
            Some cookies on our website are set by third-party service providers, such as Google Analytics, Payment Processors, Social Media Platforms, and Cloudinary. These third parties are responsible for their own cookie policies.
          </p>
        </section>

        <section>
          <h2>4. How to Control Cookies</h2>
          <p>
            You have the right to control and disable cookies through your browser settings. Most browsers allow you to accept all cookies, accept only essential cookies, block cookies from specific websites, or delete cookies stored on your device.
          </p>
        </section>

        <section>
          <h2>5. Browser Settings Instructions</h2>
          
          <h3>Google Chrome</h3>
          <p>Click the Menu icon → Settings → Privacy and security → Cookies and other site data</p>

          <h3>Mozilla Firefox</h3>
          <p>Click the Menu button → Settings → Privacy & Security → Cookies and Site Data</p>

          <h3>Safari</h3>
          <p>Click Safari in the top menu bar → Settings → Privacy → Cookies and website data</p>

          <h3>Microsoft Edge</h3>
          <p>Click the Settings and more button → Settings → Privacy, search, and services → Cookies and other site data</p>
        </section>

        <section>
          <h2>6. Do Not Track Signals</h2>
          <p>
            Some browsers include a "Do Not Track" feature. Our website currently does not respond to DNT signals, but we respect your privacy choices as outlined in this policy.
          </p>
        </section>

        <section>
          <h2>7. Updates to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
          </p>
        </section>

        <section>
          <h2>8. Contact Us</h2>
          <p>
            If you have questions about our Cookie Policy or how we use cookies, please contact us at: contact@rentease.com
          </p>
        </section>
      </div>
    </div>
  );
}
