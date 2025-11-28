import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Requirements.css';

const Requirements = ({ projectId }) => {
  const { user, getAuthHeaders } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [coverageSummary, setCoverageSummary] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [showMapTestModal, setShowMapTestModal] = useState(false);
  const [selectedTestToMap, setSelectedTestToMap] = useState('');
  const [coverageType, setCoverageType] = useState('full');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [formData, setFormData] = useState({
    requirement_id: '',
    title: '',
    description: '',
    requirement_type: 'functional',
    priority: 'medium',
    status: 'draft'
  });

  const API_BASE = process.env.REACT_APP_API_URL || '';

  useEffect(() => {
    if (projectId && user?.client_id) {
      fetchRequirements();
      fetchCoverageSummary();
    }
  }, [projectId, user?.client_id, filterStatus, filterPriority]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/api/requirements?client_id=${user.client_id}&project_id=${projectId}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterPriority) url += `&priority=${filterPriority}`;
      
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setRequirements(data.requirements || []);
        setError(null);
      } else {
        setError('Failed to fetch requirements');
      }
    } catch (err) {
      console.error('Error fetching requirements:', err);
      setError('Error fetching requirements');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoverageSummary = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/requirements/coverage/summary?client_id=${user.client_id}&project_id=${projectId}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        setCoverageSummary(data);
      }
    } catch (err) {
      console.error('Error fetching coverage summary:', err);
    }
  };

  const fetchTestCases = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/tests/tree`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        // Flatten tree to get test cases only (type === 'test')
        const flattenTests = (items, result = []) => {
          for (const item of items) {
            if (item.type === 'test') {
              result.push(item);
            }
            if (item.children) {
              flattenTests(item.children, result);
            }
          }
          return result;
        };
        const allTests = flattenTests(Array.isArray(data) ? data : []);
        setTestCases(allTests);
      }
    } catch (err) {
      console.error('Error fetching test cases:', err);
    }
  };

  const fetchTestsForRequirement = async (reqId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/requirements/${reqId}/tests`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        return data.tests || [];
      }
    } catch (err) {
      console.error('Error fetching tests for requirement:', err);
    }
    return [];
  };

  const handleSelectRequirement = async (req) => {
    setSelectedRequirement(req);
    const tests = await fetchTestsForRequirement(req.id);
    setSelectedRequirement({ ...req, tests });
  };

  const handleCreateRequirement = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/requirements`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: user.client_id,
          project_id: projectId,
          ...formData
        })
      });

      if (response.ok) {
        fetchRequirements();
        fetchCoverageSummary();
        setShowCreateForm(false);
        resetForm();
      } else {
        const error = await response.json();
        setError(error.detail || 'Failed to create requirement');
      }
    } catch (err) {
      console.error('Error creating requirement:', err);
      setError('Error creating requirement');
    }
  };

  const handleUpdateRequirement = async () => {
    if (!selectedRequirement) return;
    try {
      const response = await fetch(`${API_BASE}/api/requirements/${selectedRequirement.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requirement_type: formData.requirement_type,
          priority: formData.priority,
          status: formData.status
        })
      });

      if (response.ok) {
        fetchRequirements();
        setSelectedRequirement(null);
        resetForm();
      }
    } catch (err) {
      console.error('Error updating requirement:', err);
    }
  };

  const handleDeleteRequirement = async (reqId) => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/requirements/${reqId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        fetchRequirements();
        fetchCoverageSummary();
        setSelectedRequirement(null);
      }
    } catch (err) {
      console.error('Error deleting requirement:', err);
    }
  };

  const handleMapTest = async () => {
    if (!selectedTestToMap || !selectedRequirement) return;
    try {
      const response = await fetch(
        `${API_BASE}/api/requirements/${selectedRequirement.id}/tests`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            test_case_id: parseInt(selectedTestToMap),
            coverage_type: coverageType
          })
        }
      );

      if (response.ok) {
        const tests = await fetchTestsForRequirement(selectedRequirement.id);
        setSelectedRequirement({ ...selectedRequirement, tests });
        fetchCoverageSummary();
        setShowMapTestModal(false);
        setSelectedTestToMap('');
      }
    } catch (err) {
      console.error('Error mapping test:', err);
    }
  };

  const handleUnmapTest = async (testCaseId) => {
    if (!selectedRequirement) return;
    try {
      const response = await fetch(
        `${API_BASE}/api/requirements/${selectedRequirement.id}/tests/${testCaseId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const tests = await fetchTestsForRequirement(selectedRequirement.id);
        setSelectedRequirement({ ...selectedRequirement, tests });
        fetchCoverageSummary();
      }
    } catch (err) {
      console.error('Error unmapping test:', err);
    }
  };

  const openMapTestModal = () => {
    fetchTestCases();
    setShowMapTestModal(true);
  };

  const resetForm = () => {
    setFormData({
      requirement_id: '',
      title: '',
      description: '',
      requirement_type: 'functional',
      priority: 'medium',
      status: 'draft'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'verified': return 'status-verified';
      case 'implemented': return 'status-implemented';
      case 'approved': return 'status-approved';
      case 'draft': return 'status-draft';
      case 'deprecated': return 'status-deprecated';
      default: return '';
    }
  };

  return (
    <div className="requirements-container">
      <div className="requirements-header">
        <h2>Requirements Traceability</h2>
        <button className="create-btn" onClick={() => setShowCreateForm(true)}>
          + New Requirement
        </button>
      </div>

      {/* Coverage Summary */}
      {coverageSummary && (
        <div className="coverage-summary">
          <div className="coverage-card">
            <div className="coverage-label">Total Requirements</div>
            <div className="coverage-value">{coverageSummary.total_requirements}</div>
          </div>
          <div className="coverage-card">
            <div className="coverage-label">Covered</div>
            <div className="coverage-value covered">{coverageSummary.covered_requirements}</div>
          </div>
          <div className="coverage-card">
            <div className="coverage-label">Uncovered</div>
            <div className="coverage-value uncovered">{coverageSummary.uncovered_requirements}</div>
          </div>
          <div className="coverage-card">
            <div className="coverage-label">Coverage</div>
            <div className={`coverage-value ${coverageSummary.coverage_percentage >= 80 ? 'good' : coverageSummary.coverage_percentage >= 50 ? 'warning' : 'bad'}`}>
              {coverageSummary.coverage_percentage}%
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="filters-row">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="implemented">Implemented</option>
          <option value="verified">Verified</option>
          <option value="deprecated">Deprecated</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="requirements-content">
        {/* Requirements List */}
        <div className="requirements-list">
          {loading ? (
            <div className="loading">Loading requirements...</div>
          ) : requirements.length === 0 ? (
            <div className="no-data">No requirements found. Create your first requirement to get started.</div>
          ) : (
            requirements.map(req => (
              <div
                key={req.id}
                className={`requirement-card ${selectedRequirement?.id === req.id ? 'selected' : ''}`}
                onClick={() => handleSelectRequirement(req)}
              >
                <div className="req-header">
                  <span className="req-id">{req.requirement_id}</span>
                  <span className={`req-priority ${getPriorityClass(req.priority)}`}>{req.priority}</span>
                </div>
                <div className="req-title">{req.title}</div>
                <div className="req-footer">
                  <span className={`req-status ${getStatusClass(req.status)}`}>{req.status}</span>
                  <span className="req-type">{req.requirement_type}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Requirement Details */}
        {selectedRequirement && (
          <div className="requirement-details">
            <div className="details-header">
              <h3>{selectedRequirement.requirement_id}: {selectedRequirement.title}</h3>
              <div className="details-actions">
                <button className="edit-btn" onClick={() => {
                  setFormData({
                    requirement_id: selectedRequirement.requirement_id,
                    title: selectedRequirement.title,
                    description: selectedRequirement.description || '',
                    requirement_type: selectedRequirement.requirement_type,
                    priority: selectedRequirement.priority,
                    status: selectedRequirement.status
                  });
                }}>
                  ✏️ Edit
                </button>
                <button className="delete-btn" onClick={() => handleDeleteRequirement(selectedRequirement.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>

            <div className="details-content">
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`detail-value ${getStatusClass(selectedRequirement.status)}`}>
                  {selectedRequirement.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Priority:</span>
                <span className={`detail-value ${getPriorityClass(selectedRequirement.priority)}`}>
                  {selectedRequirement.priority}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedRequirement.requirement_type}</span>
              </div>
              {selectedRequirement.description && (
                <div className="detail-row description">
                  <span className="detail-label">Description:</span>
                  <p className="detail-value">{selectedRequirement.description}</p>
                </div>
              )}
            </div>

            {/* Linked Tests */}
            <div className="linked-tests-section">
              <div className="section-header">
                <h4>Linked Test Cases ({selectedRequirement.tests?.length || 0})</h4>
                <button className="link-test-btn" onClick={openMapTestModal}>
                  + Link Test
                </button>
              </div>
              {selectedRequirement.tests?.length > 0 ? (
                <div className="linked-tests-list">
                  {selectedRequirement.tests.map(test => (
                    <div key={test.test_case_id} className="linked-test-item">
                      <span className="test-name">{test.name}</span>
                      <span className={`coverage-type ${test.coverage_type}`}>{test.coverage_type}</span>
                      <button
                        className="unlink-btn"
                        onClick={() => handleUnmapTest(test.test_case_id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-tests">No test cases linked to this requirement.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Requirement Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Requirement</h3>
            <form onSubmit={handleCreateRequirement}>
              <div className="form-group">
                <label>Requirement ID *</label>
                <input
                  type="text"
                  name="requirement_id"
                  value={formData.requirement_id}
                  onChange={handleInputChange}
                  placeholder="REQ-001"
                  required
                />
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Requirement title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description..."
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select name="requirement_type" value={formData.requirement_type} onChange={handleInputChange}>
                    <option value="functional">Functional</option>
                    <option value="non-functional">Non-Functional</option>
                    <option value="security">Security</option>
                    <option value="performance">Performance</option>
                    <option value="usability">Usability</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleInputChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="implemented">Implemented</option>
                  <option value="verified">Verified</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">Create Requirement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Test Modal */}
      {showMapTestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Link Test Case to Requirement</h3>
            <div className="form-group">
              <label>Select Test Case</label>
              <select
                value={selectedTestToMap}
                onChange={(e) => setSelectedTestToMap(e.target.value)}
              >
                <option value="">-- Select Test Case --</option>
                {testCases.map(tc => (
                  <option key={tc.id} value={tc.id}>{tc.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Coverage Type</label>
              <select value={coverageType} onChange={(e) => setCoverageType(e.target.value)}>
                <option value="full">Full Coverage</option>
                <option value="partial">Partial Coverage</option>
                <option value="exploratory">Exploratory</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowMapTestModal(false)}>Cancel</button>
              <button
                className="submit-btn"
                onClick={handleMapTest}
                disabled={!selectedTestToMap}
              >
                Link Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requirements;
