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
  const [testCase, setTestCase] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchTreeData();
  }, []);

  const fetchTreeData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/get_tree`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTreeData(data);
      }
    } catch (error) {
      console.error('Error fetching tree data:', error);
    }
  };

  const handleNodeClick = async (id) => {
    setSelectedTestId(id);
    try {
      const response = await fetch(`${API_URL}/api/get_test_cases/${id}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTestCase(data);
      }
    } catch (error) {
      console.error('Error fetching test case:', error);
    }
  };

  const handleFileSubmit = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/generate_test_cases_from_data`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();
      setShowUploadPopup(false);
      fetchTreeData(); // Refresh the tree data
    } catch (error) {
      console.error('Error uploading file:', error);
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
            data={treeData} 
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
