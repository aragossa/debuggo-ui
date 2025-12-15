import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ExecutionPlans.css';

const ExecutionPlans = ({ projectId }) => {
  const { user, getAuthHeaders } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [suites, setSuites] = useState([]);
  const [loadingSuites, setLoadingSuites] = useState(false);
  const [availableSuites, setAvailableSuites] = useState([]);
  const [showAddSuiteModal, setShowAddSuiteModal] = useState(false);
  const [selectedSuiteToAdd, setSelectedSuiteToAdd] = useState('');
  const [executionOrder, setExecutionOrder] = useState(0);
  const [environments, setEnvironments] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loadingTestResults, setLoadingTestResults] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    notify_on_start: false,
    notify_on_completion: true,
    notify_on_failure: true,
    notify_on_retry: false,
    email_recipients: '',
    slack_channels: ''
  });
  const [scheduleSettings, setScheduleSettings] = useState({
    schedule_type: 'manual',
    cron_expression: '',
    recurrence_pattern: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    environment_id: '',
    plan_type: 'parallel',
    schedule_type: 'manual',
    max_parallel_suites: 3,
    max_retries: 2,
    retry_delay_seconds: 5,
    timeout_seconds: 300
  });

  const API_BASE = process.env.REACT_APP_API_URL || '';

  // Fetch execution plans and environments
  useEffect(() => {
    fetchPlans();
    fetchEnvironments();
  }, [projectId]);

  // Fetch environments for the project
  const fetchEnvironments = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}/environments`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setEnvironments(Array.isArray(data) ? data : (data.environments || []));
      }
    } catch (err) {
      console.error('Error fetching environments:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/execution-plans`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
        setError(null);
      } else {
        setError('Failed to fetch execution plans');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Error fetching execution plans');
    } finally {
      setLoading(false);
    }
  };

  // Fetch suites for a plan
  const fetchPlanSuites = async (planId) => {
    try {
      setLoadingSuites(true);
      const response = await fetch(`${API_BASE}/api/execution-plans/${planId}/suites`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSuites(data.suites || []);
      }
    } catch (err) {
      console.error('Error fetching plan suites:', err);
    } finally {
      setLoadingSuites(false);
    }
  };

  // Fetch execution runs for a plan
  const fetchPlanRuns = async (planId) => {
    try {
      setLoadingRuns(true);
      const response = await fetch(`${API_BASE}/api/execution-plans/${planId}/runs?limit=20`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      }
    } catch (err) {
      console.error('Error fetching plan runs:', err);
    } finally {
      setLoadingRuns(false);
    }
  };

  // Fetch test results for a specific run
  const fetchTestResults = async (runId) => {
    try {
      setLoadingTestResults(true);
      const response = await fetch(`${API_BASE}/api/execution-plans/runs/${runId}/tests`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTestResults(data.tests || []);
      }
    } catch (err) {
      console.error('Error fetching test results:', err);
    } finally {
      setLoadingTestResults(false);
    }
  };

  // Fetch notification settings for a plan
  const fetchNotificationSettings = async (planId) => {
    try {
      const response = await fetch(`${API_BASE}/api/execution-plans/${planId}/notifications`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings({
          notify_on_start: data.notify_on_start || false,
          notify_on_completion: data.notify_on_completion !== false,
          notify_on_failure: data.notify_on_failure !== false,
          notify_on_retry: data.notify_on_retry || false,
          email_recipients: (data.email_recipients || []).join(', '),
          slack_channels: (data.slack_channels || []).join(', ')
        });
      }
    } catch (err) {
      console.error('Error fetching notification settings:', err);
    }
  };

  // Save notification settings
  const saveNotificationSettings = async () => {
    if (!selectedPlan) return;
    try {
      const response = await fetch(`${API_BASE}/api/execution-plans/${selectedPlan.id}/notifications`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notify_on_start: notificationSettings.notify_on_start,
          notify_on_completion: notificationSettings.notify_on_completion,
          notify_on_failure: notificationSettings.notify_on_failure,
          notify_on_retry: notificationSettings.notify_on_retry,
          email_recipients: notificationSettings.email_recipients.split(',').map(e => e.trim()).filter(e => e),
          slack_channels: notificationSettings.slack_channels.split(',').map(c => c.trim()).filter(c => c)
        })
      });
      if (!response.ok) {
        throw new Error('Failed to save notification settings');
      }
    } catch (err) {
      console.error('Error saving notification settings:', err);
      throw err;
    }
  };

  // Save schedule settings
  const saveScheduleSettings = async () => {
    if (!selectedPlan) return;
    try {
      const response = await fetch(`${API_BASE}/api/execution-plans/${selectedPlan.id}/schedule`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schedule_type: scheduleSettings.schedule_type,
          cron_expression: scheduleSettings.cron_expression || null,
          recurrence_pattern: scheduleSettings.recurrence_pattern || null
        })
      });
      if (!response.ok) {
        throw new Error('Failed to save schedule settings');
      }
    } catch (err) {
      console.error('Error saving schedule settings:', err);
      throw err;
    }
  };

  // Open settings modal
  const openSettingsModal = () => {
    if (selectedPlan) {
      fetchNotificationSettings(selectedPlan.id);
      setScheduleSettings({
        schedule_type: selectedPlan.schedule_type || 'manual',
        cron_expression: selectedPlan.cron_expression || '',
        recurrence_pattern: selectedPlan.recurrence_pattern || ''
      });
      setShowSettingsModal(true);
    }
  };

  // Save all settings
  const handleSaveSettings = async () => {
    try {
      await saveScheduleSettings();
      await saveNotificationSettings();
      setShowSettingsModal(false);
      fetchPlans(); // Refresh plans to get updated schedule info
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings. Please try again.');
    }
  };

  // Fetch available test suites for the project
  const fetchAvailableSuites = async () => {
    try {
      const clientId = user?.client_id;
      const response = await fetch(`${API_BASE}/api/suites?client_id=${clientId}&project_id=${projectId}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        // API returns array directly, not { suites: [] }
        setAvailableSuites(Array.isArray(data) ? data : (data.suites || []));
      }
    } catch (err) {
      console.error('Error fetching available suites:', err);
    }
  };

  // Add suite to plan
  const handleAddSuite = async () => {
    if (!selectedSuiteToAdd || !selectedPlan) return;

    try {
      const response = await fetch(`${API_BASE}/api/execution-plans/${selectedPlan.id}/suites`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          suite_id: parseInt(selectedSuiteToAdd, 10),
          execution_order: parseInt(executionOrder, 10)
        })
      });

      if (response.ok) {
        // Refresh suites list
        fetchPlanSuites(selectedPlan.id);
        setShowAddSuiteModal(false);
        setSelectedSuiteToAdd('');
        setExecutionOrder(0);
      } else {
        const error = await response.json();
        alert(`Failed to add suite: ${error.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error adding suite:', err);
      alert('Error adding suite to plan');
    }
  };

  // Remove suite from plan
  const handleRemoveSuite = async (suiteId) => {
    if (!selectedPlan) return;

    try {
      const response = await fetch(`${API_BASE}/api/execution-plans/${selectedPlan.id}/suites/${suiteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        fetchPlanSuites(selectedPlan.id);
      } else {
        alert('Failed to remove suite');
      }
    } catch (err) {
      console.error('Error removing suite:', err);
    }
  };

  // Open add suite modal
  const openAddSuiteModal = () => {
    fetchAvailableSuites();
    setShowAddSuiteModal(true);
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Get client_id from user object
      const clientId = user?.client_id;
      if (!clientId) {
        setError('Client ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      // Ensure all numeric fields are integers
      // Use user's uuid if available, otherwise client_id as fallback for created_by
      const requestData = {
        ...formData,
        client_id: clientId,
        project_id: projectId,
        created_by: user?.uuid || user?.user_id || clientId,
        environment_id: formData.environment_id ? parseInt(formData.environment_id, 10) : null,
        max_parallel_suites: parseInt(formData.max_parallel_suites, 10),
        max_retries: parseInt(formData.max_retries, 10),
        retry_delay_seconds: parseInt(formData.retry_delay_seconds, 10),
        timeout_seconds: parseInt(formData.timeout_seconds, 10)
      };

      const response = await fetch(`${API_BASE}/api/execution-plans`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        setPlans([...plans, data]);
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          environment_id: '',
          plan_type: 'parallel',
          schedule_type: 'manual',
          max_parallel_suites: 3,
          max_retries: 2,
          retry_delay_seconds: 5,
          timeout_seconds: 300
        });
        setError(null);
      } else {
        const errorData = await response.json();

        // Handle validation errors
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail
            .map(err => `${err.loc?.join('.')} - ${err.msg}`)
            .join('; ');
          setError(errorMessages);
        } else if (typeof errorData.detail === 'string') {
          setError(errorData.detail);
        } else {
          setError('Failed to create execution plan');
        }
      }
    } catch (err) {
      console.error('Error creating plan:', err);
      setError('Error creating execution plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/execution-plans/${planId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setPlans(plans.filter(p => p.id !== planId));
        if (selectedPlan?.id === planId) {
          setSelectedPlan(null);
        }
        setError(null);
      } else {
        setError('Failed to delete execution plan');
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Error deleting execution plan');
    }
  };

  const handleExecutePlan = async (planId) => {
    try {
      const response = await fetch(`${API_BASE}/api/execution/plans/${planId}/execute`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Execution started! Run ID: ${data.run_id}\n\nThe tests are running in the background. Refresh the execution history to see progress.`);
        // Refresh runs if this is the selected plan
        if (selectedPlan && selectedPlan.id === planId) {
          setTimeout(() => fetchPlanRuns(planId), 1000); // Refresh after 1 second
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to execute plan');
      }
    } catch (err) {
      console.error('Error executing plan:', err);
      setError('Error executing plan');
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setSelectedRun(null);
    setTestResults([]);
    fetchPlanSuites(plan.id);
    fetchPlanRuns(plan.id);
  };

  const handleSelectRun = (run) => {
    setSelectedRun(run);
    fetchTestResults(run.id);
  };

  const formatDuration = (val) => {
    if (!val) return '-';
    const seconds = parseFloat(val);
    if (isNaN(seconds)) return '-';

    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(0);
    return `${mins}m ${secs}s`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'passed': return 'status-badge passed';
      case 'failed':
      case 'error': return 'status-badge failed';
      case 'running': return 'status-badge running';
      case 'skipped': return 'status-badge skipped';
      default: return 'status-badge';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Convert to appropriate type
    let convertedValue = value;
    if (name === 'max_parallel_suites' ||
      name === 'max_retries' ||
      name === 'retry_delay_seconds' ||
      name === 'timeout_seconds') {
      convertedValue = parseInt(value, 10) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: convertedValue
    }));
  };

  return (
    <div className="execution-plans-container">
      <div className="plans-header">
        <h2>📋 Execution Plans</h2>
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ Create Plan'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="create-plan-form">
          <h3>Create New Execution Plan</h3>
          <form onSubmit={handleCreatePlan}>
            <div className="form-group">
              <label>Plan Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Daily Smoke Tests"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Plan description"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Environment *</label>
              <select
                name="environment_id"
                value={formData.environment_id}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select Environment --</option>
                {environments.map(env => (
                  <option key={env.id} value={env.id}>
                    {env.name} ({env.base_url})
                  </option>
                ))}
              </select>
              <small className="help-text">The environment provides base_url and credentials for test execution</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Plan Type *</label>
                <select
                  name="plan_type"
                  value={formData.plan_type}
                  onChange={handleInputChange}
                >
                  <option value="sequential">Sequential</option>
                  <option value="parallel">Parallel</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div className="form-group">
                <label>Schedule Type *</label>
                <select
                  name="schedule_type"
                  value={formData.schedule_type}
                  onChange={handleInputChange}
                >
                  <option value="manual">Manual</option>
                  <option value="once">Once</option>
                  <option value="recurring">Recurring</option>
                  <option value="cron">Cron</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Max Parallel Suites</label>
                <input
                  type="number"
                  name="max_parallel_suites"
                  value={formData.max_parallel_suites}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                />
              </div>

              <div className="form-group">
                <label>Max Retries</label>
                <input
                  type="number"
                  name="max_retries"
                  value={formData.max_retries}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                />
              </div>

              <div className="form-group">
                <label>Retry Delay (seconds)</label>
                <input
                  type="number"
                  name="retry_delay_seconds"
                  value={formData.retry_delay_seconds}
                  onChange={handleInputChange}
                  min="1"
                  max="300"
                />
              </div>

              <div className="form-group">
                <label>Timeout (seconds)</label>
                <input
                  type="number"
                  name="timeout_seconds"
                  value={formData.timeout_seconds}
                  onChange={handleInputChange}
                  min="60"
                  max="3600"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Plan'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="plans-content">
        <div className="plans-list">
          <h3>Available Plans ({plans.length})</h3>
          {loading && !showCreateForm ? (
            <div className="loading">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="no-data">No execution plans created yet</div>
          ) : (
            <div className="plans-grid">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`plan-card ${selectedPlan?.id === plan.id ? 'selected' : ''}`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <div className="plan-header">
                    <h4>{plan.name}</h4>
                    <span className={`plan-type ${plan.plan_type}`}>{plan.plan_type}</span>
                  </div>

                  <div className="plan-description">
                    {plan.description || 'No description'}
                  </div>

                  <div className="plan-meta">
                    <div className="meta-item">
                      <span className="label">Schedule:</span>
                      <span className="value">{plan.schedule_type}</span>
                    </div>
                    <div className="meta-item">
                      <span className="label">Status:</span>
                      <span className={`status ${plan.status}`}>{plan.status}</span>
                    </div>
                  </div>

                  <div className="plan-actions">
                    <button
                      className="btn-small btn-execute"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecutePlan(plan.id);
                      }}
                    >
                      ▶️ Execute
                    </button>
                    <button
                      className="btn-small btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(plan.id);
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPlan && (
          <div className="plan-details">
            <div className="plan-details-header">
              <h3>Plan Details: {selectedPlan.name}</h3>
              <button className="settings-btn" onClick={openSettingsModal}>
                ⚙️ Settings
              </button>
            </div>

            <div className="details-section">
              <h4>Configuration</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="label">Type:</span>
                  <span className="value">{selectedPlan.plan_type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Schedule:</span>
                  <span className="value">{selectedPlan.schedule_type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`status ${selectedPlan.status}`}>{selectedPlan.status}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Max Parallel:</span>
                  <span className="value">{selectedPlan.max_parallel_suites}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Max Retries:</span>
                  <span className="value">{selectedPlan.max_retries}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Retry Delay:</span>
                  <span className="value">{selectedPlan.retry_delay_seconds}s</span>
                </div>
                <div className="detail-item">
                  <span className="label">Timeout:</span>
                  <span className="value">{selectedPlan.timeout_seconds}s</span>
                </div>
              </div>

              {selectedPlan.description && (
                <div className="description-box">
                  <strong>Description:</strong>
                  <p>{selectedPlan.description}</p>
                </div>
              )}
            </div>

            <div className="details-section">
              <div className="section-header">
                <h4>Associated Suites</h4>
                <button className="add-suite-btn" onClick={openAddSuiteModal}>
                  + Add Suite
                </button>
              </div>
              {loadingSuites ? (
                <div className="loading">Loading suites...</div>
              ) : suites.length === 0 ? (
                <div className="no-data">No suites associated with this plan. Click "Add Suite" to connect test suites.</div>
              ) : (
                <div className="suites-list">
                  {suites.map(suite => (
                    <div key={suite.id} className="suite-item">
                      <span className="suite-name">{suite.suite_name || `Suite #${suite.test_suite_id}`}</span>
                      <span className="suite-order">Order: {suite.execution_order}</span>
                      <button
                        className="remove-suite-btn"
                        onClick={() => handleRemoveSuite(suite.test_suite_id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Suite Modal */}
            {showAddSuiteModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Add Suite to Plan</h3>
                  <div className="form-group">
                    <label>Select Suite</label>
                    <select
                      value={selectedSuiteToAdd}
                      onChange={(e) => setSelectedSuiteToAdd(e.target.value)}
                    >
                      <option value="">-- Select a Suite --</option>
                      {availableSuites.map(suite => (
                        <option key={suite.id} value={suite.id}>
                          {suite.name} ({suite.test_count || 0} tests)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Execution Order</label>
                    <input
                      type="number"
                      value={executionOrder}
                      onChange={(e) => setExecutionOrder(parseInt(e.target.value, 10) || 0)}
                      min="0"
                    />
                    <small>Suites with the same order run in parallel</small>
                  </div>
                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => setShowAddSuiteModal(false)}>
                      Cancel
                    </button>
                    <button
                      className="confirm-btn"
                      onClick={handleAddSuite}
                      disabled={!selectedSuiteToAdd}
                    >
                      Add Suite
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Execution Runs Section */}
            <div className="details-section">
              <div className="section-header">
                <h4>Execution History</h4>
                <button
                  className="refresh-btn"
                  onClick={() => fetchPlanRuns(selectedPlan.id)}
                  title="Refresh"
                >
                  ↻
                </button>
              </div>
              {loadingRuns ? (
                <div className="loading">Loading runs...</div>
              ) : runs.length === 0 ? (
                <div className="no-data">No executions yet. Click "Run Now" to execute this plan.</div>
              ) : (
                <div className="runs-list">
                  {runs.map(run => (
                    <div
                      key={run.id}
                      className={`run-item ${selectedRun?.id === run.id ? 'selected' : ''}`}
                      onClick={() => handleSelectRun(run)}
                    >
                      <div className="run-header">
                        <span className={getStatusBadgeClass(run.status)}>{run.status}</span>
                        <span className="run-date">{formatDateTime(run.started_at)}</span>
                      </div>
                      <div className="run-stats">
                        <span className="stat passed">✓ {run.passed_tests || 0}</span>
                        <span className="stat failed">✗ {run.failed_tests || 0}</span>
                        <span className="stat skipped">○ {run.skipped_tests || 0}</span>
                        <span className="stat duration">⏱ {formatDuration(run.duration_seconds)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Results Section */}
            {selectedRun && (
              <div className="details-section test-results-section">
                <h4>Test Results - Run #{selectedRun.id}</h4>
                <div className="run-summary">
                  <span className={getStatusBadgeClass(selectedRun.status)}>
                    {selectedRun.status.toUpperCase()}
                  </span>
                  <span>Total: {selectedRun.total_tests || 0}</span>
                  <span className="passed">Passed: {selectedRun.passed_tests || 0}</span>
                  <span className="failed">Failed: {selectedRun.failed_tests || 0}</span>
                </div>
                {loadingTestResults ? (
                  <div className="loading">Loading test results...</div>
                ) : testResults.length === 0 ? (
                  <div className="no-data">No test results available for this run.</div>
                ) : (
                  <div className="test-results-list">
                    {testResults.map(test => (
                      <div key={test.id} className={`test-result-item ${test.status}`}>
                        <div className="test-info">
                          <span className={getStatusBadgeClass(test.status)}>{test.status}</span>
                          <span className="test-name">{test.test_name}</span>
                          <span className="test-suite">({test.suite_name})</span>
                        </div>
                        <div className="test-meta">
                          <span className="duration">{formatDuration(test.duration_seconds)}</span>
                          {test.retry_count > 0 && (
                            <span className="retries">Retries: {test.retry_count}</span>
                          )}
                        </div>
                        {test.error_message && (
                          <div className="error-message">
                            <strong>Error:</strong> {test.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="modal-overlay">
            <div className="modal-content settings-modal">
              <h3>Plan Settings</h3>

              {/* Schedule Settings */}
              <div className="settings-section">
                <h4>Schedule</h4>
                <div className="form-group">
                  <label>Schedule Type</label>
                  <select
                    value={scheduleSettings.schedule_type}
                    onChange={(e) => setScheduleSettings({ ...scheduleSettings, schedule_type: e.target.value })}
                  >
                    <option value="manual">Manual</option>
                    <option value="recurring">Recurring</option>
                    <option value="cron">Cron Expression</option>
                  </select>
                </div>

                {scheduleSettings.schedule_type === 'recurring' && (
                  <div className="form-group">
                    <label>Recurrence Pattern</label>
                    <select
                      value={scheduleSettings.recurrence_pattern}
                      onChange={(e) => setScheduleSettings({ ...scheduleSettings, recurrence_pattern: e.target.value })}
                    >
                      <option value="">-- Select Pattern --</option>
                      <option value="hourly">Every Hour</option>
                      <option value="every_6_hours">Every 6 Hours</option>
                      <option value="every_12_hours">Every 12 Hours</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}

                {scheduleSettings.schedule_type === 'cron' && (
                  <div className="form-group">
                    <label>Cron Expression</label>
                    <input
                      type="text"
                      value={scheduleSettings.cron_expression}
                      onChange={(e) => setScheduleSettings({ ...scheduleSettings, cron_expression: e.target.value })}
                      placeholder="0 2 * * * (2 AM daily)"
                    />
                    <small className="help-text">Format: minute hour day month weekday (e.g., "0 2 * * *" for 2 AM daily)</small>
                  </div>
                )}
              </div>

              {/* Notification Settings */}
              <div className="settings-section">
                <h4>Notifications</h4>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notify_on_start}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notify_on_start: e.target.checked })}
                    />
                    Notify on start
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notify_on_completion}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notify_on_completion: e.target.checked })}
                    />
                    Notify on completion
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notify_on_failure}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notify_on_failure: e.target.checked })}
                    />
                    Notify on failure
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notify_on_retry}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, notify_on_retry: e.target.checked })}
                    />
                    Notify on retry
                  </label>
                </div>

                <div className="form-group">
                  <label>Email Recipients</label>
                  <input
                    type="text"
                    value={notificationSettings.email_recipients}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, email_recipients: e.target.value })}
                    placeholder="email1@example.com, email2@example.com"
                  />
                  <small className="help-text">Comma-separated email addresses</small>
                </div>

                <div className="form-group">
                  <label>Slack Webhook URLs</label>
                  <input
                    type="text"
                    value={notificationSettings.slack_channels}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, slack_channels: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                  />
                  <small className="help-text">Comma-separated Slack webhook URLs</small>
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowSettingsModal(false)}>
                  Cancel
                </button>
                <button className="confirm-btn" onClick={handleSaveSettings}>
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionPlans;
