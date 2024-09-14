// App.js
import React, { useState, useEffect } from 'react';
import TestCaseTree from './components/TestCaseTree';
import TestCaseSteps from './components/TestCaseSteps';
import UploadPopup from './components/UploadPopup';
import TestResultPopup from './components/TestResultPopup'; // Import the new component
import './App.css';
import logo from './logo.png';

const App = () => {
  const [treeData, setTreeData] = useState([]);
  const [testCases, setTestCases] = useState({ test_steps: [], test_runs: [] });
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [uploadType, setUploadType] = useState(''); // 'UI' or 'API'
  const [testResult, setTestResult] = useState(null); // State for test result

  useEffect(() => {
    // Fetch data when component mounts
    fetchTreeData();
  }, []);

  const fetchTreeData = async () => {
    try {
      const response = await fetch('http://localhost:8000/get_tree');
      const data = await response.json();
      setTreeData(data);
    } catch (error) {
      console.error('Error fetching tree data:', error);
    }
  };

  const fetchTestCases = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/get_test_cases/${id}`);
      const data = await response.json();
      setTestCases(data); // Update the test cases based on the selected node
    } catch (error) {
      console.error('Error fetching test cases:', error);
    }
  };

  const handleNodeClick = (id) => {
    // Fetch the test steps for the clicked node
    fetchTestCases(id);
  };

  const handleRunClick = (testCaseId) => {
    console.log('Running test case:', testCaseId);

    fetch(`http://localhost:8000/run_test_case/${testCaseId}`, {
      method: 'POST',
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Test case run result:', data);
        setTestResult(data.result); // Set the test result to display the popup
      })
      .catch((error) => {
        console.error('Error running test case:', error);
        // Optionally set testResult to 'Failed' if there's an error
        setTestResult('Failed');
      });
  };

  const handleCloseTestResultPopup = () => {
    setTestResult(null); // Close the popup
  };

  const handleFileSubmit = (file, callback) => {
    console.log('File submitted:', file);

    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:8000/generate_test_cases_from_data', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('File successfully uploaded', data);
        setShowUploadPopup(false); // Close the popup after successful upload
        if (callback) callback(); // Stop the spinner
        window.location.reload(); // Refresh the page
        // Or use fetchTreeData(); to refresh data without page reload
        // fetchTreeData();
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        if (callback) callback(); // Stop the spinner even if there's an error
      });
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-title-container">
          <img src={logo} alt="Logo" className="logo" />
          <h1>AuroQA Test Management Platform</h1>
        </div>
        <div className="button-container">
          <button
            className="upload-button"
            onClick={() => {
              setUploadType('API');
              setShowUploadPopup(true);
            }}
          >
            Generate from file
          </button>
        </div>
      </header>
      <div className="sidebar">
        <TestCaseTree
          onNodeClick={handleNodeClick}
          onRunClick={handleRunClick}
        />
      </div>
      <div className="content">
        <TestCaseSteps
          test_steps={testCases.test_steps}
          test_runs={testCases.test_runs}
        />
        {showUploadPopup && (
          <UploadPopup
            uploadType={uploadType}
            onClose={() => setShowUploadPopup(false)}
            onSubmit={handleFileSubmit}
          />
        )}
        {testResult && (
          <TestResultPopup
            result={testResult}
            onClose={handleCloseTestResultPopup}
          />
        )}
      </div>
    </div>
  );
};

export default App;
