import React, { useState, useEffect } from 'react';
import TestCaseTree from './TestCaseTree';
import TestCaseSteps from './TestCaseSteps';
import UploadPopup from './UploadPopup';
import TestResultPopup from './TestResultPopup';
import Environments from './Environments';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faFlask, faCog } from '@fortawesome/free-solid-svg-icons';
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
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(() => {
    // Try to get the selected project ID from localStorage
    return localStorage.getItem('selectedProjectId') || 'all';
  });
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetchProjects();
    if (selectedProject && selectedProject !== 'all') {
      fetchTreeDataForProject(selectedProject);
    } else {
      fetchTreeData();
    }
    // If we have a selected test ID in state, fetch its details
    if (selectedTestId) {
      fetchTestCase(selectedTestId);
    }
  }, []);

  useEffect(() => {
    // When selected project changes, fetch test cases for that project
    if (selectedProject && selectedProject !== 'all') {
      fetchTreeDataForProject(selectedProject);
    } else {
      // If 'all' is selected, fetch all test cases
      fetchTreeData();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error('Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const fetchTreeDataForProject = async (projectId) => {
    try {
      setTreeError(null);
      const response = await fetch(`${API_URL}/api/projects/${projectId}/test_tree`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTreeData(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch project test tree');
      }
    } catch (error) {
      console.error('Error fetching project test tree:', error);
      setTreeError(error.message || 'Failed to load test cases for this project. Please try again later.');
      setTreeData([]);
    }
  };

  const fetchTreeData = async () => {
    try {
      setTreeError(null);
      const response = await fetch(`${API_URL}/api/tests/tree`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setTreeData(data);
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

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    localStorage.setItem('selectedProjectId', projectId);
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
      
      // Add the project_id to the form data if a project is selected
      if (selectedProject && selectedProject !== 'all') {
        formData.append('project_id', selectedProject);
      }

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
      
      // Refresh the tree data based on the selected project
      if (selectedProject && selectedProject !== 'all') {
        fetchTreeDataForProject(selectedProject);
      } else {
        fetchTreeData();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error.message);
    }
  };

  const handleTestCaseDeleted = (deletedTestId) => {
    // If the deleted test case is the currently selected one, clear the selection
    if (deletedTestId === selectedTestId) {
      setSelectedTestId(null);
      setTestCase(null);
      localStorage.removeItem('selectedTestId');
    }
    
    // Refresh the tree data based on the selected project
    if (selectedProject && selectedProject !== 'all') {
      fetchTreeDataForProject(selectedProject);
    } else {
      fetchTreeData();
    }
  };

  const handleCloseTestResultPopup = () => {
    setTestResult(null);
  };

  const isProjectSelected = selectedProject && selectedProject !== 'all';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="project-selector-container">
          <label htmlFor="project-selector">Project:</label>
          <select
            id="project-selector"
            value={selectedProject}
            onChange={handleProjectChange}
            disabled={isLoadingProjects}
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="generate-button-container" 
             onMouseEnter={() => !isProjectSelected && setShowTooltip(true)} 
             onMouseLeave={() => setShowTooltip(false)}>
          <button
            className={`generate-from-file-button ${!isProjectSelected ? 'disabled' : ''}`}
            onClick={() => isProjectSelected && setShowUploadPopup(true)}
            disabled={!isProjectSelected}
          >
            Generate from file
          </button>
          {!isProjectSelected && showTooltip && (
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} /> Please select a project
            </div>
          )}
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="tree-container">
          <TestCaseTree 
            treeData={treeData} 
            onNodeClick={handleNodeClick} 
            selectedTestId={selectedTestId}
            error={treeError}
            onTestCaseDeleted={handleTestCaseDeleted}
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
              projectId={selectedProject}
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
          onClose={() => setTestResult(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
