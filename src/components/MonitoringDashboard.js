import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MonitoringDashboard.css';

const MonitoringDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState(24);
  
  // Data states
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [trends, setTrends] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  const fetchData = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [healthRes, metricsRes, alertsRes, trendsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/monitoring/health`, { headers }),
        axios.get(`${API_BASE_URL}/api/monitoring/metrics?hours=${timeRange}`, { headers }),
        axios.get(`${API_BASE_URL}/api/monitoring/alerts`, { headers }),
        axios.get(`${API_BASE_URL}/api/monitoring/trends?hours=${timeRange}&interval_minutes=60`, { headers }),
      ]);

      setHealth(healthRes.data.data);
      setMetrics(metricsRes.data.data);
      setAlerts(alertsRes.data.data);
      setTrends(trendsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch monitoring data');
      console.error('Error fetching monitoring data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="monitoring-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="monitoring-container">
      {/* Header */}
      <div className="monitoring-header">
        <div>
          <h1>Monitoring Dashboard</h1>
          <p>Real-time metrics for AI Agent services</p>
        </div>
        <div className="header-controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="time-range-select"
          >
            <option value={1}>Last 1 Hour</option>
            <option value={24}>Last 24 Hours</option>
            <option value={168}>Last 7 Days</option>
            <option value={720}>Last 30 Days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="refresh-button"
          >
            {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="error-alert">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Health Status */}
      {health && (
        <div className="health-card">
          <div className="health-header">
            <h2>System Health</h2>
            <div className="health-status">
              <span
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(health.overall_status) }}
              ></span>
              <span className="status-text">{health.overall_status.toUpperCase()}</span>
            </div>
          </div>

          {/* Tables Status */}
          <div className="tables-grid">
            {Object.entries(health.tables || {}).map(([tableName, tableData]) => (
              <div key={tableName} className="table-status">
                <div className="table-header">
                  <span className="table-name">{tableName}</span>
                  <span
                    className="table-indicator"
                    style={{
                      backgroundColor:
                        tableData.status === 'healthy' ? '#10b981' : '#f59e0b',
                    }}
                  ></span>
                </div>
                <div className="table-count">{tableData.record_count}</div>
                <div className="table-label">records</div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          {health.recent_activity && (
            <div className="recent-activity">
              <h3>Recent Activity (1h)</h3>
              <div className="activity-grid">
                <div className="activity-item">
                  <div className="activity-value">{health.recent_activity.validations_1h}</div>
                  <div className="activity-label">Validations</div>
                </div>
                <div className="activity-item">
                  <div className="activity-value">{health.recent_activity.failures_1h}</div>
                  <div className="activity-label">Failures</div>
                </div>
                <div className="activity-item">
                  <div className="activity-value">{health.recent_activity.retries_1h}</div>
                  <div className="activity-label">Retries</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      {metrics && (
        <div className="metrics-section">
          <h2>Key Metrics</h2>
          <div className="metrics-grid">
            {/* Validation Metrics */}
            {metrics.validation && (
              <div className="metric-card">
                <h3>Validation</h3>
                <div className="metric-item">
                  <span className="metric-label">Success Rate</span>
                  <span className="metric-value">{metrics.validation.success_rate}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Avg Confidence</span>
                  <span className="metric-value">{metrics.validation.avg_confidence}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Total Validations</span>
                  <span className="metric-value">{metrics.validation.total_validations}</span>
                </div>
              </div>
            )}

            {/* Confidence Metrics */}
            {metrics.confidence && (
              <div className="metric-card">
                <h3>Confidence Scoring</h3>
                <div className="metric-item">
                  <span className="metric-label">Avg Confidence</span>
                  <span className="metric-value">{metrics.confidence.avg_confidence}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Low Risk</span>
                  <span className="metric-value">{metrics.confidence.low_risk_percentage}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">High Risk</span>
                  <span className="metric-value">{metrics.confidence.high_risk_percentage}%</span>
                </div>
              </div>
            )}

            {/* Feedback Metrics */}
            {metrics.feedback && (
              <div className="metric-card">
                <h3>Execution Feedback</h3>
                <div className="metric-item">
                  <span className="metric-label">Total Failures</span>
                  <span className="metric-value">{metrics.feedback.total_failures}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Error Types</span>
                  <span className="metric-value">{metrics.feedback.unique_error_types}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Most Common</span>
                  <span className="metric-value">
                    {metrics.feedback.most_common_errors?.[0]?.count || 0}
                  </span>
                </div>
              </div>
            )}

            {/* Retry Metrics */}
            {metrics.retry && (
              <div className="metric-card">
                <h3>Retry Attempts</h3>
                <div className="metric-item">
                  <span className="metric-label">Success Rate</span>
                  <span className="metric-value">{metrics.retry.retry_success_rate}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Total Retries</span>
                  <span className="metric-value">{metrics.retry.total_retry_attempts}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Avg Attempts</span>
                  <span className="metric-value">{metrics.retry.avg_attempts_per_step}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts Panel */}
      {alerts && alerts.alerts && alerts.alerts.length > 0 && (
        <div className="alerts-section">
          <h2>Active Alerts ({alerts.alert_count})</h2>
          <div className="alerts-list">
            {alerts.alerts.map((alert, index) => (
              <div
                key={index}
                className="alert-item"
                style={{
                  borderLeftColor: getAlertSeverityColor(alert.severity),
                }}
              >
                <div className="alert-header">
                  <span className="alert-severity">{alert.severity.toUpperCase()}</span>
                  <span className="alert-type">{alert.type}</span>
                </div>
                <div className="alert-message">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Alerts */}
      {alerts && alerts.alerts && alerts.alerts.length === 0 && (
        <div className="no-alerts">
          <span>✓ No active alerts</span>
        </div>
      )}

      {/* Error Categories */}
      {metrics?.feedback?.error_categories && (
        <div className="error-categories">
          <h2>Error Categories</h2>
          <div className="categories-grid">
            {Object.entries(metrics.feedback.error_categories).map(([category, count]) => (
              <div key={category} className="category-item">
                <span className="category-name">{category}</span>
                <span className="category-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
