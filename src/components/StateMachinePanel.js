import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGears,
  faChevronUp,
  faSpinner,
  faCheckCircle,
  faClock,
  faCircleCheck
} from '@fortawesome/free-solid-svg-icons';
import './StateMachinePanel.css';

const StateMachinePanel = ({ testCaseId, isVisible = true, API_URL, getAuthHeaders }) => {
  const [stateMachineData, setStateMachineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    current: false,
    history: false,
    stats: false
  });

  useEffect(() => {
    if (testCaseId && isVisible && API_URL && getAuthHeaders) {
      fetchStateMachineData();
      // Poll for updates every 2 seconds
      const interval = setInterval(fetchStateMachineData, 2000);
      return () => clearInterval(interval);
    }
  }, [testCaseId, isVisible, API_URL, getAuthHeaders]);

  const fetchStateMachineData = async () => {
    try {
      setLoading(true);

      if (!API_URL || !getAuthHeaders) {
        setError('API configuration missing');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/api/state-machine/${testCaseId}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStateMachineData(data);
        setError(null);
      } else if (response.status === 404) {
        setStateMachineData(null);
        setError(null);
      } else if (response.status === 401 || response.status === 403) {
        setError('Authentication failed. Please login again.');
      } else {
        const text = await response.text();
        console.error('Response status:', response.status);
        console.error('Response text:', text);
        setError(`Failed to fetch state machine data (${response.status})`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStateColor = (state) => {
    const colors = {
      'INIT': '#9CA3AF',
      'ANALYZE': '#3B82F6',
      'PLAN': '#8B5CF6',
      'GENERATE': '#EC4899',
      'VALIDATE': '#F59E0B',
      'EXECUTE': '#10B981',
      'LEARN': '#06B6D4',
      'NEXT_STEP': '#6366F1',
      'COMPLETE': '#14B8A6',
      'ERROR': '#EF4444'
    };
    return colors[state] || '#6B7280';
  };

  const getStateIcon = (state) => {
    const icons = {
      'INIT': '🔄',
      'ANALYZE': '🔍',
      'PLAN': '📋',
      'GENERATE': '✨',
      'VALIDATE': '✅',
      'EXECUTE': '▶️',
      'LEARN': '🧠',
      'NEXT_STEP': '➡️',
      'COMPLETE': '🎉',
      'ERROR': '❌'
    };
    return icons[state] || '◉';
  };

  if (!isVisible) return null;

  if (loading && !stateMachineData) {
    return (
      <div className="state-machine-panel loading">
        <div className="spinner"></div>
        <p>Loading State Machine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-machine-panel error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!stateMachineData) {
    return (
      <div className="state-machine-panel no-data">
        <p>No state machine data available</p>
      </div>
    );
  }

  const { current_state, previous_state, step_number, total_steps, confidence, error_count, retry_count, history } = stateMachineData;

  const togglePanel = () => {
    setExpandedSections(prev => ({
      ...prev,
      current: !prev.current,
      history: false,
      stats: false
    }));
  };

  return (
    <div className="state-machine-panel">
      <div className="panel-header" onClick={togglePanel}>
        <div className="header-left">
          <FontAwesomeIcon icon={faGears} className="state-machine-icon" />
          <h3>State Machine & Transitions</h3>
          {isVisible && (
            <span className="generating-badge">
              <FontAwesomeIcon icon={faSpinner} className="spinning" />
              Monitoring...
            </span>
          )}
        </div>
        <FontAwesomeIcon
          icon={faChevronUp}
          className="toggle-icon"
          style={{ transform: expandedSections.current ? 'rotate(0deg)' : 'rotate(180deg)' }}
        />
      </div>

      {/* Current State Section */}
      <div className="section">
        <div
          className="section-header"
          onClick={() => toggleSection('current')}
        >
          <span className="toggle-icon">
            {expandedSections.current ? '▼' : '▶'}
          </span>
          <h4>Current State</h4>
        </div>

        {expandedSections.current && (
          <div className="section-content">
            <div className="state-display">
              <div className="state-box current">
                <div className="state-icon">
                  {getStateIcon(current_state)}
                </div>
                <div className="state-name">{current_state}</div>
              </div>

              {previous_state && (
                <>
                  <div className="arrow">→</div>
                  <div className="state-box previous">
                    <div className="state-icon">
                      {getStateIcon(previous_state)}
                    </div>
                    <div className="state-name">{previous_state}</div>
                  </div>
                </>
              )}
            </div>

            <div className="state-info">
              <div className="info-row">
                <span className="label">Step:</span>
                <span className="value">{step_number} / {total_steps}</span>
              </div>
              <div className="info-row">
                <span className="label">Confidence:</span>
                <span className="value confidence">
                  {(confidence * 100).toFixed(0)}%
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${confidence * 100}%` }}
                    ></div>
                  </div>
                </span>
              </div>
              <div className="info-row">
                <span className="label">Errors:</span>
                <span className="value error-count">{error_count}</span>
              </div>
              <div className="info-row">
                <span className="label">Retries:</span>
                <span className="value retry-count">{retry_count}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* State Transitions History */}
      {history && history.length > 0 && (
        <div className="section">
          <div
            className="section-header"
            onClick={() => toggleSection('history')}
          >
            <span className="toggle-icon">
              {expandedSections.history ? '▼' : '▶'}
            </span>
            <h4>Transition History ({history.length})</h4>
          </div>

          {expandedSections.history && (
            <div className="section-content">
              <div className="history-timeline">
                {history.map((transition, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">
                      <div
                        className="marker-dot"
                        style={{ backgroundColor: getStateColor(transition.from_state) }}
                      ></div>
                    </div>
                    <div className="timeline-content">
                      <div className="transition-info">
                        <span className="from-state">
                          {getStateIcon(transition.from_state)} {transition.from_state}
                        </span>
                        <span className="arrow">→</span>
                        <span className="to-state">
                          {getStateIcon(transition.to_state)} {transition.to_state}
                        </span>
                      </div>
                      <div className="transition-details">
                        <span className="event">Event: {transition.event}</span>
                        {transition.timestamp && (
                          <span className="time">
                            {new Date(transition.timestamp).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics Section */}
      <div className="section">
        <div
          className="section-header"
          onClick={() => toggleSection('stats')}
        >
          <span className="toggle-icon">
            {expandedSections.stats ? '▼' : '▶'}
          </span>
          <h4>Statistics</h4>
        </div>

        {expandedSections.stats && (
          <div className="section-content">
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-label">Total Transitions</div>
                <div className="stat-value">
                  {history ? history.length : 0}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Progress</div>
                <div className="stat-value">
                  {total_steps > 0 ? ((step_number / total_steps) * 100).toFixed(0) : 0}%
                </div>
              </div>
              <div className="stat-box error">
                <div className="stat-label">Errors</div>
                <div className="stat-value">{error_count}</div>
              </div>
              <div className="stat-box warning">
                <div className="stat-label">Retries</div>
                <div className="stat-value">{retry_count}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateMachinePanel;
