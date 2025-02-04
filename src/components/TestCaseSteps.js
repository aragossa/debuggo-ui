// TestCaseSteps.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faMagicWandSparkles, faGripVertical } from '@fortawesome/free-solid-svg-icons';
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

const TestCaseSteps = ({ test_steps, test_runs, testCaseId, test_name, test_description, updated_at }) => {
  const [expandedRuns, setExpandedRuns] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [stepValues, setStepValues] = useState({});
  const [steps, setSteps] = useState([]);
  const [draggedStep, setDraggedStep] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();

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

  const hasTestSteps = steps && steps.length > 0;

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

  const handleRunClick = async () => {
    if (isRunning || !testCaseId || !hasTestSteps) return;
    
    setIsRunning(true);
    try {
      const response = await fetch(`${API_URL}/api/run_test_case/${testCaseId}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to run test case');
      }
      
      const result = await response.json();
      console.log('Test run result:', result);
      
    } catch (error) {
      console.error('Error running test case:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerateSteps = async () => {
    if (!testCaseId) return;
    
    try {
      const response = await fetch(`${API_URL}/api/generate_steps/${testCaseId}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate steps');
      }
      
      const result = await response.json();
      console.log('Steps generation result:', result);
      await refreshTestCase();
      
    } catch (error) {
      console.error('Error generating steps:', error);
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
        // Revert steps state if update failed
        await refreshTestCase();
      }
    } catch (error) {
      console.error('Error updating test step action:', error);
      // Revert steps state if there was an error
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
          <button
            className="generate-steps-button"
            onClick={handleGenerateSteps}
            disabled={isRunning}
          >
            <FontAwesomeIcon icon={faMagicWandSparkles} /> Generate Steps
          </button>
          <button
            className={`run-button ${(!hasTestSteps || isRunning) ? 'disabled' : ''}`}
            onClick={handleRunClick}
            disabled={!hasTestSteps || isRunning}
          >
            <FontAwesomeIcon icon={faPlay} className={isRunning ? 'fa-spin' : ''} />
            {isRunning ? 'Running...' : 'Run Test'}
          </button>
        </div>
      </div>

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
                {run.stderr && (
                  <div className="test-run-error">
                    <strong>Error Output:</strong>
                    <pre>{run.stderr}</pre>
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
