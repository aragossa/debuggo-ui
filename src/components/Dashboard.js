import React, { useState, useEffect, useRef } from 'react';
import TestCaseTree from './TestCaseTree';
import TestCaseSteps from './TestCaseSteps';
import TestExecutionsTree from './TestExecutionsTree';
import UploadPopup from './UploadPopup';
import TestResultPopup from './TestResultPopup';
import Environments from './Environments';
import ApiSchemaUpload from './ApiSchemaUpload';
import ConflictNotifications from './ConflictNotifications';
import ConflictPopup from './ConflictPopup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faFlask, faCog, faFileImport, faChevronDown, faChevronUp, faFolderOpen, faPlay, faFileCode, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
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
    return localStorage.getItem('selectedProjectId') || null;
  });
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState('testCases');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isTreeVisible, setIsTreeVisible] = useState(true);
  const projectDropdownRef = useRef(null);

  useEffect(() => {
    fetchProjects(); // This will handle project selection and tree data loading
    // If we have a selected test ID in state, fetch its details
    if (selectedTestId) {
      fetchTestCase(selectedTestId);
    }
    
    // Close project dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Only fetch tree data when selectedProject changes from user interaction
    // Don't fetch during initial load (handled by fetchProjects)
    if (selectedProject && projects.length > 0) {
      const projectExists = projects.find(p => p.id === selectedProject);
      if (projectExists) {
        fetchTreeDataForProject(selectedProject);
      }
    }
  }, [selectedProject, projects]);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        
        // Always auto-select the first available project if we have projects
        if (data.length > 0) {
          let projectToSelect = null;
          let shouldUpdateState = false;
          
          // Check if current selected project exists in the fetched list
          if (selectedProject && data.find(p => p.id === selectedProject)) {
            projectToSelect = selectedProject; // Keep current selection if valid
          } else {
            // Select first project if no valid selection
            projectToSelect = data[0].id;
            shouldUpdateState = true;
          }
          
          // Update state and localStorage if needed
          if (shouldUpdateState) {
            setSelectedProject(projectToSelect);
            localStorage.setItem('selectedProjectId', projectToSelect);
          }
          
          // Load test tree for the selected project
          if (projectToSelect) {
            fetchTreeDataForProject(projectToSelect);
          }
        } else {
          // No projects available, clear selection
          setSelectedProject(null);
          localStorage.removeItem('selectedProjectId');
          setTreeData([]);
        }
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
      } else if (response.status === 404) {
        // Project not found, clear invalid selection and reload projects
        setSelectedProject(null);
        localStorage.removeItem('selectedProjectId');
        fetchProjects(); // Reload projects and auto-select first one
        return;
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


  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    localStorage.setItem('selectedProjectId', projectId);
    
    // Clear the selected test case when changing projects
    setSelectedTestId(null);
    setTestCase(null);
    localStorage.removeItem('selectedTestId');
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
      
      // Add the project_id to the form data (project is always selected now)
      if (selectedProject) {
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
      if (selectedProject) {
        fetchTreeDataForProject(selectedProject);
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
    } else if (deletedTestId === null) {
      // If null is passed, just refresh the tree without clearing the selection
      // This happens when a group is created, renamed, or a test case is moved
    }
    
    // Refresh the tree data based on the selected project
    if (selectedProject) {
      fetchTreeDataForProject(selectedProject);
    }
  };


  const isProjectSelected = selectedProject;

  const noProjects = !projects || projects.length === 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="project-selector-container" ref={projectDropdownRef}>
          <div className="project-selector-label">Project:</div>
          <div 
            className="project-selector-button"
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
          >
            <FontAwesomeIcon icon={faFolderOpen} className="project-icon" />
            <span>
              {isLoadingProjects ? 'Loading...' : 
                projects.find(p => p.id === selectedProject)?.name || 'Select Project'}
            </span>
            <FontAwesomeIcon 
              icon={showProjectDropdown ? faChevronUp : faChevronDown} 
              className="dropdown-icon" 
            />
          </div>
          
          {showProjectDropdown && (
            <div className="project-dropdown">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className={`project-option ${selectedProject === project.id ? 'selected' : ''}`}
                  onClick={() => {
                    handleProjectChange({ target: { value: project.id } });
                    setShowProjectDropdown(false);
                  }}
                >
                  <span>{project.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {noProjects && (
          <div className="dashboard-no-projects" style={{ marginTop: 10, color: '#b00', fontWeight: 500 }}>
            No projects created
          </div>
        )}
        <div className="generate-button-container" 
             onMouseEnter={() => !isProjectSelected && setShowTooltip(true)} 
             onMouseLeave={() => setShowTooltip(false)}>
          <button
            className={`generate-from-file-button ${!isProjectSelected ? 'disabled' : ''}`}
            onClick={() => isProjectSelected && setShowUploadPopup(true)}
            disabled={!isProjectSelected}
          >
            <FontAwesomeIcon icon={faFileImport} /> Generate from File
          </button>
          {!isProjectSelected && showTooltip && (
            <div className="tooltip">
              <FontAwesomeIcon icon={faInfoCircle} /> Please select a project
            </div>
          )}
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'testCases' ? 'active' : ''}`}
            onClick={() => setActiveTab('testCases')}
          >
            <FontAwesomeIcon icon={faFlask} /> Test Cases
          </button>
          <button 
            className={`tab-button ${activeTab === 'testExecutions' ? 'active' : ''}`}
            onClick={() => setActiveTab('testExecutions')}
          >
            <FontAwesomeIcon icon={faPlay} /> Test Executions
          </button>
          <button 
            className={`tab-button ${activeTab === 'environments' ? 'active' : ''}`}
            onClick={() => setActiveTab('environments')}
          >
            <FontAwesomeIcon icon={faCog} /> Environments
          </button>
          <button 
            className={`tab-button ${activeTab === 'apiSchemas' ? 'active' : ''}`}
            onClick={() => setActiveTab('apiSchemas')}
          >
            <FontAwesomeIcon icon={faFileCode} /> API Schemas
          </button>
          <button 
            className={`tab-button ${activeTab === 'conflicts' ? 'active' : ''}`}
            onClick={() => setActiveTab('conflicts')}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} /> Conflicts
          </button>
        </div>
        
        {activeTab === 'testCases' ? (
          <div className="dashboard-main">
            {isTreeVisible && (
              <div className="tree-container">
                {treeError && treeError !== 'Project not found' ? (
                  <div className="error-message">
                    {treeError}
                  </div>
                ) : (
                  <TestCaseTree 
                    treeData={treeData} 
                    onNodeClick={handleNodeClick} 
                    selectedTestId={selectedTestId}
                    error={treeError}
                    onTestCaseDeleted={handleTestCaseDeleted}
                    projectId={selectedProject}
                    onToggleVisibility={setIsTreeVisible}
                  />
                )}
              </div>
            )}
            <div className={`content-container ${!isTreeVisible ? 'full-width' : ''}`}>
              {!isTreeVisible && (
                <button className="show-tree-btn" onClick={() => setIsTreeVisible(true)}>
                  Show Test Cases
                </button>
              )}
              {testCase ? (
                <TestCaseSteps
                  test_steps={testCase.test_steps}
                  test_runs={testCase.test_runs}
                  testCaseId={selectedTestId}
                  test_name={testCase.test_name}
                  test_description={testCase.test_description}
                  test_type={testCase.test_type}
                  requires_preconditions={testCase.requires_preconditions}
                  updated_at={testCase.updated_at}
                  steps_generation_start_time={testCase.steps_generation_start_time}
                  steps_generation_end_time={testCase.steps_generation_end_time}
                  onTestResult={setTestResult}
                  onTestCaseUpdate={(name, description, updated_at, requires_preconditions) => {
                    setTestCase(prev => ({
                      ...prev,
                      test_name: name,
                      test_description: description,
                      updated_at: updated_at,
                      requires_preconditions: requires_preconditions
                    }));
                  }}
                  projectId={selectedProject}
                />
              ) : (
                <div className="no-test-selected">
                  <div className="empty-state">
                    <FontAwesomeIcon icon={faInfoCircle} size="2x" />
                    <h3>No Test Case Selected</h3>
                    <p>Select a test case from the tree to view its details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'testExecutions' ? (
          <div className="test-executions-tab-container">
            <TestExecutionsTree selectedProjectId={selectedProject} />
          </div>
        ) : activeTab === 'environments' ? (
          <div className="environments-tab-container">
            <Environments projectId={selectedProject} />
          </div>
        ) : activeTab === 'apiSchemas' ? (
          <div className="api-schemas-tab-container">
            <ApiSchemaUpload projectId={selectedProject} />
          </div>
        ) : activeTab === 'conflicts' ? (
          <div className="conflicts-tab-container">
            <ConflictNotifications />
          </div>
        ) : null}
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
      
      {/* Conflict notification popup - appears automatically when conflicts are detected */}
      <ConflictPopup />
    </div>
  );
};

export default Dashboard;
