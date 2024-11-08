// TestResultPopup.js
import React, { useEffect, useState } from 'react';
import './TestResultPopup.css';

// Import Font Awesome icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const TestResultPopup = ({ result, onClose }) => {
  const isPassed = result === 'Passed';
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Start the fade-out after 1 second
    const timer = setTimeout(() => {
      setVisible(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Once visibility is false, wait for the CSS transition before calling onClose
    if (!visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 500); // Match this to the CSS transition duration

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <div className={`popup-overlay ${visible ? 'visible' : 'hidden'}`}>
      <div className={`popup-content ${visible ? '' : 'fade-out'}`}>
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
