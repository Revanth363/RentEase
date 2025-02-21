// src/pages/AboutUs.jsx
import React from "react";
import "../assets/css/AboutUs.css";
import '@fortawesome/fontawesome-free/css/all.min.css';

const AboutUs = () => {
  return (
    <div className="about-us-page">
      {/* Include your Header component here */}
      {/* <Header /> */}
      
      <div className="whole_container">
        <div className="container">
          <div className="about-section">
            <div className="about-info">
              <h2>About RentEase</h2>

              <div className="mission-item">
                <h3>Our Mission</h3>
                <p>
                  At RentEase, we're simplifying the home rental experience by
                  connecting property seekers with homeowners and providing
                  essential domestic services - all in one seamless platform.
                </p>
                <p>
                  Our goal is to transform the rental process into a hassle-free
                  experience for everyone involved while creating opportunities
                  for domestic service providers.
                </p>
              </div>

              <div className="mission-item">
                <h3>Our Vision</h3>
                <p>
                  We envision a world where finding and managing rental homes is
                  stress-free, transparent, and accessible to all. RentEase aims
                  to be the go-to platform for all your housing and domestic
                  service needs.
                </p>
              </div>

              <div className="mission-item">
                <h3>What Sets Us Apart</h3>
                <p>
                  Unlike traditional rental platforms, RentEase offers a
                  comprehensive solution that includes property listings, rental
                  agreements, monthly payment management, and domestic services -
                  creating a complete ecosystem for modern living.
                </p>
              </div>
            </div>

            <div className="team-info">
              <h2>Core Features</h2>

              <div className="feature-list">
                <div className="feature-item">
                  <h3><i className="fas fa-home"></i> Property Listings</h3>
                  <p>
                    Detailed rental property listings with photos, amenities, and
                    pricing
                  </p>
                </div>

                <div className="feature-item">
                  <h3><i className="fas fa-search"></i> Smart Search</h3>
                  <p>
                    Advanced filters to find the perfect home based on your
                    requirements
                  </p>
                </div>

                <div className="feature-item">
                  <h3><i className="fas fa-file-contract"></i> Rental Agreements</h3>
                  <p>Streamlined digital rental contracts and documentation</p>
                </div>

                <div className="feature-item">
                  <h3><i className="fas fa-money-bill-wave"></i> Online Payments</h3>
                  <p>Secure monthly rent payment processing system</p>
                </div>

                <div className="feature-item">
                  <h3><i className="fas fa-broom"></i> Domestic Services</h3>
                  <p>Access to verified cooks, cleaners, and laundry services</p>
                </div>

                <div className="feature-item">
                  <h3><i className="fas fa-tools"></i> Maintenance Requests</h3>
                  <p>
                    Easy submission and tracking of property maintenance issues
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-section" style={{ marginTop: "2rem" }}>
            <div className="team-info">
              <h2>Meet Our Team</h2>

              <div className="team-member">
                <div className="team-avatar">
                  <i className="fas fa-user-circle fa-3x" style={{ color: "#ffcc00" }}></i>
                </div>
                <div className="team-member-info">
                  <h3>Syed Dheeraj Shahul</h3>
                  <p>Dashboards & Property Management</p>
                </div>
              </div>

              <div className="team-member">
                <div className="team-avatar">
                  <i className="fas fa-user-circle fa-3x" style={{ color: "#ffcc00" }}></i>
                </div>
                <div className="team-member-info">
                  <h3>Dompaka Revanth Kumar</h3>
                  <p>Admin Systems & Database Integration</p>
                </div>
              </div>

              <div className="team-member">
                <div className="team-avatar">
                  <i className="fas fa-user-circle fa-3x" style={{ color: "#ffcc00" }}></i>
                </div>
                <div className="team-member-info">
                  <h3>Akula Sai Satish</h3>
                  <p>Authentication & Request Systems</p>
                </div>
              </div>

              <div className="team-member">
                <div className="team-avatar">
                  <i className="fas fa-user-circle fa-3x" style={{ color: "#ffcc00" }}></i>
                </div>
                <div className="team-member-info">
                  <h3>Baikidi Vignesh</h3>
                  <p>UI/UX Design & Property registration and unified header development</p>
                </div>
              </div>

              <div className="team-member">
                <div className="team-avatar">
                  <i className="fas fa-user-circle fa-3x" style={{ color: "#ffcc00" }}></i>
                </div>
                <div className="team-member-info">
                  <h3>Talla Ganesh Koti Reddy</h3>
                  <p>Worker Service Listings & Quality Assurance</p>
                </div>
              </div>
            </div>

            <div className="about-info">
              <h2>Our Approach</h2>

              <div className="mission-item">
                <h3>User-Centered Design</h3>
                <p>
                  We've built RentEase with a focus on intuitive navigation and
                  seamless user experience, making property management accessible
                  to everyone.
                </p>
              </div>

              <div className="mission-item">
                <h3>Trust & Security</h3>
                <p>
                  We prioritize secure transactions, verified listings, and
                  protected user data to create a trustworthy platform for all our
                  users.
                </p>
              </div>

              <div className="mission-item">
                <h3>Community Building</h3>
                <p>
                  RentEase aims to foster connections between homeowners, tenants,
                  and service providers, creating a supportive ecosystem for all
                  involved.
                </p>
              </div>

              <div className="mission-item">
                <h3>Continuous Improvement</h3>
                <p>
                  We're constantly enhancing our platform based on user feedback
                  to better serve the needs of our growing community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;