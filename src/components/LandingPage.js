import React, { useState } from 'react';
import { ArrowRight, Check, Clock, Database, Code, Zap, Shield, BarChart, Layers, GitBranch, Users, Cpu, RefreshCw, Sliders, Target, Bug, Bot, Linkedin } from 'lucide-react';
import Login from './Login';
import './LandingPage.css';
import axios from 'axios';
import { ReactComponent as Logo } from '../logo.svg';

const LandingPage = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  const [showLogin, setShowLogin] = useState(false);
  const [formData, setFormData] = useState({ name: '', message: '' });
  const [formStatus, setFormStatus] = useState({ submitted: false, error: false, message: '' });

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav-container">
        <div className="nav-content">
          <div className="logo-container">
            <Logo width="100%" height="100%" />
          </div>
          <div className="nav-links">
            <a href="#about" className="nav-link">About</a>
            <a href="#team" className="nav-link">Team</a>
            <a href="#product" className="nav-link">Product</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#contact" className="nav-link">Contact</a>
            <a href="/login" className="nav-link">Login</a>
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

      {/* Join Beta Section */}
      <section id="join-beta" className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <div className="section-header">
                <h2 className="section-title"><span className="hero-highlight">Revolutionize</span> Your QA with AI-Powered Test Automation</h2>
                <h1 className="section-subtitle">Join the Debuggo Beta: Get Free Early Access Today!</h1>
                <h1 className="section-description">AI-Powered No-Code Platform for Seamless Test Automation</h1>
                <p className="section-description">Debuggo is a database-driven QA automation tool that generates and executes tests from screenshots, API schemas, tech docs, or URLs. Say goodbye to fragmented workflows and hardcoded scripts—empower your team to create maintainable, reusable tests without coding.</p>
              </div>
              <div className="section-header">
                <h2 className="section-subtitle">Join Beta for Free</h2>
              </div>
              <div className="hero-actions">
                <button onClick={() => setShowLogin(true)} className="cta-button">Get Started<ArrowRight size={20} /></button>
                <a href="#how-it-works" className="secondary-button">Learn More</a>
              </div>
              <div className="product-features">
                <h3>Why Join Beta Now?</h3>
                <div className="feature-highlights">
                  <div className="highlight-item">
                    <Check className="highlight-icon" />
                    <div>
                      <h4>Free Access:</h4>
                      <p>Test Debuggo in your real-world environment at no cost.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <Check className="highlight-icon" />
                    <div>
                      <h4>Shape the Product:</h4>
                      <p>Provide feedback to influence features and get priority support.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <Check className="highlight-icon" />
                    <div>
                      <h4>Future Perks:</h4>
                      <p>Beta participants get exclusive discounts on launch subscriptions.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <Check className="highlight-icon" />
                    <div>
                      <h4>Limited Spots:</h4>
                      <p>Be among the first to experience up to 80% time savings in test creation.</p>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">80%</span>
              <span className="stat-label">Time Saved</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Availability</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title"><span className="hero-highlight">About Debuggo</span>: Solving Real QA Challenges</h2>
            <p className="section-description">In today's fast-paced dev cycles, QA teams struggle with fragmented tools, time-consuming test creation, and maintenance nightmares. <span className="hero-highlight">Debuggo</span> integrates UI and API testing into one AI-driven platform, cutting inefficiencies and boosting coverage.</p>
          </div>
          <div className="about-content">
            <div className="about-text">

              <div className="product-features">
                <h3>Key Problems We Solve</h3>
                <div className="feature-highlights">
                  <div className="highlight-item">
                    <Check className="highlight-icon" />
                    <div>
                      <h4>Fragmented Workflows:</h4>
                      <p>No more separate UI/API tools—unified testing for complete coverage.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <Check className="highlight-icon" />
                    <div>
                      <h4>AI Bug Detection:</h4>
                      <p>AI proactively finds issues during execution that manual tests miss.</p>
                    </div>
                  </div>
                  <div className="highlight-item">
                    <Check className="highlight-icon" />
                    <div>
                      <h4>Slow Test Creation:</h4>
                      <p>Generate tests 80% faster from everyday inputs like screenshots.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h3><span className="hero-highlight">Our target:</span> QA teams, developers, and enterprises ready for scalable, no-code automation.</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Section */}
      <section id="product" className="product-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Product:<span className="hero-highlight"> Ready for Your Input</span></h2>
            <p className="section-subtitle"><span className="hero-highlight">Debuggo</span> is in advanced beta stage—core features built, now validating with real users like you.</p>
          </div>
          <div className="product-content">
            <div className="product-features">
              <h3>What You'll Get in Beta:</h3>
              <div className="feature-highlights">
                <div className="highlight-item">
                  <Check className="highlight-icon" />
                  <div>
                    <h4>AI Test Generation:</h4>
                    <p>Upload assets to auto-create suites</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <Check className="highlight-icon" />
                  <div>
                    <h4>Unified UI/API Testing:</h4>
                    <p>End-to-end flows with enhanced stability (up to 40% faster automation).</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <Check className="highlight-icon" />
                  <div>
                    <h4>Intelligent Bug Detection</h4>
                    <p>AI actively analyzes pages during test execution to identify potential issues and anomalies</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <Check className="highlight-icon" />
                  <div>
                    <h4>Intelligent Bug Detection:</h4>
                    <p>Real-time anomaly spotting.</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <Check className="highlight-icon" />
                  <div>
                    <h4>Database-Driven Design:</h4>
                    <p>Centralized, reusable tests for easy maintenance.</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <Check className="highlight-icon" />
                  <div>
                    <h4>Automation Boost:</h4>
                    <p>Accelerate processes up to 20x with smart workflows.</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <Check className="highlight-icon" />
                  <div>
                    <h4>Self-Healing Tests:</h4>
                    <p>Adapt to changes automatically, improving productivity significantly (up to 10x).</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <Check className="highlight-icon" />
                  <div>
                    <h4>Natural Language Tests:</h4>
                    <p>80% of end-to-end tests via plain English—no code needed.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-actions">
              <button onClick={() => setShowLogin(true)} className="cta-button">Join beta<ArrowRight size={20} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Powerful Features Tailored for You</h2>
        </div>


        <div className="product-content">
          <div className="product-features">
            <h3><span className="hero-highlight">Debuggo</span> combines AI with a robust architecture for efficient QA.</h3>
            <div className="feature-highlights">
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <h4>AI Test Generation:</h4>
                  <p>Optimal steps from UI elements, stored for reuse.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <h4>Bug Tracking Integration:</h4>
                  <p>Auto-reports to JIRA, GitHub, with logs and screenshots.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <h4>Time Savings:</h4>
                  <p>Asynchronous runs cut QA time by up to 80%.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <h4>No-Code Interface:</h4>
                  <p>Intuitive for non-tech users.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <h4>Parallel Execution:</h4>
                  <p>16 slots for fast testing.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <h4>Secure Handling:</h4>
                  <p>Runtime credential substitution for safety.</p>
                </div>
              </div>
            </div>
          </div>
        </div>




        <div className="product-content">
          <div className="product-features">
            <h3>Database Benefits:</h3>
            <div className="feature-highlights">
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <p>Centralized storage for no-duplication updates.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <p>Reusable components across teams.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <p>Collaborative editing without conflicts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Showcase Section */}
      <section className="screenshots-section">
        <div className="section-header">
          <h2 className="section-title">See It In Action</h2>
          <p className="section-subtitle">Real examples of Debuggo in use</p>
          <p className="section-description">
            Our database-driven platform makes test management simple and efficient. Generate test cases from screenshots, API schema files, or directly from your application's UI. All test steps and locators are stored in the database, making them reusable across your entire organization.
          </p>
        </div>
        <div className="screenshots-container">
          <div className="screenshot-item">
            <div className="screenshot-image test-case-image">
              {/* Test Case Generation Screenshot */}
              <img src="/images/test-case-generation.png" alt="Test Case Generation Interface" />
            </div>
            <div className="screenshot-description">
              <h3>Test Case Generation</h3>
              <p>Generate test cases from screenshots or URLs with AI assistance. Each test step is automatically stored in the database with proper locators and actions.</p>
            </div>
          </div>
          <div className="screenshot-item">
            <div className="screenshot-image environments-image">
              {/* Environments Management Screenshot */}
              <img src="/images/environments-management.png" alt="Environments Management Interface" />
            </div>
            <div className="screenshot-description">
              <h3>Environment Management</h3>
              <p>Easily manage different testing environments with secure credential storage. Environment variables are substituted at runtime, ensuring sensitive information never appears in test scripts.</p>
            </div>
          </div>


          <div className="screenshot-item">
            <div className="screenshot-image test-case-image">
              {/* Test Execution Screenshot */}
              <img src="/images/test-case-execution.png" alt="Test Case Execution" />
            </div>
            <div className="screenshot-description">
              <h3>Test Case Execution</h3>
              <p>The test case execution results, complete with screenshots for each step, are available below.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section">
        <div className="section-header">
          <h2 className="section-title">Example Use Cases:</h2>
        </div>





        <div className="product-content">
          <div className="product-features">
            <div className="feature-highlights">
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <h4>QA Teams:</h4>
                  <p>Automate routines, focus on strategy.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <h4>Developers:</h4>
                  <p>Quick feature tests without scripts.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <h4>DevOps:</h4>
                  <p>CI/CD integration for reliable deploys.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <h4>Product Managers:</h4>
                  <p>Code-free quality checks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Team Section */}
      <section id="team" className="team-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Meet the <span className="hero-highlight">Team Driving Innovation</span></h2>
          </div>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-photo">
                <img src="/images/photo.jpg" alt="Ilya Ploskovitov" className="member-image" />
              </div>
              <div className="member-info">
                <h3><span className="h3-title-primary">Ilya Ploskovitov</span></h3>
                <p className="member-role">Founder & CEO</p>
                <p className="member-bio">
                  QA leader at LUCY Awareness, expert in high-load automation, DevOps, and AI testing.
                </p>
                <div className="member-links">
                  <a
                    href="https://www.linkedin.com/in/aragossa/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="linkedin-link"
                  >
                    <Linkedin size={20} />
                    LinkedIn Profile
                  </a>
                </div>
              </div>
            </div>

            <div className="team-member">
              <div className="member-photo">
                <img src="/images/1656436650919.jpeg" alt="Sasha Zelenin" className="member-image" />
              </div>
              <div className="member-info">
                <h3><span className="h3-title-primary">Sasha Zelenin</span></h3>
                <p className="member-role">Mentor</p>
                <p className="member-bio">
                  Serial entrepreneur with 7 companies founded (5 sold), focusing on scaling and team building.
                </p>
                <div className="member-links">
                  <a
                    href="https://www.linkedin.com/in/aleksandr-zelenin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="linkedin-link"
                  >
                    <Linkedin size={20} />
                    LinkedIn Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>





      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Join Our Free Beta Program</h2>
        </div>
        <div className="product-content">
          <div className="product-features">
            <h3>Ready to streamline your QA? Sign up for beta testing:</h3>
            <div className="feature-highlights">
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <p>Provide real test cases.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <p>Get guided onboarding and direct feedback channels.</p>
                </div>
              </div>
              <div className="highlight-item">
                <Check className="highlight-icon" />
                <div>
                  <p>Influence roadmap and earn launch perks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-actions">
          <button onClick={() => setShowLogin(true)} className="cta-button">Apply Now<ArrowRight size={20} /></button>
        </div>
      </section>









      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-header">
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-subtitle">Questions? Schedule a demo or chat with us.</p>
        </div>
        <div className="contact-container">
          <div className="contact-form-container">
            {formStatus.submitted ? (
              <div className={`form-message ${formStatus.error ? 'error' : 'success'}`}>
                <h3>{formStatus.error ? 'Error' : 'Thank You!'}</h3>
                <p>{formStatus.message}</p>
                {formStatus.error && (
                  <div className="form-actions">
                    <button
                      onClick={() => setFormStatus({ submitted: false, error: false, message: '' })}
                      className="retry-button"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form
                className="contact-form"
                onSubmit={(e) => {
                  e.preventDefault();

                  // Validate form
                  if (!formData.name || !formData.message) {
                    setFormStatus({
                      submitted: true,
                      error: true,
                      message: 'Please fill out all required fields.'
                    });
                    return;
                  }

                  // Submit form data
                  axios.post(`${API_URL}/api/contact`, formData)
                    .then(response => {
                      setFormStatus({
                        submitted: true,
                        error: false,
                        message: 'Your message has been sent successfully. We will get back to you soon!'
                      });
                      setFormData({ name: '', message: '' });
                    })
                    .catch(error => {
                      setFormStatus({
                        submitted: true,
                        error: true,
                        message: 'There was an error sending your message. Please try again later.'
                      });
                      console.error('Error submitting contact form:', error);
                    });
                }}
              >
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Your message"
                    rows="4"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="contact-submit">Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <Logo width="100%" height="100%" />
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Founder</h4>
              <span>Ilya Ploskovitov</span>
              <a href="mailto:ilya.ploskovitov@auroqa.com">ilya.ploskovitov@auroqa.com</a>
              <span >+972 53-528-6313</span>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#contact">Contact</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">Blog</a>
              <a href="#">Support</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-text">&copy; 2025 Debuggo. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
