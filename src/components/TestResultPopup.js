// TestResultPopup.js
import React from 'react';
import './TestResultPopup.css';

// Import Font Awesome icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const TestResultPopup = ({ result, onClose }) => {
  const isPassed = result === 'Passed';

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <FontAwesomeIcon
          icon={isPassed ? faCheckCircle : faExclamationCircle}
          className={`result-icon ${isPassed ? 'passed' : 'failed'}`}
        />
        <h2>{isPassed ? 'Test Passed' : 'Test Failed'}</h2>
        <button onClick={onClose} className="close-popup-button">
          Close
        </button>
      </div>
    </div>
  );
};

export default TestResultPopup;
