import React from 'react';
import './PlaceholderHelp.css';

const PlaceholderHelp = () => {
  return (
    <div className="placeholder-help">
      <div className="help-header">
        <h1>📚 Test Placeholders Guide</h1>
        <p>Learn how to use dynamic placeholders in your tests</p>
      </div>

      <div className="help-content">
        {/* Quick Reference */}
        <section className="help-section">
          <h2>🎯 Quick Reference</h2>
          <div className="syntax-boxes">
            <div className="syntax-box">
              <strong>UI Tests:</strong> <code>%placeholder%</code>
            </div>
            <div className="syntax-box">
              <strong>API Tests:</strong> <code>{`{{variable}}`}</code>
            </div>
          </div>
        </section>

        {/* Environment Variables */}
        <section className="help-section">
          <h2>🔑 Environment Variables</h2>
          <table className="help-table">
            <thead>
              <tr>
                <th>Placeholder</th>
                <th>Example Output</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>%base_url%</code></td>
                <td>https://app.example.com</td>
              </tr>
              <tr>
                <td><code>%login%</code></td>
                <td>admin@example.com</td>
              </tr>
              <tr>
                <td><code>%password%</code></td>
                <td>SecurePass123!</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Unique Names */}
        <section className="help-section">
          <h2>🏷️ Unique Identifiers (Cached)</h2>
          <div className="info-box">
            <strong>💡 Special:</strong> These remember their value throughout the test - consistent within the same test run!
          </div>
          <table className="help-table">
            <thead>
              <tr>
                <th>Placeholder</th>
                <th>Example Output</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>%unique_name%</code></td>
                <td>a7b3c9d2</td>
                <td>Random 8-char ID</td>
              </tr>
              <tr>
                <td><code>%unique_name:Client%</code></td>
                <td>Client_a7b3c9d2</td>
                <td>With prefix</td>
              </tr>
              <tr>
                <td><code>%unique_name:User:Test%</code></td>
                <td>User_a7b3c9d2_Test</td>
                <td>With prefix & suffix</td>
              </tr>
              <tr>
                <td><code>%timestamp_name%</code></td>
                <td>20250129_143052</td>
                <td>Timestamp-based</td>
              </tr>
              <tr>
                <td><code>%timestamp_name:Group%</code></td>
                <td>Group_20250129_143052</td>
                <td>With prefix</td>
              </tr>
              <tr>
                <td><code>%uuid_name:Client%</code></td>
                <td>Client_a7b3c9d2</td>
                <td>Short UUID</td>
              </tr>
              <tr>
                <td><code>%uuid_name:Client:false%</code></td>
                <td>Client_a7b3c9d2-e5f1-4a8b-9c3d</td>
                <td>Full UUID</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Personal Info */}
        <section className="help-section">
          <h2>👤 Personal Information</h2>
          <table className="help-table">
            <thead>
              <tr>
                <th>Placeholder</th>
                <th>Example Output</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>%random_name%</code></td>
                <td>John Smith</td>
              </tr>
              <tr>
                <td><code>%random_first_name%</code></td>
                <td>John</td>
              </tr>
              <tr>
                <td><code>%random_last_name%</code></td>
                <td>Smith</td>
              </tr>
              <tr>
                <td><code>%random_email%</code></td>
                <td>john.smith@example.com</td>
              </tr>
              <tr>
                <td><code>%random_phone%</code></td>
                <td>+12025551234 (E.164 format)</td>
              </tr>
              <tr>
                <td><code>%random_username%</code></td>
                <td>john_smith_123</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Location */}
        <section className="help-section">
          <h2>📍 Location</h2>
          <table className="help-table">
            <thead>
              <tr>
                <th>Placeholder</th>
                <th>Example Output</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>%random_address%</code></td>
                <td>742 Evergreen Terrace</td>
              </tr>
              <tr>
                <td><code>%random_city%</code></td>
                <td>Springfield</td>
              </tr>
              <tr>
                <td><code>%random_country%</code></td>
                <td>United States</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Business */}
        <section className="help-section">
          <h2>🏢 Business</h2>
          <table className="help-table">
            <thead>
              <tr>
                <th>Placeholder</th>
                <th>Example Output</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>%random_company%</code></td>
                <td>AcmeCorporation (alphabetic only)</td>
              </tr>
              <tr>
                <td><code>%random_job_title%</code></td>
                <td>Software Engineer</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Generic Data */}
        <section className="help-section">
          <h2>🎲 Generic Data</h2>
          <table className="help-table">
            <thead>
              <tr>
                <th>Placeholder</th>
                <th>Example Output</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>%random_string%</code></td>
                <td>k7m2p9x4q1</td>
                <td>Random string (default 10 chars)</td>
              </tr>
              <tr>
                <td><code>%random_string:5%</code></td>
                <td>a9f2k</td>
                <td>Custom length (5 chars)</td>
              </tr>
              <tr>
                <td><code>%random_number%</code></td>
                <td>7543</td>
                <td>Random number (1-10000)</td>
              </tr>
              <tr>
                <td><code>%random_number:1:100%</code></td>
                <td>42</td>
                <td>Custom range (1-100)</td>
              </tr>
              <tr>
                <td><code>%random_url%</code></td>
                <td>https://www.example.com</td>
                <td>URL</td>
              </tr>
              <tr>
                <td><code>%random_color%</code></td>
                <td>blue</td>
                <td>Color name</td>
              </tr>
              <tr>
                <td><code>%random_date%</code></td>
                <td>2024-03-15</td>
                <td>Date (YYYY-MM-DD)</td>
              </tr>
              <tr>
                <td><code>%random_date:%d/%m/%Y%</code></td>
                <td>15/03/2024</td>
                <td>Custom date format</td>
              </tr>
              <tr>
                <td><code>%random_boolean%</code></td>
                <td>True</td>
                <td>True/False</td>
              </tr>
              <tr>
                <td><code>%random_ip%</code></td>
                <td>192.168.1.42</td>
                <td>IP address</td>
              </tr>
              <tr>
                <td><code>%random_uuid%</code></td>
                <td>a7b3c9d2-e5f1-4a8b-9c3d</td>
                <td>UUID</td>
              </tr>
              <tr>
                <td><code>%random_text%</code></td>
                <td>Lorem ipsum dolor...</td>
                <td>Text paragraph (3 sentences)</td>
              </tr>
              <tr>
                <td><code>%random_text:5%</code></td>
                <td>Lorem ipsum dolor...</td>
                <td>Custom sentence count (5)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Special */}
        <section className="help-section">
          <h2>⭐ Special</h2>
          <table className="help-table">
            <thead>
              <tr>
                <th>Placeholder</th>
                <th>Example Output</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>%random_option%</code></td>
                <td>(Picks available option)</td>
                <td>Randomly select from dropdown options</td>
              </tr>
            </tbody>
          </table>
          <div className="info-box">
            <strong>💡 Dropdown Selection:</strong> Use <code>%random_option%</code> in dropdown/select fields to automatically pick a valid option. Never hardcode dropdown IDs!
          </div>
        </section>

        {/* Examples */}
        <section className="help-section">
          <h2>📝 Common Examples</h2>
          
          <div className="example-block">
            <h3>User Registration Form:</h3>
            <pre>{`First Name: %random_first_name%
Last Name: %random_last_name%
Email: %random_email%
Phone: %random_phone%
Username: %random_username%
Address: %random_address%
City: %random_city%
Country: %random_country%`}</pre>
          </div>

          <div className="example-block">
            <h3>Create/Find/Delete Entity (Cached):</h3>
            <pre>{`Step 1: Create client with name: %unique_name:Client%
        → Generates: "Client_a7b3c9d2"
        
Step 5: Find client: %unique_name:Client%
        → Uses cached: "Client_a7b3c9d2" (same!)
        
Step 10: Delete client: %unique_name:Client%
        → Uses cached: "Client_a7b3c9d2" (same!)`}</pre>
          </div>

          <div className="example-block">
            <h3>Dropdown Selection:</h3>
            <pre>{`Client: %random_option%  ← Picks any valid client
Category: %random_option%  ← Picks any valid category
Status: %random_option%  ← Picks any valid status`}</pre>
          </div>

          <div className="example-block">
            <h3>Custom Parameters:</h3>
            <pre>{`Order ID: %random_string:8%  → "k7m2p9x4"
Quantity: %random_number:1:100%  → "42"
Date: %random_date:%d/%m/%Y%  → "15/03/2024"
Description: %random_text:2%  → "Two sentences."
Promo Code: %random_string:6%  → "a9f2k5"`}</pre>
          </div>
        </section>

        {/* Best Practices */}
        <section className="help-section">
          <h2>✅ Best Practices</h2>
          <div className="tips-grid">
            <div className="tip-card do">
              <h3>✓ DO</h3>
              <ul>
                <li>Always use placeholders instead of hardcoded values</li>
                <li>Use <code>%unique_name:Prefix%</code> for consistency within test</li>
                <li>Use <code>%random_option%</code> for all dropdowns</li>
                <li>Use custom parameters like <code>%random_string:8%</code></li>
                <li>Combine placeholders: <code>%unique_name%@test.com</code></li>
                <li>Use <code>%timestamp_name%</code> for time-based ordering</li>
              </ul>
            </div>
            <div className="tip-card dont">
              <h3>✗ DON'T</h3>
              <ul>
                <li>Don't hardcode "Test Client" or "John Doe"</li>
                <li>Don't use specific dropdown IDs like "35" or "category_123"</li>
                <li>Don't mix <code>%unique_name%</code> and <code>%random_name%</code> for same entity</li>
                <li>Don't use <code>%random_*%</code> when you need consistency</li>
                <li>Don't forget to use cached placeholders for CRUD operations</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="help-footer">
        <p>For complete documentation, see the technical guides in the docs folder.</p>
      </div>
    </div>
  );
};

export default PlaceholderHelp;
