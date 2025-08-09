import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Clock, Database, Code, Zap, Shield, BarChart, Layers, GitBranch, Users, Cpu, RefreshCw, Sliders, Target, Bug, Bot, Linkedin } from 'lucide-react';
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
            <div className="logo-square">
              <Logo width="100%" height="100%" />
            </div>
            <span className="logo-text">AuroQA</span>
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

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            <span className="hero-highlight">Database-Driven</span> Test Automation
          </h1>
          <p className="hero-subtitle">
            AI-powered no-code platform that generates and executes test cases from screenshots, API schema files, tech docs, or URLs
          </p>
          <p className="hero-description">
            AuroQA is a database-driven QA automation platform that makes test creation and maintenance simple. All test cases, steps, and locators are stored in a centralized database, making them easily maintainable and reusable across your entire organization. Our no-code automation approach allows anyone to create and run tests without writing a single line of code. Say goodbye to hardcoded tests and hello to a more efficient testing process.
          </p>
          <div className="hero-actions">
            <button 
              onClick={() => setShowLogin(true)}
              className="cta-button"
            >
              Get Started
              <ArrowRight size={20} />
            </button>
            <a href="#how-it-works" className="secondary-button">
              Learn More
            </a>
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
            <h2 className="section-title">About AuroQA</h2>
            <p className="section-subtitle">Revolutionizing Test Automation with AI-Powered Intelligence</p>
          </div>
          <div className="about-content">
            <div className="about-text">
              <h3>What We Do</h3>
              <p>
                AuroQA solves the critical challenges facing QA teams, developers, and enterprises in today's fast-paced development environment. 
                We generate complete test automation flows that seamlessly combine UI and API testing, eliminating the fragmentation 
                that plagues traditional testing approaches.
              </p>
              <h3>The Problems We Solve</h3>
              <div className="problem-solutions">
                <div className="solution-item">
                  <Target className="solution-icon" />
                  <div>
                    <h4>Fragmented Testing Workflows</h4>
                    <p>Traditional tools force teams to manage UI and API tests separately, creating gaps in coverage and inefficient processes.</p>
                  </div>
                </div>
                <div className="solution-item">
                  <Bug className="solution-icon" />
                  <div>
                    <h4>AI Bug Detection</h4>
                    <p>Our AI actively searches for bugs on pages during test execution, catching issues that manual testing often misses.</p>
                  </div>
                </div>
                <div className="solution-item">
                  <Bot className="solution-icon" />
                  <div>
                    <h4>Time-Intensive Test Creation</h4>
                    <p>AI-powered test generation from screenshots, API schemas, and documentation reduces test creation time by 80%.</p>
                  </div>
                </div>
              </div>
              <h3>Our Target Audience</h3>
              <p>
                We serve QA teams looking to modernize their testing approach, developers seeking integrated testing solutions, 
                and enterprises requiring scalable, maintainable test automation across their entire technology stack.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="team-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Meet Our Team</h2>
            <p className="section-subtitle">Experienced leaders driving innovation in test automation</p>
          </div>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-photo">
                <img src="/images/photo.jpg" alt="Ilya Ploskovitov" className="member-image" />
              </div>
              <div className="member-info">
                <h3>Ilya Ploskovitov</h3>
                <p className="member-role">Founder & CEO | Senior QA Engineer</p>
                <p className="member-bio">
                  Experienced QA Engineer (Manual, Automation, Performance) with expertise in automation for high-loaded information systems.
                  Specialized in building comprehensive test automation frameworks using modern DevOps practices and AI-powered testing solutions.
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
          </div>
        </div>
      </section>

      {/* Product Details Section */}
      <section id="product" className="product-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Product</h2>
            <p className="section-subtitle">Comprehensive test automation platform ready for real-world deployment</p>
          </div>
          <div className="product-content">
            <div className="product-overview">
              <h3>Current Development Stage</h3>
              <div className="stage-indicator">
                <div className="stage-badge">Pre-Launch Testing Phase</div>
                <p>
                  AuroQA is currently in an advanced development stage, actively seeking test groups to validate 
                  our platform with real test cases in production environments. We've completed core development 
                  and are preparing for full market launch.
                </p>
              </div>
            </div>
            
            <div className="product-features">
              <h3>What Users Can Expect</h3>
              <div className="feature-highlights">
                <div className="highlight-item">
                  <CheckCircle className="highlight-icon" />
                  <div>
                    <h4>AI-Powered Test Generation</h4>
                    <p>Upload screenshots, API schemas, or documentation and watch AI create comprehensive test suites</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <CheckCircle className="highlight-icon" />
                  <div>
                    <h4>Unified UI & API Testing</h4>
                    <p>Single platform for complete test automation workflows covering both frontend and backend</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <CheckCircle className="highlight-icon" />
                  <div>
                    <h4>Intelligent Bug Detection</h4>
                    <p>AI actively analyzes pages during test execution to identify potential issues and anomalies</p>
                  </div>
                </div>
                <div className="highlight-item">
                  <CheckCircle className="highlight-icon" />
                  <div>
                    <h4>Database-Driven Architecture</h4>
                    <p>All test cases, steps, and locators stored centrally for maximum reusability and maintenance</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="product-cta">
              <h3>Ready to Join Our Testing Program?</h3>
              <p>
                We're actively seeking forward-thinking teams to participate in our pre-launch testing program. 
                Get early access to AuroQA and help shape the future of test automation.
              </p>
              <button 
                onClick={() => setShowLogin(true)}
                className="cta-button"
              >
                Join Testing Program
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">Everything you need to automate your QA process</p>
          <p className="section-description">
            AuroQA combines AI-powered analysis with a database-driven architecture to deliver a complete testing solution. All test cases, steps, and locators are stored in a centralized database, making them reusable and maintainable across your entire organization. Our platform integrates seamlessly with your existing tools and workflows, providing immediate value without disruption.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <CheckCircle className="feature-icon pink" />
            <h3 className="feature-title">AI Test Generation</h3>
            <p className="feature-description">
              Automated creation of test cases for websites at any stage of development. Our AI analyzes your application's UI, identifies key elements, and generates optimal test steps that are stored in the database for reuse.
            </p>
          </div>
          <div className="feature-card">
            <Database className="feature-icon blue" />
            <h3 className="feature-title">Bug Tracking</h3>
            <p className="feature-description">
              Seamless integration with JIRA, GitHub Issues, and other tracking systems. When tests fail, detailed reports with screenshots and error logs are automatically created and linked to your existing bug tracking workflow.
            </p>
          </div>
          <div className="feature-card">
            <Clock className="feature-icon purple" />
            <h3 className="feature-title">Time Saving</h3>
            <p className="feature-description">
              Reduce QA time by up to 80% with automated test generation and execution. Our asynchronous task processing system allows multiple tests to run concurrently without blocking your UI, maximizing efficiency and productivity.
            </p>
          </div>
          <div className="feature-card">
            <Code className="feature-icon green" />
            <h3 className="feature-title">No-Code Solution</h3>
            <p className="feature-description">
              Generate and run tests without writing a single line of code. Our database-driven approach stores all test components centrally, allowing non-technical team members to create, modify, and execute tests through an intuitive interface.
            </p>
          </div>
          <div className="feature-card">
            <Zap className="feature-icon orange" />
            <h3 className="feature-title">Parallel Execution</h3>
            <p className="feature-description">
              With 16 concurrent browser slots available, you can execute entire test suites in a fraction of the time, with real-time progress tracking and detailed reporting.
            </p>
          </div>
          <div className="feature-card">
            <Shield className="feature-icon teal" />
            <h3 className="feature-title">Secure Testing</h3>
            <p className="feature-description">
              Test both public and private applications with complete security. Environment variables for credentials are stored securely and substituted at runtime, ensuring sensitive information never appears in test scripts or logs.
            </p>
          </div>
        </div>
      </section>


      {/* Database-Driven Approach Section */}
      <section className="database-driven-section">
        <div className="section-header">
          <h2 className="section-title">Database-Driven Architecture</h2>
          <p className="section-subtitle">The foundation of maintainable test automation</p>
          <p className="section-description">
            Unlike traditional test automation frameworks that rely on hardcoded tests, AuroQA stores all test components in a centralized database. This approach eliminates script maintenance headaches and enables true test reusability across your organization.
          </p>
        </div>
        <div className="database-benefits-container">
          <div className="database-benefit-card">
            <Database className="benefit-icon" />
            <h3>Centralized Storage</h3>
            <p>All test cases, steps, locators, and actions are stored in a structured database, not in code files, making them easy to manage and update.</p>
          </div>
          <div className="database-benefit-card">
            <RefreshCw className="benefit-icon" />
            <h3>Reusable Components</h3>
            <p>Test steps and locators can be reused across multiple test cases, eliminating duplication and reducing maintenance effort.</p>
          </div>
          <div className="database-benefit-card">
            <Users className="benefit-icon" />
            <h3>Team Collaboration</h3>
            <p>Multiple team members can work on different test cases simultaneously without code conflicts, with changes immediately available to everyone.</p>
          </div>
          <div className="database-benefit-card">
            <Sliders className="benefit-icon" />
            <h3>Environment Variables</h3>
            <p>Credentials and environment-specific values are stored securely and substituted at runtime, keeping sensitive information out of test scripts.</p>
          </div>
        </div>
      </section>

      {/* Screenshots Showcase Section */}
      <section className="screenshots-section">
        <div className="section-header">
          <h2 className="section-title">See It In Action</h2>
          <p className="section-subtitle">Real examples of AuroQA in use</p>
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
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section">
        <div className="section-header">
          <h2 className="section-title">Use Cases</h2>
          <p className="section-subtitle">Perfect for teams of all sizes</p>
          <p className="section-description">
            AuroQA adapts to your team's specific needs. Whether you're a QA specialist looking to automate repetitive tasks, a developer wanting to ensure code quality, or a product manager seeking confidence in new releases, our platform provides the tools you need with a database-driven architecture that scales with your organization.
          </p>
        </div>
        <div className="use-cases-grid">
          <div className="use-case-card">
            <BarChart className="use-case-icon" />
            <h3 className="use-case-title">QA Teams</h3>
            <p className="use-case-description">
              Automate repetitive testing tasks with our database-driven approach. Generate test cases from screenshots and API schema files without writing code, allowing you to focus on more complex scenarios.
            </p>
          </div>
          <div className="use-case-card">
            <Layers className="use-case-icon" />
            <h3 className="use-case-title">Developers</h3>
            <p className="use-case-description">
              Quickly test new features without writing extensive test scripts. Our AI automatically identifies UI elements and generates optimal test steps that are stored in the database for reuse across your team.
            </p>
          </div>
          <div className="use-case-card">
            <GitBranch className="use-case-icon" />
            <h3 className="use-case-title">DevOps</h3>
            <p className="use-case-description">
              Integrate automated testing into your CI/CD pipeline with our API-first approach. Run tests in parallel using our Selenium Grid integration for faster feedback and more reliable deployments.
            </p>
          </div>
          <div className="use-case-card">
            <Users className="use-case-icon" />
            <h3 className="use-case-title">Product Managers</h3>
            <p className="use-case-description">
              Ensure product quality before each release without technical knowledge. Our no-code approach lets you create and run tests from screenshots or URLs, with all test steps stored in the database for easy maintenance.
            </p>
          </div>
        </div>
      </section>

      {/* No-Code Automation Section */}
      <section className="no-code-section">
        <div className="section-header">
          <h2 className="section-title">No-Code Automation</h2>
          <p className="section-subtitle">Test automation for everyone</p>
          <p className="section-description">
            AuroQA eliminates the need for coding skills in test automation. Our AI-powered platform handles the technical complexity, allowing anyone on your team to create, manage, and execute tests without writing a single line of code.
          </p>
        </div>
        <div className="no-code-features-container">
          <div className="no-code-feature">
            <div className="no-code-feature-icon-container">
              <Cpu className="no-code-feature-icon" />
            </div>
            <div className="no-code-feature-content">
              <h3>AI-Generated Test Steps</h3>
              <p>Upload screenshots or provide URLs, and our AI will automatically identify UI elements and generate optimal test steps with proper locators and actions.</p>
            </div>
          </div>
          <div className="no-code-feature">
            <div className="no-code-feature-icon-container">
              <Code className="no-code-feature-icon" />
            </div>
            <div className="no-code-feature-content">
              <h3>API Schema Testing</h3>
              <p>Generate comprehensive API tests from schema files without writing code. Our system automatically creates test cases for different endpoints and response validations.</p>
            </div>
          </div>
          <div className="no-code-feature">
            <div className="no-code-feature-icon-container">
              <Sliders className="no-code-feature-icon" />
            </div>
            <div className="no-code-feature-content">
              <h3>Visual Test Management</h3>
              <p>Manage all your test cases through an intuitive visual interface. Organize tests by project, view execution results, and troubleshoot failures—all without touching code.</p>
            </div>
          </div>
          <div className="no-code-feature">
            <div className="no-code-feature-icon-container">
              <Shield className="no-code-feature-icon" />
            </div>
            <div className="no-code-feature-content">
              <h3>Self-Healing Tests</h3>
              <p>Tests automatically adapt to UI changes without manual intervention. When elements change, our AI identifies alternative locators and updates the database, ensuring tests remain stable even as your application evolves.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-header">
          <h2 className="section-title">Get In Touch</h2>
          <p className="section-subtitle">We'd love to hear from you</p>
          <p className="section-description">
            Have questions about how AuroQA can help your team? Want to see a personalized demo of our database-driven test automation platform? Our team is ready to assist you in setting up a solution tailored to your organization's specific testing needs. Whether you're looking to integrate with your existing tools or start fresh with a complete testing solution, we're here to help.
          </p>
        </div>
        <div className="contact-container">
          <div className="contact-info">
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
          </div>
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
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
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
            <div className="logo-square">
              <Logo width="100%" height="100%" />
            </div>
            <span className="logo-text">AuroQA</span>
          </div>
          <div className="footer-links">
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
          <p className="footer-text">&copy; 2025 AuroQA. All rights reserved.</p>
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
