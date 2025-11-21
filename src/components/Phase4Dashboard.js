import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Phase4Dashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faDatabase, faCog, faCheckCircle, faExclamationCircle, faSync } from '@fortawesome/free-solid-svg-icons';

const Phase4Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  
  // Performance Optimizer Data
  const [cacheStats, setCacheStats] = useState(null);
  const [queryLogs, setQueryLogs] = useState(null);
  const [optimizationRecs, setOptimizationRecs] = useState(null);
  const [indexAnalysis, setIndexAnalysis] = useState(null);
  
  // Fine-Tuning Data
  const [successfulTests, setSuccessfulTests] = useState(null);
  const [jobHistory, setJobHistory] = useState(null);
  
  // Continuous Improvement Data
  const [failureAnalysis, setFailureAnalysis] = useState(null);
  const [confidenceCalibration, setConfidenceCalibration] = useState(null);
  const [toolUsage, setToolUsage] = useState(null);
  const [abTestAnalysis, setAbTestAnalysis] = useState(null);
  const [ensemblePerformance, setEnsemblePerformance] = useState(null);
  const [errorCategories, setErrorCategories] = useState(null);
  const [planningAccuracy, setPlanningAccuracy] = useState(null);
  
  // A/B Test Modal State
  const [showABTestModal, setShowABTestModal] = useState(false);
  const [abTestForm, setAbTestForm] = useState({
    test_case_id_a: '',
    test_case_id_b: '',
    variant_a_id: '',
    variant_b_id: '',
    notes: '',
    sample_size: 10
  });
  const [abTestLoading, setAbTestLoading] = useState(false);

  // Batch Linking Modal State
  const [showBatchLinkModal, setShowBatchLinkModal] = useState(false);
  const [batchLinkForm, setBatchLinkForm] = useState({
    ab_test_id: '',
    variant_a_test_case_id: '',
    variant_b_test_case_id: ''
  });
  const [availableRunsA, setAvailableRunsA] = useState([]);
  const [availableRunsB, setAvailableRunsB] = useState([]);
  const [selectedRunsA, setSelectedRunsA] = useState([]);
  const [selectedRunsB, setSelectedRunsB] = useState([]);
  const [batchLinkLoading, setBatchLinkLoading] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  const fetchPhase4Data = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all Phase 4 data in parallel
      const [
        cacheRes,
        queryRes,
        recsRes,
        indexRes,
        testsRes,
        jobRes,
        failureRes,
        confRes,
        toolRes,
        abRes,
        ensembleRes,
        errorRes,
        planRes
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/phase4/performance/cache-stats`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/performance/query-logs?limit=50`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/performance/optimization-recommendations?analysis_type=all`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/performance/index-analysis`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/finetuning/collect-successful-tests?limit=100`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/finetuning/job-history?limit=20`, { headers }).catch(() => null),
        axios.post(`${API_BASE_URL}/api/phase4/improvement/analyze-failures`, { days_back: 7 }, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/improvement/confidence-calibration`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/improvement/tool-usage-analysis`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/improvement/ab-test-analysis`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/improvement/ensemble-performance`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/improvement/error-categories`, { headers }).catch(() => null),
        axios.get(`${API_BASE_URL}/api/phase4/improvement/planning-accuracy`, { headers }).catch(() => null),
      ]);

      if (cacheRes?.data?.data) setCacheStats(cacheRes.data.data);
      if (queryRes?.data?.data) setQueryLogs(queryRes.data.data);
      if (recsRes?.data?.data) setOptimizationRecs(recsRes.data.data);
      if (indexRes?.data?.data) setIndexAnalysis(indexRes.data.data);
      if (testsRes?.data) setSuccessfulTests(testsRes.data);
      if (jobRes?.data) setJobHistory(jobRes.data);
      if (failureRes?.data?.data) setFailureAnalysis(failureRes.data.data);
      if (confRes?.data?.data) setConfidenceCalibration(confRes.data.data);
      if (toolRes?.data?.data) setToolUsage(toolRes.data.data);
      if (abRes?.data?.data) setAbTestAnalysis(abRes.data.data);
      if (ensembleRes?.data?.data) setEnsemblePerformance(ensembleRes.data.data);
      if (errorRes?.data?.data) setErrorCategories(errorRes.data.data);
      if (planRes?.data?.data) setPlanningAccuracy(planRes.data.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch Phase 4 data');
      console.error('Error fetching Phase 4 data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPhase4Data();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchPhase4Data();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPhase4Data();
  };

  const handleRunABTest = async () => {
    if (!abTestForm.test_case_id_a || !abTestForm.test_case_id_b || !abTestForm.variant_a_id || !abTestForm.variant_b_id) {
      setError('Please fill in all required fields');
      return;
    }

    setAbTestLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.post(
        `${API_BASE_URL}/api/phase4/improvement/run-ab-test`,
        abTestForm,
        { headers }
      );

      if (response.data.status === 'success') {
        setError('');
        setShowABTestModal(false);
        setAbTestForm({
          test_case_id_a: '',
          test_case_id_b: '',
          variant_a_id: '',
          variant_b_id: '',
          notes: '',
          sample_size: 10
        });
        // Refresh data to show new test
        fetchPhase4Data();
        alert(`✅ A/B Test created successfully! Test ID: ${response.data.test_id}`);
      }
    } catch (err) {
      setError(`Failed to create A/B test: ${err.response?.data?.detail || err.message}`);
    } finally {
      setAbTestLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAbTestForm(prev => ({
      ...prev,
      [name]: name === 'sample_size' ? parseInt(value) : value
    }));
  };

  const handleBatchLinkFormChange = (e) => {
    const { name, value } = e.target;
    setBatchLinkForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchAvailableRuns = async (testCaseId, variant) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      setLoadingRuns(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/phase4/improvement/available-test-runs/${testCaseId}?limit=100`,
        { headers }
      );

      if (response.data.status === 'success') {
        if (variant === 'A') {
          setAvailableRunsA(response.data.data || []);
          setSelectedRunsA([]);
        } else {
          setAvailableRunsB(response.data.data || []);
          setSelectedRunsB([]);
        }
      }
    } catch (err) {
      setError(`Failed to fetch available runs: ${err.message}`);
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleVariantAChange = (e) => {
    const testCaseId = e.target.value;
    setBatchLinkForm(prev => ({
      ...prev,
      variant_a_test_case_id: testCaseId
    }));
    if (testCaseId) {
      fetchAvailableRuns(testCaseId, 'A');
    }
  };

  const handleVariantBChange = (e) => {
    const testCaseId = e.target.value;
    setBatchLinkForm(prev => ({
      ...prev,
      variant_b_test_case_id: testCaseId
    }));
    if (testCaseId) {
      fetchAvailableRuns(testCaseId, 'B');
    }
  };

  const toggleRunSelection = (runId, variant) => {
    if (variant === 'A') {
      setSelectedRunsA(prev => 
        prev.includes(runId) ? prev.filter(id => id !== runId) : [...prev, runId]
      );
    } else {
      setSelectedRunsB(prev => 
        prev.includes(runId) ? prev.filter(id => id !== runId) : [...prev, runId]
      );
    }
  };

  const handleBatchLink = async () => {
    if (!batchLinkForm.ab_test_id || selectedRunsA.length === 0 || selectedRunsB.length === 0) {
      setError('Please select an A/B test and at least one run for each variant');
      return;
    }

    setBatchLinkLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const response = await axios.post(
        `${API_BASE_URL}/api/phase4/improvement/batch-link-test-runs`,
        {
          ab_test_id: parseInt(batchLinkForm.ab_test_id),
          variant_a_run_ids: selectedRunsA,
          variant_b_run_ids: selectedRunsB
        },
        { headers }
      );

      if (response.data.status === 'success') {
        setError('');
        setShowBatchLinkModal(false);
        setBatchLinkForm({
          ab_test_id: '',
          variant_a_test_case_id: '',
          variant_b_test_case_id: ''
        });
        setSelectedRunsA([]);
        setSelectedRunsB([]);
        setAvailableRunsA([]);
        setAvailableRunsB([]);
        // Refresh data
        fetchPhase4Data();
        alert(`✅ Successfully linked ${response.data.linked.total_linked} test runs!`);
      }
    } catch (err) {
      setError(`Failed to batch link runs: ${err.response?.data?.detail || err.message}`);
    } finally {
      setBatchLinkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="phase4-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Phase 4 Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="phase4-container">
      {/* Header */}
      <div className="phase4-header">
        <div>
          <h1>🚀 Phase 4 Optimization Dashboard</h1>
          <p>Performance Optimization, Fine-Tuning & Continuous Improvement</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="refresh-button"
        >
          <FontAwesomeIcon icon={faSync} /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="error-alert">
          <FontAwesomeIcon icon={faExclamationCircle} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="phase4-tabs">
        <button
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <FontAwesomeIcon icon={faChartLine} /> Performance Optimizer
        </button>
        <button
          className={`tab-button ${activeTab === 'finetuning' ? 'active' : ''}`}
          onClick={() => setActiveTab('finetuning')}
        >
          <FontAwesomeIcon icon={faDatabase} /> Fine-Tuning
        </button>
        <button
          className={`tab-button ${activeTab === 'improvement' ? 'active' : ''}`}
          onClick={() => setActiveTab('improvement')}
        >
          <FontAwesomeIcon icon={faCog} /> Continuous Improvement
        </button>
      </div>

      {/* Performance Optimizer Tab */}
      {activeTab === 'performance' && (
        <div className="tab-content">
          <div className="section-title">Cache Performance</div>
          {cacheStats && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Total Cached Items</div>
                <div className="metric-value">{cacheStats.total_cached || 0}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Cache Hit Rate</div>
                <div className="metric-value">{((cacheStats.cache_hit_rate || 0) * 100).toFixed(1)}%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Avg Access Time</div>
                <div className="metric-value">{cacheStats.avg_access_time || 0}ms</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Memory Usage</div>
                <div className="metric-value">{cacheStats.memory_usage || 'N/A'}</div>
              </div>
            </div>
          )}

          <div className="section-title">Query Performance</div>
          {queryLogs && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Slow Queries</div>
                <div className="metric-value">{queryLogs.slow_queries || 0}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Avg Query Time</div>
                <div className="metric-value">{queryLogs.avg_query_time || 0}ms</div>
              </div>
            </div>
          )}

          <div className="section-title">Optimization Recommendations</div>
          {optimizationRecs && optimizationRecs.recommendations && (
            <div className="recommendations-list">
              {optimizationRecs.recommendations.slice(0, 5).map((rec, idx) => (
                <div key={idx} className="recommendation-item">
                  <div className="rec-priority" style={{ backgroundColor: rec.priority === 'high' ? '#ef4444' : '#f59e0b' }}>
                    {rec.priority?.toUpperCase()}
                  </div>
                  <div className="rec-content">
                    <div className="rec-title">{rec.description}</div>
                    <div className="rec-impact">Est. Improvement: +{rec.estimated_improvement}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="section-title">Index Analysis</div>
          {indexAnalysis && (
            <div className="index-analysis">
              <div className="index-section">
                <h4>Used Indexes</h4>
                <div className="index-list">
                  {indexAnalysis.used_indexes?.slice(0, 5).map((idx, i) => (
                    <div key={i} className="index-item">✓ {idx}</div>
                  ))}
                </div>
              </div>
              <div className="index-section">
                <h4>Unused Indexes</h4>
                <div className="index-list">
                  {indexAnalysis.unused_indexes?.slice(0, 5).map((idx, i) => (
                    <div key={i} className="index-item warning">⚠ {idx}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fine-Tuning Tab */}
      {activeTab === 'finetuning' && (
        <div className="tab-content">
          <div className="section-title">Successful Tests for Training</div>
          {successfulTests && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Tests Collected</div>
                <div className="metric-value">{successfulTests.collected_count || 0}</div>
              </div>
            </div>
          )}

          <div className="section-title">Fine-Tuning Job History</div>
          {jobHistory && jobHistory.data && (
            <div className="jobs-list">
              {jobHistory.data.slice(0, 10).map((job, idx) => (
                <div key={idx} className="job-item">
                  <div className="job-header">
                    <span className="job-id">{job.job_id}</span>
                    <span className={`job-status ${job.status}`}>{job.status?.toUpperCase()}</span>
                  </div>
                  <div className="job-details">
                    <span>Model: {job.model_id}</span>
                    <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Continuous Improvement Tab */}
      {activeTab === 'improvement' && (
        <div className="tab-content">
          <div className="section-title">Failure Analysis (Last 7 Days)</div>
          {failureAnalysis && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Total Failures</div>
                <div className="metric-value">{failureAnalysis.total_failures || 0}</div>
              </div>
            </div>
          )}

          <div className="section-title">Confidence Calibration</div>
          {confidenceCalibration && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Calibration Score</div>
                <div className="metric-value">{confidenceCalibration.calibration_score || 0}/100</div>
              </div>
            </div>
          )}

          <div className="section-title">Tool Usage Analysis</div>
          {toolUsage && toolUsage.tools && (
            <div className="tools-grid">
              {toolUsage.tools.slice(0, 6).map((tool, idx) => (
                <div key={idx} className="tool-card">
                  <div className="tool-name">{tool.name}</div>
                  <div className="tool-stat">Usage: {tool.usage_count}</div>
                  <div className="tool-stat">Success: {((tool.success_rate || 0) * 100).toFixed(1)}%</div>
                </div>
              ))}
            </div>
          )}

          <div className="section-title-with-button">
            <div className="section-title">A/B Test Results</div>
            <div className="button-group">
              <button 
                className="run-ab-test-btn"
                onClick={() => setShowABTestModal(true)}
                title="Run a new A/B test"
              >
                ➕ Run A/B Test
              </button>
              <button 
                className="batch-link-btn"
                onClick={() => setShowBatchLinkModal(true)}
                title="Link multiple test runs to an A/B test"
              >
                🔗 Batch Link Runs
              </button>
            </div>
          </div>
          {abTestAnalysis && (
            <>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Active Tests</div>
                  <div className="metric-value">{abTestAnalysis.active_tests || 0}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Completed Tests</div>
                  <div className="metric-value">{abTestAnalysis.completed_tests?.length || 0}</div>
                </div>
              </div>

              {/* Completed Tests Results */}
              {abTestAnalysis.completed_tests && abTestAnalysis.completed_tests.length > 0 && (
                <div className="ab-test-results-container">
                  <div className="section-subtitle">Completed Test Results</div>
                  {abTestAnalysis.completed_tests.map((test, idx) => (
                    <div key={idx} className="ab-test-result-card">
                      <div className="result-header">
                        <div className="test-id">Test #{test.test_id}</div>
                        <div className={`winner-badge ${test.winner?.toLowerCase()}`}>
                          Winner: {test.winner || 'N/A'}
                        </div>
                      </div>
                      <div className="result-variants">
                        <div className="variant-result">
                          <div className="variant-name">Variant A: {test.variant_a_id}</div>
                          <div className="variant-stats">
                            <span className="success-rate">{test.variant_a_success_rate.toFixed(1)}%</span>
                            <span className="sample-size">({test.sample_size_a} runs)</span>
                          </div>
                        </div>
                        <div className="variant-result">
                          <div className="variant-name">Variant B: {test.variant_b_id}</div>
                          <div className="variant-stats">
                            <span className="success-rate">{test.variant_b_success_rate.toFixed(1)}%</span>
                            <span className="sample-size">({test.sample_size_b} runs)</span>
                          </div>
                        </div>
                      </div>
                      <div className="result-footer">
                        <span className="confidence">Confidence: {test.confidence_level.toFixed(1)}%</span>
                        <span className="created-date">{new Date(test.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="section-title">Ensemble Performance</div>
          {ensemblePerformance && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Ensemble Accuracy</div>
                <div className="metric-value">{((ensemblePerformance.ensemble_accuracy || 0) * 100).toFixed(1)}%</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Consensus Quality</div>
                <div className="metric-value">{((ensemblePerformance.consensus_quality || 0) * 100).toFixed(1)}%</div>
              </div>
            </div>
          )}

          <div className="section-title">Error Categories</div>
          {errorCategories && errorCategories.error_categories && (
            <div className="categories-grid">
              {Object.entries(errorCategories.error_categories).slice(0, 6).map(([category, count], idx) => (
                <div key={idx} className="category-card">
                  <div className="category-name">{category}</div>
                  <div className="category-count">{count}</div>
                </div>
              ))}
            </div>
          )}

          <div className="section-title">Planning Accuracy</div>
          {planningAccuracy && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Planning Accuracy</div>
                <div className="metric-value">{((planningAccuracy.planning_accuracy || 0) * 100).toFixed(1)}%</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Link Modal */}
      {showBatchLinkModal && (
        <div className="modal-overlay" onClick={() => setShowBatchLinkModal(false)}>
          <div className="modal-content batch-link-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔗 Batch Link Test Runs to A/B Test</h2>
              <button 
                className="modal-close"
                onClick={() => setShowBatchLinkModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>A/B Test ID *</label>
                <input
                  type="number"
                  name="ab_test_id"
                  value={batchLinkForm.ab_test_id}
                  onChange={handleBatchLinkFormChange}
                  placeholder="e.g., 4"
                  required
                />
              </div>

              <div className="batch-link-section">
                <h3>Variant A Runs</h3>
                <div className="form-group">
                  <label>Test Case ID *</label>
                  <input
                    type="number"
                    value={batchLinkForm.variant_a_test_case_id}
                    onChange={handleVariantAChange}
                    placeholder="e.g., 2004"
                    required
                  />
                </div>

                {loadingRuns ? (
                  <div className="loading-text">Loading available runs...</div>
                ) : availableRunsA.length > 0 ? (
                  <div className="runs-list">
                    <div className="runs-header">
                      <input
                        type="checkbox"
                        checked={selectedRunsA.length === availableRunsA.length && availableRunsA.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRunsA(availableRunsA.map(r => r.test_run_id));
                          } else {
                            setSelectedRunsA([]);
                          }
                        }}
                      />
                      <span>Select All ({selectedRunsA.length}/{availableRunsA.length})</span>
                    </div>
                    {availableRunsA.map(run => (
                      <div key={run.test_run_id} className="run-item">
                        <input
                          type="checkbox"
                          checked={selectedRunsA.includes(run.test_run_id)}
                          onChange={() => toggleRunSelection(run.test_run_id, 'A')}
                        />
                        <span className="run-id">Run #{run.test_run_id}</span>
                        <span className={`run-result ${run.result}`}>{run.result}</span>
                        <span className="run-time">{run.execution_time_seconds?.toFixed(1)}s</span>
                      </div>
                    ))}
                  </div>
                ) : batchLinkForm.variant_a_test_case_id ? (
                  <div className="no-runs">No available runs for this test case</div>
                ) : null}
              </div>

              <div className="batch-link-section">
                <h3>Variant B Runs</h3>
                <div className="form-group">
                  <label>Test Case ID *</label>
                  <input
                    type="number"
                    value={batchLinkForm.variant_b_test_case_id}
                    onChange={handleVariantBChange}
                    placeholder="e.g., 2005"
                    required
                  />
                </div>

                {loadingRuns ? (
                  <div className="loading-text">Loading available runs...</div>
                ) : availableRunsB.length > 0 ? (
                  <div className="runs-list">
                    <div className="runs-header">
                      <input
                        type="checkbox"
                        checked={selectedRunsB.length === availableRunsB.length && availableRunsB.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRunsB(availableRunsB.map(r => r.test_run_id));
                          } else {
                            setSelectedRunsB([]);
                          }
                        }}
                      />
                      <span>Select All ({selectedRunsB.length}/{availableRunsB.length})</span>
                    </div>
                    {availableRunsB.map(run => (
                      <div key={run.test_run_id} className="run-item">
                        <input
                          type="checkbox"
                          checked={selectedRunsB.includes(run.test_run_id)}
                          onChange={() => toggleRunSelection(run.test_run_id, 'B')}
                        />
                        <span className="run-id">Run #{run.test_run_id}</span>
                        <span className={`run-result ${run.result}`}>{run.result}</span>
                        <span className="run-time">{run.execution_time_seconds?.toFixed(1)}s</span>
                      </div>
                    ))}
                  </div>
                ) : batchLinkForm.variant_b_test_case_id ? (
                  <div className="no-runs">No available runs for this test case</div>
                ) : null}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowBatchLinkModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleBatchLink}
                disabled={batchLinkLoading || selectedRunsA.length === 0 || selectedRunsB.length === 0}
              >
                {batchLinkLoading ? '⏳ Linking...' : `✅ Link ${selectedRunsA.length + selectedRunsB.length} Runs`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* A/B Test Modal */}
      {showABTestModal && (
        <div className="modal-overlay" onClick={() => setShowABTestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🧪 Run A/B Test</h2>
              <button 
                className="modal-close"
                onClick={() => setShowABTestModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Test Case A ID *</label>
                <input
                  type="number"
                  name="test_case_id_a"
                  value={abTestForm.test_case_id_a}
                  onChange={handleFormChange}
                  placeholder="e.g., 2004"
                  required
                />
              </div>

              <div className="form-group">
                <label>Test Case B ID *</label>
                <input
                  type="number"
                  name="test_case_id_b"
                  value={abTestForm.test_case_id_b}
                  onChange={handleFormChange}
                  placeholder="e.g., 2005"
                  required
                />
              </div>

              <div className="form-group">
                <label>Variant A ID *</label>
                <input
                  type="text"
                  name="variant_a_id"
                  value={abTestForm.variant_a_id}
                  onChange={handleFormChange}
                  placeholder="e.g., login_v1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Variant B ID *</label>
                <input
                  type="text"
                  name="variant_b_id"
                  value={abTestForm.variant_b_id}
                  onChange={handleFormChange}
                  placeholder="e.g., login_v2"
                  required
                />
              </div>

              <div className="form-group">
                <label>Sample Size (runs per variant)</label>
                <input
                  type="number"
                  name="sample_size"
                  value={abTestForm.sample_size}
                  onChange={handleFormChange}
                  min="1"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea
                  name="notes"
                  value={abTestForm.notes}
                  onChange={handleFormChange}
                  placeholder="Add any notes about this A/B test..."
                  rows="3"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowABTestModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleRunABTest}
                disabled={abTestLoading}
              >
                {abTestLoading ? '⏳ Creating...' : '✅ Create A/B Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase4Dashboard;
