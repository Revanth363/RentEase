import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/PolicyPage.css';

export default function TermsOfService() {
  return (
    <div className="policy-wrapper">
      <div className="policy-whole-container">
        <div className="policy-container">
          <div className="policy-header">
            <h1>Terms and Conditions</h1>
            <p className="policy-date">Last Updated: April 2026</p>
          </div>

          <div className="policy-content">

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using the RentEase website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on RentEase for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to decompile or reverse engineer any software contained on RentEase</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            <li>Violating any applicable laws or regulations</li>
          </ul>
        </section>

        <section>
          <h2>3. Disclaimer</h2>
          <p>
            The materials on RentEase are provided on an 'as is' basis. RentEase makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2>4. Limitations</h2>
          <p>
            In no event shall RentEase or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on RentEase.
          </p>
        </section>

        <section>
          <h2>5. User Responsibilities</h2>
          <p>
            As a user of RentEase, you agree to provide accurate information, maintain confidentiality of your credentials, accept responsibility for account activities, not engage in unlawful activities, and respect the rights of other users.
          </p>
        </section>

        <section>
          <h2>6. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>

        <section>
          <h2>7. Contact Information</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us at: contact@rentease.com
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

