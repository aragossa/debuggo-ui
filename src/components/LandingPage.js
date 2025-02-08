import React from 'react';
import { ArrowRight, CheckCircle, Clock, Database } from 'lucide-react';
import Login from './Login';
import './LandingPage.css';

const LandingPage = () => {
  const [showLogin, setShowLogin] = React.useState(false);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav-container">
        <div className="nav-content">
          <div className="logo-container">
            <div className="logo-square"></div>
            <span className="logo-text">AuroQA</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button 
              onClick={() => setShowLogin(false)}
              className="modal-close"
            >
              ×
            </button>
            <Login />
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            All You Need Is <span className="hero-highlight">Two Clicks</span>
          </h1>
          <p className="hero-subtitle">
            AI-driven QA services using screenshots, tech docs, or links
          </p>
          <button 
            onClick={() => setShowLogin(true)}
            className="cta-button"
          >
            Get Started
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title">Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <CheckCircle className="feature-icon pink" />
            <h3 className="feature-title">Test Case Creation</h3>
            <p className="feature-description">
              Automated generation of test cases for websites at various lifecycle stages
            </p>
          </div>
          <div className="feature-card">
            <Database className="feature-icon blue" />
            <h3 className="feature-title">Bug Tracking</h3>
            <p className="feature-description">
              Seamless integration with popular bug tracking systems
            </p>
          </div>
          <div className="feature-card">
            <Clock className="feature-icon purple" />
            <h3 className="feature-title">Time Saving</h3>
            <p className="feature-description">
              Location-independent services accessible for both local and remote servers
            </p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section">
        <h2 className="section-title">Coming Soon</h2>
        <div className="timeline-card">
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <p>Beta Testing Expected: May 2025</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <h2 className="section-title">Keep In Touch</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <h3 className="contact-title">Founder</h3>
            <p className="contact-name">Ilya Ploskovitov</p>
            <a 
              href="mailto:ilya.ploskovitov@auroqa.com" 
              className="contact-email"
            >
              ilya.ploskovitov@auroqa.com
            </a>
            <p className="contact-phone">+972 53-528-6313</p>
          </div>
          <div className="contact-card">
            <h3 className="contact-title">Co-founder</h3>
            <p className="contact-name">Ivan Stolpnikov</p>
            <a 
              href="mailto:ivan.stolpnikov@auroqa.com" 
              className="contact-email"
            >
              ivan.stolpnikov@auroqa.com
            </a>
            <p className="contact-phone">+972 52-256-5380</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">&copy; 2025 AuroQA. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
