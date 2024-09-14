// TestCaseSteps.js
import React, { useState } from 'react';
import './TestCaseSteps.css';

const TestCaseSteps = ({ test_steps, test_runs }) => {
  const [expandedRuns, setExpandedRuns] = useState({});

  const toggleRunDetails = (runId) => {
    setExpandedRuns((prevState) => ({
      ...prevState,
      [runId]: !prevState[runId],
    }));
  };

  return (
    <div className="test-steps-container">
      <h3>Test Steps</h3>
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
