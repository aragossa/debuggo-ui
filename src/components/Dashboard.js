import React, { useState, useEffect } from 'react';
import TestCaseTree from './TestCaseTree';
import TestCaseSteps from './TestCaseSteps';
import UploadPopup from './UploadPopup';
import TestResultPopup from './TestResultPopup';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  const [treeData, setTreeData] = useState([]);
  const [treeError, setTreeError] = useState(null);
  const [testCase, setTestCase] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(() => {
    // Try to get the selected test ID from localStorage
    return localStorage.getItem('selectedTestId');
  });
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchTreeData();
    // If we have a selected test ID in state, fetch its details
    if (selectedTestId) {
      fetchTestCase(selectedTestId);
    }
  }, []);

  const fetchTreeData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/tests/tree`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTreeData(data);
        setTreeError(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch tree data');
      }
    } catch (error) {
      console.error('Error fetching tree data:', error);
      setTreeError(error.message || 'Failed to load test cases. Please try again later.');
      setTreeData([]);
    }
  };

  const handleNodeClick = async (id) => {
    setSelectedTestId(id);
    // Store the selected ID in localStorage
    localStorage.setItem('selectedTestId', id);
    fetchTestCase(id);
  };

  const fetchTestCase = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/get_test_cases/${id}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTestCase(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch test case');
      }
    } catch (error) {
      console.error('Error fetching test case:', error);
      setTestCase(null);
    }
  };

  const handleFileSubmit = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get auth headers without Content-Type
      const headers = getAuthHeaders(false);

      const response = await fetch(`${API_URL}/api/generate_test_cases_from_data`, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('File upload successful:', data);
      
      setShowUploadPopup(false);
      fetchTreeData(); // Refresh the tree data
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error.message);
    }
  };

  const handleCloseTestResultPopup = () => {
    setTestResult(null);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Test Management Dashboard</h1>
        <button
          className="generate-from-file-button"
          onClick={() => setShowUploadPopup(true)}
        >
          Generate from file
        </button>
      </div>
      <div className="dashboard-content">
        <div className="tree-container">
          <TestCaseTree 
            treeData={treeData} 
            onNodeClick={handleNodeClick}
            selectedTestId={selectedTestId}
          />
        </div>
        <div className="content-container">
          {testCase && (
            <TestCaseSteps
              test_steps={testCase.test_steps}
              test_runs={testCase.test_runs}
              testCaseId={selectedTestId}
              test_name={testCase.test_name}
              test_description={testCase.test_description}
              updated_at={testCase.updated_at}
              onTestResult={setTestResult}
            />
          )}
        </div>
      </div>
      {showUploadPopup && (
        <UploadPopup
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
  );
};

export default Dashboard;
