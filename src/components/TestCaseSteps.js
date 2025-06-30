// TestCaseSteps.js
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faMagicWandSparkles, faGripVertical, faInfoCircle, faSignInAlt, faChevronUp, faChevronDown, faPlus, faEdit, faTrash, faCode, faSearch, faQuestionCircle, faCheckCircle, faTimesCircle, faImage
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import AIModelSelector from './AIModelSelector';
import './TestCaseSteps.css';

const STEP_ACTIONS = [
  'click',
  'type',
  'select',
  'hover',
  'wait',
  'assert',
  'scroll',
  'clear',
  'navigate',
  'press_key'
];

const TestCaseSteps = ({ 
  test_steps, 
  test_runs, 
  testCaseId, 
  test_name, 
  test_description, 
  updated_at, 
  projectId,
  onTestCaseUpdate,
  steps_generation_start_time,
  steps_generation_end_time
}) => {
  const [expandedRuns, setExpandedRuns] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false);
  const [currentGeneratingStep, setCurrentGeneratingStep] = useState("");
  const [nextGeneratingStep, setNextGeneratingStep] = useState("");
  const [generationDuration, setGenerationDuration] = useState("");
  const [steps, setSteps] = useState(test_steps || []);
  const [currentTestName, setCurrentTestName] = useState(test_name || '');
  const [currentTestDescription, setCurrentTestDescription] = useState(test_description || '');
  const [stepValues, setStepValues] = useState({});
  const [draggedStep, setDraggedStep] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [generatingTestCases, setGeneratingTestCases] = useState(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('generatingTestCases');
    return saved ? JSON.parse(saved) : {};
  });
  const [pollingInterval, setPollingInterval] = useState(null);
  const [showProjectTooltip, setShowProjectTooltip] = useState(false);
  const [showGenerateTooltip, setShowGenerateTooltip] = useState(false);
  const [showRunTooltip, setShowRunTooltip] = useState(false);
  const [showEnvTooltip, setShowEnvTooltip] = useState(false);
  const [showRunningTooltip, setShowRunningTooltip] = useState(false);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [showRunConfirmModal, setShowRunConfirmModal] = useState(false);
  const [showAddEnvironmentModal, setShowAddEnvironmentModal] = useState(false);
  const [showEditEnvironmentModal, setShowEditEnvironmentModal] = useState(false);
  const [showEnvironmentDropdown, setShowEnvironmentDropdown] = useState(false);
  const [newEnvironment, setNewEnvironment] = useState({
    name: '',
    base_url: '',
    login: '',
    password: '',
    custom_variables: []
  });
  const [editingEnvironment, setEditingEnvironment] = useState(null);
  const [showDeleteStepModal, setShowDeleteStepModal] = useState(false);
  const [stepToDelete, setStepToDelete] = useState(null);
  const [locatorTooltipStep, setLocatorTooltipStep] = useState(null);
  const [locatorValidationStatus, setLocatorValidationStatus] = useState({});
  const [isTestingLocator, setIsTestingLocator] = useState(false);
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStep, setNewStep] = useState({
    description: '',
    action: '',
    element_path: '',
    value: '',
    path_type: 'xpath',
    expected_result: ''
  });
  const [isEditingTestCase, setIsEditingTestCase] = useState(false);
  const [editedTestCase, setEditedTestCase] = useState({
    name: currentTestName,
    description: currentTestDescription
  });
  const [isUpdatingTestCase, setIsUpdatingTestCase] = useState(false);
  const [showEditTestCaseModal, setShowEditTestCaseModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotError, setScreenshotError] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  const [showEnvVarsDropdown, setShowEnvVarsDropdown] = useState(false);
  const [activeInputStepId, setActiveInputStepId] = useState(null);
  const [inputCursorPosition, setInputCursorPosition] = useState(0);
  const [selectedAIModel, setSelectedAIModel] = useState(null);
  const envVarsDropdownRef = useRef(null);
  const inputRefs = useRef({});
  const locatorTooltipRef = useRef(null);
  const environmentDropdownRef = React.useRef(null);

  // State for tracking steps with screenshots
  const [stepsWithScreenshots, setStepsWithScreenshots] = useState({});

  // Function to check if a step has a screenshot
  const checkStepScreenshot = async (stepId) => {
    try {
      const response = await fetch(`${API_URL}/api/test_step_screenshot/${stepId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // If the response is OK, a screenshot exists
      return response.ok;
    } catch (error) {
      console.error('Error checking screenshot availability:', error);
      return false;
    }
  };

  // Check for screenshots when steps are loaded
  useEffect(() => {
    const checkScreenshots = async () => {
      if (steps && steps.length > 0) {
        const screenshotStatus = {};
        
        for (const step of steps) {
          screenshotStatus[step.id] = await checkStepScreenshot(step.id);
        }
        
        setStepsWithScreenshots(screenshotStatus);
      }
    };
    
    checkScreenshots();
  }, [steps]);

  useEffect(() => {
    // Add click outside listener to close the dropdown
    function handleClickOutside(event) {
      if (environmentDropdownRef.current && !environmentDropdownRef.current.contains(event.target)) {
        setShowEnvironmentDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Add click outside listener to close the env vars dropdown
    function handleClickOutside(event) {
      if (envVarsDropdownRef.current && !envVarsDropdownRef.current.contains(event.target)) {
        setShowEnvVarsDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Add click outside listener to close the locator tooltip
    function handleClickOutside(event) {
      if (locatorTooltipRef.current && !locatorTooltipRef.current.contains(event.target)) {
        setLocatorTooltipStep(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate generation duration when start and end times are available
  useEffect(() => {
    if (steps_generation_start_time && steps_generation_end_time) {
      const startTime = new Date(steps_generation_start_time);
      const endTime = new Date(steps_generation_end_time);
      let durationMs = endTime - startTime;
      
      // Ensure we have a positive duration
      if (durationMs < 0) {
        console.warn('Negative duration detected, using absolute value');
        durationMs = Math.abs(durationMs);
      }
      
      // Format duration as mm:ss
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setGenerationDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    } else {
      setGenerationDuration("");
    }
  }, [steps_generation_start_time, steps_generation_end_time]);

  useEffect(() => {
    if (test_steps && Array.isArray(test_steps)) {
      // Log the test steps to debug
      console.log("Test steps received:", test_steps);
      
      setSteps(test_steps);
      // Initialize stepValues with values from test_steps
      const initialValues = {};
      test_steps.forEach(step => {
        if (step.action === 'type' && step.value) {
          initialValues[step.id] = step.value;
        }
      });
      setStepValues(initialValues);
    }
  }, [test_steps]);

  useEffect(() => {
    if (projectId && projectId !== 'all') {
      fetchEnvironments();
    } else {
      setEnvironments([]);
      setSelectedEnvironment('');
    }
  }, [projectId]);

  useEffect(() => {
    setEditedTestCase({
      name: currentTestName,
      description: currentTestDescription
    });
  }, [currentTestName, currentTestDescription]);
  
  // Update the current test name and description when props change
  useEffect(() => {
    setCurrentTestName(test_name || '');
    setCurrentTestDescription(test_description || '');
  }, [test_name, test_description]);

  useEffect(() => {
    // This effect runs when the component mounts or when testCaseId changes
    console.log("Test case ID changed to:", testCaseId);
    
    // Reset relevant state when test case changes
    setShowAddStepModal(false);
    setShowDeleteStepModal(false);
    setShowConfirmModal(false);
    setShowRunConfirmModal(false);
    setShowEditTestCaseModal(false);
    setShowScreenshotModal(false);
    setLocatorTooltipStep(null);
    setIsTestingLocator(false);
    
    if (testCaseId) {
      // Reset steps when test case changes
      if (!generatingTestCases[testCaseId]) {
        setIsGeneratingSteps(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
      
      // Check if this test case is in the list of generating test cases
      const isGenerating = generatingTestCases[testCaseId];
      
      if (isGenerating) {
        setIsGeneratingSteps(true);
        startPollingForUpdates();
      }
    }
    
    // Cleanup polling when component unmounts or testCaseId changes
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [testCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem('generatingTestCases', JSON.stringify(generatingTestCases));
  }, [generatingTestCases]);

  const startPollingForUpdates = () => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Set up a new polling interval
    const interval = setInterval(async () => {
      if (!testCaseId) return;
      
      try {
        // First, check the generation status
        const statusResponse = await fetch(`${API_URL}/api/test_case_generation_status/${testCaseId}`, {
          headers: getAuthHeaders()
        });
        
        if (!statusResponse.ok) {
          throw new Error('Failed to fetch test case generation status');
        }
        
        const statusData = await statusResponse.json();
        
        // Update current and next step information if available
        if (statusData.current_step) {
          setCurrentGeneratingStep(statusData.current_step);
        }
        
        if (statusData.next_step) {
          setNextGeneratingStep(statusData.next_step);
        }
        
        // Then, get the latest test case data to ensure we have the most up-to-date steps
        const testCaseResponse = await fetch(`${API_URL}/api/get_test_cases/${testCaseId}`, {
          headers: getAuthHeaders()
        });
        
        if (!testCaseResponse.ok) {
          throw new Error('Failed to fetch test case data');
        }
        
        const testCaseData = await testCaseResponse.json();
        
        // Update steps with the latest from the server
        if (testCaseData.test_steps && Array.isArray(testCaseData.test_steps)) {
          console.log('Received updated steps during polling:', testCaseData.test_steps.length);
          setSteps(testCaseData.test_steps);
          
          // Initialize stepValues for any new type steps
          setStepValues(prevValues => {
            const newValues = { ...prevValues };
            testCaseData.test_steps.forEach(step => {
              if (step.action === 'type' && step.value && !newValues[step.id]) {
                newValues[step.id] = step.value;
              }
            });
            return newValues;
          });
          
          // Check for screenshots for new steps
          checkNewStepsForScreenshots(testCaseData.test_steps);
        }
        
        // Check if generation is complete
        if (!statusData.is_generating) {
          setIsGeneratingSteps(false);
          
          // Remove this test case from the generating list
          setGeneratingTestCases(prev => {
            const updated = { ...prev };
            delete updated[testCaseId];
            return updated;
          });
          
          // Reset current and next step information
          setCurrentGeneratingStep("");
          setNextGeneratingStep("");
          
          // Stop polling
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      } catch (error) {
        console.error('Error checking test case generation status:', error);
      }
    }, 2000); // Poll every 2 seconds for more responsive updates
    
    setPollingInterval(interval);
  };

  // Helper function to check for screenshots for new steps
  const checkNewStepsForScreenshots = async (newSteps) => {
    if (!newSteps || newSteps.length === 0) return;
    
    const screenshotStatus = { ...stepsWithScreenshots };
    
    for (const step of newSteps) {
      // Only check steps we haven't checked before
      if (screenshotStatus[step.id] === undefined) {
        screenshotStatus[step.id] = await checkStepScreenshot(step.id);
      }
    }
    
    setStepsWithScreenshots(screenshotStatus);
  };

  const handleStopGeneration = async () => {
    if (!testCaseId || !isGeneratingSteps) return;
    
    try {
      const response = await fetch(`${API_URL}/api/stop_test_case_generation/${testCaseId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop test step generation');
      }
      
      // We'll let the polling handle the UI update once the backend confirms the stop
      console.log('Requested to stop test step generation');
    } catch (error) {
      console.error('Error stopping test step generation:', error);
      alert('Failed to stop test step generation. Please try again.');
    }
  };

  const handleStopExecution = async () => {
    if (!testCaseId || !isRunning) return;
    
    try {
      const response = await fetch(`${API_URL}/api/stop_test_case_execution/${testCaseId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to stop test execution');
      }
      
      console.log('Requested to stop test execution');
    } catch (error) {
      console.error('Error stopping test execution:', error);
      alert('Failed to stop test execution. Please try again.');
    }
  };

  const fetchEnvironments = async () => {
    if (!projectId || projectId === 'all') return;
    
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/environments`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch environments');
      }
      
      const data = await response.json();
      setEnvironments(data);
      
      // If there's at least one environment, select it by default
      if (data.length > 0) {
        // If there's a previously selected environment that exists in the current project, keep it
        const environmentExists = selectedEnvironment && data.some(env => env.id === parseInt(selectedEnvironment));
        if (!environmentExists) {
          // Otherwise select the first environment
          setSelectedEnvironment(data[0].id.toString());
        }
      } else {
        // No environments available
        setSelectedEnvironment('');
      }
    } catch (error) {
      console.error('Error fetching environments:', error);
    }
  };

  const hasTestSteps = steps && steps.length > 0;
  const isProjectSelected = projectId && projectId !== 'all';

  const refreshTestCase = async () => {
    try {
      const response = await fetch(`${API_URL}/api/get_test_cases/${testCaseId}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch updated test case');
      }
      const data = await response.json();
      setSteps(data.test_steps);
    } catch (error) {
      console.error('Error refreshing test case:', error);
    }
  };

  const toggleRunDetails = (runId) => {
    setExpandedRuns((prevState) => ({
      ...prevState,
      [runId]: !prevState[runId],
    }));
  };

  const handleEnvironmentChange = (environmentId) => {
    setSelectedEnvironment(environmentId);
    setShowEnvironmentDropdown(false);
  };

  const handleAddNewEnvironmentClick = () => {
    setNewEnvironment({
      name: '',
      base_url: '',
      login: '',
      password: '',
      custom_variables: []
    });
    setShowAddEnvironmentModal(true);
    setShowEnvironmentDropdown(false);
  };

  const handleEditEnvironmentClick = (environment, e) => {
    e.stopPropagation(); // Prevent dropdown from closing
    setEditingEnvironment(environment);
    setNewEnvironment({
      name: environment.name,
      base_url: environment.base_url,
      login: environment.login || '',
      password: environment.password || '',
      custom_variables: environment.custom_variables || []
    });
    setShowEditEnvironmentModal(true);
  };

  const handleUpdateEnvironment = async (e) => {
    e.preventDefault();
    
    if (!newEnvironment.name || !newEnvironment.base_url) {
      alert('Name and Base URL are required fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/environments/${editingEnvironment.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEnvironment)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      // Reset form and close modal
      setNewEnvironment({
        name: '',
        base_url: '',
        login: '',
        password: '',
        custom_variables: []
      });
      setShowEditEnvironmentModal(false);
      setEditingEnvironment(null);

      // Refresh environments
      await fetchEnvironments();
      
    } catch (error) {
      console.error('Error updating environment:', error);
      alert('Failed to update environment: ' + error.message);
    }
  };

  const handleNewEnvironmentChange = (e) => {
    const { name, value } = e.target;
    
    // Check if this is a custom variable field
    if (name.startsWith('custom_variables[')) {
      const match = name.match(/custom_variables\[(\d+)\]\.(\w+)/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2]; // 'name' or 'value'
        
        setNewEnvironment(prev => {
          const updatedVars = [...prev.custom_variables];
          if (!updatedVars[index]) {
            updatedVars[index] = { name: '', value: '' };
          }
          updatedVars[index][field] = value;
          return {
            ...prev,
            custom_variables: updatedVars
          };
        });
      }
    } else {
      setNewEnvironment(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddCustomVariable = () => {
    setNewEnvironment(prev => ({
      ...prev,
      custom_variables: [...prev.custom_variables, { name: '', value: '' }]
    }));
  };

  const handleRemoveCustomVariable = (index) => {
    setNewEnvironment(prev => ({
      ...prev,
      custom_variables: prev.custom_variables.filter((_, i) => i !== index)
    }));
  };

  const handleAddEnvironment = async (e) => {
    e.preventDefault(); // Prevent form submission
    
    // Validate form
    if (!newEnvironment.name || !newEnvironment.base_url) {
      alert('Name and Base URL are required fields');
      return;
    }

    try {
      console.log('Creating environment:', newEnvironment);
      console.log('Project ID:', projectId);
      
      const response = await fetch(`${API_URL}/api/projects/${projectId}/environments`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEnvironment)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Created environment:', data);

      // Reset form and close modal
      setNewEnvironment({
        name: '',
        base_url: '',
        login: '',
        password: '',
        custom_variables: []
      });
      setShowAddEnvironmentModal(false);

      // Refresh environments
      await fetchEnvironments();
      
      // Select the newly created environment
      if (data && data.id) {
        setSelectedEnvironment(data.id.toString());
      }
    } catch (error) {
      console.error('Error creating environment:', error);
      alert('Failed to create environment: ' + error.message);
    }
  };

  const handleRunClick = async () => {
    if (isRunning || !testCaseId || !hasTestSteps) return;
    
    // If there are environments available but none is selected, show confirmation modal
    if (environments.length > 0 && !selectedEnvironment) {
      setShowRunConfirmModal(true);
      return;
    }
    
    await runTest();
  };

  const handleRunConfirm = async () => {
    setShowRunConfirmModal(false);
    await runTest();
  };

  const runTest = async () => {
    setIsRunning(true);
    try {
      const requestBody = {};
      
      // If an environment is selected, include it in the request
      if (selectedEnvironment) {
        requestBody.environment_id = selectedEnvironment;
      }
      
      const response = await fetch(`${API_URL}/api/run_test_case/${testCaseId}`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
      });
      
      if (!response.ok) {
        throw new Error('Failed to run test case');
      }
      
      const result = await response.json();
      console.log('Test run result:', result);
      
      // Refresh the test case to show the latest test run
      await refreshTestCase();
      
    } catch (error) {
      console.error('Error running test case:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerateSteps = async () => {
    if (!isProjectSelected) {
      setShowProjectTooltip(true);
      return;
    }
    
    // Check if an environment is selected
    if (!selectedEnvironment) {
      alert('Please select an environment before generating test steps');
      return;
    }
    
    if (test_steps && test_steps.length > 0) {
      setShowConfirmModal(true);
      return;
    }
    
    await generateSteps(false);
  };

  const handleConfirmGenerate = async () => {
    setShowConfirmModal(false);
    await generateSteps(true);
  };

  const generateSteps = async (confirm) => {
    if (!testCaseId || isGeneratingSteps || !isProjectSelected || !selectedEnvironment) return;
    
    setIsGeneratingSteps(true);
    
    // Add this test case to the generating list
    setGeneratingTestCases(prev => ({
      ...prev,
      [testCaseId]: true
    }));
    
    try {
      const endpoint = confirm 
        ? `${API_URL}/api/confirm_generate_steps/${testCaseId}` 
        : `${API_URL}/api/generate_steps/${testCaseId}`;
      
      const requestBody = {
        environment_id: parseInt(selectedEnvironment)
      };
      
      // If projectId exists and is not 'all', add it to the request body
      if (projectId && projectId !== 'all') {
        requestBody.project_id = projectId;
      }
      
      // If AI model is selected, add it to the request body
      if (selectedAIModel) {
        requestBody.ai_model_id = selectedAIModel;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate steps');
      }
      
      // Start polling for updates
      startPollingForUpdates();
      
    } catch (error) {
      console.error('Error generating steps:', error);
      alert('Failed to generate steps. Please try again.');
      setIsGeneratingSteps(false);
      
      // Remove this test case from the generating list
      setGeneratingTestCases(prev => {
        const updated = { ...prev };
        delete updated[testCaseId];
        return updated;
      });
    }
  };
  
  const handleActionChange = async (stepId, newAction) => {
    try {
      // Update steps state immediately for better UI responsiveness
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.id === stepId 
            ? { ...step, action: newAction }
            : step
        )
      );

      const response = await fetch(`${API_URL}/api/update_test_step/${stepId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: newAction })
      });

      if (!response.ok) {
        throw new Error('Failed to update test step action');
      }
    } catch (error) {
      console.error('Error updating test step action:', error);
      await refreshTestCase();
    }
  };

  const handleValueChange = async (stepId, value, currentAction) => {
    setStepValues(prev => ({
      ...prev,
      [stepId]: value
    }));

    try {
      const response = await fetch(`${API_URL}/api/update_test_step/${stepId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          value: value,
          action: currentAction 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update test step value');
      }
    } catch (error) {
      console.error('Error updating test step value:', error);
    }
  };

  const handleElementPathChange = async (stepId, elementPath) => {
    try {
      // Update steps state immediately for better UI responsiveness
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.id === stepId 
            ? { ...step, element_path: elementPath }
            : step
        )
      );

      const response = await fetch(`${API_URL}/api/update_test_step/${stepId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ element_path: elementPath })
      });

      if (!response.ok) {
        throw new Error('Failed to update element locator');
      }
    } catch (error) {
      console.error('Error updating element locator:', error);
      await refreshTestCase();
    }
  };

  const handleDragStart = (e, step) => {
    // Prevent dragging if generating steps or running test
    if (isGeneratingSteps || isRunning) {
      e.preventDefault();
      return;
    }
    
    setDraggedStep(step);
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedStep(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const dragBox = e.currentTarget;
    dragBox.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = async (e, targetStep) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedStep || draggedStep.id === targetStep.id) return;

    const oldIndex = steps.findIndex(s => s.id === draggedStep.id);
    const newIndex = steps.findIndex(s => s.id === targetStep.id);
    
    const newSteps = [...steps];
    newSteps.splice(oldIndex, 1);
    newSteps.splice(newIndex, 0, draggedStep);

    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      step_order: index
    }));

    setSteps(updatedSteps);

    try {
      const response = await fetch(`${API_URL}/api/update_step_orders`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_case_id: testCaseId,
          step_orders: updatedSteps.map(step => ({
            id: step.id,
            step_order: step.step_order
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update step orders');
      }
    } catch (error) {
      console.error('Error updating step orders:', error);
      setSteps(test_steps);
    }
  };

  const handleDeleteStepClick = (step) => {
    setStepToDelete(step);
    setShowDeleteStepModal(true);
  };

  const handleConfirmDeleteStep = async () => {
    if (!stepToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/api/delete_test_step/${stepToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete test step');
      }
      
      // Remove the step from the local state
      setSteps(prevSteps => prevSteps.filter(step => step.id !== stepToDelete.id));
      
      setShowDeleteStepModal(false);
      setStepToDelete(null);
    } catch (error) {
      console.error('Error deleting test step:', error);
      alert('Failed to delete test step. Please try again.');
    }
  };

  const handleInputFocus = (stepId, e) => {
    setActiveInputStepId(stepId);
    setInputCursorPosition(e.target.selectionStart);
  };

  const handleInputClick = (stepId, e) => {
    setInputCursorPosition(e.target.selectionStart);
  };

  const handleInputKeyUp = (e) => {
    setInputCursorPosition(e.target.selectionStart);
  };

  const toggleEnvVarsDropdown = () => {
    setShowEnvVarsDropdown(!showEnvVarsDropdown);
  };

  const insertEnvVariable = (varName) => {
    if (!activeInputStepId) return;
    
    // Create the variable text with the format {{variable_name}}
    const variableText = `{{${varName}}}`;
    
    // Replace the entire input value with the environment variable
    setStepValues(prev => ({
      ...prev,
      [activeInputStepId]: variableText
    }));
    
    // Save the new value to the database
    const step = steps.find(s => s.id === activeInputStepId);
    if (step) {
      handleValueChange(activeInputStepId, variableText, step.action);
    }
    
    // Close the dropdown
    setShowEnvVarsDropdown(false);
    
    // Focus back on the input and set cursor position at the end
    setTimeout(() => {
      const input = inputRefs.current[activeInputStepId];
      if (input) {
        input.focus();
        const newPosition = variableText.length;
        input.setSelectionRange(newPosition, newPosition);
        setInputCursorPosition(newPosition);
      }
    }, 0);
  };

  const handleTestLocator = async (stepId, elementPath) => {
    if (!elementPath || !selectedEnvironment) return;
    
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    // Set the testing state for this locator
    setIsTestingLocator(true);
    setLocatorValidationStatus(prev => ({
      ...prev,
      [stepId]: { status: 'testing', message: 'Testing locator...' }
    }));
    
    try {
      const response = await fetch(`${API_URL}/api/test_element_locator`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          element_path: elementPath,
          environment_id: selectedEnvironment,
          test_case_id: testCaseId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to test locator');
      }
      
      const result = await response.json();
      
      // Update the validation status based on the result
      setLocatorValidationStatus(prev => ({
        ...prev,
        [stepId]: { 
          status: result.valid ? 'valid' : 'invalid', 
          message: result.message || (result.valid ? 'Element found!' : 'Element not found')
        }
      }));
      
    } catch (error) {
      console.error('Error testing locator:', error);
      setLocatorValidationStatus(prev => ({
        ...prev,
        [stepId]: { status: 'invalid', message: 'Error testing locator: ' + error.message }
      }));
    } finally {
      setIsTestingLocator(false);
    }
  };

  const toggleLocatorTooltip = (stepId) => {
    if (locatorTooltipStep === stepId) {
      setLocatorTooltipStep(null);
    } else {
      setLocatorTooltipStep(stepId);
    }
  };

  const getLocatorExamples = () => {
    return [
      { type: 'XPath', example: '//input[@id="username"]', description: 'Select input with id="username"' },
      { type: 'CSS', example: '#username', description: 'Select element with id="username"' },
      { type: 'XPath', example: '//button[contains(text(), "Login")]', description: 'Select button containing text "Login"' },
      { type: 'CSS', example: '.submit-button', description: 'Select element with class="submit-button"' },
      { type: 'XPath', example: '//div[@class="form-group"][2]//input', description: 'Select input in the second form-group div' }
    ];
  };

  const handleNewStepChange = (e) => {
    const { name, value } = e.target;
    setNewStep(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddStepClick = () => {
    // Reset the form and open the modal
    setNewStep({
      description: '',
      action: '',
      element_path: '',
      value: '',
      path_type: 'xpath',
      expected_result: ''
    });
    setShowAddStepModal(true);
  };

  const handleAddStep = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newStep.description || !newStep.action) {
      alert('Description and Action are required fields');
      return;
    }
    
    // If action requires an element path but none is provided, show an error
    if (['click', 'type', 'select', 'hover', 'assert'].includes(newStep.action) && !newStep.element_path) {
      alert('Element path is required for this action');
      return;
    }
    
    // If action is "type" but no value is provided, show an error
    if (newStep.action === 'type' && !newStep.value) {
      alert('Value is required for the "type" action');
      return;
    }
    
    setIsAddingStep(true);
    
    try {
      const response = await fetch(`${API_URL}/api/create_test_step`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_case_id: testCaseId,
          description: newStep.description,
          action: newStep.action,
          element_path: newStep.element_path || null,
          value: newStep.value || null,
          path_type: newStep.path_type || 'xpath',
          expected_result: newStep.expected_result || null
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || `HTTP error! status: ${response.status}`;
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const newStepData = await response.json();
      
      // Add the new step to the steps array
      setSteps(prevSteps => [...prevSteps, newStepData]);
      
      // Close the modal and reset the form
      setShowAddStepModal(false);
      setNewStep({
        description: '',
        action: '',
        element_path: '',
        value: '',
        path_type: 'xpath',
        expected_result: ''
      });
      
    } catch (error) {
      console.error('Error adding test step:', error);
      alert('Failed to add test step: ' + error.message);
    } finally {
      setIsAddingStep(false);
    }
  };

  const handleEditTestCaseClick = () => {
    setIsEditingTestCase(true);
    setShowEditTestCaseModal(true);
  };

  const handleUpdateTestCase = async (e) => {
    e.preventDefault();
    
    if (!editedTestCase.name || !editedTestCase.description) {
      alert('Name and Description are required fields');
      return;
    }

    setIsUpdatingTestCase(true);
    try {
      const response = await fetch(`${API_URL}/api/test_cases/${testCaseId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editedTestCase.name,
          description: editedTestCase.description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update test case');
      }

      // Update the test case details in the parent component
      if (typeof onTestCaseUpdate === 'function') {
        onTestCaseUpdate(editedTestCase.name, editedTestCase.description);
      }

      // Update the local state to reflect the changes immediately
      setCurrentTestName(editedTestCase.name);
      setCurrentTestDescription(editedTestCase.description);

      // Refresh the test case to show the latest changes
      await refreshTestCase();

      // Close the modal and reset the form
      setShowEditTestCaseModal(false);
      setIsEditingTestCase(false);
      setIsUpdatingTestCase(false);
    } catch (error) {
      console.error('Error updating test case:', error);
      alert('Failed to update test case: ' + error.message);
      setIsUpdatingTestCase(false);
    }
  };

  const handleTestCaseChange = (e) => {
    const { name, value } = e.target;
    setEditedTestCase(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageLoad = (event) => {
    const { naturalWidth, naturalHeight } = event.target;
    setImageSize({ width: naturalWidth, height: naturalHeight });
  };

  const handleImageClick = (event) => {
    const image = event.target;
    const rect = image.getBoundingClientRect();
    
    // Calculate relative position within the image (0 to 1)
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    
    // Toggle zoom state
    const newZoomState = !isZoomed;
    
    // Set zoom position only when zooming in
    if (newZoomState) {
      setZoomPosition({ x: relativeX, y: relativeY });
      
      // Scroll the container to center on the clicked point after a short delay
      setTimeout(() => {
        const container = image.closest('.screenshot-image-container');
        if (container) {
          // Calculate scroll position to center on the clicked point
          const zoomedWidth = image.width * 1.75; // Match the CSS scale(1.75)
          const zoomedHeight = image.height * 1.75;
          
          // Add padding offset to ensure corners are visible
          const padding = 100; // Match the CSS padding/margin
          
          // Calculate scroll position with absolute positioning in mind
          const scrollX = Math.max(0, (relativeX * zoomedWidth) - (container.clientWidth / 2));
          const scrollY = Math.max(0, (relativeY * zoomedHeight) - (container.clientHeight / 2));
          
          container.scrollTo({
            left: scrollX,
            top: scrollY,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
    
    setIsZoomed(newZoomState);
  };

  const handleViewScreenshot = async (stepId) => {
    setScreenshotLoading(true);
    setShowScreenshotModal(true);
    setCurrentScreenshot(null);
    setScreenshotError(null);
    setIsZoomed(false);
    setImageSize({ width: 0, height: 0 });
    setZoomPosition({ x: 0, y: 0 });
    
    try {
      const response = await fetch(`${API_URL}/api/test_step_screenshot/${stepId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch screenshot');
      }
      
      const data = await response.json();
      setCurrentScreenshot(data);
    } catch (error) {
      console.error('Error fetching screenshot:', error);
      setScreenshotError(error.message);
    } finally {
      setScreenshotLoading(false);
    }
  };

  const formatDuration = (milliseconds) => {
    // Ensure we have a positive duration
    const posMilliseconds = Math.abs(milliseconds);
    const totalSeconds = Math.floor(posMilliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="test-steps-container">
      <div className="test-case-header">
        <div className="test-case-title">
          <h2>{currentTestName}</h2>
          <p className="test-description">{currentTestDescription}</p>
          <p className="updated-at">Last updated: {formatDate(updated_at)}</p>
          {generationDuration && (
            <p className="generation-duration">Steps generation time: <span className="duration-value">{generationDuration}</span></p>
          )}
        </div>
        
        <div className={`test-steps-actions ${isRunning ? 'running' : ''}`}>
          <div className="environment-selector-container">
            <div 
              className="environment-selector-button"
              onClick={() => setShowEnvironmentDropdown(!showEnvironmentDropdown)}
              onMouseEnter={() => setShowEnvTooltip(true)}
              onMouseLeave={() => setShowEnvTooltip(false)}
            >
              {selectedEnvironment 
                ? environments.find(env => env.id.toString() === selectedEnvironment)?.name || 'Select Environment'
                : 'Select Environment'}
              <FontAwesomeIcon icon={showEnvironmentDropdown ? faChevronUp : faChevronDown} />
            </div>
            {showEnvironmentDropdown && (
              <div className="environment-dropdown" ref={environmentDropdownRef}>
                {environments.length > 0 ? (
                  <>
                    {environments.map(env => (
                      <div 
                        key={env.id} 
                        className={`environment-option ${selectedEnvironment === env.id.toString() ? 'selected' : ''}`}
                        onClick={() => handleEnvironmentChange(env.id.toString())}
                      >
                        <span>{env.name}</span>
                        <button 
                          className="edit-environment-button"
                          onClick={(e) => handleEditEnvironmentClick(env, e)}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      </div>
                    ))}
                    <div 
                      className="environment-option add-environment"
                      onClick={handleAddNewEnvironmentClick}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add New Environment
                    </div>
                  </>
                ) : (
                  <div className="no-environments">
                    <p>No environments available</p>
                    <button 
                      className="add-environment-button"
                      onClick={handleAddNewEnvironmentClick}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add Environment
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <AIModelSelector 
            onModelSelect={setSelectedAIModel} 
            selectedModelId={selectedAIModel} 
          />
          
          <button 
            className="add-step-button action-button"
            onClick={handleAddStepClick}
            disabled={isGeneratingSteps || isRunning}
          >
            <FontAwesomeIcon icon={faPlus} /> Add Step
          </button>
          
          <div className="generate-button-container">
            <button 
              className={`generate-button action-button ${isGeneratingSteps ? 'generating' : ''} ${(!isProjectSelected || isRunning) ? 'disabled' : ''}`}
              onClick={handleGenerateSteps}
              disabled={isGeneratingSteps || !isProjectSelected || isRunning}
              onMouseEnter={() => {
                if (!isProjectSelected) {
                  setShowProjectTooltip(true);
                } else if (isRunning) {
                  setShowRunningTooltip(true);
                }
              }}
              onMouseLeave={() => {
                setShowProjectTooltip(false);
                setShowRunningTooltip(false);
              }}
            >
              {isGeneratingSteps ? (
                <>
                  <div className="spinner"></div> Generating Steps
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faMagicWandSparkles} /> Generate with AI
                </>
              )}
            </button>
            {!isProjectSelected && showProjectTooltip && (
              <div className="tooltip">
                <FontAwesomeIcon icon={faInfoCircle} /> Please select a project first
              </div>
            )}
            {isRunning && showRunningTooltip && (
              <div className="tooltip">
                <FontAwesomeIcon icon={faInfoCircle} /> Cannot generate steps while test is running
              </div>
            )}
          </div>
          
          <div className="run-button-container">
            <button 
              className={`run-button action-button ${(isRunning || !hasTestSteps || isGeneratingSteps) ? 'disabled' : ''}`}
              onClick={handleRunClick}
              disabled={isRunning || !hasTestSteps || isGeneratingSteps}
              onMouseEnter={() => setShowRunTooltip(true)}
              onMouseLeave={() => setShowRunTooltip(false)}
            >
              {isRunning ? (
                <>
                  <div className="spinner"></div> Running...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlay} /> Run Test
                </>
              )}
            </button>
            {showRunTooltip && !hasTestSteps && (
              <div className="tooltip run-tooltip">
                <FontAwesomeIcon icon={faInfoCircle} /> No test steps to run
              </div>
            )}
          </div>
          <div className="stop-button-container">
            <button 
              className={`stop-button action-button ${(!isRunning) ? 'disabled' : ''}`}
              onClick={handleStopExecution}
              disabled={!isRunning}
            >
              <FontAwesomeIcon icon={faTimesCircle} /> Stop Test
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Generate Steps */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Step Generation</h3>
            <p>This test case already has steps. Generating new steps will delete all existing steps. Are you sure you want to continue?</p>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleConfirmGenerate} className="modal-button confirm">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Running Test without Environment */}
      {showRunConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Run Test Without Environment</h3>
            <p>You have not selected an environment. The test will run with default settings. Would you like to continue or select an environment?</p>
            <div className="modal-actions">
              <button onClick={() => setShowRunConfirmModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleRunConfirm} className="modal-button confirm">Run Without Environment</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deleting Step */}
      {showDeleteStepModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete Step</h3>
            <p>Are you sure you want to delete this step? This action cannot be undone.</p>
            <p><strong>Step:</strong> {stepToDelete?.description}</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteStepModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleConfirmDeleteStep} className="modal-button delete">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Case Modal */}
      {showEditTestCaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Test Case</h3>
            <form onSubmit={handleUpdateTestCase}>
              <div className="form-group">
                <label>Name:</label>
                <input type="text" name="name" value={editedTestCase.name} onChange={handleTestCaseChange} required />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea name="description" value={editedTestCase.description} onChange={handleTestCaseChange} required />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditTestCaseModal(false)} className="modal-button cancel">Cancel</button>
                <button type="submit" className="modal-button confirm" disabled={isUpdatingTestCase}>
                  {isUpdatingTestCase ? 'Updating...' : 'Update Test Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Environment Modal */}
      {showAddEnvironmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Environment</h3>
            <form onSubmit={handleAddEnvironment}>
              <div className="form-group">
                <label>Name:</label>
                <input type="text" name="name" value={newEnvironment.name} onChange={handleNewEnvironmentChange} required />
              </div>
              <div className="form-group">
                <label>Base URL:</label>
                <input type="text" name="base_url" value={newEnvironment.base_url} onChange={handleNewEnvironmentChange} required />
              </div>
              <div className="form-group">
                <label>Login:</label>
                <input type="text" name="login" value={newEnvironment.login} onChange={handleNewEnvironmentChange} />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input type="password" name="password" value={newEnvironment.password} onChange={handleNewEnvironmentChange} />
              </div>
              <div className="form-group">
                <label>Custom Variables:</label>
                <div className="custom-variables-container">
                  {newEnvironment.custom_variables.length > 0 && (
                    <div className="custom-variable-labels">
                      <span>Name</span>
                      <span>Value</span>
                    </div>
                  )}
                  <ul className="custom-variables-list">
                    {newEnvironment.custom_variables.map((variable, index) => (
                      <li key={index} className="custom-variable-item">
                        <input 
                          type="text" 
                          className="custom-variable-name"
                          placeholder="Variable name"
                          name={`custom_variables[${index}].name`} 
                          value={variable.name} 
                          onChange={handleNewEnvironmentChange} 
                        />
                        <input 
                          type="text" 
                          className="custom-variable-value"
                          placeholder="Variable value"
                          name={`custom_variables[${index}].value`} 
                          value={variable.value} 
                          onChange={handleNewEnvironmentChange} 
                        />
                        <button 
                          type="button"
                          className="remove-variable-button"
                          onClick={() => handleRemoveCustomVariable(index)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button 
                    type="button"
                    className="add-variable-button"
                    onClick={handleAddCustomVariable}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Variable
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddEnvironmentModal(false)} className="modal-button cancel">Cancel</button>
                <button type="submit" className="modal-button confirm">Add Environment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Environment Modal */}
      {showEditEnvironmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Environment</h3>
            <form onSubmit={handleUpdateEnvironment}>
              <div className="form-group">
                <label>Name:</label>
                <input type="text" name="name" value={newEnvironment.name} onChange={handleNewEnvironmentChange} required />
              </div>
              <div className="form-group">
                <label>Base URL:</label>
                <input type="text" name="base_url" value={newEnvironment.base_url} onChange={handleNewEnvironmentChange} required />
              </div>
              <div className="form-group">
                <label>Login:</label>
                <input type="text" name="login" value={newEnvironment.login} onChange={handleNewEnvironmentChange} />
              </div>
              <div className="form-group">
                <label>Password:</label>
                <input type="password" name="password" value={newEnvironment.password} onChange={handleNewEnvironmentChange} />
              </div>
              <div className="form-group">
                <label>Custom Variables:</label>
                <div className="custom-variables-container">
                  {newEnvironment.custom_variables.length > 0 && (
                    <div className="custom-variable-labels">
                      <span>Name</span>
                      <span>Value</span>
                    </div>
                  )}
                  <ul className="custom-variables-list">
                    {newEnvironment.custom_variables.map((variable, index) => (
                      <li key={index} className="custom-variable-item">
                        <input 
                          type="text" 
                          className="custom-variable-name"
                          placeholder="Variable name"
                          name={`custom_variables[${index}].name`} 
                          value={variable.name} 
                          onChange={handleNewEnvironmentChange} 
                        />
                        <input 
                          type="text" 
                          className="custom-variable-value"
                          placeholder="Variable value"
                          name={`custom_variables[${index}].value`} 
                          value={variable.value} 
                          onChange={handleNewEnvironmentChange} 
                        />
                        <button 
                          type="button"
                          className="remove-variable-button"
                          onClick={() => handleRemoveCustomVariable(index)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button 
                    type="button"
                    className="add-variable-button"
                    onClick={handleAddCustomVariable}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Add Variable
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditEnvironmentModal(false)} className="modal-button cancel">Cancel</button>
                <button type="submit" className="modal-button confirm">Update Environment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Step Modal */}
      {showAddStepModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Step</h3>
            <form onSubmit={handleAddStep}>
              <div className="form-group">
                <label>Description:</label>
                <input type="text" name="description" value={newStep.description} onChange={handleNewStepChange} required />
              </div>
              <div className="form-group">
                <label>Action:</label>
                <select 
                  value={newStep.action || ''}
                  onChange={(e) => handleNewStepChange(e)}
                  name="action"
                  required
                >
                  <option value="">Select Action</option>
                  {STEP_ACTIONS.map((action) => (
                    <option key={action} value={action}>
                      {action.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Element Path:</label>
                <input type="text" name="element_path" value={newStep.element_path} onChange={handleNewStepChange} />
              </div>
              <div className="form-group">
                <label>Value:</label>
                <input type="text" name="value" value={newStep.value} onChange={handleNewStepChange} />
              </div>
              <div className="form-group">
                <label>Path Type:</label>
                <select 
                  value={newStep.path_type || ''}
                  onChange={(e) => handleNewStepChange(e)}
                  name="path_type"
                >
                  <option value="xpath">XPath</option>
                  <option value="css">CSS</option>
                </select>
              </div>
              <div className="form-group">
                <label>Expected Result:</label>
                <input type="text" name="expected_result" value={newStep.expected_result} onChange={handleNewStepChange} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddStepModal(false)} className="modal-button cancel">Cancel</button>
                <button type="submit" className="modal-button confirm">Add Step</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="test-steps-table-container">
        {isGeneratingSteps && (
          <div className="generating-indicator">
            <div className="spinner"></div>
            <span className="generating-indicator-text">Generating test steps... Steps will appear as they are created.</span>
            {currentGeneratingStep && (
              <div className="step-generation-info">
                <p><strong>Current step:</strong> {currentGeneratingStep}</p>
                {nextGeneratingStep && nextGeneratingStep !== "Stop" && (
                  <p><strong>Next step:</strong> {nextGeneratingStep}</p>
                )}
              </div>
            )}
            <button 
              className="stop-generation-button"
              onClick={handleStopGeneration}
            >
              <FontAwesomeIcon icon={faTimesCircle} /> Stop Generation
            </button>
          </div>
        )}
        
        {isRunning && (
          <div className="running-indicator">
            <div className="spinner"></div>
            <span className="running-indicator-text">Executing test steps... Results will be updated when complete.</span>
            <button 
              className="stop-execution-button"
              onClick={handleStopExecution}
            >
              <FontAwesomeIcon icon={faTimesCircle} /> Stop Execution
            </button>
          </div>
        )}
        <table className="test-steps-table">
          <thead>
            <tr>
              <th className="drag-handle-column"></th>
              <th className="step-description-column">Description</th>
              <th className="step-action-column">Action</th>
              <th className="step-locator-column">Element Locator</th>
              <th className="step-value-column">Value</th>
              <th className="step-actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {steps && steps.map((step) => (
              <tr
                key={step.id}
                className="test-step-row"
                draggable={!isGeneratingSteps && !isRunning}
                onDragStart={(e) => handleDragStart(e, step)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, step)}
              >
                <td className={`drag-handle-cell ${(isGeneratingSteps || isRunning) ? 'disabled' : ''}`}>
                  <FontAwesomeIcon icon={faGripVertical} className="drag-handle" />
                </td>
                <td className="step-description-cell">
                  {step.description}
                </td>
                <td className="step-action-cell">
                  <select 
                    value={step.action || ''}
                    onChange={(e) => handleActionChange(step.id, e.target.value)}
                    className="action-select"
                  >
                    <option value="">Select Action</option>
                    {STEP_ACTIONS.map((action) => (
                      <option key={action} value={action}>
                        {action.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="step-locator-cell">
                  <div className="element-locator-container">
                    <input
                      type="text"
                      className="element-path-input"
                      placeholder="Element path (e.g., //input[@id='username'])"
                      value={step.element_path || ''}
                      onChange={(e) => handleElementPathChange(step.id, e.target.value)}
                    />
                    <button 
                      className="test-locator-button"
                      onClick={() => handleTestLocator(step.id, step.element_path)}
                      title="Test locator"
                      disabled={!step.element_path || !selectedEnvironment || isTestingLocator}
                    >
                      <FontAwesomeIcon icon={faSearch} spin={isTestingLocator} />
                      {isTestingLocator ? ' Testing...' : ' Test'}
                    </button>
                    <FontAwesomeIcon 
                      icon={faQuestionCircle} 
                      className="locator-help-icon" 
                      onClick={() => toggleLocatorTooltip(step.id)}
                      title="Show locator examples"
                    />
                    {locatorValidationStatus[step.id] && (
                      <span className={`locator-status ${locatorValidationStatus[step.id].status}`}>
                        <FontAwesomeIcon icon={locatorValidationStatus[step.id].status === 'valid' ? faCheckCircle : faTimesCircle} />
                        {' '}{locatorValidationStatus[step.id].message}
                      </span>
                    )}
                    {locatorTooltipStep === step.id && (
                      <div className="locator-info-tooltip" ref={locatorTooltipRef}>
                        <h4>Locator Examples:</h4>
                        <ul>
                          {getLocatorExamples().map((example, index) => (
                            <li key={index}>
                              <strong>{example.type}:</strong> <code>{example.example}</code>
                              <br />
                              <span className="locator-example-description">{example.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </td>
                <td className="step-value-cell">
                  <div className="action-input-container">
                    <input
                      ref={el => inputRefs.current[step.id] = el}
                      type="text"
                      className="action-input"
                      placeholder="Value"
                      value={stepValues[step.id] || step.value || ''}
                      onChange={(e) => handleValueChange(step.id, e.target.value, step.action)}
                      onFocus={(e) => handleInputFocus(step.id, e)}
                      onClick={(e) => handleInputClick(step.id, e)}
                      onKeyUp={handleInputKeyUp}
                    />
                    <button 
                      className="env-vars-button"
                      onClick={toggleEnvVarsDropdown}
                      title="Insert environment variable"
                      disabled={!selectedEnvironment}
                    >
                      <FontAwesomeIcon icon={faCode} />
                    </button>
                    
                    {showEnvVarsDropdown && activeInputStepId === step.id && selectedEnvironment && (
                      <div className="env-vars-dropdown" ref={envVarsDropdownRef}>
                        <div className="env-vars-dropdown-header">
                          Environment Variables
                        </div>
                        <div 
                          className="env-vars-dropdown-item"
                          onClick={() => insertEnvVariable('base_url')}
                        >
                          <div className="env-var-item-content">
                            <span className="env-var-name">base_url</span>
                            <span className="env-var-description">Base URL of the environment</span>
                          </div>
                        </div>
                        <div 
                          className="env-vars-dropdown-item"
                          onClick={() => insertEnvVariable('login')}
                        >
                          <div className="env-var-item-content">
                            <span className="env-var-name">login</span>
                            <span className="env-var-description">Login username</span>
                          </div>
                        </div>
                        <div 
                          className="env-vars-dropdown-item"
                          onClick={() => insertEnvVariable('password')}
                        >
                          <div className="env-var-item-content">
                            <span className="env-var-name">password</span>
                            <span className="env-var-description">Login password</span>
                          </div>
                        </div>
                        {environments.find(env => env.id.toString() === selectedEnvironment)?.custom_variables?.map((customVar, index) => (
                          <div 
                            key={index}
                            className="env-vars-dropdown-item"
                            onClick={() => insertEnvVariable(customVar.name)}
                          >
                            <div className="env-var-item-content">
                              <span className="env-var-name">{customVar.name}</span>
                              <span className="env-var-description">Custom variable</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="step-actions-cell">
                  <button 
                    className="view-screenshot-button"
                    onClick={() => handleViewScreenshot(step.id)}
                    title="View screenshot"
                    disabled={!stepsWithScreenshots[step.id]}
                  >
                    <FontAwesomeIcon icon={faImage} />
                  </button>
                  <button 
                    className="delete-step-button"
                    onClick={() => handleDeleteStepClick(step)}
                    title="Delete step"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Screenshot Modal */}
      {showScreenshotModal && (
        <div className="modal-overlay">
          <div 
            className={`modal-content screenshot-modal ${isZoomed ? 'zoomed-modal' : ''}`}
            style={{
              width: isZoomed && imageSize.width > 0 ? 
                `min(95vw, ${Math.max(800, Math.min(imageSize.width * 1.8, window.innerWidth * 0.95))}px)` : 
                undefined,
              maxHeight: isZoomed && imageSize.height > 0 ? 
                `min(95vh, ${Math.max(600, Math.min(imageSize.height * 1.5, window.innerHeight * 0.95))}px)` : 
                undefined
            }}
          >
            <div className="modal-header">
              <h3>Screenshot</h3>
              <button 
                onClick={() => setShowScreenshotModal(false)} 
                className="modal-close-button"
                title="Close"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
              </button>
            </div>
            <div className="screenshot-container">
              {screenshotLoading ? (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <span>Loading screenshot...</span>
                </div>
              ) : screenshotError ? (
                <div className="error-message">
                  <p>Error loading screenshot: {screenshotError}</p>
                </div>
              ) : currentScreenshot ? (
                <>
                  {currentScreenshot.description && (
                    <p className="screenshot-description">{currentScreenshot.description}</p>
                  )}
                  <div className="screenshot-image-container">
                    <img 
                      src={`data:image/png;base64,${currentScreenshot.screenshot}`} 
                      alt="Test step screenshot" 
                      className={`step-screenshot ${isZoomed ? 'zoomed' : ''}`}
                      onClick={handleImageClick}
                      onLoad={handleImageLoad}
                      title={isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
                      style={isZoomed ? {
                        transformOrigin: `${zoomPosition.x * 100}% ${zoomPosition.y * 100}%`
                      } : undefined}
                    />
                  </div>
                </>
              ) : (
                <div className="no-screenshot">No screenshot available</div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowScreenshotModal(false)} className="modal-button cancel">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Test Results Table */}
      <h3>Test Results</h3>
      <table className="test-results-table">
        <thead>
          <tr>
            <th>Run ID</th>
            <th>Duration (s)</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {test_runs.map((run) => (
            <tr key={run.id}>
              <td>{run.id}</td>
              <td>{run.duration !== null ? run.duration.toFixed(2) : 'N/A'}</td>
              <td className={run.result.toLowerCase()}>{run.result}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Test Runs</h3>
      <div className="test-runs-list">
        {test_runs.map((run) => (
          <div key={run.id} className={`test-run-item ${run.result.toLowerCase()}`}>
            <div className="test-run-header" onClick={() => toggleRunDetails(run.id)}>
              <span className="test-run-id">Run ID: {run.id}</span>
              <span className={`test-run-result ${run.result.toLowerCase()}`}>
                {run.result}
              </span>
              <button className="toggle-details-btn">
                {expandedRuns[run.id] ? '▲' : '▼'}
              </button>
            </div>
            {expandedRuns[run.id] && (
              <div className="test-run-details">
                <div>
                  <strong>Date:</strong> {run.run_date}
                </div>
                <div>
                  <strong>Duration:</strong> {run.duration !== null ? run.duration.toFixed(2) : 'N/A'} seconds
                </div>
                {run.exception && (
                  <div>
                    <strong>Exception:</strong> {run.exception}
                  </div>
                )}
                {run.stdout && (
                  <div className="test-run-output">
                    <strong>Output:</strong>
                    <pre>{run.stdout}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestCaseSteps;
