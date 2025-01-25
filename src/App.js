import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import TestCaseTree from './components/TestCaseTree';
import TestCaseSteps from './components/TestCaseSteps';
import UploadPopup from './components/UploadPopup';
import TestResultPopup from './components/TestResultPopup';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './App.css';
import logo from './logo.png';

const MainApp = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders, isAuthenticated, logout } = useAuth();
  const [treeData, setTreeData] = useState([]);
  const [testCase, setTestCase] = useState(null);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTreeData();
    }
  }, [isAuthenticated]);

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

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo-title-container">
          <img src={logo} alt="Logo" className="logo" />
          <h1>AuroQA Test Management Platform</h1>
        </div>
        <div className="header-actions">
          <button
            className="generate-from-file-button"
            onClick={() => setShowUploadPopup(true)}
          >
            Generate from file
          </button>
          <button className="logout-button" onClick={logout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </button>
        </div>
      </header>
      <div className="main-content">
        <div className="sidebar">
          <TestCaseTree
            treeData={treeData}
            onNodeClick={handleNodeClick}
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

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  );
};

export default App;
