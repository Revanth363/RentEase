// src/pages/FAQ.jsx
import React, { useState } from 'react';
import '../assets/css/FAQ.css';
import Header from '../components/Header'; // Adjust path if needed

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      icon: "fa-house-user",
      question: "How does RentEase work?",
      answer: "RentEase is your one-stop rental solution that connects property seekers with landlords and service providers. Browse listings, schedule viewings, and even book maintenance services all in one platform."
    },
    {
      icon: "fa-clock",
      question: "How long does the rental application process take?",
      answer: "The rental application process typically takes 24-48 hours. Once you submit your application with required documents, our team reviews it promptly."
    },
    {
      icon: "fa-dollar-sign",
      question: "What are the fees involved?",
      answer: "Our platform is free to browse. Application fees vary by property but typically range from 0.1% - 0.5%."
    },
    {
      icon: "fa-shield-alt",
      question: "How is my security deposit protected?",
      answer: "Your security deposit is held in a secure escrow account throughout your tenancy."
    },
    {
      icon: "fa-tools",
      question: "What maintenance services are available?",
      answer: "We offer a wide range of maintenance services including plumbing, electrical work, appliance repair, and cleaning."
    },
    {
      icon: "fa-key",
      question: "How do I schedule a property viewing?",
      answer: "Simply click the \"Schedule Viewing\" button on any property listing. You can choose from available time slots and receive instant confirmation."
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <Header />

      <div className="container">
        <div className="header">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <i className="fas fa-question-circle fa-3x" style={{ color: '#ffcc00' }}></i>
          </div>
          <h1>Frequently Asked Questions</h1>
          <p className="subheading">
            Find answers to common questions about RentEase's rental and service platform
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div className="faq-item" key={index}>
              <button
                className="faq-question"
                onClick={() => toggleFAQ(index)}
              >
                <div>
                  <i className={`fas ${faq.icon}`}></i>
                  {faq.question}
                </div>
                <span className="toggle-icon">
                  <i className={`fas fa-chevron-down ${activeIndex === index ? 'rotate' : ''}`}></i>
                </span>
              </button>
              <div className={`faq-answer ${activeIndex === index ? 'active' : ''}`}>
                {faq.answer}
              </div>
            </div>
          ))}
        </div>

        <div className="contact">
          Still have questions?{' '}
          <a href="mailto:support@rentease.com">Contact our support team</a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;