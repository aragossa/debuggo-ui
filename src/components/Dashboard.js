import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useAuth } from '../context/AuthContext';
import {
  FlaskConical,
  Settings,
  FileJson,
  Folder,
  AlertTriangle,
  ClipboardList,
  BarChart2,
  ClipboardCheck,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import './Dashboard.css';
import './DashboardPages.css';

const Dashboard = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders, user } = useAuth();
  const [treeData, setTreeData] = useState([]);
  const [treeError, setTreeError] = useState(null);
  const [testCase, setTestCase] = useState(null);
  const [selectedTestId, setSelectedTestId] = useState(() => {
    return localStorage.getItem('selectedTestId');
  });
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(() => {
    return localStorage.getItem('selectedProjectId') || null;
  });
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('dashboardActiveTab') || 'testCases';
  });
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [isTreeVisible, setIsTreeVisible] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Global sidebar (icon strip)
  const [isContextSidebarOpen, setIsContextSidebarOpen] = useState(true); // Context sidebar (Tree)
  const projectDropdownRef = useRef(null);

  useEffect(() => {
    fetchProjects();
    if (selectedTestId) {
      fetchTestCase(selectedTestId);
    }

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

        if (data.length > 0) {
          let projectToSelect = null;
          let shouldUpdateState = false;

          if (selectedProject && data.find(p => p.id === selectedProject)) {
            projectToSelect = selectedProject;
          } else {
            projectToSelect = data[0].id;
            shouldUpdateState = true;
          }

          if (shouldUpdateState) {
            setSelectedProject(projectToSelect);
            localStorage.setItem('selectedProjectId', projectToSelect);
          }

          if (projectToSelect) {
            fetchTreeDataForProject(projectToSelect);
          }
        } else {
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
        setSelectedProject(null);
        localStorage.removeItem('selectedProjectId');
        fetchProjects();
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
    setSelectedTestId(null);
    setTestCase(null);
    localStorage.removeItem('selectedTestId');
  };

  // Stable identity: TestCaseSteps restarts its polling when this prop changes.
  // localStorage always mirrors selectedTestId, so it tells whether the missing
  // test is still the selected one.
  const handleTestCaseNotFound = useCallback((missingTestId) => {
    if (localStorage.getItem('selectedTestId') !== String(missingTestId)) return;
    setSelectedTestId(null);
    setTestCase(null);
    localStorage.removeItem('selectedTestId');
  }, []);

  const handleNodeClick = async (id) => {
    setSelectedTestId(id);
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
        if (data.status === 'success' && data.data) {
          const testCaseData = data.data.test_case;
          const steps = data.data.steps || [];

          const formattedTestCase = {
            test_name: testCaseData.name,
            test_description: testCaseData.description,
            test_type: testCaseData.test_type || 'ui',
            test_steps: steps,
            test_runs: [],
            updated_at: testCaseData.updated_at || new Date().toISOString(),
            steps_generation_start_time: testCaseData.steps_generation_start_time,
            steps_generation_end_time: testCaseData.steps_generation_end_time
          };

          setTestCase(formattedTestCase);
        } else if (data.status === 'error') {
          // The backend answers 200 with status "error" for a missing test case
          setTestCase(null);
          handleTestCaseNotFound(id);
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
      if (selectedProject) {
        formData.append('project_id', selectedProject);
      }
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
      if (selectedProject) {
        fetchTreeDataForProject(selectedProject);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error.message);
    }
  };

  const handleTestCaseDeleted = (deletedTestId) => {
    if (deletedTestId !== null && String(deletedTestId) === String(selectedTestId)) {
      setSelectedTestId(null);
      setTestCase(null);
      localStorage.removeItem('selectedTestId');
    } else if (deletedTestId === null) {
      // Refresh only
    }
    if (selectedProject) {
      fetchTreeDataForProject(selectedProject);
    }
  };

  const noProjects = !projects || projects.length === 0;

  return (
    <div className="dashboard-container">
      {/* 1. Global Sidebar (Slim) */}
      <div className={`global-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">D</div>
        </div>
        <div className="global-nav">
          <button
            className={`nav-item ${activeTab === 'testCases' ? 'active' : ''}`}
            onClick={() => setActiveTab('testCases')}
            title="Test Cases"
          >
            <FlaskConical className="nav-icon" size={18} />
            {!isSidebarCollapsed && <span>Test Cases</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'environments' ? 'active' : ''}`}
            onClick={() => setActiveTab('environments')}
            title="Environments"
          >
            <Settings className="nav-icon" size={18} />
            {!isSidebarCollapsed && <span>Environments</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'apiSchemas' ? 'active' : ''}`}
            onClick={() => setActiveTab('apiSchemas')}
            title="API Schemas"
          >
            <FileJson className="nav-icon" size={18} />
            {!isSidebarCollapsed && <span>API Schemas</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'suites' ? 'active' : ''}`}
            onClick={() => setActiveTab('suites')}
            title="Test Suites"
          >
            <Folder className="nav-icon" size={18} />
            {!isSidebarCollapsed && <span>Test Suites</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'conflicts' ? 'active' : ''}`}
            onClick={() => setActiveTab('conflicts')}
            title="Conflicts"
          >
            <AlertTriangle className="nav-icon" size={18} />
            {!isSidebarCollapsed && <span>Conflicts</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'executionPlans' ? 'active' : ''}`}
            onClick={() => setActiveTab('executionPlans')}
            title="Execution Plans"
          >
            <ClipboardList className="nav-icon" size={18} />
            {!isSidebarCollapsed && <span>Execution Plans</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
            title="Metrics"
          >
            <BarChart2 className="nav-icon" size={18} />
            {!isSidebarCollapsed && <span>Metrics</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'requirements' ? 'active' : ''}`}
            onClick={() => setActiveTab('requirements')}
            title="Requirements"
          >
            <ClipboardCheck className="nav-icon" size={18} />
            {!isSidebarCollapsed && <span>Requirements</span>}
          </button>
        </div>
        <div className="sidebar-footer">
          <button
            className={`nav-item ${activeTab === 'help' ? 'active' : ''}`}
            onClick={() => setActiveTab('help')}
            title="Help"
          >
            <HelpCircle className="nav-icon" size={18} />
          </button>
        </div>
      </div>

      {/* 2. Context Sidebar (Test Tree) - Only active for 'testCases' */}
      {activeTab === 'testCases' && isContextSidebarOpen && (
        <div className="context-sidebar">
          {/* Context Header (Project Selector) */}
          <div className="context-header">
            <div className="project-selector-container" ref={projectDropdownRef}>
              <div
                className="project-selector-button"
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              >
                <FolderOpen size={16} className="text-gray-500 mr-2" />
                <span className="font-medium text-sm text-gray-700 truncate">
                  {isLoadingProjects ? 'Loading...' :
                    projects.find(p => p.id === selectedProject)?.name || 'Select Project'}
                </span>
                <ChevronDown size={14} className="ml-auto text-gray-400" />
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

            <button
              className="context-header-collapse-btn"
              onClick={() => setIsContextSidebarOpen(false)}
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          {/* Tree Content */}
          <div className="context-content">
            {noProjects ? (
              <div className="p-4 text-sm text-red-500">No projects created</div>
            ) : (
              <div className="tree-wrapper">
                {treeError && treeError !== 'Project not found' ? (
                  <div className="error-message p-3 text-xs">{treeError}</div>
                ) : (
                  <TestCaseTree
                    treeData={treeData}
                    onNodeClick={(id) => {
                      handleNodeClick(id);
                      if (window.innerWidth <= 768) setIsContextSidebarOpen(false);
                    }}
                    selectedTestId={selectedTestId}
                    error={treeError}
                    onTestCaseDeleted={handleTestCaseDeleted}
                    projectId={selectedProject}
                    onToggleVisibility={() => { }}
                    onGenerateFromFile={() => setShowUploadPopup(true)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Collapse Toggle for Context Sidebar */}

        </div>
      )}

      {/* 2.1 Re-open button for context sidebar */}
      {activeTab === 'testCases' && !isContextSidebarOpen && (
        <div className="context-sidebar-collapsed">
          <button
            className="context-expand-btn"
            onClick={() => setIsContextSidebarOpen(true)}
            title="Expand Sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="main-content-area">
        {activeTab === 'testCases' ? (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {/* No Header here anymore, it's in the sidebar or specific views */}
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
                onTestCaseNotFound={handleTestCaseNotFound}
                onTestCaseUpdate={(name, description, updated_at) => {
                  setTestCase(prev => ({
                    ...prev,
                    test_name: name,
                    test_description: description,
                    updated_at: updated_at
                  }));
                }}
                projectId={selectedProject}
                user={user}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FlaskConical size={18} className="mb-4 opacity-20" />
                <p>Select a test case to view details</p>
              </div>
            )}
          </div>
        ) : activeTab === 'environments' ? (
          <div className="tab-scrollable-container dash-page">
            <Environments projectId={selectedProject} />
          </div>
        ) : activeTab === 'apiSchemas' ? (
          <div className="tab-scrollable-container dash-page">
            <ApiSchemaUpload projectId={selectedProject} onTestsGenerated={() => fetchTreeDataForProject(selectedProject)} />
          </div>
        ) : activeTab === 'suites' ? (
          <div className="tab-scrollable-container dash-page">
            <TestSuites projectId={selectedProject} />
          </div>
        ) : activeTab === 'conflicts' ? (
          <div className="tab-scrollable-container dash-page">
            <ConflictNotifications />
          </div>
        ) : activeTab === 'executionPlans' ? (
          <div className="tab-scrollable-container dash-page">
            <ExecutionPlans projectId={selectedProject} />
          </div>
        ) : activeTab === 'metrics' ? (
          <div className="tab-scrollable-container dash-page">
            <MetricsDashboard />
          </div>
        ) : activeTab === 'requirements' ? (
          <div className="tab-scrollable-container dash-page">
            <Requirements projectId={selectedProject} />
          </div>
        ) : activeTab === 'help' ? (
          <div className="tab-scrollable-container dash-page">
            <PlaceholderHelp />
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

      <ConflictPopup />
    </div>
  );
};

export default Dashboard;
