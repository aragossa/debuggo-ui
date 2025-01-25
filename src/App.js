// App.js
import React, { useState, useEffect } from 'react';
import TestCaseTree from './components/TestCaseTree';
import TestCaseSteps from './components/TestCaseSteps';
import UploadPopup from './components/UploadPopup';
import TestResultPopup from './components/TestResultPopup'; // Import the new component
import './App.css';
import logo from './logo.png';

const App = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const [treeData, setTreeData] = useState([]);
  const [testCase, setTestCase] = useState(null);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [uploadType, setUploadType] = useState(''); // 'UI' or 'API'
  const [testResult, setTestResult] = useState(null); // State for test result
  const [selectedTestId, setSelectedTestId] = useState(null);

  useEffect(() => {
    // Fetch data when component mounts
    fetchTreeData();
  }, []);

  const fetchTreeData = async () => {
    try {
      // const response = await fetch(`${API_URL}/get_tree`);
      const response = await fetch(`${API_URL}/api/get_tree`);
      console.log('api url')
      console.log(API_URL)
      const data = await response.json();
      setTreeData(data);
    } catch (error) {
      console.error('Error fetching tree data:', error);
    }
  };

  const fetchTestCases = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/get_test_cases/${id}`);
      const data = await response.json();
      setTestCase(data); // Update the test cases based on the selected node
    } catch (error) {
      console.error('Error fetching test cases:', error);
    }
  };

  const handleNodeClick = (id) => {
    // Fetch the test steps for the clicked node
    setSelectedTestId(id);
    fetchTestCases(id);
  };

  const handleRunClick = (testCaseId) => {
    console.log('Running test case:', testCaseId);

    fetch(`${API_URL}/api/run_test_case/${testCaseId}`, {
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

  const handleFileSubmit = async (file, callback) => {
    try {
      console.log('File submitted to handleFileSubmit:', file);
      console.log('File size:', file?.size);
      console.log('File type:', file?.type);

      if (!file) {
        console.error('No file provided');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      // Debug FormData contents
      for (let pair of formData.entries()) {
        console.log('FormData entry:', pair[0], pair[1]);
        console.log('FormData file details:', pair[1] instanceof File ? {
          name: pair[1].name,
          size: pair[1].size,
          type: pair[1].type
        } : 'Not a file');
      }

      const response = await fetch(`${API_URL}/api/generate_test_cases_from_data`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);
      
      setShowUploadPopup(false);
      if (callback) callback();
      window.location.reload();
    } catch (error) {
      console.error('Error uploading file:', error);
      if (callback) callback();
    }
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
          treeData={treeData}
          onNodeClick={handleNodeClick}
          onRunClick={handleRunClick}
          selectedTestId={selectedTestId}
        />
      </div>
      <div className="content">
        {testCase && (
          <TestCaseSteps
            test_steps={testCase.test_steps}
            test_runs={testCase.test_runs}
            testCaseId={selectedTestId}
            test_name={testCase.test_name}
            test_description={testCase.test_description}
            updated_at={testCase.updated_at}
          />
        )}
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
