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
  faHistory,
  faCodeBranch,
  faTools,
  faExclamationTriangle,
  faArrowRight,
  faDatabase,
  faShieldAlt,
  faRobot,
  faSync,
  faTasks,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { pollWhileVisible } from '../utils/polling';
import './PlanningPanel.css';

const PlanningPanel = ({ testCaseId, isGenerating, API_URL, getAuthHeaders }) => {
  const [planning, setPlanning] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    planning: true,
    reasoning: true,
    recovery: true
  });

  // Fetch planning data periodically while generating
  useEffect(() => {
    if (!isGenerating || !testCaseId) {
      return;
    }

    const fetchPlanning = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/test-cases/${testCaseId}/planning`,
          { headers: getAuthHeaders() }
        );

        if (response.ok) {
          const data = await response.json();
          setPlanning(data);
        }
      } catch (error) {
        console.error('Error fetching planning data:', error);
      }
    };

    // Fetch immediately and then every 3 seconds (reduced from 2s to avoid overwhelming the frontend)
    return pollWhileVisible(fetchPlanning, 3000);
  }, [isGenerating, testCaseId, API_URL, getAuthHeaders]);

  if (!planning && !isGenerating) {
    return null;
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ==================== STRATEGIC PLANNING SECTION ====================
  const renderStrategicPlanning = (planData) => {
    if (!planData) return null;

    return (
      <div className="planning-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('planning')}
        >
          <div className="header-left">
            <FontAwesomeIcon icon={faMapPin} className="section-icon" />
            <span className="section-title">Strategic Planning (Pre-Generation)</span>
            <span className="target-badge">90%+ Accuracy Target</span>
          </div>
          <FontAwesomeIcon 
            icon={expandedSections.planning ? faChevronUp : faChevronDown}
            className="toggle-icon"
          />
        </div>

        {expandedSections.planning && (
          <div className="section-content">
            {/* Requirement Analysis */}
            {planData.requirement_analysis && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faTasks} />
                  <span>Requirement Analysis</span>
                </div>
                <div className="subsection-content">
                  <div className="analysis-item">
                    <span className="label">Test Complexity Score:</span>
                    <div className="complexity-display">
                      <div className="complexity-bar">
                        <div 
                          className="complexity-fill"
                          style={{ 
                            width: `${planData.requirement_analysis.complexity_score}%`,
                            backgroundColor: planData.requirement_analysis.complexity_score > 70 ? '#ff6b6b' : 
                                            planData.requirement_analysis.complexity_score > 40 ? '#ffa500' : '#4caf50'
                          }}
                        />
                      </div>
                      <span className="complexity-value">{planData.requirement_analysis.complexity_score}/100</span>
                    </div>
                  </div>
                  
                  <div className="analysis-item">
                    <span className="label">Complexity Factors:</span>
                    <ul className="factors-list">
                      {planData.requirement_analysis.factors && planData.requirement_analysis.factors.map((factor, idx) => (
                        <li key={idx}>
                          <span className="factor-icon">•</span>
                          <span className="factor-text">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {planData.requirement_analysis.description && (
                    <div className="analysis-description">
                      <strong>Analysis:</strong> {planData.requirement_analysis.description}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Decomposition and Ordering */}
            {planData.decomposition && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faCodeBranch} />
                  <span>Decomposition & Ordering</span>
                </div>
                <div className="subsection-content">
                  <div className="decomposition-info">
                    <p className="decomposition-strategy">
                      <strong>Strategy:</strong> {planData.decomposition.strategy}
                    </p>
                  </div>

                  {planData.decomposition.subtasks && planData.decomposition.subtasks.length > 0 && (
                    <div className="subtasks-container">
                      <div className="subtasks-title">Planned Subtasks (Execution Order):</div>
                      {planData.decomposition.subtasks.map((subtask, idx) => (
                        <div key={idx} className="subtask-item">
                          <div className="subtask-header">
                            <span className="subtask-order">{idx + 1}</span>
                            <span className="subtask-name">{subtask.name}</span>
                            {subtask.estimated_steps && (
                              <span className="subtask-steps">~{subtask.estimated_steps} steps</span>
                            )}
                          </div>
                          {subtask.description && (
                            <div className="subtask-description">{subtask.description}</div>
                          )}
                          {subtask.actions && (
                            <div className="subtask-actions">
                              {subtask.actions.map((action, aIdx) => (
                                <span key={aIdx} className="action-badge">{action}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dependency Identification */}
            {planData.dependencies && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faDatabase} />
                  <span>Dependency Identification</span>
                </div>
                <div className="subsection-content">
                  {planData.dependencies.data_dependencies && planData.dependencies.data_dependencies.length > 0 && (
                    <div className="dependency-group">
                      <div className="dependency-type">Data Dependencies:</div>
                      {planData.dependencies.data_dependencies.map((dep, idx) => (
                        <div key={idx} className="dependency-item">
                          <span className="dep-source">{dep.source}</span>
                          <FontAwesomeIcon icon={faArrowRight} className="dep-arrow" />
                          <span className="dep-target">{dep.target}</span>
                          {dep.description && (
                            <span className="dep-description">({dep.description})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {planData.dependencies.state_dependencies && planData.dependencies.state_dependencies.length > 0 && (
                    <div className="dependency-group">
                      <div className="dependency-type">State Dependencies:</div>
                      {planData.dependencies.state_dependencies.map((dep, idx) => (
                        <div key={idx} className="dependency-item">
                          <span className="dep-state">{dep.state}</span>
                          <FontAwesomeIcon icon={faArrowRight} className="dep-arrow" />
                          <span className="dep-action">{dep.action}</span>
                          {dep.description && (
                            <span className="dep-description">({dep.description})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            {planData.risk_assessment && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>Risk Assessment</span>
                </div>
                <div className="subsection-content">
                  {planData.risk_assessment.identified_risks && planData.risk_assessment.identified_risks.length > 0 && (
                    <div className="risks-container">
                      {planData.risk_assessment.identified_risks.map((risk, idx) => (
                        <div key={idx} className={`risk-item risk-${risk.severity}`}>
                          <div className="risk-header">
                            <span className="risk-severity">{risk.severity.toUpperCase()}</span>
                            <span className="risk-title">{risk.title}</span>
                          </div>
                          <div className="risk-description">{risk.description}</div>
                          {risk.mitigation && (
                            <div className="risk-mitigation">
                              <strong>Mitigation:</strong> {risk.mitigation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completed Plan Summary */}
            {planData.plan_summary && (
              <div className="subsection plan-summary">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Completed Plan Summary</span>
                </div>
                <div className="subsection-content">
                  <div className="plan-overview">
                    <div className="plan-stat">
                      <span className="stat-label">Total Steps Planned:</span>
                      <span className="stat-value">{planData.plan_summary.total_steps}</span>
                    </div>
                    <div className="plan-stat">
                      <span className="stat-label">Estimated Duration:</span>
                      <span className="stat-value">{planData.plan_summary.estimated_duration}</span>
                    </div>
                    <div className="plan-stat">
                      <span className="stat-label">Test Type:</span>
                      <span className="stat-value">{planData.plan_summary.test_type}</span>
                    </div>
                  </div>
                  
                  {planData.plan_summary.execution_plan && (
                    <div className="execution-plan">
                      <strong>Execution Plan:</strong>
                      <p>{planData.plan_summary.execution_plan}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== MULTI-TURN REASONING SECTION ====================
  const renderMultiTurnReasoning = (reasoningData) => {
    if (!reasoningData) return null;

    return (
      <div className="reasoning-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('reasoning')}
        >
          <div className="header-left">
            <FontAwesomeIcon icon={faBrain} className="section-icon" />
            <span className="section-title">Multi-Turn Reasoning (Contextual Generation)</span>
            <span className="target-badge">ReAct Pattern</span>
          </div>
          <FontAwesomeIcon 
            icon={expandedSections.reasoning ? faChevronUp : faChevronDown}
            className="toggle-icon"
          />
        </div>

        {expandedSections.reasoning && (
          <div className="section-content">
            {/* ReAct Pattern Traces */}
            {reasoningData.react_traces && reasoningData.react_traces.length > 0 && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faRobot} />
                  <span>ReAct Pattern Traces (Thought → Action → Observation → Reflection)</span>
                </div>
                <div className="subsection-content">
                  <div className="react-traces">
                    {reasoningData.react_traces.map((trace, idx) => (
                      <div key={idx} className="react-trace">
                        <div className="trace-step thought-step">
                          <div className="step-header">
                            <FontAwesomeIcon icon={faLightbulb} />
                            <span>Thought</span>
                          </div>
                          <div className="step-content">{trace.thought}</div>
                        </div>

                        <div className="trace-arrow">
                          <FontAwesomeIcon icon={faArrowRight} />
                        </div>

                        <div className="trace-step action-step">
                          <div className="step-header">
                            <FontAwesomeIcon icon={faTools} />
                            <span>Action</span>
                          </div>
                          <div className="step-content">
                            <div className="action-name">{trace.action}</div>
                            {trace.action_params && (
                              <div className="action-params">
                                <code>{JSON.stringify(trace.action_params, null, 2)}</code>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="trace-arrow">
                          <FontAwesomeIcon icon={faArrowRight} />
                        </div>

                        <div className="trace-step observation-step">
                          <div className="step-header">
                            <FontAwesomeIcon icon={faDatabase} />
                            <span>Observation</span>
                          </div>
                          <div className="step-content">{trace.observation}</div>
                        </div>

                        <div className="trace-arrow">
                          <FontAwesomeIcon icon={faArrowRight} />
                        </div>

                        <div className="trace-step reflection-step">
                          <div className="step-header">
                            <FontAwesomeIcon icon={faChartLine} />
                            <span>Reflection</span>
                          </div>
                          <div className="step-content">{trace.reflection}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tool Usage */}
            {reasoningData.tool_usage && reasoningData.tool_usage.length > 0 && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faTools} />
                  <span>Tool Registry & Usage</span>
                </div>
                <div className="subsection-content">
                  <div className="tools-list">
                    {reasoningData.tool_usage.map((tool, idx) => (
                      <div key={idx} className="tool-item">
                        <div className="tool-header">
                          <span className="tool-name">{tool.name}</span>
                          <span className="tool-status">{tool.status}</span>
                        </div>
                        <div className="tool-description">{tool.description}</div>
                        {tool.result && (
                          <div className="tool-result">
                            <strong>Result:</strong> {tool.result}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reasoning Traces */}
            {reasoningData.reasoning_traces && reasoningData.reasoning_traces.length > 0 && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faHistory} />
                  <span>Reasoning Traces (95%+ Debugging Accuracy)</span>
                </div>
                <div className="subsection-content">
                  <div className="traces-timeline">
                    {reasoningData.reasoning_traces.map((trace, idx) => (
                      <div key={idx} className={`trace-item trace-${trace.type}`}>
                        <div className="trace-marker" />
                        <div className="trace-info">
                          <div className="trace-timestamp">{trace.timestamp}</div>
                          <div className="trace-type-badge">{trace.type}</div>
                          <div className="trace-message">{trace.message}</div>
                          {trace.details && (
                            <div className="trace-details">
                              <code>{trace.details}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Context Accumulation */}
            {reasoningData.context_accumulation && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faSync} />
                  <span>Context Accumulation</span>
                </div>
                <div className="subsection-content">
                  <div className="context-info">
                    <p><strong>Accumulated Context:</strong></p>
                    <p>{reasoningData.context_accumulation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== ERROR RECOVERY SECTION ====================
  const renderErrorRecovery = (recoveryData) => {
    if (!recoveryData) return null;

    return (
      <div className="recovery-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('recovery')}
        >
          <div className="header-left">
            <FontAwesomeIcon icon={faShieldAlt} className="section-icon" />
            <span className="section-title">Error Recovery & Self-Correction</span>
            <span className="target-badge">70%+ Automated Recovery</span>
          </div>
          <FontAwesomeIcon 
            icon={expandedSections.recovery ? faChevronUp : faChevronDown}
            className="toggle-icon"
          />
        </div>

        {expandedSections.recovery && (
          <div className="section-content">
            {/* Failure Analysis */}
            {recoveryData.failure_analysis && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>Failure Analysis</span>
                </div>
                <div className="subsection-content">
                  {recoveryData.failure_analysis.failures && recoveryData.failure_analysis.failures.length > 0 && (
                    <div className="failures-list">
                      {recoveryData.failure_analysis.failures.map((failure, idx) => (
                        <div key={idx} className="failure-item">
                          <div className="failure-header">
                            <FontAwesomeIcon icon={faExclamationCircle} className="failure-icon" />
                            <span className="failure-type">{failure.type}</span>
                            <span className="failure-step">Step {failure.step_number}</span>
                          </div>
                          <div className="failure-details">
                            <div className="failure-message">
                              <strong>Error:</strong> {failure.error_message}
                            </div>
                            <div className="failure-root-cause">
                              <strong>Root Cause:</strong> {failure.root_cause}
                            </div>
                            {failure.stack_trace && (
                              <div className="failure-stack">
                                <strong>Stack Trace:</strong>
                                <code>{failure.stack_trace}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {recoveryData.failure_analysis.summary && (
                    <div className="failure-summary">
                      <strong>Summary:</strong> {recoveryData.failure_analysis.summary}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recovery Strategies */}
            {recoveryData.recovery_strategies && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faTools} />
                  <span>Recovery Strategies & Implementation</span>
                </div>
                <div className="subsection-content">
                  {recoveryData.recovery_strategies.automated && recoveryData.recovery_strategies.automated.length > 0 && (
                    <div className="strategy-group">
                      <div className="strategy-type">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <span>Automated Recovery (70%+ Success Rate)</span>
                      </div>
                      {recoveryData.recovery_strategies.automated.map((strategy, idx) => (
                        <div key={idx} className="strategy-item automated">
                          <div className="strategy-header">
                            <span className="strategy-name">{strategy.name}</span>
                            {strategy.success_rate && (
                              <span className="success-rate">{strategy.success_rate}% success</span>
                            )}
                          </div>
                          <div className="strategy-description">{strategy.description}</div>
                          {strategy.implementation && (
                            <div className="strategy-implementation">
                              <strong>Implementation:</strong>
                              <code>{strategy.implementation}</code>
                            </div>
                          )}
                          {strategy.result && (
                            <div className="strategy-result">
                              <strong>Result:</strong> {strategy.result}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {recoveryData.recovery_strategies.escalation && recoveryData.recovery_strategies.escalation.length > 0 && (
                    <div className="strategy-group">
                      <div className="strategy-type">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>Escalation (Human Review)</span>
                      </div>
                      {recoveryData.recovery_strategies.escalation.map((strategy, idx) => (
                        <div key={idx} className="strategy-item escalation">
                          <div className="strategy-header">
                            <span className="strategy-name">{strategy.name}</span>
                            <span className="escalation-badge">Requires Human Review</span>
                          </div>
                          <div className="strategy-description">{strategy.description}</div>
                          {strategy.reason && (
                            <div className="escalation-reason">
                              <strong>Reason for Escalation:</strong> {strategy.reason}
                            </div>
                          )}
                          {strategy.recommended_action && (
                            <div className="recommended-action">
                              <strong>Recommended Action:</strong> {strategy.recommended_action}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recovery Statistics */}
            {recoveryData.recovery_stats && (
              <div className="subsection">
                <div className="subsection-title">
                  <FontAwesomeIcon icon={faChartLine} />
                  <span>Recovery Statistics</span>
                </div>
                <div className="subsection-content">
                  <div className="stats-grid">
                    <div className="stat-box">
                      <div className="stat-label">Total Failures</div>
                      <div className="stat-value">{recoveryData.recovery_stats.total_failures}</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-label">Automated Recoveries</div>
                      <div className="stat-value">{recoveryData.recovery_stats.automated_recoveries}</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-label">Escalations</div>
                      <div className="stat-value">{recoveryData.recovery_stats.escalations}</div>
                    </div>
                    <div className="stat-box">
                      <div className="stat-label">Recovery Rate</div>
                      <div className="stat-value">{recoveryData.recovery_stats.recovery_rate}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="planning-panel">
      <div className="planning-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          <FontAwesomeIcon icon={faBrain} className="brain-icon" />
          <span className="header-title">Planning & Reasoning Visualization</span>
          {isGenerating && (
            <span className="generating-badge">
              <FontAwesomeIcon icon={faSpinner} className="spinning" />
              Analyzing...
            </span>
          )}
        </div>
        <FontAwesomeIcon 
          icon={isExpanded ? faChevronUp : faChevronDown}
          className="toggle-icon"
        />
      </div>

      {isExpanded && (
        <div className="planning-content">
          {planning ? (
            <>
              {/* Strategic Planning */}
              {renderStrategicPlanning(planning.strategic_planning)}

              {/* Multi-Turn Reasoning */}
              {renderMultiTurnReasoning(planning.multi_turn_reasoning)}

              {/* Error Recovery */}
              {renderErrorRecovery(planning.error_recovery)}
            </>
          ) : (
            <div className="planning-loading">
              <FontAwesomeIcon icon={faSpinner} className="spinning" />
              <span>Waiting for planning data...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlanningPanel;
