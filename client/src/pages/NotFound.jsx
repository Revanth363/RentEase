import React from "react";
import { Link } from "react-router-dom";
import "../assets/css/NotFound.css";

const NotFound = () => {
  return (
    <div className="notFound-wrapper">
      <div className="notFound-whole-container">
        <div className="notFound-container">
          <div className="notFound-section">
            {/* Visual / Error Code Area */}
            <div className="notFound-visual">
              <h1 className="notFound-error-code">404</h1>
              <div className="notFound-error-icon">😕</div>
            </div>

            {/* Message Area */}
            <div className="notFound-message">
              <h2>Oops! Page Not Found</h2>
              <p>
                The page you're looking for might have been removed, had its name changed,
                or is temporarily unavailable.
              </p>
              <p>Don't worry — we're here to help!</p>

              {/* Home Button – same style as Contact Us */}
              <Link to="/" className="notFound-btn notFound-primary-btn">
                Return to Home Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;