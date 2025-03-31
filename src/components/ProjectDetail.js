import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlus, faTimes, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [availableTestCases, setAvailableTestCases] = useState([]);
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchProjectDetails();
    fetchProjectTestCases();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/projects/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }
      
      const data = await response.json();
      setProject(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError('Failed to load project details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTestCases = async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects/${id}/test_cases`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch project test cases');
      }
      
      const data = await response.json();
      setTestCases(data);
    } catch (err) {
      console.error('Error fetching project test cases:', err);
      setError('Failed to load test cases. Please try again later.');
    }
  };

  const fetchAvailableTestCases = async () => {
    try {
      // Get all test cases
      const response = await fetch(`${API_URL}/api/tests/tree`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch available test cases');
      }
      
      const data = await response.json();
      
      // Flatten the tree structure to get all test cases
      const flattenTestCases = (cases, result = []) => {
        cases.forEach(testCase => {
          if (testCase.type === 'test') {
            result.push(testCase);
          }
          if (testCase.children && testCase.children.length > 0) {
            flattenTestCases(testCase.children, result);
          }
        });
        return result;
      };
      
      const allTestCases = flattenTestCases(data);
      
      // Filter out test cases that are already in the project
      const projectTestCaseIds = testCases.map(tc => tc.id);
      const available = allTestCases.filter(tc => !projectTestCaseIds.includes(tc.id));
      
      setAvailableTestCases(available);
    } catch (err) {
      console.error('Error fetching available test cases:', err);
      setError('Failed to load available test cases. Please try again later.');
    }
  };

  const handleAddTestCases = async () => {
    if (selectedTestCases.length === 0) {
      setError('Please select at least one test case to add');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/projects/${id}/test_cases`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedTestCases)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add test cases to project');
      }
      
      await fetchProjectTestCases();
      setSelectedTestCases([]);
      setShowAddModal(false);
      setError(null);
    } catch (err) {
      console.error('Error adding test cases to project:', err);
      setError('Failed to add test cases to project. Please try again.');
    }
  };

  const handleRemoveTestCase = async (testCaseId) => {
    try {
      const response = await fetch(`${API_URL}/api/projects/${id}/test_cases`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([testCaseId])
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove test case from project');
      }
      
      await fetchProjectTestCases();
      setError(null);
    } catch (err) {
      console.error('Error removing test case from project:', err);
      setError('Failed to remove test case from project. Please try again.');
    }
  };

  const handleOpenAddModal = () => {
    fetchAvailableTestCases();
    setShowAddModal(true);
  };

  const handleSelectTestCase = (testCaseId) => {
    if (selectedTestCases.includes(testCaseId)) {
      setSelectedTestCases(selectedTestCases.filter(id => id !== testCaseId));
    } else {
      setSelectedTestCases([...selectedTestCases, testCaseId]);
    }
  };

  const handleRunTestCase = (testCaseId) => {
    // Navigate to test case execution page
    navigate(`/test_cases/${testCaseId}`);
  };

  if (loading) {
    return <div className="loading">Loading project details...</div>;
  }

  if (!project) {
    return (
      <div className="project-detail-container">
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} /> Project not found
        </div>
        <button className="back-button" onClick={() => navigate('/projects')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      <div className="project-detail-header">
        <button className="back-button" onClick={() => navigate('/projects')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Projects
        </button>
        <h1>{project.name}</h1>
        <button className="add-test-cases-button" onClick={handleOpenAddModal}>
          <FontAwesomeIcon icon={faPlus} /> Add Test Cases
        </button>
      </div>
      
      {project.description && (
        <div className="project-description">
          <p>{project.description}</p>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="test-cases-section">
        <h2>Test Cases</h2>
        {testCases.length === 0 ? (
          <div className="no-test-cases">
            <p>No test cases have been added to this project yet.</p>
            <button className="add-test-cases-button" onClick={handleOpenAddModal}>
              <FontAwesomeIcon icon={faPlus} /> Add Test Cases
            </button>
          </div>
        ) : (
          <div className="test-cases-list">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {testCases.map(testCase => (
                  <tr key={testCase.id}>
                    <td>{testCase.name}</td>
                    <td>{testCase.description || 'No description'}</td>
                    <td>
                      <div className="test-case-actions">
                        <button 
                          className="action-button run"
                          onClick={() => handleRunTestCase(testCase.id)}
                          title="Run Test Case"
                        >
                          Run
                        </button>
                        <button 
                          className="action-button remove"
                          onClick={() => handleRemoveTestCase(testCase.id)}
                          title="Remove from Project"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Test Cases to Project</h2>
              <button className="close-button" onClick={() => setShowAddModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-body">
              {availableTestCases.length === 0 ? (
                <p>No available test cases to add. All test cases are already in this project.</p>
              ) : (
                <>
                  <p>Select test cases to add to this project:</p>
                  <div className="available-test-cases">
                    {availableTestCases.map(testCase => (
                      <div 
                        key={testCase.id} 
                        className={`test-case-item ${selectedTestCases.includes(testCase.id) ? 'selected' : ''}`}
                        onClick={() => handleSelectTestCase(testCase.id)}
                      >
                        <div className="test-case-checkbox">
                          {selectedTestCases.includes(testCase.id) && <FontAwesomeIcon icon={faCheck} />}
                        </div>
                        <div className="test-case-info">
                          <h4>{testCase.name}</h4>
                          <p>{testCase.description || 'No description'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className="add-button"
                onClick={handleAddTestCases}
                disabled={selectedTestCases.length === 0 || availableTestCases.length === 0}
              >
                Add Selected ({selectedTestCases.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
