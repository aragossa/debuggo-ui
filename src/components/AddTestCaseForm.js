import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './AddTestCaseForm.css';

const AddTestCaseForm = ({ projectId, onTestCaseAdded, onClose }) => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  const [testCaseName, setTestCaseName] = useState('');
  const [testCaseDescription, setTestCaseDescription] = useState('');
  const [testCaseSteps, setTestCaseSteps] = useState([{ description: '', order: 0 }]);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEnvironmentTooltip, setShowEnvironmentTooltip] = useState(false);

  useEffect(() => {
    if (projectId && projectId !== 'all') {
      fetchEnvironments();
    }
  }, [projectId]);

  const fetchEnvironments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/environments`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch environments');
      }
      
      const data = await response.json();
      setEnvironments(data);
    } catch (error) {
      console.error('Error fetching environments:', error);
      setError('Failed to load environments. Please try again.');
    }
  };

  const handleAddStep = () => {
    setTestCaseSteps([
      ...testCaseSteps,
      { description: '', order: testCaseSteps.length }
    ]);
  };

  const handleRemoveStep = (index) => {
    const updatedSteps = testCaseSteps.filter((_, i) => i !== index);
    // Update order for remaining steps
    const reorderedSteps = updatedSteps.map((step, i) => ({
      ...step,
      order: i
    }));
    setTestCaseSteps(reorderedSteps);
  };

  const handleStepChange = (index, value) => {
    const updatedSteps = [...testCaseSteps];
    updatedSteps[index].description = value;
    setTestCaseSteps(updatedSteps);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!testCaseName.trim()) {
      setError('Test case name is required');
      return;
    }

    if (!selectedEnvironment && environments.length > 0) {
      setError('Please select an environment');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Combine the test case description and steps into a single description
      const stepsText = testCaseSteps
        .map((step, index) => step.description.trim() ? `Step ${index + 1}: ${step.description}` : null)
        .filter(Boolean)
        .join('\n\n');
      
      // Combine original description with steps
      const combinedDescription = testCaseDescription.trim() 
        ? `${testCaseDescription}\n\n${stepsText}` 
        : stepsText;

      const requestBody = {
        name: testCaseName,
        description: combinedDescription,
        project_id: projectId,
        environment_id: selectedEnvironment ? parseInt(selectedEnvironment) : null
      };

      const response = await fetch(`${API_URL}/api/create_test_case`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create test case');
      }

      const data = await response.json();
      onTestCaseAdded(data);
      onClose();
    } catch (error) {
      console.error('Error creating test case:', error);
      setError(error.message || 'Failed to create test case. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-test-case-form-container">
      <div className="add-test-case-form-header">
        <h2>Add New Test Case</h2>
        <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="testCaseName">Test Case Name *</label>
          <input
            id="testCaseName"
            type="text"
            value={testCaseName}
            onChange={(e) => setTestCaseName(e.target.value)}
            placeholder="Enter test case name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="testCaseDescription">Description</label>
          <textarea
            id="testCaseDescription"
            value={testCaseDescription}
            onChange={(e) => setTestCaseDescription(e.target.value)}
            placeholder="Enter test case description"
            rows={3}
          />
        </div>

        {environments.length > 0 && (
          <div className="form-group">
            <label htmlFor="environment">Environment *</label>
            <select
              id="environment"
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              required
            >
              <option value="">Select Environment</option>
              {environments.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
          </div>
        )}
        
        <div className="form-group">
          <label>
            Test Steps
            <div 
              className="info-icon"
              onMouseEnter={() => setShowEnvironmentTooltip(true)}
              onMouseLeave={() => setShowEnvironmentTooltip(false)}
            >
              <FontAwesomeIcon icon={faInfoCircle} />
              {showEnvironmentTooltip && (
                <div className="tooltip">
                  When you generate test steps, the system will use AI to create detailed steps based on your descriptions.
                  If login is needed, the system will automatically add login steps using environment variables.
                </div>
              )}
            </div>
          </label>
          {testCaseSteps.map((step, index) => (
            <div key={index} className="test-step-input">
              <textarea
                value={step.description}
                onChange={(e) => handleStepChange(index, e.target.value)}
                placeholder={`Step ${index + 1}: Describe what this step should do`}
                rows={2}
              />
              <button
                type="button"
                className="remove-step-button"
                onClick={() => handleRemoveStep(index)}
                disabled={testCaseSteps.length === 1}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="add-step-button"
            onClick={handleAddStep}
          >
            <FontAwesomeIcon icon={faPlus} /> Add Step
          </button>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Test Case'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTestCaseForm;
