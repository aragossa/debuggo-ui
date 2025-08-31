import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPlay, faClock } from '@fortawesome/free-solid-svg-icons';
import './RunningTestIndicator.css';

const RunningTestIndicator = ({ testCaseId, onRunningStateChange }) => {
  const [runningTests, setRunningTests] = useState([]);
  const [isCurrentTestRunning, setIsCurrentTestRunning] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;

  const fetchRunningTests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/running-tests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRunningTests(data.running_tests || []);
        
        // Check if current test case is running
        const currentTestRunning = data.running_tests.some(test => 
          test.test_case_id == testCaseId
        );
        setIsCurrentTestRunning(currentTestRunning);
        
        // Notify parent component
        if (onRunningStateChange) {
          onRunningStateChange(currentTestRunning);
        }
      }
    } catch (error) {
      console.error('Error fetching running tests:', error);
    }
  };

  useEffect(() => {
    fetchRunningTests();
    
    // Poll every 3 seconds
    const interval = setInterval(fetchRunningTests, 3000);
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [testCaseId]);

  if (runningTests.length === 0) {
    return null;
  }

  return (
    <div className="running-test-indicator">
      {isCurrentTestRunning && (
        <div className="current-test-running">
          <FontAwesomeIcon icon={faSpinner} className="spinning" />
          <span>Test is currently running...</span>
        </div>
      )}
      
      {runningTests.length > 0 && (
        <div className="running-tests-summary">
          <div className="running-tests-header">
            <FontAwesomeIcon icon={faPlay} />
            <span>{runningTests.length} test{runningTests.length > 1 ? 's' : ''} running</span>
          </div>
          
          <div className="running-tests-list">
            {runningTests.map((test, index) => (
              <div key={test.test_run_id || index} className="running-test-item">
                <div className="test-info">
                  <span className="test-name">{test.test_case_name}</span>
                  {test.execution_name && (
                    <span className="execution-name">in {test.execution_name}</span>
                  )}
                </div>
                <div className="test-timing">
                  <FontAwesomeIcon icon={faClock} />
                  <span>
                    {test.started_at ? 
                      `Started ${new Date(test.started_at).toLocaleTimeString()}` : 
                      'Starting...'
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RunningTestIndicator;
