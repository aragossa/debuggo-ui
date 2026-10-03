import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './MetricsDashboard.css';

const MetricsDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Metrics data
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [slowestSuites, setSlowestSuites] = useState([]);
  const [flakySuites, setFlakySuites] = useState([]);
  const [failureAnalysis, setFailureAnalysis] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || '';

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/execution-plans`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
          if (data.plans && data.plans.length > 0) {
            setSelectedPlanId(data.plans[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to fetch execution plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Fetch metrics when plan is selected
  useEffect(() => {
    if (!selectedPlanId) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch all metrics in parallel
        const [statsRes, trendRes, slowestRes, flakyRes, failureRes, dashboardRes] = await Promise.all([
          fetch(`${API_BASE}/api/metrics/plans/${selectedPlanId}/stats`, { headers }),
          fetch(`${API_BASE}/api/metrics/plans/${selectedPlanId}/trend?days=30`, { headers }),
          fetch(`${API_BASE}/api/metrics/plans/${selectedPlanId}/slowest-suites?limit=10`, { headers }),
          fetch(`${API_BASE}/api/metrics/plans/${selectedPlanId}/flaky-suites?limit=10`, { headers }),
          fetch(`${API_BASE}/api/metrics/plans/${selectedPlanId}/failure-analysis`, { headers }),
          fetch(`${API_BASE}/api/metrics/plans/${selectedPlanId}/dashboard`, { headers })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (trendRes.ok) {
          const data = await trendRes.json();
          setTrend(data.trend || []);
        }
        if (slowestRes.ok) {
          const data = await slowestRes.json();
          setSlowestSuites(data.slowest_suites || []);
        }
        if (flakyRes.ok) {
          const data = await flakyRes.json();
          setFlakySuites(data.flaky_suites || []);
        }
        if (failureRes.ok) setFailureAnalysis(await failureRes.json());
        if (dashboardRes.ok) setDashboard(await dashboardRes.json());

        setError(null);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Failed to fetch metrics data');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedPlanId]);

  const renderOverview = () => {
    if (!stats) return <div className="no-data">No data available</div>;

    return (
      <div className="metrics-overview">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-bg"><i className="fas fa-play"></i></div>
            <div className="metric-content">
              <div className="metric-label">Total Runs</div>
              <div className="metric-value">{stats.total_runs}</div>
              <div className="metric-subtext">execution runs</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-bg"><i className="fas fa-check-circle"></i></div>
            <div className="metric-content">
              <div className="metric-label">Pass Rate</div>
              <div className="metric-value" style={{ color: stats.pass_rate >= 80 ? '#10b981' : '#ef4444' }}>
                {stats.pass_rate.toFixed(1)}%
              </div>
              <div className="metric-subtext">{stats.passed_runs}/{stats.total_runs} passed</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-bg"><i className="fas fa-clock"></i></div>
            <div className="metric-content">
              <div className="metric-label">Avg Duration</div>
              <div className="metric-value">{stats.avg_duration_seconds.toFixed(1)}s</div>
              <div className="metric-subtext">average execution time</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-bg"><i className="fas fa-vial"></i></div>
            <div className="metric-content">
              <div className="metric-label">Total Tests</div>
              <div className="metric-value">{stats.total_tests}</div>
              <div className="metric-subtext">{stats.total_passed_tests} passed, {stats.total_failed_tests} failed</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-bg"><i className="fas fa-percentage"></i></div>
            <div className="metric-content">
              <div className="metric-label">Test Pass Rate</div>
              <div className="metric-value" style={{ color: stats.overall_pass_rate >= 90 ? '#10b981' : '#f59e0b' }}>
                {stats.overall_pass_rate.toFixed(1)}%
              </div>
              <div className="metric-subtext">overall test success rate</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-bg"><i className="fas fa-hourglass-half"></i></div>
            <div className="metric-content">
              <div className="metric-label">Duration Range</div>
              <div className="metric-value">{stats.min_duration_seconds.toFixed(1)}s - {stats.max_duration_seconds.toFixed(1)}s</div>
              <div className="metric-subtext">min to max execution time</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTrend = () => {
    if (!trend || trend.length === 0) return <div className="no-data">No trend data available</div>;

    return (
      <div className="metrics-trend">
        <h3>Execution Trend (Last 30 Days)</h3>
        <div className="metrics-table-container">
          <table className="metrics-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Runs</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Pass Rate</th>
                <th>Avg Duration</th>
                <th>Test Pass Rate</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((item, idx) => (
                <tr key={idx}>
                  <td className="date-cell">{item.date}</td>
                  <td>{item.total_runs}</td>
                  <td className="success-text">{item.passed_runs}</td>
                  <td className="failure-text">{item.failed_runs}</td>
                  <td>
                    <span className={`status-badge ${item.pass_rate >= 80 ? 'success' : 'failure'}`}>
                      {item.pass_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td>{item.avg_duration_seconds.toFixed(1)}s</td>
                  <td>
                    <span className={`status-badge ${item.test_pass_rate >= 90 ? 'success' : 'warning'}`}>
                      {item.test_pass_rate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    return (
      <div className="metrics-performance">
        <div className="performance-section">
          <h3>Slowest Suites</h3>
          {slowestSuites.length === 0 ? (
            <div className="no-data">No data available</div>
          ) : (
            <div className="metrics-table-container">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Suite ID</th>
                    <th>Avg Duration</th>
                    <th>Runs</th>
                    <th>Pass Rate</th>
                    <th>Max Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {slowestSuites.map((suite, idx) => (
                    <tr key={idx}>
                      <td className="suite-id-cell">Suite #{suite.suite_id}</td>
                      <td className="duration-cell">{suite.avg_duration_seconds.toFixed(1)}s</td>
                      <td>{suite.total_runs}</td>
                      <td>
                        <span className={`status-badge ${suite.pass_rate >= 80 ? 'success' : 'failure'}`}>
                          {suite.pass_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td>{suite.max_duration_seconds.toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="performance-section">
          <h3>Flakiest Suites</h3>
          {flakySuites.length === 0 ? (
            <div className="no-data">No data available</div>
          ) : (
            <div className="metrics-table-container">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Suite ID</th>
                    <th>Flakiness Score</th>
                    <th>Runs</th>
                    <th>Pass Rate</th>
                    <th>Duration StdDev</th>
                  </tr>
                </thead>
                <tbody>
                  {flakySuites.map((suite, idx) => (
                    <tr key={idx}>
                      <td className="suite-id-cell">Suite #{suite.suite_id}</td>
                      <td className="flakiness-cell">{suite.flakiness_score.toFixed(2)}</td>
                      <td>{suite.total_runs}</td>
                      <td>
                        <span className={`status-badge ${suite.pass_rate >= 80 ? 'success' : 'failure'}`}>
                          {suite.pass_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td>{suite.duration_stddev.toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFailureAnalysis = () => {
    if (!failureAnalysis) return <div className="no-data">No data available</div>;

    return (
      <div className="metrics-failure">
        <div className="metrics-grid">
          <div className="metric-card failure-card">
            <div className="metric-icon-bg failure"><i className="fas fa-bug"></i></div>
            <div className="metric-content">
              <div className="metric-label">Total Failures</div>
              <div className="metric-value">{failureAnalysis.total_failures}</div>
            </div>
          </div>

          <div className="metric-card failure-card">
            <div className="metric-icon-bg failure"><i className="fas fa-folder-open"></i></div>
            <div className="metric-content">
              <div className="metric-label">Suites with Failures</div>
              <div className="metric-value">{failureAnalysis.suites_with_failures}</div>
            </div>
          </div>

          <div className="metric-card failure-card">
            <div className="metric-icon-bg failure"><i className="fas fa-times-circle"></i></div>
            <div className="metric-content">
              <div className="metric-label">Failed Tests</div>
              <div className="metric-value">{failureAnalysis.total_failed_tests}</div>
            </div>
          </div>

          <div className="metric-card failure-card">
            <div className="metric-icon-bg failure"><i className="fas fa-chart-pie"></i></div>
            <div className="metric-content">
              <div className="metric-label">Failure Rate</div>
              <div className="metric-value" style={{ color: failureAnalysis.failure_rate > 20 ? '#ef4444' : '#f59e0b' }}>
                {failureAnalysis.failure_rate.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="metric-card failure-card">
            <div className="metric-icon-bg failure"><i className="fas fa-exclamation-triangle"></i></div>
            <div className="metric-content">
              <div className="metric-label">Avg Failures/Run</div>
              <div className="metric-value">{failureAnalysis.avg_failures_per_run.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    if (!dashboard) return <div className="no-data">No data available</div>;

    return (
      <div className="metrics-dashboard-full">
        <div className="dashboard-section">
          <h3>Execution Statistics</h3>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-name">Total Runs:</span>
              <span className="stat-val">{dashboard.execution_stats.total_runs}</span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Pass Rate:</span>
              <span className="stat-val" style={{ color: dashboard.execution_stats.pass_rate >= 80 ? '#10b981' : '#ef4444' }}>
                {dashboard.execution_stats.pass_rate.toFixed(1)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Avg Duration:</span>
              <span className="stat-val">{dashboard.execution_stats.avg_duration_seconds.toFixed(1)}s</span>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Failure Analysis</h3>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-name">Total Failures:</span>
              <span className="stat-val">{dashboard.failure_analysis.total_failures}</span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Failure Rate:</span>
              <span className="stat-val" style={{ color: dashboard.failure_analysis.failure_rate > 20 ? '#ef4444' : '#f59e0b' }}>
                {dashboard.failure_analysis.failure_rate.toFixed(1)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-name">Suites with Failures:</span>
              <span className="stat-val">{dashboard.failure_analysis.suites_with_failures}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h3>Top Slowest Suites</h3>
          {dashboard.slowest_suites.length === 0 ? (
            <div className="no-data">No data</div>
          ) : (
            <div className="mini-suite-list">
              {dashboard.slowest_suites.slice(0, 5).map((suite, idx) => (
                <div key={idx} className="mini-suite">
                  <span>Suite #{suite.suite_id}</span>
                  <span>{suite.avg_duration_seconds.toFixed(1)}s</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h3>Top Flaky Suites</h3>
          {dashboard.flaky_suites.length === 0 ? (
            <div className="no-data">No data</div>
          ) : (
            <div className="mini-suite-list">
              {dashboard.flaky_suites.slice(0, 5).map((suite, idx) => (
                <div key={idx} className="mini-suite">
                  <span>Suite #{suite.suite_id}</span>
                  <span>Flakiness: {suite.flakiness_score.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="metrics-dashboard-container">
      <div className="metrics-header">
        <h1>Metrics & Analytics</h1>
        <p>Test execution metrics, trends, and performance analysis</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="metrics-controls">
        <div className="plan-selector">
          <label htmlFor="plan-select">Select Execution Plan:</label>
          <select
            id="plan-select"
            value={selectedPlanId || ''}
            onChange={(e) => setSelectedPlanId(parseInt(e.target.value))}
            disabled={loading}
          >
            <option value="">-- Select a plan --</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name} (ID: {plan.id})
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="loading-spinner">Loading metrics...</div>}
      </div>

      {selectedPlanId && !loading && (
        <>
          <div className="metrics-tabs">
            <button
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-button ${activeTab === 'trend' ? 'active' : ''}`}
              onClick={() => setActiveTab('trend')}
            >
              Trends
            </button>
            <button
              className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </button>
            <button
              className={`tab-button ${activeTab === 'failure' ? 'active' : ''}`}
              onClick={() => setActiveTab('failure')}
            >
              Failures
            </button>
            <button
              className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
          </div>

          <div className="metrics-content">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'trend' && renderTrend()}
            {activeTab === 'performance' && renderPerformance()}
            {activeTab === 'failure' && renderFailureAnalysis()}
            {activeTab === 'dashboard' && renderDashboard()}
          </div>
        </>
      )}
    </div>
  );
};

export default MetricsDashboard;
