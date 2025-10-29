import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faPlay, faClock, faStop, faCog } from '@fortawesome/free-solid-svg-icons';
import './StatusBar.css';

const StatusBar = () => {
  const [runningTests, setRunningTests] = useState([]);
  const [stopAllLoading, setStopAllLoading] = useState(false);
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
      }
    } catch (error) {
      console.error('Error fetching running tests:', error);
    }
  };

  const handleStopAllExecutions = async () => {
    if (runningTests.length === 0) {
      alert('No tests are currently running.');
      return;
    }

    const confirmStop = window.confirm(
      `Are you sure you want to stop all ${runningTests.length} running test(s)?`
    );

    if (!confirmStop) return;

    setStopAllLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/stop-all-tests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully stopped ${result.stopped_count} test execution(s).`);
        // Refresh running tests immediately
        fetchRunningTests();
      } else {
        const error = await response.json();
        alert(`Failed to stop test executions: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error stopping all test executions:', error);
      alert('Failed to stop test executions. Please try again.');
    } finally {
      setStopAllLoading(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manage body class for status bar padding
  useEffect(() => {
    if (runningTests.length > 0) {
      document.body.classList.add('status-bar-active');
    } else {
      document.body.classList.remove('status-bar-active');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('status-bar-active');
    };
  }, [runningTests.length]);

  if (runningTests.length === 0) {
    return null;
  }

  // Separate running tests and generating tests
  const executingTests = runningTests.filter(t => t.status === 'running');
  const generatingTests = runningTests.filter(t => t.status === 'generating');

  return (
    <div className="status-bar">
      <div className="status-bar-content">
        <div className="running-tests-info">
          <FontAwesomeIcon icon={faSpinner} className="spinning" />
          <span className="running-count">
            {executingTests.length > 0 && `${executingTests.length} test${executingTests.length > 1 ? 's' : ''} running`}
            {executingTests.length > 0 && generatingTests.length > 0 && ' • '}
            {generatingTests.length > 0 && `${generatingTests.length} generating`}
          </span>
          
          <div className="running-tests-details">
            {executingTests.map((test, index) => (
              <div key={test.test_run_id || index} className="running-test-summary">
                <FontAwesomeIcon icon={faPlay} className="activity-icon" />
                <span className="test-name">{test.test_case_name}</span>
                {test.execution_name && (
                  <span className="execution-name">({test.execution_name})</span>
                )}
                <span className="test-timing">
                  <FontAwesomeIcon icon={faClock} />
                  {test.started_at ? 
                    new Date(test.started_at).toLocaleTimeString() : 
                    'Starting...'
                  }
                </span>
              </div>
            ))}
            {generatingTests.map((test, index) => (
              <div key={`gen-${test.test_case_id || index}`} className="running-test-summary generating">
                <FontAwesomeIcon icon={faCog} className="activity-icon spinning" />
                <span className="test-name">{test.test_case_name}</span>
                <span className="generation-label">
                  {test.activity_type === 'ui_generation' ? 'Generating UI test steps...' : 'Generating API tests...'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <button 
          className="stop-all-btn"
          onClick={handleStopAllExecutions}
          disabled={stopAllLoading || runningTests.length === 0}
        >
          <FontAwesomeIcon 
            icon={stopAllLoading ? faSpinner : faStop} 
            className={stopAllLoading ? 'spinning' : ''} 
          />
          {stopAllLoading ? 'Stopping...' : 'Stop All Tests'}
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
