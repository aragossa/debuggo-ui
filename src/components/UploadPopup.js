import React, { useState } from 'react';

const UploadPopup = ({ onClose, onSubmit }) => {
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // State to manage loading spinner and interactions

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    if (file) {
      setIsSubmitting(true); // Start the spinner and disable interactions
      onSubmit(file, () => {
        setIsSubmitting(false); // Stop the spinner and enable interactions after completion
      }); // Pass a callback to handle completion
    }
  };

  return (
    <div style={popupStyle}>
      <div style={popupContentStyle}>
        <div
          style={{
            ...dropAreaStyle,
            pointerEvents: isSubmitting ? 'none' : 'auto', // Disable pointer events when submitting
          }}
          onDrop={
            isSubmitting
              ? undefined
              : (e) => {
                  e.preventDefault();
                  setFile(e.dataTransfer.files[0]);
                }
          }
          onDragOver={isSubmitting ? undefined : (e) => e.preventDefault()}
        >
          {isSubmitting ? (
            <div style={spinnerStyle}>Loading...</div> // Display spinner when submitting
          ) : file ? (
            file.name
          ) : (
            'Drag and drop a file here or click to select a file'
          )}
          <input type="file" onChange={handleFileChange} style={fileInputStyle} disabled={isSubmitting} />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!file || isSubmitting}
          style={submitButtonStyle}
        >
          Submit
        </button>
        <button
          onClick={onClose}
          style={closeButtonStyle}
          disabled={isSubmitting} // Disable close button while submitting
        >
          Close
        </button>
      </div>
    </div>
  );
};


// Styles for popup and drag-drop area
const popupStyle = {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const popupContentStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const dropAreaStyle = {
  width: '300px',
  height: '150px',
  border: '2px dashed #ccc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
  cursor: 'pointer',
  position: 'relative',
};

const fileInputStyle = {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  opacity: '0',
  cursor: 'pointer',
};

const buttonStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '5px',
  fontWeight: 'bold',
  margin: '5px',
  cursor: 'pointer',
  outline: 'none',
  transition: 'all 0.3s ease',
};

const submitButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#4CAF50',
  color: 'white',
};

const closeButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#f44336',
  color: 'white',
};

// Hover styles in your CSS file or using onMouseEnter/onMouseLeave
const hoverEffect = {
  filter: 'brightness(90%)',
};

const spinnerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  fontSize: '20px',
};

export default UploadPopup;
