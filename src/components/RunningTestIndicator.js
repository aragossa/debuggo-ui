import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPlay, faClock } from '@fortawesome/free-solid-svg-icons';
import { useRunningTests } from '../utils/polling';
import './RunningTestIndicator.css';

const RunningTestIndicator = ({ testCaseId, onRunningStateChange }) => {
  const { data: runningTests, loaded } = useRunningTests();
  const isCurrentTestRunning = runningTests.some(test =>
    String(test.test_case_id) === String(testCaseId)
  );

  // Notify parent component after every poll
  useEffect(() => {
    if (loaded && onRunningStateChange) {
      onRunningStateChange(isCurrentTestRunning);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningTests, loaded, testCaseId]);

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
