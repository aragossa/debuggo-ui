import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ConflictPopup.css';

const ConflictPopup = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  const [conflicts, setConflicts] = useState([]);
  const [currentConflict, setCurrentConflict] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Poll for new conflicts every 5 seconds
    const pollInterval = setInterval(() => {
      fetchPendingConflicts();
    }, 5000);

    // Initial fetch
    fetchPendingConflicts();

    return () => clearInterval(pollInterval);
  }, []);

  const fetchPendingConflicts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/conflict-notifications/pending`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        const notifications = data.notifications || [];
        console.log('Fetched conflicts:', notifications.length, notifications);
        setConflicts(notifications);
        
        // Show popup if there are new conflicts and popup is not already shown
        if (notifications.length > 0 && !showPopup) {
          console.log('Showing popup for conflict:', notifications[0]);
          setCurrentConflict(notifications[0]); // Show first conflict
          setShowPopup(true);
        }
      }
    } catch (error) {
      console.error('Error fetching conflicts:', error);
    }
  };

  const handleApprove = async () => {
    if (!currentConflict) return;

    try {
      const response = await fetch(
        `${API_URL}/api/conflict-notifications/${currentConflict.id}/approve`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        // Remove from list and close popup
        const updatedConflicts = conflicts.filter(c => c.id !== currentConflict.id);
        setConflicts(updatedConflicts);
        
        // Show next conflict if any
        if (updatedConflicts.length > 0) {
          setCurrentConflict(updatedConflicts[0]);
        } else {
          setShowPopup(false);
          setCurrentConflict(null);
        }
        
        setShowDetails(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to approve conflict'}`);
      }
    } catch (error) {
      console.error('Error approving conflict:', error);
      alert('Failed to approve conflict resolution');
    }
  };

  const handleReject = async () => {
    if (!currentConflict) return;

    if (!window.confirm('Are you sure you want to cancel test generation for this test case?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/conflict-notifications/${currentConflict.id}/reject`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        // Remove from list and close popup
        const updatedConflicts = conflicts.filter(c => c.id !== currentConflict.id);
        setConflicts(updatedConflicts);
        
        // Show next conflict if any
        if (updatedConflicts.length > 0) {
          setCurrentConflict(updatedConflicts[0]);
        } else {
          setShowPopup(false);
          setCurrentConflict(null);
        }
        
        setShowDetails(false);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to reject conflict'}`);
      }
    } catch (error) {
      console.error('Error rejecting conflict:', error);
      alert('Failed to reject conflict resolution');
    }
  };

  const handleClose = () => {
    setShowPopup(false);
    setShowDetails(false);
  };

  if (!showPopup || !currentConflict) {
    return null;
  }

  return (
    <div className="conflict-popup-overlay">
      <div className="conflict-popup">
        <div className="conflict-popup-header">
          <div className="conflict-popup-title">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>API Conflict Detected</h2>
            {conflicts.length > 1 && (
              <span className="conflict-popup-count">{conflicts.length} conflicts</span>
            )}
          </div>
          <button className="conflict-popup-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="conflict-popup-body">
          <div className="conflict-popup-test-info">
            <h3>{currentConflict.test_case_name}</h3>
            <div className="conflict-popup-badges">
              <span className="conflict-popup-badge step">Step {currentConflict.step_number}</span>
              <span className="conflict-popup-badge type">{currentConflict.conflict_type}</span>
            </div>
          </div>

          <div className="conflict-popup-summary">
            <p><strong>Issue:</strong> {currentConflict.conflict_description}</p>
          </div>

          <div className="conflict-popup-comparison">
            <div className="conflict-popup-expected">
              <h4>📖 Expected</h4>
              <div className="conflict-popup-status">Status: {currentConflict.expected_status}</div>
            </div>
            <div className="conflict-popup-arrow">→</div>
            <div className="conflict-popup-actual">
              <h4>🔍 Actual</h4>
              <div className="conflict-popup-status actual">Status: {currentConflict.actual_status}</div>
            </div>
          </div>

          {showDetails && (
            <div className="conflict-popup-details">
              <div className="conflict-popup-section">
                <h4>Request Details</h4>
                <div className="conflict-popup-code">
                  <div><strong>Method:</strong> {currentConflict.request?.method}</div>
                  <div><strong>Endpoint:</strong> {currentConflict.request?.endpoint}</div>
                  {currentConflict.request?.body && (
                    <div>
                      <strong>Body:</strong>
                      <pre>{JSON.stringify(currentConflict.request.body, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="conflict-popup-section">
                <h4>Actual Response</h4>
                <pre className="conflict-popup-code">
                  {JSON.stringify(currentConflict.actual_response, null, 2)}
                </pre>
              </div>

              {currentConflict.suggested_resolution && (
                <div className="conflict-popup-resolution">
                  <h4>💡 Suggested Resolution</h4>
                  <p>{currentConflict.suggested_resolution}</p>
                  <div className="conflict-popup-corrected">
                    <strong>Corrected Expected Status:</strong> {currentConflict.corrected_expected_status}
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            className="conflict-popup-toggle-details"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        <div className="conflict-popup-actions">
          <button className="conflict-popup-btn approve" onClick={handleApprove}>
            <i className="fas fa-check"></i>
            Apply & Continue
          </button>
          <button className="conflict-popup-btn reject" onClick={handleReject}>
            <i className="fas fa-times"></i>
            Cancel Generation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictPopup;
