import React, { useState, useEffect, useRef } from 'react';
import TestCaseTree from './TestCaseTree';
import TestCaseSteps from './TestCaseSteps';
import TestSuites from './TestSuites';
import UploadPopup from './UploadPopup';
import TestResultPopup from './TestResultPopup';
import Environments from './Environments';
import ApiSchemaUpload from './ApiSchemaUpload';
import ConflictNotifications from './ConflictNotifications';
import ConflictPopup from './ConflictPopup';
import PlaceholderHelp from './PlaceholderHelp';
import MetricsDashboard from './MetricsDashboard';
import ExecutionPlans from './ExecutionPlans';
import Requirements from './Requirements';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faFlask, faCog, faChevronDown, faChevronUp, faFolderOpen, faFileCode, faExclamationTriangle, faQuestionCircle, faFolder, faChartLine, faClipboardList, faClipboardCheck, faBars, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
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
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('dashboardActiveTab') || 'testCases';
  });
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isTreeVisible, setIsTreeVisible] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    localStorage.setItem('dashboardActiveTab', activeTab);
  }, [activeTab]);

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
        // Map API response to expected format
        if (data.status === 'success' && data.data) {
          const testCaseData = data.data.test_case;
          const steps = data.data.steps || [];

          // Transform the data to match the expected format
          const formattedTestCase = {
            test_name: testCaseData.name,
            test_description: testCaseData.description,
            test_type: testCaseData.test_type || 'ui',  // Use test_type column (ui/api), not type column (test/group)
            test_steps: steps,
            test_runs: [],
            updated_at: testCaseData.updated_at || new Date().toISOString(),
            steps_generation_start_time: testCaseData.steps_generation_start_time,
            steps_generation_end_time: testCaseData.steps_generation_end_time
          };

          setTestCase(formattedTestCase);
        } else {
          setTestCase(data);
        }
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
      {/* Sidebar Navigation */}
      {/* Sidebar Navigation */}
      <div className={`dashboard-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isSidebarCollapsed && <div className="sidebar-logo">Debuggo</div>}
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <FontAwesomeIcon icon={isSidebarCollapsed ? faAngleRight : faAngleLeft} />
          </button>
        </div>
        <div className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'testCases' ? 'active' : ''}`}
            onClick={() => setActiveTab('testCases')}
          >
            <FontAwesomeIcon icon={faFlask} className="nav-icon" />
            <span>Test Cases</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'environments' ? 'active' : ''}`}
            onClick={() => setActiveTab('environments')}
          >
            <FontAwesomeIcon icon={faCog} className="nav-icon" />
            <span>Environments</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'apiSchemas' ? 'active' : ''}`}
            onClick={() => setActiveTab('apiSchemas')}
          >
            <FontAwesomeIcon icon={faFileCode} className="nav-icon" />
            <span>API Schemas</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'suites' ? 'active' : ''}`}
            onClick={() => setActiveTab('suites')}
          >
            <FontAwesomeIcon icon={faFolder} className="nav-icon" />
            <span>Test Suites</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'conflicts' ? 'active' : ''}`}
            onClick={() => setActiveTab('conflicts')}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} className="nav-icon" />
            <span>Conflicts</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'executionPlans' ? 'active' : ''}`}
            onClick={() => setActiveTab('executionPlans')}
          >
            <FontAwesomeIcon icon={faClipboardList} className="nav-icon" />
            <span>Execution Plans</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <FontAwesomeIcon icon={faChartLine} className="nav-icon" />
            <span>Metrics</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'requirements' ? 'active' : ''}`}
            onClick={() => setActiveTab('requirements')}
          >
            <FontAwesomeIcon icon={faClipboardCheck} className="nav-icon" />
            <span>Requirements</span>
          </button>
        </div>
        <div className="sidebar-footer">
          <button
            className={`nav-item ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
          >
            <FontAwesomeIcon icon={faQuestionCircle} className="nav-icon" />
            <span>Help</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-main-area">
        <div className="dashboard-header">
          <div className="project-selector-container" ref={projectDropdownRef}>
            <div className="project-selector-label">Current Project:</div>
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
        </div>

        <div className="dashboard-content">
          {activeTab === 'testCases' ? (
            <div className="dashboard-main">
              {isTreeVisible && (
                <div className={`tree-container ${isTreeVisible ? 'visible' : ''}`}>
                  {treeError && treeError !== 'Project not found' ? (
                    <div className="error-message">
                      {treeError}
                    </div>
                  ) : (
                    <TestCaseTree
                      treeData={treeData}
                      onNodeClick={(id) => {
                        handleNodeClick(id);
                        // Auto-close tree on mobile after selection
                        if (window.innerWidth <= 768) setIsTreeVisible(false);
                      }}
                      selectedTestId={selectedTestId}
                      error={treeError}
                      onTestCaseDeleted={handleTestCaseDeleted}
                      projectId={selectedProject}
                      onToggleVisibility={setIsTreeVisible}
                      onGenerateFromFile={() => setShowUploadPopup(true)}
                    />
                  )}
                </div>
              )}
              {isTreeVisible && window.innerWidth <= 768 && (
                <div
                  className="mobile-tree-overlay"
                  onClick={() => setIsTreeVisible(false)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    zIndex: 45
                  }}
                />
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
                    updated_at={testCase.updated_at}
                    steps_generation_start_time={testCase.steps_generation_start_time}
                    steps_generation_end_time={testCase.steps_generation_end_time}
                    onTestResult={setTestResult}
                    onTestCaseUpdate={(name, description, updated_at) => {
                      setTestCase(prev => ({
                        ...prev,
                        test_name: name,
                        test_description: description,
                        updated_at: updated_at
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
          ) : activeTab === 'environments' ? (
            <div className="environments-tab-container">
              <Environments projectId={selectedProject} />
            </div>
          ) : activeTab === 'apiSchemas' ? (
            <div className="api-schemas-tab-container">
              <ApiSchemaUpload projectId={selectedProject} />
            </div>
          ) : activeTab === 'suites' ? (
            <div className="suites-tab-container">
              <TestSuites projectId={selectedProject} />
            </div>
          ) : activeTab === 'conflicts' ? (
            <div className="conflicts-tab-container">
              <ConflictNotifications />
            </div>
          ) : activeTab === 'executionPlans' ? (
            <div className="execution-plans-tab-container">
              <ExecutionPlans projectId={selectedProject} />
            </div>
          ) : activeTab === 'metrics' ? (
            <div className="metrics-tab-container">
              <MetricsDashboard />
            </div>
          ) : activeTab === 'requirements' ? (
            <div className="requirements-tab-container">
              <Requirements projectId={selectedProject} />
            </div>
          ) : activeTab === 'help' ? (
            <div className="help-tab-container">
              <PlaceholderHelp />
            </div>
          ) : null}
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

      {/* Conflict notification popup - appears automatically when conflicts are detected */}
      <ConflictPopup />
    </div>
  );
};

export default Dashboard;
