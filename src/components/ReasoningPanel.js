import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBrain,
  faChevronDown,
  faChevronUp,
  faSpinner,
  faCheckCircle,
  faExclamationCircle,
  faLightbulb,
  faMapPin,
  faClock,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import { pollWhileVisible } from '../utils/polling';
import './ReasoningPanel.css';

const ReasoningPanel = ({ testCaseId, isGenerating, API_URL, getAuthHeaders }) => {
  const [reasoning, setReasoning] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Note: Removed auto-scroll to prevent page jumping during updates
  // Users can manually scroll to see new content

  // Fetch reasoning data periodically while generating
  useEffect(() => {
    if (!isGenerating || !testCaseId) {
      return;
    }

    const fetchReasoning = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/test-cases/${testCaseId}/reasoning`,
          { headers: getAuthHeaders() }
        );

        if (response.ok) {
          const data = await response.json();
          setReasoning(data);
        }
      } catch (error) {
        console.error('Error fetching reasoning data:', error);
      }
    };

    // Fetch immediately and then every 2 seconds
    return pollWhileVisible(fetchReasoning, 2000);
  }, [isGenerating, testCaseId, API_URL, getAuthHeaders]);

  if (!reasoning && !isGenerating) {
    return null;
  }

  const renderPhaseStatus = (phase) => {
    if (!phase) return null;

    const statusIcon = phase.status === 'completed' ? faCheckCircle :
      phase.status === 'in_progress' ? faSpinner :
        faExclamationCircle;
    const statusClass = phase.status === 'completed' ? 'completed' :
      phase.status === 'in_progress' ? 'in-progress' :
        'pending';

    return (
      <div key={phase.name} className={`phase-item ${statusClass}`}>
        <div className="phase-header">
          <FontAwesomeIcon
            icon={statusIcon}
            className={`phase-icon ${phase.status === 'in_progress' ? 'spinning' : ''}`}
          />
          <span className="phase-name">{phase.name}</span>
          <span className="phase-status">{phase.status}</span>
        </div>
        {phase.description && (
          <div className="phase-description">{phase.description}</div>
        )}
        {phase.details && (
          <div className="phase-details">
            {Array.isArray(phase.details) ? (
              <ul>
                {phase.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            ) : (
              <p>{phase.details}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderThoughts = (thoughts) => {
    if (!thoughts || thoughts.length === 0) return null;

    return (
      <div className="thoughts-section">
        <div className="thoughts-header">
          <FontAwesomeIcon icon={faLightbulb} />
          <span>AI Thoughts</span>
        </div>
        <div className="thoughts-list">
          {thoughts.map((thought, idx) => (
            <div key={idx} className="thought-item">
              <span className="thought-marker">💭</span>
              <span className="thought-text">{thought}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTestSplit = (split) => {
    if (!split) return null;

    return (
      <div className="split-section">
        <div className="split-header">
          <FontAwesomeIcon icon={faMapPin} />
          <span>Test Case Split Strategy</span>
        </div>
        <div className="split-content">
          <div className="split-info">
            <div className="split-item">
              <span className="split-label">Total Steps Planned:</span>
              <span className="split-value">{split.total_steps_planned}</span>
            </div>
            <div className="split-item">
              <span className="split-label">Current Step:</span>
              <span className="split-value">{split.current_step_number}/{split.total_steps_planned}</span>
            </div>
            <div className="split-item">
              <span className="split-label">Progress:</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(split.current_step_number / split.total_steps_planned) * 100}%` }}
                />
              </div>
            </div>
          </div>
          {split.phases && split.phases.length > 0 && (
            <div className="split-phases">
              <div className="phases-label">Test Phases:</div>
              {split.phases.map((phase, idx) => (
                <div key={idx} className="phase-badge">
                  <span className="phase-number">{idx + 1}</span>
                  <span className="phase-title">{phase}</span>
                </div>
              ))}
            </div>
          )}
          {split.strategy && (
            <div className="strategy-description">
              <strong>Strategy:</strong> {split.strategy}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentStep = (step) => {
    if (!step) return null;

    return (
      <div className="current-step-section">
        <div className="current-step-header">
          <FontAwesomeIcon icon={faClock} />
          <span>Current Step Generation</span>
        </div>
        <div className="current-step-content">
          <div className="step-info">
            <div className="step-item">
              <span className="step-label">Step #{step.step_number}:</span>
              <span className="step-action">{step.action}</span>
            </div>
            {step.description && (
              <div className="step-description">{step.description}</div>
            )}
            {step.reasoning && (
              <div className="step-reasoning">
                <strong>Why this step:</strong> {step.reasoning}
              </div>
            )}
            {step.element_info && (
              <div className="step-element">
                <strong>Target Element:</strong> {step.element_info}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="reasoning-panel">
      <div className="reasoning-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          <FontAwesomeIcon icon={faBrain} className="brain-icon" />
          <span className="header-title">AI Reasoning & Planning</span>
          {isGenerating && (
            <span className="generating-badge">
              <FontAwesomeIcon icon={faSpinner} className="spinning" />
              Generating...
            </span>
          )}
        </div>
        <FontAwesomeIcon
          icon={isExpanded ? faChevronUp : faChevronDown}
          className="toggle-icon"
        />
      </div>

      {isExpanded && (
        <div className="reasoning-content">
          {reasoning ? (
            <>
              {/* Overall Status */}
              {reasoning.overall_status && (
                <div className="overall-status">
                  <div className="status-message">{reasoning.overall_status}</div>
                </div>
              )}

              {/* AI Thoughts */}
              {renderThoughts(reasoning.thoughts)}

              {/* Test Split Strategy */}
              {renderTestSplit(reasoning.test_split)}

              {/* Phases */}
              {reasoning.phases && reasoning.phases.length > 0 && (
                <div className="phases-section">
                  <div className="phases-header">
                    <FontAwesomeIcon icon={faMapPin} />
                    <span>Generation Phases</span>
                  </div>
                  <div className="phases-list">
                    {reasoning.phases.map((phase, idx) => (
                      <div key={idx}>{renderPhaseStatus(phase)}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Step */}
              {renderCurrentStep(reasoning.current_step)}

              {/* Steps Progress - Generated vs Planned */}
              {reasoning.test_split && (
                <div className="steps-progress-section">
                  <div className="steps-progress-header">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>Steps Progress</span>
                  </div>
                  <div className="steps-progress-content">
                    <div className="steps-comparison">
                      <div className="steps-generated">
                        <div className="steps-label">Generated</div>
                        <div className="steps-count generated-count">
                          {reasoning.test_split.current_step_number}
                        </div>
                      </div>
                      <div className="steps-separator">/</div>
                      <div className="steps-planned">
                        <div className="steps-label">Planned</div>
                        <div className="steps-count planned-count">
                          {reasoning.test_split.total_steps_planned}
                        </div>
                      </div>
                    </div>
                    <div className="progress-bar-large">
                      <div
                        className="progress-fill-large"
                        style={{
                          width: `${(reasoning.test_split.current_step_number / Math.max(reasoning.test_split.total_steps_planned, 1)) * 100}%`
                        }}
                      />
                    </div>
                    <div className="progress-percentage">
                      {Math.round((reasoning.test_split.current_step_number / Math.max(reasoning.test_split.total_steps_planned, 1)) * 100)}% Complete
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {reasoning.timeline && reasoning.timeline.length > 0 && (
                <div className="timeline-section">
                  <div className="timeline-header">
                    <FontAwesomeIcon icon={faHistory} />
                    <span>Generation Timeline</span>
                  </div>
                  <div className="timeline-items">
                    {reasoning.timeline.map((item, idx) => (
                      <div key={idx} className={`timeline-item ${item.type}`}>
                        <div className="timeline-marker" />
                        <div className="timeline-content">
                          <div className="timeline-time">{item.timestamp}</div>
                          <div className="timeline-message">{item.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              {reasoning.statistics && (
                <div className="statistics-section">
                  <div className="stats-header">Statistics</div>
                  <div className="stats-grid">
                    {Object.entries(reasoning.statistics).map(([key, value]) => (
                      <div key={key} className="stat-item">
                        <span className="stat-label">{key}:</span>
                        <span className="stat-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="reasoning-loading">
              <FontAwesomeIcon icon={faSpinner} className="spinning" />
              <span>Waiting for reasoning data...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReasoningPanel;
