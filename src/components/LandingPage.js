import React from 'react';
import { ArrowRight, CheckCircle, Clock, Database, Code, Zap, Shield, BarChart, Layers, GitBranch, Users, Cpu, RefreshCw, Sliders } from 'lucide-react';
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

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Simple 3-step process to automate your testing</p>
          <p className="section-description">
            Our database-driven approach ensures that all test components are reusable and maintainable. No hardcoded tests or locators - everything is dynamically generated by AI and stored in a centralized database, allowing your entire team to benefit from the accumulated testing knowledge.
          </p>
        </div>
        <div className="process-container">
          <div className="process-step">
            <div className="process-number">1</div>
            <h3 className="process-title">Input Your URL</h3>
            <p className="process-description">Provide the URL of your web application, upload screenshots, or share technical documentation. The system associates all tests with your selected project for better organization and management.</p>
          </div>
          <div className="process-arrow">
            <ArrowRight size={24} />
          </div>
          <div className="process-step">
            <div className="process-number">2</div>
            <h3 className="process-title">AI Analysis</h3>
            <p className="process-description">Our AI analyzes the page structure and generates optimal test cases. All test steps, locators, and actions are stored in the database in a standardized format, making them reusable across your organization.</p>
          </div>
          <div className="process-arrow">
            <ArrowRight size={24} />
          </div>
          <div className="process-step">
            <div className="process-number">3</div>
            <h3 className="process-title">Execute Tests</h3>
            <p className="process-description">Run tests automatically and receive detailed reports. Our asynchronous task processing system allows multiple tests to run concurrently without blocking your UI.</p>
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
            <form className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input type="text" id="name" name="name" placeholder="Your name" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" placeholder="Your email" />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" placeholder="Your message" rows="4"></textarea>
              </div>
              <button type="submit" className="contact-submit">Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-square"></div>
            <span className="logo-text">AuroQA</span>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#">Pricing</a>
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
