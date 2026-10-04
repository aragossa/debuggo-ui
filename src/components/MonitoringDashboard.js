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
        axios.get(`${API_BASE_URL}/api/monitoring/trends?hours=${timeRange}&interval_minutes=60`, { headers }).catch(() => ({ data: { data: [] } })),
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

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
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

  const metricRows = (rows) =>
    rows.map(([label, value]) => (
      <div className="mon-row" key={label}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
    ));

  const header = (
    <div className="mon-card mon-header">
      <div>
        <h1>Monitoring</h1>
        <p>AI agent metrics for the selected period (validation, confidence, errors, retries)</p>
      </div>
      <div className="mon-controls">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="mon-select"
        >
          <option value={1}>Last 1 Hour</option>
          <option value={24}>Last 24 Hours</option>
          <option value={168}>Last 7 Days</option>
          <option value={720}>Last 30 Days</option>
        </select>
        <button onClick={handleRefresh} disabled={refreshing} className="mon-btn">
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="monitoring-page">
        {header}
        <div className="mon-loading">Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="monitoring-page">
      {header}

      {error && <div className="mon-error">{error}</div>}

      {health && (
        <div className="mon-card">
          <div className="mon-health-head">
            <h2 className="mon-section-title">System Health</h2>
            <div className="mon-status">
              <span className="mon-dot" style={{ backgroundColor: getStatusColor(health.overall_status) }}></span>
              {(health.overall_status || '').toUpperCase()}
            </div>
          </div>
          <p className="mon-hint">
            Status is "warning" when there were no validations in the last hour. Table counts cover all time.
          </p>

          <div className="mon-grid">
            {Object.entries(health.tables || {}).map(([tableName, tableData]) => (
              <div key={tableName} className="mon-tile">
                <div className="mon-tile-label">
                  <span>{tableName}</span>
                  <span
                    className="mon-dot"
                    style={{ backgroundColor: tableData.status === 'healthy' ? '#10b981' : '#f59e0b' }}
                  ></span>
                </div>
                <div className="mon-tile-value">{tableData.record_count}</div>
                <div className="mon-tile-sub">records</div>
              </div>
            ))}
          </div>

          {health.recent_activity && (
            <>
              <div className="mon-subtitle">Recent Activity (1h)</div>
              <div className="mon-grid">
                <div className="mon-tile">
                  <div className="mon-tile-label">Validations</div>
                  <div className="mon-tile-value">{health.recent_activity.validations_1h}</div>
                </div>
                <div className="mon-tile">
                  <div className="mon-tile-label">Failures</div>
                  <div className="mon-tile-value">{health.recent_activity.failures_1h}</div>
                </div>
                <div className="mon-tile">
                  <div className="mon-tile-label">Retries</div>
                  <div className="mon-tile-value">{health.recent_activity.retries_1h}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {alerts && alerts.alerts && alerts.alerts.length > 0 && (
        <div className="mon-card">
          <h2 className="mon-section-title">Active Alerts ({alerts.alert_count})</h2>
          {alerts.alerts.map((alert, index) => (
            <div key={index} className="mon-alert" style={{ borderLeftColor: getAlertSeverityColor(alert.severity) }}>
              <div className="mon-alert-head">
                <span>{alert.severity.toUpperCase()}</span>
                <span className="mon-alert-type">{alert.type}</span>
              </div>
              <div className="mon-alert-msg">{alert.message}</div>
            </div>
          ))}
        </div>
      )}

      {alerts && alerts.alerts && alerts.alerts.length === 0 && (
        <div className="mon-ok">No active alerts</div>
      )}

      {metrics && (
        <div className="mon-card">
          <h2 className="mon-section-title">Key Metrics</h2>
          <div className="mon-grid">
            {metrics.validation && (
              <div className="mon-tile mon-metric-group">
                <h3>Validation</h3>
                {metricRows([
                  ['Success Rate', `${metrics.validation.success_rate}%`],
                  ['Avg Confidence', `${metrics.validation.avg_confidence}%`],
                  ['Total Validations', metrics.validation.total_validations],
                ])}
              </div>
            )}
            {metrics.confidence && (
              <div className="mon-tile mon-metric-group">
                <h3>Confidence Scoring</h3>
                {metricRows([
                  ['Avg Confidence', `${metrics.confidence.avg_confidence}%`],
                  ['Low Risk', `${metrics.confidence.low_risk_percentage}%`],
                  ['High Risk', `${metrics.confidence.high_risk_percentage}%`],
                ])}
              </div>
            )}
            {metrics.feedback && (
              <div className="mon-tile mon-metric-group">
                <h3>Execution Feedback</h3>
                {metricRows([
                  ['Total Failures', metrics.feedback.total_failures],
                  ['Error Types', metrics.feedback.unique_error_types],
                  ['Most Common', metrics.feedback.most_common_errors?.[0]?.count || 0],
                ])}
              </div>
            )}
            {metrics.retry && (
              <div className="mon-tile mon-metric-group">
                <h3>Retry Attempts</h3>
                {metricRows([
                  ['Success Rate', `${metrics.retry.retry_success_rate}%`],
                  ['Total Retries', metrics.retry.total_retry_attempts],
                  ['Avg Attempts', metrics.retry.avg_attempts_per_step],
                ])}
              </div>
            )}
          </div>
        </div>
      )}

      {metrics?.feedback?.error_categories && Object.keys(metrics.feedback.error_categories).length > 0 && (
        <div className="mon-card">
          <h2 className="mon-section-title">Error Categories</h2>
          <div className="mon-chip-list">
            {Object.entries(metrics.feedback.error_categories).map(([category, count]) => (
              <span key={category} className="mon-chip">
                {category} <b>{count}</b>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
