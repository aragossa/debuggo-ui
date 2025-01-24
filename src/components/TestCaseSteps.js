// TestCaseSteps.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faMagicWandSparkles } from '@fortawesome/free-solid-svg-icons';
import './TestCaseSteps.css';

const TestCaseSteps = ({ test_steps, test_runs, testCaseId, test_name, test_description, updated_at }) => {
  const [expandedRuns, setExpandedRuns] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;

  const toggleRunDetails = (runId) => {
    setExpandedRuns((prevState) => ({
      ...prevState,
      [runId]: !prevState[runId],
    }));
  };

  const handleRunClick = async () => {
    if (isRunning || !testCaseId) return;
    
    setIsRunning(true);
    try {
      const response = await fetch(`${API_URL}/api/run_test_case/${testCaseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to run test case');
      }
      
      const result = await response.json();
      // Optionally handle the result or trigger a refresh of test runs
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
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate steps');
      }
      
      const result = await response.json();
      console.log('Steps generation result:', result);
      
    } catch (error) {
      console.error('Error generating steps:', error);
    }
  };

  return (
    <div className="test-steps-container">
      {testCaseId && (
        <div className="test-case-details">
          <h2 className="test-name">{test_name}</h2>
          <p className="test-description">{test_description}</p>
          <p className="updated-at">Last updated: {new Date(updated_at).toLocaleString()}</p>
        </div>
      )}
      <div className="test-steps-header">
        <h3>Test Steps</h3>
        <div className="button-group">
          <button 
            onClick={handleGenerateSteps}
            className="generate-steps-btn"
            disabled={!testCaseId}
            title="Generate Steps">
            <FontAwesomeIcon icon={faMagicWandSparkles} /> Generate Steps
          </button>
          <button 
            onClick={handleRunClick} 
            className={`run-button ${isRunning ? 'running' : ''}`}
            disabled={isRunning || !testCaseId}
          >
            <FontAwesomeIcon icon={faPlay} className={isRunning ? 'fa-spin' : ''} />
            {isRunning ? 'Running...' : 'Run Test'}
          </button>
        </div>
      </div>
      <div className="test-steps-flow">
        {test_steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="test-step-box">
              <div className="test-step-name">{step.name}</div>
              <div className="test-step-description">{step.description}</div>

              {step.expected_result && (
                <div className="test-step-expected">
                  <strong>Expected Result: </strong>
                  {step.expected_result}
                </div>
              )}
            </div>
            {/* Remove the separate arrow div */}
          </React.Fragment>
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
