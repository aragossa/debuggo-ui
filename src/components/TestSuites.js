import React, { useState, useEffect } from 'react';
import './TestSuites.css';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Folder, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TestSuites = ({ projectId }) => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  const [suites, setSuites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTestsModal, setShowAddTestsModal] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [expandedSuites, setExpandedSuites] = useState(new Set());
  const [suiteTests, setSuiteTests] = useState({});
  const [environments, setEnvironments] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    suite_type: 'static',
    default_environment_id: null,
    parent_suite_id: null
  });

  // Load suites on component mount or project change
  useEffect(() => {
    loadSuites();
    loadEnvironments();
  }, [projectId]);

  const loadSuites = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectId) {
        params.append('project_id', projectId);
      }
      
      const response = await fetch(`${API_URL}/api/suites?${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to load suites');
      
      const data = await response.json();
      setSuites(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading suites:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEnvironments = async () => {
    try {
      if (!projectId) return;
      
      const response = await fetch(`${API_URL}/api/projects/${projectId}/environments`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setEnvironments(data);
      }
    } catch (err) {
      console.error('Error loading environments:', err);
    }
  };

  const loadSuiteTests = async (suiteId) => {
    try {
      const response = await fetch(`${API_URL}/api/suites/${suiteId}/tests`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSuiteTests(prev => ({
          ...prev,
          [suiteId]: data
        }));
      }
    } catch (err) {
      console.error('Error loading suite tests:', err);
    }
  };

  const handleCreateSuite = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/suites`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(false),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          project_id: projectId || null
        })
      });

      if (!response.ok) throw new Error('Failed to create suite');

      await loadSuites();
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        suite_type: 'static',
        default_environment_id: null,
        parent_suite_id: null
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateSuite = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/suites/${selectedSuite.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(false),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update suite');

      await loadSuites();
      setShowEditModal(false);
      setSelectedSuite(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteSuite = async (suiteId) => {
    if (!window.confirm('Are you sure you want to delete this suite?')) return;

    try {
      const response = await fetch(`${API_URL}/api/suites/${suiteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to delete suite');

      await loadSuites();
    } catch (err) {
      setError(err.message);
    }
  };

  const loadAvailableTests = async (suiteId) => {
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/test_tree`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        // Flatten the tree structure to get individual test cases
        const flattenTests = (items) => {
          let flat = [];
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (item.type === 'test') {
                flat.push({
                  id: item.id,
                  test_name: item.name,
                  test_type: item.test_type || 'ui'
                });
              } else if (item.children) {
                flat = flat.concat(flattenTests(item.children));
              }
            });
          }
          return flat;
        };
        
        const flatTests = flattenTests(data);
        setAvailableTests(flatTests);
      }
    } catch (err) {
      console.error('Error loading available tests:', err);
    }
  };

  const handleOpenAddTestsModal = async (suite) => {
    setSelectedSuite(suite);
    // Load suite tests first, then pre-select them
    await loadSuiteTests(suite.id);
    await loadAvailableTests(suite.id);
    // Pre-select tests that are already in the suite
    const existingTestIds = new Set((suiteTests[suite.id] || []).map(t => t.test_case_id));
    setSelectedTests(existingTestIds);
    setShowAddTestsModal(true);
  };

  const handleRemoveTestFromSuite = async (suiteId, testCaseId) => {
    if (!window.confirm('Remove this test from the suite?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/suites/${suiteId}/tests/${testCaseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) throw new Error('Failed to remove test from suite');

      // Refresh suite tests
      await loadSuiteTests(suiteId);
      await loadSuites();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddTestsToSuite = async () => {
    if (selectedTests.size === 0) {
      setError('Please select at least one test');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/suites/${selectedSuite.id}/tests/bulk`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(false),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_case_ids: Array.from(selectedTests)
        })
      });

      if (!response.ok) throw new Error('Failed to add tests to suite');

      setShowAddTestsModal(false);
      setSelectedTests(new Set());
      await loadSuites();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditSuite = (suite) => {
    setSelectedSuite(suite);
    setFormData({
      name: suite.name,
      description: suite.description,
      suite_type: suite.suite_type,
      default_environment_id: suite.default_environment_id,
      parent_suite_id: suite.parent_suite_id
    });
    setShowEditModal(true);
  };

  const toggleSuiteExpanded = (suiteId) => {
    const newExpanded = new Set(expandedSuites);
    if (newExpanded.has(suiteId)) {
      newExpanded.delete(suiteId);
    } else {
      newExpanded.add(suiteId);
      loadSuiteTests(suiteId);
    }
    setExpandedSuites(newExpanded);
  };

  const renderSuite = (suite) => {
    const isExpanded = expandedSuites.has(suite.id);
    const tests = suiteTests[suite.id];
    const childSuites = suites.filter(s => s.parent_suite_id === suite.id);
    const hasContent = suite.test_count > 0 || childSuites.length > 0;

    return (
      <div key={suite.id} className={`ts-suite ${isExpanded ? 'expanded' : ''}`}>
        <div className="ts-suite-row">
          <button
            className="ts-icon-btn"
            onClick={() => toggleSuiteExpanded(suite.id)}
            disabled={!hasContent}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <div
            className={`ts-suite-info ${hasContent ? 'clickable' : ''}`}
            onClick={hasContent ? () => toggleSuiteExpanded(suite.id) : undefined}
          >
            <Folder size={16} className="ts-suite-icon" />
            <div className="ts-suite-text">
              <div className="ts-suite-title">
                <h4 className="ts-suite-name">{suite.name}</h4>
                <span className="ts-badge">{suite.suite_type}</span>
                <span className="ts-suite-count">
                  {suite.test_count} test{suite.test_count !== 1 ? 's' : ''}
                </span>
              </div>
              {suite.description && <p className="ts-suite-description">{suite.description}</p>}
            </div>
          </div>

          <div className="ts-suite-actions">
            <button
              className="ts-btn"
              onClick={() => handleOpenAddTestsModal(suite)}
              title="Add tests to suite"
            >
              <Plus size={14} /> Add Tests
            </button>
            <button
              className="ts-icon-btn"
              onClick={() => handleEditSuite(suite)}
              title="Edit suite"
            >
              <Pencil size={15} />
            </button>
            <button
              className="ts-icon-btn danger"
              onClick={() => handleDeleteSuite(suite.id)}
              title="Delete suite"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="ts-suite-body">
            {tests === undefined && suite.test_count > 0 && (
              <div className="ts-tests-loading">Loading tests...</div>
            )}

            {tests && tests.length > 0 && (
              <ul className="ts-tests">
                {tests.map((test, index) => (
                  <li key={test.test_case_id} className="ts-test-row">
                    <span className="ts-test-index">{index + 1}</span>
                    <span className="ts-badge">{test.test_type}</span>
                    <span className="ts-test-name">{test.test_name}</span>
                    <button
                      className="ts-icon-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTestFromSuite(suite.id, test.test_case_id);
                      }}
                      title="Remove test from suite"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {childSuites.length > 0 && (
              <div className="ts-children">
                <h5>Child Suites</h5>
                <div className="ts-suites">
                  {childSuites.map(childSuite => renderSuite(childSuite))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSuiteTypeAndEnvironment = (typeLabels) => (
    <div className="ts-form-row">
      <div className="form-group">
        <label>Suite Type *</label>
        <select
          value={formData.suite_type}
          onChange={e => setFormData({ ...formData, suite_type: e.target.value })}
        >
          <option value="static">{typeLabels.static}</option>
          <option value="dynamic">{typeLabels.dynamic}</option>
          <option value="smart">{typeLabels.smart}</option>
        </select>
      </div>

      <div className="form-group">
        <label>Default Environment</label>
        <select
          value={formData.default_environment_id || ''}
          onChange={e => setFormData({ ...formData, default_environment_id: e.target.value ? parseInt(e.target.value) : null })}
        >
          <option value="">None</option>
          {environments.map(env => (
            <option key={env.id} value={env.id}>{env.name}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const rootSuites = suites.filter(s => !s.parent_suite_id);

  return (
    <div className="test-suites-container">
      <div className="suites-header">
        <h2>Test Suites</h2>
        <button
          className="create-button"
          onClick={() => {
            setFormData({
              name: '',
              description: '',
              suite_type: 'static',
              default_environment_id: null,
              parent_suite_id: null
            });
            setShowCreateModal(true);
          }}
        >
          <Plus size={14} /> Create Suite
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading suites...</div>
      ) : rootSuites.length === 0 ? (
        <div className="empty-state">
          <p>No test suites yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="ts-suites">
          {rootSuites.map(suite => renderSuite(suite))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="ts-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="ts-modal" onClick={e => e.stopPropagation()}>
            <h3>Create Test Suite</h3>
            <form onSubmit={handleCreateSuite}>
              <div className="form-group">
                <label>Suite Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                  placeholder="e.g., Smoke Tests, Regression Suite"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Suite description"
                  rows="3"
                />
              </div>

              {renderSuiteTypeAndEnvironment({
                static: 'Static (Manual selection)',
                dynamic: 'Dynamic (Auto-populated)',
                smart: 'Smart (ML-based)'
              })}

              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Create Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSuite && (
        <div className="ts-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="ts-modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Test Suite</h3>
            <form onSubmit={handleUpdateSuite}>
              <div className="form-group">
                <label>Suite Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              {renderSuiteTypeAndEnvironment({ static: 'Static', dynamic: 'Dynamic', smart: 'Smart' })}

              <div className="form-actions">
                <button type="button" onClick={() => setShowEditModal(false)} className="cancel-button">
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  Update Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tests Modal */}
      {showAddTestsModal && selectedSuite && (
        <div className="ts-modal-overlay" onClick={() => setShowAddTestsModal(false)}>
          <div className="ts-modal ts-modal-large" onClick={e => e.stopPropagation()}>
            <h3>Add Tests to Suite: {selectedSuite.name}</h3>

            {availableTests.length === 0 ? (
              <div className="empty-state">
                <p>No test cases available in this project</p>
              </div>
            ) : (
              <div className="ts-pick-list">
                {availableTests.map(test => (
                  <label key={test.id} className="ts-pick-row" htmlFor={`test-${test.id}`}>
                    <input
                      type="checkbox"
                      id={`test-${test.id}`}
                      checked={selectedTests.has(test.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedTests);
                        if (e.target.checked) {
                          newSelected.add(test.id);
                        } else {
                          newSelected.delete(test.id);
                        }
                        setSelectedTests(newSelected);
                      }}
                    />
                    <span className="ts-test-name">{test.test_name}</span>
                    <span className="ts-badge">{test.test_type}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button type="button" onClick={() => setShowAddTestsModal(false)} className="cancel-button">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTestsToSuite}
                className="submit-button"
                disabled={selectedTests.size === 0}
              >
                Add {selectedTests.size} Test{selectedTests.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSuites;
