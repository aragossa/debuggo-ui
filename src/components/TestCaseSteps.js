// TestCaseSteps.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faMagicWandSparkles, faGripVertical, faInfoCircle, faSignInAlt, faChevronUp, faChevronDown, faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './TestCaseSteps.css';

const STEP_ACTIONS = [
  'click',
  'type',
  'select',
  'hover',
  'wait',
  'assert',
  'scroll',
  'clear',
  'navigate',
  'press_key'
];

const TestCaseSteps = ({ 
  test_steps, 
  test_runs, 
  testCaseId, 
  test_name, 
  test_description, 
  updated_at, 
  projectId 
}) => {
  const [expandedRuns, setExpandedRuns] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [stepValues, setStepValues] = useState({});
  const [steps, setSteps] = useState([]);
  const [draggedStep, setDraggedStep] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [showProjectTooltip, setShowProjectTooltip] = useState(false);
  const [showGenerateTooltip, setShowGenerateTooltip] = useState(false);
  const [showRunTooltip, setShowRunTooltip] = useState(false);
  const [showEnvTooltip, setShowEnvTooltip] = useState(false);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [showRunConfirmModal, setShowRunConfirmModal] = useState(false);
  const [showAddEnvironmentModal, setShowAddEnvironmentModal] = useState(false);
  const [showEditEnvironmentModal, setShowEditEnvironmentModal] = useState(false);
  const [showEnvironmentDropdown, setShowEnvironmentDropdown] = useState(false);
  const [newEnvironment, setNewEnvironment] = useState({
    name: '',
    base_url: '',
    login: '',
    password: ''
  });
  const [editingEnvironment, setEditingEnvironment] = useState(null);
  const [showDeleteStepModal, setShowDeleteStepModal] = useState(false);
  const [stepToDelete, setStepToDelete] = useState(null);
  const environmentDropdownRef = React.useRef(null);
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    // Add click outside listener to close the dropdown
    function handleClickOutside(event) {
      if (environmentDropdownRef.current && !environmentDropdownRef.current.contains(event.target)) {
        setShowEnvironmentDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (test_steps && Array.isArray(test_steps)) {
      setSteps(test_steps);
      // Initialize stepValues with values from test_steps
      const initialValues = {};
      test_steps.forEach(step => {
        if (step.action === 'type' && step.value) {
          initialValues[step.id] = step.value;
        }
      });
      setStepValues(initialValues);
    }
  }, [test_steps]);

  useEffect(() => {
    if (projectId && projectId !== 'all') {
      fetchEnvironments();
    } else {
      setEnvironments([]);
      setSelectedEnvironment('');
    }
  }, [projectId]);

  const fetchEnvironments = async () => {
    if (!projectId || projectId === 'all') return;
    
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/environments`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch environments');
      }
      
      const data = await response.json();
      setEnvironments(data);
      
      // Reset selected environment if it doesn't belong to the current project
      if (selectedEnvironment) {
        const environmentExists = data.some(env => env.id === parseInt(selectedEnvironment));
        if (!environmentExists) {
          setSelectedEnvironment('');
        }
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
    }
  };

  const hasTestSteps = steps && steps.length > 0;
  const isProjectSelected = projectId && projectId !== 'all';

  const refreshTestCase = async () => {
    try {
      const response = await fetch(`${API_URL}/api/get_test_cases/${testCaseId}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch updated test case');
      }
      const data = await response.json();
      setSteps(data.test_steps);
    } catch (error) {
      console.error('Error refreshing test case:', error);
    }
  };

  const toggleRunDetails = (runId) => {
    setExpandedRuns((prevState) => ({
      ...prevState,
      [runId]: !prevState[runId],
    }));
  };

  const handleEnvironmentChange = (environmentId) => {
    setSelectedEnvironment(environmentId);
    setShowEnvironmentDropdown(false);
  };

  const handleAddNewEnvironmentClick = () => {
    setNewEnvironment({
      name: '',
      base_url: '',
      login: '',
      password: ''
    });
    setShowAddEnvironmentModal(true);
    setShowEnvironmentDropdown(false);
  };

  const handleEditEnvironmentClick = (environment, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    setEditingEnvironment(environment);
    setNewEnvironment({
      name: environment.name,
      base_url: environment.base_url,
      login: environment.login || '',
      password: environment.password || ''
    });
    setShowEditEnvironmentModal(true);
  };

  const handleUpdateEnvironment = async (e) => {
    e.preventDefault();
    
    if (!newEnvironment.name || !newEnvironment.base_url) {
      alert('Name and Base URL are required fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/environments/${editingEnvironment.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEnvironment)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      // Reset form and close modal
      setNewEnvironment({
        name: '',
        base_url: '',
        login: '',
        password: ''
      });
      setShowEditEnvironmentModal(false);
      setEditingEnvironment(null);

      // Refresh environments
      await fetchEnvironments();
      
    } catch (error) {
      console.error('Error updating environment:', error);
      alert('Failed to update environment: ' + error.message);
    }
  };

  const handleNewEnvironmentChange = (e) => {
    const { name, value } = e.target;
    setNewEnvironment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEnvironment = async (e) => {
    e.preventDefault(); // Prevent form submission
    
    // Validate form
    if (!newEnvironment.name || !newEnvironment.base_url) {
      alert('Name and Base URL are required fields');
      return;
    }

    try {
      console.log('Creating environment:', newEnvironment);
      console.log('Project ID:', projectId);
      
      const response = await fetch(`${API_URL}/api/projects/${projectId}/environments`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEnvironment)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Created environment:', data);

      // Reset form and close modal
      setNewEnvironment({
        name: '',
        base_url: '',
        login: '',
        password: ''
      });
      setShowAddEnvironmentModal(false);

      // Refresh environments
      await fetchEnvironments();
      
      // Select the newly created environment
      if (data && data.id) {
        setSelectedEnvironment(data.id.toString());
      }
    } catch (error) {
      console.error('Error creating environment:', error);
      alert('Failed to create environment: ' + error.message);
    }
  };

  const handleRunClick = async () => {
    if (isRunning || !testCaseId || !hasTestSteps) return;
    
    // If there are environments available but none is selected, show confirmation modal
    if (environments.length > 0 && !selectedEnvironment) {
      setShowRunConfirmModal(true);
      return;
    }
    
    await runTest();
  };

  const handleRunConfirm = async () => {
    setShowRunConfirmModal(false);
    await runTest();
  };

  const runTest = async () => {
    setIsRunning(true);
    try {
      const requestBody = {};
      
      // If an environment is selected, include it in the request
      if (selectedEnvironment) {
        requestBody.environment_id = selectedEnvironment;
      }
      
      const response = await fetch(`${API_URL}/api/run_test_case/${testCaseId}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
      });
      
      if (!response.ok) {
        throw new Error('Failed to run test case');
      }
      
      const result = await response.json();
      console.log('Test run result:', result);
      
      // Refresh the test case to show the latest test run
      await refreshTestCase();
      
    } catch (error) {
      console.error('Error running test case:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerateSteps = async () => {
    if (!isProjectSelected) {
      setShowProjectTooltip(true);
      return;
    }
    
    // Check if an environment is selected
    if (!selectedEnvironment) {
      alert('Please select an environment before generating test steps');
      return;
    }
    
    if (test_steps && test_steps.length > 0) {
      setShowConfirmModal(true);
      return;
    }
    
    await generateSteps(false);
  };

  const handleConfirmGenerate = async () => {
    setShowConfirmModal(false);
    await generateSteps(true);
  };

  const generateSteps = async (confirm) => {
    if (!testCaseId || isGeneratingSteps || !isProjectSelected || !selectedEnvironment) return;
    
    setIsGeneratingSteps(true);
    try {
      const endpoint = confirm 
        ? `${API_URL}/api/confirm_generate_steps/${testCaseId}` 
        : `${API_URL}/api/generate_steps/${testCaseId}`;
      
      const requestBody = {
        environment_id: parseInt(selectedEnvironment)
      };
      
      // If projectId exists and is not 'all', add it to the request body
      if (projectId && projectId !== 'all') {
        requestBody.project_id = projectId;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate steps');
      }
      
      const data = await response.json();
      
      // Don't set isGeneratingSteps to false here as the backend process is still running
      // The status check interval will update it when the process completes
      
      alert('Test step generation has started. This may take a few minutes to complete.');
    } catch (error) {
      console.error('Error generating steps:', error);
      alert('Failed to generate steps. Please try again.');
      setIsGeneratingSteps(false);
    }
  };
  
  const handleActionChange = async (stepId, newAction) => {
    try {
      // Update steps state immediately for better UI responsiveness
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.id === stepId 
            ? { ...step, action: newAction }
            : step
        )
      );

      const response = await fetch(`${API_URL}/api/update_test_step/${stepId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: newAction })
      });

      if (!response.ok) {
        throw new Error('Failed to update test step action');
      }
    } catch (error) {
      console.error('Error updating test step action:', error);
      await refreshTestCase();
    }
  };

  const handleValueChange = async (stepId, value, currentAction) => {
    setStepValues(prev => ({
      ...prev,
      [stepId]: value
    }));

    try {
      const response = await fetch(`${API_URL}/api/update_test_step/${stepId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          value: value,
          action: currentAction 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update test step value');
      }
    } catch (error) {
      console.error('Error updating test step value:', error);
    }
  };

  const handleDragStart = (e, step) => {
    setDraggedStep(step);
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedStep(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const dragBox = e.currentTarget;
    dragBox.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e, targetStep) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedStep || draggedStep.id === targetStep.id) return;

    const oldIndex = steps.findIndex(s => s.id === draggedStep.id);
    const newIndex = steps.findIndex(s => s.id === targetStep.id);
    
    const newSteps = [...steps];
    newSteps.splice(oldIndex, 1);
    newSteps.splice(newIndex, 0, draggedStep);

    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      step_order: index
    }));

    setSteps(updatedSteps);

    try {
      const response = await fetch(`${API_URL}/api/update_step_orders`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_case_id: testCaseId,
          step_orders: updatedSteps.map(step => ({
            id: step.id,
            step_order: step.step_order
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update step orders');
      }
    } catch (error) {
      console.error('Error updating step orders:', error);
      setSteps(test_steps);
    }
  };

  const handleDeleteStepClick = (step) => {
    setStepToDelete(step);
    setShowDeleteStepModal(true);
  };

  const handleConfirmDeleteStep = async () => {
    if (!stepToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/api/delete_test_step/${stepToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete test step');
      }
      
      // Remove the step from the local state
      setSteps(prevSteps => prevSteps.filter(step => step.id !== stepToDelete.id));
      
      setShowDeleteStepModal(false);
      setStepToDelete(null);
    } catch (error) {
      console.error('Error deleting test step:', error);
      alert('Failed to delete test step. Please try again.');
    }
  };

  return (
    <div className="test-steps-container">
      <div className="test-case-header">
        <h2>{test_name}</h2>
        <p>{test_description}</p>
        <p className="last-updated">Last updated: {updated_at}</p>
      </div>

      <div className="test-steps-header">
        <h3>Test Steps</h3>
        <div className="test-steps-actions">
          <div className="generate-button-container"
               onMouseEnter={() => {
                 if (!isProjectSelected) {
                   setShowProjectTooltip(true);
                 } else if (!selectedEnvironment) {
                   setShowEnvTooltip(true);
                 }
               }}
               onMouseLeave={() => {
                 setShowProjectTooltip(false);
                 setShowEnvTooltip(false);
               }}>
            <button
              className={`generate-button ${(isRunning || isGeneratingSteps || !isProjectSelected || !selectedEnvironment) ? 'disabled' : ''}`}
              onClick={handleGenerateSteps}
              disabled={isRunning || isGeneratingSteps || !isProjectSelected || !selectedEnvironment}
            >
              <FontAwesomeIcon icon={faMagicWandSparkles} className={isGeneratingSteps ? 'fa-spin' : ''} />
              {isGeneratingSteps ? 'Generating...' : 'Generate Steps'}
            </button>
            {!isProjectSelected && showProjectTooltip && (
              <div className="tooltip">
                <FontAwesomeIcon icon={faInfoCircle} /> Please select a project first
              </div>
            )}
            {isProjectSelected && !selectedEnvironment && showEnvTooltip && (
              <div className="tooltip">
                <FontAwesomeIcon icon={faInfoCircle} /> Please select an environment
              </div>
            )}
          </div>
          
          {/* Custom Environment Selector */}
          {isProjectSelected && (
            <div className="environment-selector-container" ref={environmentDropdownRef}>
              <div 
                className="environment-selector-button"
                onClick={() => setShowEnvironmentDropdown(!showEnvironmentDropdown)}
                disabled={isRunning || isGeneratingSteps}
              >
                {selectedEnvironment ? 
                  environments.find(env => env.id.toString() === selectedEnvironment)?.name : 
                  'Select Environment *'}
                <FontAwesomeIcon icon={showEnvironmentDropdown ? faChevronUp : faChevronDown} />
              </div>
              
              {showEnvironmentDropdown && (
                <div className="environment-dropdown">
                  <div 
                    className="environment-dropdown-item"
                    onClick={() => handleEnvironmentChange('')}
                  >
                    <div className="environment-item-content">
                      <span className="environment-name">No Environment</span>
                      <span className="environment-description">Run with default settings</span>
                    </div>
                  </div>
                  
                  {environments.map(env => (
                    <div 
                      key={env.id} 
                      className={`environment-dropdown-item ${selectedEnvironment === env.id.toString() ? 'selected' : ''}`}
                      onClick={() => handleEnvironmentChange(env.id.toString())}
                    >
                      <div className="environment-item-content">
                        <span className="environment-name">{env.name}</span>
                        <span className="environment-url">{env.base_url}</span>
                        {env.login && <span className="environment-login">Login: {env.login}</span>}
                      </div>
                      <button 
                        className="environment-edit-button"
                        onClick={(e) => handleEditEnvironmentClick(env, e)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </div>
                  ))}
                  
                  <div 
                    className="environment-dropdown-item add-new"
                    onClick={handleAddNewEnvironmentClick}
                  >
                    <div className="environment-item-content">
                      <span className="environment-name">
                        <FontAwesomeIcon icon={faPlus} /> Add New Environment
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="run-button-container"
               onMouseEnter={() => {
                 if (isGeneratingSteps) {
                   setShowRunTooltip(true);
                 } else if (!hasTestSteps) {
                   setShowRunTooltip(true);
                 }
               }}
               onMouseLeave={() => {
                 setShowRunTooltip(false);
               }}>
            <button
              className={`run-button ${(!hasTestSteps || isRunning || isGeneratingSteps) ? 'disabled' : ''}`}
              onClick={handleRunClick}
              disabled={!hasTestSteps || isRunning || isGeneratingSteps}
            >
              <FontAwesomeIcon icon={faPlay} className={isRunning ? 'fa-spin' : ''} />
              {isRunning ? 'Running...' : 'Run Test'}
            </button>
            {isGeneratingSteps && showRunTooltip && (
              <div className="tooltip">
                <FontAwesomeIcon icon={faInfoCircle} /> Cannot run test while generating steps
              </div>
            )}
            {!hasTestSteps && !isGeneratingSteps && showRunTooltip && (
              <div className="tooltip">
                <FontAwesomeIcon icon={faInfoCircle} /> There are no test steps yet, please generate them or add manually
              </div>
            )}
          </div>  
        </div>
      </div>

      {/* Confirmation Modal for Generate Steps */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Step Generation</h3>
            <p>This test case already has steps. Generating new steps will delete all existing steps. Are you sure you want to continue?</p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleConfirmGenerate} className="modal-button confirm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Running Test without Environment */}
      {showRunConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Run Test Without Environment</h3>
            <p>You have not selected an environment. The test will run with default settings. Would you like to continue or select an environment?</p>
            <div className="modal-actions">
              <button onClick={() => setShowRunConfirmModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleRunConfirm} className="modal-button confirm">Run Without Environment</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Step */}
      {showDeleteStepModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete Step</h3>
            <p>Are you sure you want to delete this step? This action cannot be undone.</p>
            <p><strong>Step:</strong> {stepToDelete?.description}</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteStepModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleConfirmDeleteStep} className="modal-button delete">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Environment Modal */}
      {showAddEnvironmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Environment</h3>
            <form onSubmit={handleAddEnvironment}>
              <div className="form-group">
                <label>Name:</label>
                <input type="text" name="name" value={newEnvironment.name} onChange={handleNewEnvironmentChange} required />
              </div>
              <div className="form-group">
                <label>Base URL:</label>
                <input type="text" name="base_url" value={newEnvironment.base_url} onChange={handleNewEnvironmentChange} required />
              </div>
              <div className="form-group">
                <label>Login:</label>
                <input type="text" name="login" value={newEnvironment.login} onChange={handleNewEnvironmentChange} />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input type="password" name="password" value={newEnvironment.password} onChange={handleNewEnvironmentChange} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddEnvironmentModal(false)} className="modal-button cancel">Cancel</button>
                <button type="submit" className="modal-button confirm">Add Environment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Environment Modal */}
      {showEditEnvironmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Environment</h3>
            <form onSubmit={handleUpdateEnvironment}>
              <div className="form-group">
                <label>Name:</label>
                <input type="text" name="name" value={newEnvironment.name} onChange={handleNewEnvironmentChange} required />
              </div>
              <div className="form-group">
                <label>Base URL:</label>
                <input type="text" name="base_url" value={newEnvironment.base_url} onChange={handleNewEnvironmentChange} required />
              </div>
              <div className="form-group">
                <label>Login:</label>
                <input type="text" name="login" value={newEnvironment.login} onChange={handleNewEnvironmentChange} />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input type="password" name="password" value={newEnvironment.password} onChange={handleNewEnvironmentChange} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditEnvironmentModal(false)} className="modal-button cancel">Cancel</button>
                <button type="submit" className="modal-button confirm">Update Environment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="test-steps-flow">
        {steps && steps.map((step) => (
          <div
            key={step.id}
            className="test-step-box"
            draggable="true"
            onDragStart={(e) => handleDragStart(e, step)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, step)}
          >
            <div className="test-step-drag-handle">
              <FontAwesomeIcon icon={faGripVertical} />
            </div>
            <div className="test-step-description">{step.description}</div>
            <div className="test-step-footer">
              <select 
                value={step.action || ''}
                onChange={(e) => handleActionChange(step.id, e.target.value)}
                className="action-select"
              >
                <option value="">Select Action</option>
                {STEP_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action.replace('_', ' ')}
                  </option>
                ))}
              </select>
              {(step.action === 'type' || step.action === 'press_key') && (
                <input
                  type="text"
                  className="action-input"
                  placeholder={step.action === 'type' ? 'Text to type...' : 'Key to press...'}
                  value={stepValues[step.id] || step.value || ''}
                  onChange={(e) => handleValueChange(step.id, e.target.value, step.action)}
                />
              )}
              <button 
                className="delete-step-button"
                onClick={() => handleDeleteStepClick(step)}
                title="Delete step"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Test Results Table */}
      <h3>Test Results</h3>
      <table className="test-results-table">
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Duration (s)</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {test_runs.map((run) => (
            <tr key={run.id}>
              <td>{run.id}</td>
              <td>{run.duration !== null ? run.duration.toFixed(2) : 'N/A'}</td>
              <td className={run.result.toLowerCase()}>{run.result}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Test Runs</h3>
      <div className="test-runs-list">
        {test_runs.map((run) => (
          <div key={run.id} className={`test-run-item ${run.result.toLowerCase()}`}>
            <div className="test-run-header" onClick={() => toggleRunDetails(run.id)}>
              <span className="test-run-id">Run ID: {run.id}</span>
              <span className={`test-run-result ${run.result.toLowerCase()}`}>
                {run.result}
              </span>
              <button className="toggle-details-btn">
                {expandedRuns[run.id] ? '▲' : '▼'}
              </button>
            </div>
            {expandedRuns[run.id] && (
              <div className="test-run-details">
                <div>
                  <strong>Date:</strong> {run.run_date}
                </div>
                <div>
                  <strong>Duration:</strong> {run.duration !== null ? run.duration.toFixed(2) : 'N/A'} seconds
                </div>
                {run.exception && (
                  <div>
                    <strong>Exception:</strong> {run.exception}
                  </div>
                )}
                {run.stdout && (
                  <div className="test-run-output">
                    <strong>Output:</strong>
                    <pre>{run.stdout}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestCaseSteps;
