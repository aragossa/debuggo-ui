// TestCaseSteps.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faStop,
  faPlus,
  faTrash,
  faPencilAlt,
  faMagic,
  faChevronDown,
  faChevronUp,
  faVial,
  faSpinner,
  faCheck,
  faTimes,
  faExclamationTriangle,
  faRobot,
  faInfoCircle,
  faCog,
  faEdit,
  faCode,
  faSearch,
  faQuestionCircle,
  faCheckCircle,
  faTimesCircle,
  faMinusCircle,
  faGripVertical,
  faImage,
  faMagicWandSparkles,
  faSignInAlt,
  faCamera
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import AIModelSelector from './AIModelSelector';
import RunningTestIndicator from './RunningTestIndicator';
import './TestCaseSteps.css';

const STEP_ACTIONS = [
  'click',
  'type',
  'select',
  'hover',
  'wait',
  'assert',
  'assert_text_contains',
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
  test_type,
  requires_preconditions,
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
  const [stepResultsPollingInterval, setStepResultsPollingInterval] = useState(null);
  const [showProjectTooltip, setShowProjectTooltip] = useState(false);
  const [showGenerateTooltip, setShowGenerateTooltip] = useState(false);
  const [showRunTooltip, setShowRunTooltip] = useState(false);
  const [showEnvTooltip, setShowEnvTooltip] = useState(false);
  const [showRunningTooltip, setShowRunningTooltip] = useState(false);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [runningTests, setRunningTests] = useState([]);
  const [runningTestsPollingInterval, setRunningTestsPollingInterval] = useState(null);
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
  const [showExecutionDropdown, setShowExecutionDropdown] = useState(false);
  const [inProgressExecutions, setInProgressExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
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
  const { user, getAuthHeaders } = useAuth();

  // Fetch running tests
  const fetchRunningTests = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/running-tests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRunningTests(data.running_tests || []);
        
        // Update local running state if current test case is running
        const currentTestRunning = data.running_tests.some(test => test.test_case_id == testCaseId);
        setIsRunning(currentTestRunning);
      }
    } catch (error) {
      console.error('Error fetching running tests:', error);
    }
  }, [API_URL, testCaseId]);

  const [showEnvVarsDropdown, setShowEnvVarsDropdown] = useState(false);
  const [activeInputStepId, setActiveInputStepId] = useState(null);
  const [activeInputPosition, setActiveInputPosition] = useState({ top: 0, left: 0 });
  const [inputCursorPosition, setInputCursorPosition] = useState(0);
  const [actionDropdownStepId, setActionDropdownStepId] = useState(null);
  const actionDropdownRefs = useRef({});
  const [selectedAIModel, setSelectedAIModel] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [forceRequirePreconditions, setForceRequirePreconditions] = useState(requires_preconditions !== undefined ? requires_preconditions : true);
  const envVarsDropdownRef = useRef(null);
  const [dependencies, setDependencies] = useState({
    preconditions: [],
    teardowns: []
  });
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const inputRefs = useRef({});
  const locatorTooltipRef = useRef(null);
  const environmentDropdownRef = React.useRef(null);
  const currentBlobUrlRef = useRef(null);

  // State for tracking steps with screenshots
  const [stepsWithScreenshots, setStepsWithScreenshots] = useState({});

  // State for step execution results
  const [stepExecutionResults, setStepExecutionResults] = useState({});
  
  // State for API step editor
  const [showApiStepEditor, setShowApiStepEditor] = useState(false);
  const [editingApiStep, setEditingApiStep] = useState(null);
  const [apiStepData, setApiStepData] = useState({
    method: 'GET',
    endpoint: '',
    body: '',
    expected_status: 200,
    headers: { "Content-Type": "application/json" },
    extract_variables: {}
  });
  
  // Local state for test runs (to allow refreshing)
  const [localTestRuns, setLocalTestRuns] = useState(test_runs || []);

  // Function to fetch step execution results for a test run
  const fetchStepExecutionResults = async (runId) => {
    try {
      const response = await fetch(`${API_URL}/api/test_run/${runId}/step_execution_results`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setStepExecutionResults(prev => ({
          ...prev,
          [runId]: data.step_results
        }));
      } else {
        console.error('Failed to fetch step execution results:', response.statusText);
        setStepExecutionResults(prev => ({
          ...prev,
          [runId]: []
        }));
      }
    } catch (error) {
      console.error('Error fetching step execution results:', error);
      setStepExecutionResults(prev => ({
        ...prev,
        [runId]: []
      }));
    }
  };

  // Function to refresh step execution results for the latest test run during execution
  const refreshLatestStepResults = async () => {
    if (!localTestRuns || localTestRuns.length === 0) return;
    
    // Get the most recent test run
    const latestRun = localTestRuns[0];
    if (latestRun && latestRun.id) {
      await fetchStepExecutionResults(latestRun.id);
    }
  };

  // Function to close screenshot modal
  const closeScreenshotModal = () => {
    console.log('closeScreenshotModal - Called');
    console.log('closeScreenshotModal - currentBlobUrlRef.current before cleanup:', currentBlobUrlRef.current);
    
    // Clean up blob URL from ref
    if (currentBlobUrlRef.current) {
      console.log('closeScreenshotModal - Revoking blob URL:', currentBlobUrlRef.current);
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
      console.log('closeScreenshotModal - Blob URL revoked and ref set to null');
    }
    
    console.log('closeScreenshotModal - Clearing React state');
    setShowScreenshotModal(false);
    setCurrentScreenshot(null);
    setScreenshotLoading(false);
    setScreenshotError(null);
    setIsZoomed(false);
    setImageSize({ width: 0, height: 0 });
    setZoomPosition({ x: 0, y: 0 });
    console.log('closeScreenshotModal - All state cleared');
  };

  // Function to open step screenshot - unified implementation for both tabs
  const openStepScreenshot = async (stepId) => {
    console.log('=== openStepScreenshot ENTRY - stepId:', stepId);
    setScreenshotLoading(true);
    setScreenshotError(null);
    setCurrentScreenshot(null);
    setIsZoomed(false);
    setImageSize({ width: 0, height: 0 });
    setZoomPosition({ x: 0, y: 0 });

    try {
      console.log('openStepScreenshot - Fetching screenshot for step:', stepId);
      const response = await fetch(`${API_URL}/api/test_step_screenshot/${stepId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      console.log('openStepScreenshot - Response status:', response.status);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('openStepScreenshot - Content-Type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('openStepScreenshot - JSON response:', data);
          if (!data.screenshot_available) {
            setScreenshotError(data.message || 'Screenshot not available');
            setShowScreenshotModal(true);
            return;
          }
        } else {
          const blob = await response.blob();
          console.log('openStepScreenshot - Blob created:', {
            size: blob.size, 
            type: blob.type
          });
          
          if (blob.size === 0) {
            setScreenshotError('Screenshot data is empty');
            setShowScreenshotModal(true);
            return;
          }
          
          // Check if blob contains base64 data instead of binary PNG
          const blobSlice = blob.slice(0, 8);
          const arrayBuffer = await blobSlice.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
          const isValidPNG = pngSignature.every((byte, index) => bytes[index] === byte);
          
          console.log('openStepScreenshot - Blob first 8 bytes:', Array.from(bytes).map(b => '0x' + b.toString(16).padStart(2, '0')));
          console.log('openStepScreenshot - Expected PNG signature:', pngSignature.map(b => '0x' + b.toString(16).padStart(2, '0')));
          console.log('openStepScreenshot - Is valid PNG?', isValidPNG);
          
          let finalBlob = blob;
          
          if (!isValidPNG) {
            // Backend sent base64 data instead of binary - decode it
            console.log('openStepScreenshot - Detected base64 data, converting to binary');
            try {
              const base64Text = await blob.text();
              console.log('openStepScreenshot - Base64 text length:', base64Text.length);
              console.log('openStepScreenshot - Base64 first 20 chars:', base64Text.substring(0, 20));
              
              // Decode base64 to binary
              const binaryString = atob(base64Text);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              // Create new blob with binary data
              finalBlob = new Blob([bytes], { type: 'image/png' });
              console.log('openStepScreenshot - Converted to binary blob:', {
                size: finalBlob.size,
                type: finalBlob.type
              });
              
              // Verify PNG signature after conversion
              const convertedSlice = finalBlob.slice(0, 8);
              const convertedBuffer = await convertedSlice.arrayBuffer();
              const convertedBytes = new Uint8Array(convertedBuffer);
              const isValidAfterConversion = pngSignature.every((byte, index) => convertedBytes[index] === byte);
              console.log('openStepScreenshot - Valid PNG after conversion?', isValidAfterConversion);
              
              if (!isValidAfterConversion) {
                setScreenshotError('Failed to convert base64 data to valid PNG');
                setShowScreenshotModal(true);
                return;
              }
            } catch (conversionError) {
              console.error('openStepScreenshot - Base64 conversion failed:', conversionError);
              setScreenshotError('Failed to process screenshot data');
              setShowScreenshotModal(true);
              return;
            }
          }
          
          // Revoke previous blob URL if it exists
          if (currentBlobUrlRef.current) {
            console.log('openStepScreenshot - Revoking previous blob URL:', currentBlobUrlRef.current);
            URL.revokeObjectURL(currentBlobUrlRef.current);
            console.log('openStepScreenshot - Previous blob URL revoked');
          }
          
          // Create new blob URL and store in ref using the final blob (converted if needed)
          const imageUrl = URL.createObjectURL(finalBlob);
          currentBlobUrlRef.current = imageUrl;
          console.log('openStepScreenshot - Created blob URL:', imageUrl);
          console.log('openStepScreenshot - Blob URL stored in ref:', currentBlobUrlRef.current);
          console.log('openStepScreenshot - About to update React state with imageUrl:', imageUrl);
          
          // Test if the blob URL is accessible by creating a test image
          const testImg = new Image();
          testImg.onload = () => {
            console.log('openStepScreenshot - Blob URL test load SUCCESS');
          };
          testImg.onerror = (e) => {
            console.error('openStepScreenshot - Blob URL test load FAILED:', e);
          };
          testImg.src = imageUrl;
          console.log('openStepScreenshot - Started blob URL test load');
          
          // Only show modal after successful blob URL creation
          setCurrentScreenshot(imageUrl);
          console.log('openStepScreenshot - React state updated, about to show modal');
          setScreenshotError(null);
          setShowScreenshotModal(true);
          console.log('openStepScreenshot - Modal state set to true');
        }
      } else {
        const errorText = await response.text();
        console.error('openStepScreenshot - Error response:', errorText);
        setScreenshotError('Failed to load screenshot');
        setShowScreenshotModal(true);
      }
    } catch (error) {
      console.error('Error loading screenshot:', error);
      setScreenshotError('Error loading screenshot');
      setShowScreenshotModal(true);
    } finally {
      setScreenshotLoading(false);
    }
  };

  // Function to check if a step has a screenshot
  const checkStepScreenshot = async (stepId) => {
    try {
      const response = await fetch(`${API_URL}/api/test_step_screenshot/${stepId}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log(`Screenshot check for step ${stepId}: status=${response.status}, ok=${response.ok}`);
      
      if (!response.ok) {
        console.log(`Screenshot not available for step ${stepId}: ${response.status}`);
        return false;
      }
      
      // If response is OK and content-type is image, screenshot exists
      const contentType = response.headers.get('content-type');
      console.log(`Step ${stepId} content-type: ${contentType}`);
      
      if (contentType && contentType.startsWith('image/')) {
        console.log(`Screenshot available for step ${stepId}`);
        return true;
      }
      
      // Try to parse as JSON for error responses
      try {
        const data = await response.json();
        console.log(`Step ${stepId} JSON response:`, data);
        
        // Check if it's the new format with screenshot_available flag
        if (data.hasOwnProperty('screenshot_available')) {
          return data.screenshot_available;
        }
        
        // Check if it's the old format with screenshot data
        return data.screenshot ? true : false;
      } catch (jsonError) {
        // If we can't parse JSON but response was OK, assume it's an image
        console.log(`Step ${stepId} - couldn't parse JSON, assuming image available`);
        return true;
      }
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
    const handleClickOutside = (event) => {
      if (envVarsDropdownRef.current && !envVarsDropdownRef.current.contains(event.target)) {
        setShowEnvVarsDropdown(false);
      }
      if (environmentDropdownRef.current && !environmentDropdownRef.current.contains(event.target)) {
        setShowEnvironmentDropdown(false);
      }
      if (!event.target.closest('.run-button-container')) {
        setShowExecutionDropdown(false);
      }
      
      // Close action dropdown when clicking outside
      if (actionDropdownStepId && 
          actionDropdownRefs.current[actionDropdownStepId] && 
          !actionDropdownRefs.current[actionDropdownStepId].contains(event.target)) {
        setActionDropdownStepId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionDropdownStepId]);

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
      console.log('Duration calculation - start:', steps_generation_start_time, 'end:', steps_generation_end_time);
      
      const startTime = new Date(steps_generation_start_time);
      const endTime = new Date(steps_generation_end_time);
      
      // Validate dates
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error('Invalid date format in duration calculation:', {
          start: steps_generation_start_time,
          end: steps_generation_end_time,
          startParsed: startTime,
          endParsed: endTime
        });
        setGenerationDuration("Invalid time");
        return;
      }
      
      let durationMs = endTime - startTime;
      console.log('Calculated duration (ms):', durationMs);
      
      // Check for unreasonable durations (more than 1 hour = likely data issue)
      if (durationMs < 0 || durationMs > 3600000) {
        console.warn('Unreasonable duration detected:', durationMs, 'ms');
        setGenerationDuration("Invalid duration");
        return;
      }
      
      // Format duration as mm:ss
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      console.log('Formatted duration:', formattedDuration);
      setGenerationDuration(formattedDuration);
    } else {
      setGenerationDuration("");
    }
  }, [steps_generation_start_time, steps_generation_end_time]);

  useEffect(() => {
    if (test_steps && Array.isArray(test_steps)) {
      // Log the test steps to debug
      console.log("Test steps received:", test_steps);
      console.log("Step has_screenshot properties:", test_steps.map(s => ({ id: s.id, has_screenshot: s.has_screenshot })));
      console.log("Current stepsWithScreenshots state:", stepsWithScreenshots);
      
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

  // Load persisted environment selection when project changes
  useEffect(() => {
    if (projectId && projectId !== 'all' && environments.length > 0) {
      const storageKey = `selectedEnvironment_${projectId}`;
      const persistedEnvironmentId = localStorage.getItem(storageKey);
      
      if (persistedEnvironmentId) {
        // Check if the persisted environment still exists in the current project
        const environmentExists = environments.some(env => env.id.toString() === persistedEnvironmentId);
        if (environmentExists) {
          setSelectedEnvironment(persistedEnvironmentId);
        } else {
          // If persisted environment doesn't exist, clear it and select first available
          localStorage.removeItem(storageKey);
          if (environments.length > 0) {
            const firstEnvId = environments[0].id.toString();
            setSelectedEnvironment(firstEnvId);
            localStorage.setItem(storageKey, firstEnvId);
          }
        }
      } else {
        // No persisted selection, select first environment and persist it
        if (environments.length > 0) {
          const firstEnvId = environments[0].id.toString();
          setSelectedEnvironment(firstEnvId);
          localStorage.setItem(storageKey, firstEnvId);
        }
      }
    }
  }, [projectId, environments]);

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

  // Update forceRequirePreconditions when prop changes
  useEffect(() => {
    setForceRequirePreconditions(requires_preconditions !== undefined ? requires_preconditions : true);
  }, [requires_preconditions]);

  // Delete a dependency
  const deleteDependency = async (dependencyId) => {
    const token = localStorage.getItem('token');
    const authHeaders = {
      'Authorization': `Bearer ${token}`
    };

    try {
      const response = await fetch(`/api/dependencies/${dependencyId}`, {
        method: 'DELETE',
        headers: authHeaders
      });

      if (response.ok) {
        console.log('✅ Dependency deleted successfully');
        // Refresh dependencies after deletion
        fetchDependencies();
      } else {
        console.error('❌ Failed to delete dependency:', response.status);
        alert('Failed to delete dependency. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error deleting dependency:', error);
      alert('Error deleting dependency. Please try again.');
    }
  };

  // Fetch test dependencies (preconditions and teardowns)
  const fetchDependencies = async () => {
    if (!testCaseId) return;
    
    console.log('🔍 Fetching dependencies for test case:', testCaseId);
    setLoadingDependencies(true);
    const token = localStorage.getItem('token');
    console.log('🔑 Auth token exists:', !!token);
    
    const authHeaders = {
      'Authorization': `Bearer ${token}`
    };

    try {
      // Fetch preconditions
      console.log('📡 Fetching preconditions...');
      const preconditionsResponse = await fetch(`/api/test-cases/${testCaseId}/dependencies?dependency_type=precondition`, {
        headers: authHeaders
      });
      console.log('📥 Preconditions response:', preconditionsResponse.status, preconditionsResponse.ok);
      
      // Fetch teardowns
      console.log('📡 Fetching teardowns...');
      const teardownsResponse = await fetch(`/api/test-cases/${testCaseId}/dependencies?dependency_type=teardown`, {
        headers: authHeaders
      });
      console.log('📥 Teardowns response:', teardownsResponse.status, teardownsResponse.ok);
      
      // Handle responses safely
      let preconditionsData = { dependencies: [] };
      let teardownsData = { dependencies: [] };
      
      // Handle preconditions response
      if (preconditionsResponse.ok) {
        const contentType = preconditionsResponse.headers.get('content-type');
        console.log('📋 Preconditions content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          try {
            preconditionsData = await preconditionsResponse.json();
          } catch (jsonError) {
            console.error('❌ Failed to parse preconditions JSON:', jsonError);
          }
        } else {
          console.error('❌ Preconditions response is not JSON, content-type:', contentType);
          const textResponse = await preconditionsResponse.text();
          console.error('📄 Actual response was:', textResponse.substring(0, 200));
        }
      } else {
        console.error('❌ Preconditions API failed:', preconditionsResponse.status);
        const errorText = await preconditionsResponse.text();
        console.error('📄 Error response:', errorText.substring(0, 200));
      }
      
      // Handle teardowns response
      if (teardownsResponse.ok) {
        const contentType = teardownsResponse.headers.get('content-type');
        console.log('📋 Teardowns content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          try {
            teardownsData = await teardownsResponse.json();
          } catch (jsonError) {
            console.error('❌ Failed to parse teardowns JSON:', jsonError);
          }
        } else {
          console.error('❌ Teardowns response is not JSON, content-type:', contentType);
          const textResponse = await teardownsResponse.text();
          console.error('📄 Actual response was:', textResponse.substring(0, 200));
        }
      } else {
        console.error('❌ Teardowns API failed:', teardownsResponse.status);
        const errorText = await teardownsResponse.text();
        console.error('📄 Error response:', errorText.substring(0, 200));
      }
      
      console.log('📋 Preconditions data:', preconditionsData);
      console.log('📋 Teardowns data:', teardownsData);
      
      setDependencies({
        preconditions: preconditionsData.dependencies || [],
        teardowns: teardownsData.dependencies || []
      });
      
      console.log('✅ Dependencies set successfully');
    } catch (error) {
      console.error('❌ Error fetching dependencies:', error);
      setDependencies({ preconditions: [], teardowns: [] });
    } finally {
      setLoadingDependencies(false);
    }
  };

  // Fetch dependencies when testCaseId changes
  useEffect(() => {
    fetchDependencies();
  }, [testCaseId]);

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
    }
  }
}, [projectId, environments]);

useEffect(() => {
  setEditedTestCase({
    name: currentTestName,
    description: currentTestDescription
  });
}, [currentTestName, currentTestDescription]);

// Fetch test runs separately when switching to results tab
useEffect(() => {
  console.log('🔄 Tab changed to:', activeTab, 'Test Case ID:', testCaseId);
  
  if (activeTab === 'results' && testCaseId) {
    console.log('🔄 Switching to results tab - fetching fresh test runs');
    
    const fetchTestRuns = async () => {
      try {
        console.log('📡 Fetching test runs from:', `${API_URL}/api/get_test_runs/${testCaseId}`);
        const response = await fetch(`${API_URL}/api/get_test_runs/${testCaseId}`, {
          headers: getAuthHeaders()
        });
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const runs = await response.json();
          console.log('✅ Received test runs:', runs.length, 'runs');
          console.log('📊 Test runs data:', runs);
          setLocalTestRuns(runs);
          console.log('✅ Updated localTestRuns state');
          
          // Fetch step results for all runs (or just the latest few)
          if (runs.length > 0) {
            // Fetch step results for the first 3 runs
            const runsToFetch = runs.slice(0, 3);
            for (const run of runsToFetch) {
              if (run.id) {
                console.log('📡 Fetching step results for run:', run.id);
                await fetchStepExecutionResults(run.id);
              }
            }
            console.log('✅ Fetched step execution results');
          }
        } else {
          console.error('❌ Failed to fetch test runs, status:', response.status);
        }
      } catch (error) {
        console.error('❌ Error fetching test runs:', error);
      }
    };
    
    fetchTestRuns();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, testCaseId, API_URL]);

// Update local test runs when prop changes
useEffect(() => {
  setLocalTestRuns(test_runs || []);
}, [test_runs]);
  
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
    if (stepResultsPollingInterval) {
      clearInterval(stepResultsPollingInterval);
      setStepResultsPollingInterval(null);
    }
    // Clean up blob URLs
    if (typeof currentScreenshot === 'string' && currentScreenshot.startsWith('blob:')) {
      URL.revokeObjectURL(currentScreenshot);
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

// Function to start polling for step execution results during test execution
const startStepResultsPolling = () => {
  // Clear any existing interval
  if (stepResultsPollingInterval) {
    clearInterval(stepResultsPollingInterval);
  }
  
  // Set up a new polling interval for step results
  const interval = setInterval(async () => {
    if (!localTestRuns || localTestRuns.length === 0) return;
    
    try {
      // Get the most recent test run
      const latestRun = localTestRuns[0];
      if (latestRun && latestRun.id && (latestRun.result === 'running' || latestRun.result === 'pending')) {
        await fetchStepExecutionResults(latestRun.id);
      } else {
        // Test is complete, stop polling
        clearInterval(stepResultsPollingInterval);
        setStepResultsPollingInterval(null);
      }
    } catch (error) {
      console.error('Error in step results polling:', error);
    }
  }, 3000);
  
  setStepResultsPollingInterval(interval);
};

  // Start polling for running tests
  useEffect(() => {
    fetchRunningTests();
    
    // Start polling every 3 seconds
    const interval = setInterval(fetchRunningTests, 3000);
    setRunningTestsPollingInterval(interval);
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchRunningTests]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      if (stepResultsPollingInterval) {
        clearInterval(stepResultsPollingInterval);
      }
      if (runningTestsPollingInterval) {
        clearInterval(runningTestsPollingInterval);
      }
    };
  }, [pollingInterval, stepResultsPollingInterval, runningTestsPollingInterval]);

  useEffect(() => {
    localStorage.setItem('generatingTestCases', JSON.stringify(generatingTestCases));
  }, [generatingTestCases]);

  // Function to stop step results polling
  const stopStepResultsPolling = () => {
    if (stepResultsPollingInterval) {
      clearInterval(stepResultsPollingInterval);
      setStepResultsPollingInterval(null);
    }
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
      
      console.log('Requested to stop test step generation');
      
      // Refresh test case to get updated timestamp
      await refreshTestCase();
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
      
      // Environment selection will be handled by the useEffect that depends on environments array
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
      
      // Update parent component with fresh test case data including updated_at
      if (typeof onTestCaseUpdate === 'function') {
        onTestCaseUpdate(data.test_name, data.test_description, data.updated_at);
      }
    } catch (error) {
      console.error('Error refreshing test case:', error);
    }
  };

  const updateRequiresPreconditions = async (newValue) => {
    try {
      const authHeaders = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/test_cases/${testCaseId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: currentTestName,
          description: currentTestDescription,
          requires_preconditions: newValue
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update requires_preconditions');
      }

      const data = await response.json();
      
      // Update parent component
      if (typeof onTestCaseUpdate === 'function') {
        onTestCaseUpdate(data.name, data.description, data.updated_at, data.requires_preconditions);
      }

      console.log('Successfully updated requires_preconditions to:', newValue);
    } catch (error) {
      console.error('Error updating requires_preconditions:', error);
      // Revert the checkbox if the save failed
      setForceRequirePreconditions(!newValue);
    }
  };

  const toggleRunDetails = (runId) => {
    setExpandedRuns((prevState) => {
      const newState = {
        ...prevState,
        [runId]: !prevState[runId],
      };
      
      // If expanding the run details and we don't have step execution results yet, fetch them
      if (newState[runId] && !stepExecutionResults[runId]) {
        fetchStepExecutionResults(runId);
      }
      
      return newState;
    });
  };

  const handleEnvironmentChange = async (environmentId) => {
    setSelectedEnvironment(environmentId);
    setShowEnvironmentDropdown(false);
    
    // Persist selected environment to localStorage with project context
    if (projectId && projectId !== 'all') {
      const storageKey = `selectedEnvironment_${projectId}`;
      localStorage.setItem(storageKey, environmentId);
    }
    
    // Notify backend about environment selection (optional - for analytics/logging)
    try {
      await fetch(`${API_URL}/api/environments/${environmentId}/select`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (error) {
      // Silent fail - this is just for tracking, not critical
      console.log('Environment selection tracking failed:', error);
    }
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

  // Fetch in-progress executions for the project
  const fetchInProgressExecutions = async () => {
    if (!projectId || projectId === 'all') {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/test-executions/in-progress`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setInProgressExecutions(data.executions || []);
      }
    } catch (error) {
      console.error('Error fetching in-progress executions:', error);
      setInProgressExecutions([]);
    }
  };

  // Handle execution selection
  const handleExecutionSelect = (execution) => {
    setSelectedExecution(execution);
    setShowExecutionDropdown(false);
  };

  // Run test with execution assignment
  const runTestWithExecution = async (executionId) => {
    const runResult = await runTest();
    
    // If test run was successful, assign it to the execution
    if (runResult && runResult.test_run_id) {
      try {
        const response = await fetch(`${API_URL}/api/test-runs/assign-to-execution`, {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            test_run_id: runResult.test_run_id,
            execution_id: executionId
          })
        });

        if (response.ok) {
          console.log('Test run assigned to execution successfully');
        }
      } catch (error) {
        console.error('Error assigning test run to execution:', error);
      }
    }
  };

  const handleRunClick = async () => {
    if (isRunning || !testCaseId || !hasTestSteps) return;
    
    // Always fetch executions and show dropdown for selection
    await fetchInProgressExecutions();
    setShowExecutionDropdown(true);
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
      
      // Start polling for step execution results if test is running
      if (result.status === 'running' || result.status === 'pending') {
        startStepResultsPolling();
      }
      
      // Refresh the test case to show the latest test run
      await refreshTestCase();
      
      // Return the result so we can get test_run_id for execution assignment
      return result;
      
    } catch (error) {
      console.error('Error running test case:', error);
      return null;
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
    
    console.log('generateSteps called with forceRequirePreconditions:', forceRequirePreconditions, 'test_type:', test_type);
    setIsGeneratingSteps(true);
    
    // Add this test case to the generating list
    setGeneratingTestCases(prev => ({
      ...prev,
      [testCaseId]: true
    }));
    
    try {
      let endpoint;
      let requestBody = {};
      
      // Check if this is an API test case
      if (test_type === 'api' || test_type === 'api_test') {
        // Use API-specific endpoint (no confirm needed for API tests)
        endpoint = `${API_URL}/api/test-cases/${testCaseId}/generate-api-steps`;
        // Send environment_id so backend uses the selected environment
        requestBody.environment_id = parseInt(selectedEnvironment);
      } else if (test_type === 'ui' && forceRequirePreconditions) {
        // Use combined UI+API generation endpoint when preconditions are forced
        console.log('Using combined generation endpoint due to forceRequirePreconditions:', forceRequirePreconditions);
        endpoint = `${API_URL}/api/test-cases/${testCaseId}/generate-combined-steps`;
        requestBody.environment_id = parseInt(selectedEnvironment);
        requestBody.force_preconditions = true;
        
        // If projectId exists and is not 'all', add it to the request body
        if (projectId && projectId !== 'all') {
          requestBody.project_id = projectId;
        }
        
        // If AI model is selected, add it to the request body
        if (selectedAIModel) {
          requestBody.ai_model_id = selectedAIModel;
        }
      } else {
        // Use regular UI test endpoint
        endpoint = confirm 
          ? `${API_URL}/api/confirm_generate_steps/${testCaseId}` 
          : `${API_URL}/api/generate_steps/${testCaseId}`;
        
        requestBody.environment_id = parseInt(selectedEnvironment);
        
        // If projectId exists and is not 'all', add it to the request body
        if (projectId && projectId !== 'all') {
          requestBody.project_id = projectId;
        }
        
        // If AI model is selected, add it to the request body
        if (selectedAIModel) {
          requestBody.ai_model_id = selectedAIModel;
        }
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate steps');
      }
      
      const result = await response.json();
      
      // For API tests and combined generation, steps are generated asynchronously via Kafka, so poll for real-time updates
      if (test_type === 'api' || test_type === 'api_test' || result.mode === 'combined') {
        let previousStepCount = 0;
        
        // Start polling to check for new steps in real-time using generation status endpoint
        const pollInterval = setInterval(async () => {
          try {
            // Use the generation status endpoint to check if still generating
            const statusResponse = await fetch(`${API_URL}/api/test_case_generation_status/${testCaseId}`, {
              headers: getAuthHeaders()
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              const currentStepCount = statusData.test_steps ? statusData.test_steps.length : 0;
              const isStillGenerating = statusData.is_generating;
              
              console.log(`Generation status: ${isStillGenerating ? 'ACTIVE' : 'COMPLETE'}, Steps: ${currentStepCount}`);
              
              // If new steps appeared, refresh the UI to show them
              if (currentStepCount > previousStepCount) {
                console.log(`New steps detected: ${currentStepCount} (was ${previousStepCount})`);
                previousStepCount = currentStepCount;
                
                // Update steps immediately in local state
                if (statusData.test_steps && Array.isArray(statusData.test_steps)) {
                  setSteps(statusData.test_steps);
                  
                  // Initialize stepValues for any new type steps
                  setStepValues(prevValues => {
                    const newValues = { ...prevValues };
                    statusData.test_steps.forEach(step => {
                      if (step.action === 'type' && step.value && !newValues[step.id]) {
                        newValues[step.id] = step.value;
                      }
                    });
                    return newValues;
                  });
                }
                
                // Also trigger parent component to refresh test case data
                if (onTestCaseUpdate) {
                  onTestCaseUpdate();
                }
              }
              
              // Check if generation is complete based on backend status
              if (!isStillGenerating) {
                console.log(`✅ API test generation COMPLETE: ${currentStepCount} steps generated`);
                clearInterval(pollInterval);
                
                setIsGeneratingSteps(false);
                setGeneratingTestCases(prev => {
                  const updated = { ...prev };
                  delete updated[testCaseId];
                  return updated;
                });
                
                // Final refresh to ensure we have all steps
                if (onTestCaseUpdate) {
                  onTestCaseUpdate();
                }
              }
            }
          } catch (error) {
            console.error('Error polling for API test steps:', error);
          }
        }, 2000); // Poll every 2 seconds for real-time updates
        
        // Set a timeout to stop polling after 5 minutes (increased from 2 minutes)
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsGeneratingSteps(false);
          setGeneratingTestCases(prev => {
            const updated = { ...prev };
            delete updated[testCaseId];
            return updated;
          });
          console.log('⏱️ API test steps generation timeout reached (5 minutes)');
        }, 300000); // 5 minutes timeout
      } else {
        // For UI tests, start polling for updates
        startPollingForUpdates();
      }
      
    } catch (error) {
      console.error('Error generating steps:', error);
      alert(`Failed to generate steps: ${error.message}`);
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
      // Close the dropdown
      setActionDropdownStepId(null);
      
      // Update local state first for immediate feedback
      setSteps(prevSteps => 
        prevSteps.map(step => 
          step.id === stepId 
            ? { ...step, action: newAction }
            : step
        )
      );
      
      // Send update to backend
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
      // Revert the state change if the API call failed
      refreshTestCase();
    }
  };
  
  const toggleActionDropdown = (stepId) => {
    setActionDropdownStepId(actionDropdownStepId === stepId ? null : stepId);
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

  const handleEditApiStep = (step) => {
    // Parse the description field which contains JSON for API steps
    try {
      const stepData = JSON.parse(step.description || '{}');
      setApiStepData({
        method: stepData.method || 'GET',
        endpoint: stepData.endpoint || '',
        body: stepData.body ? JSON.stringify(stepData.body, null, 2) : '',
        expected_status: stepData.expected_status || 200,
        headers: stepData.headers || { "Content-Type": "application/json" }, // Preserve existing headers
        extract_variables: stepData.extract_variables || {}
      });
      setEditingApiStep(step);
      setShowApiStepEditor(true);
    } catch (e) {
      console.error('Error parsing API step data:', e);
      alert('Error loading API step data');
    }
  };

  const handleSaveApiStep = async () => {
    if (!editingApiStep) return;

    try {
      // Parse body as JSON if it's not empty
      let bodyData = null;
      if (apiStepData.body.trim()) {
        try {
          bodyData = JSON.parse(apiStepData.body);
        } catch (e) {
          alert('Invalid JSON in request body');
          return;
        }
      }

      // Parse headers if it's a string
      let headersData = apiStepData.headers;
      if (typeof headersData === 'string') {
        try {
          headersData = JSON.parse(headersData);
        } catch (e) {
          alert('Invalid JSON in headers');
          return;
        }
      }

      // Parse extract_variables if it's a string
      let extractVarsData = apiStepData.extract_variables;
      if (typeof extractVarsData === 'string') {
        try {
          extractVarsData = JSON.parse(extractVarsData);
        } catch (e) {
          alert('Invalid JSON in extract variables');
          return;
        }
      }

      // Create the step description JSON - preserve all existing fields
      const descriptionData = {
        method: apiStepData.method,
        endpoint: apiStepData.endpoint,
        headers: headersData || { "Content-Type": "application/json" }, // Preserve existing headers including Authorization
        body: bodyData,
        expected_status: parseInt(apiStepData.expected_status),
        extract_variables: extractVarsData || {} // Preserve variable extraction
      };

      // Update the step
      const response = await fetch(`${API_URL}/api/update_test_step/${editingApiStep.id}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: JSON.stringify(descriptionData)
        })
      });

      if (response.ok) {
        // Close modal first
        setShowApiStepEditor(false);
        setEditingApiStep(null);
        
        // Refresh test case to get updated steps
        try {
          await refreshTestCase();
        } catch (refreshError) {
          console.error('Error refreshing steps:', refreshError);
          // Don't show alert for refresh errors since the update succeeded
        }
      } else {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        alert('Failed to update API step: ' + errorText);
      }
    } catch (error) {
      console.error('Error saving API step:', error);
      alert('Error saving API step: ' + error.message);
    }
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

  // This function is now an alias to openStepScreenshot for backward compatibility
  const handleViewScreenshot = (stepId) => {
    return openStepScreenshot(stepId);
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
      <div className="selectors-container">
        <div className="environment-selector-container">
          <div className="environment-selector-label">Environment</div>
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
      </div>
      
      <div className="test-case-header">
        <div className="test-case-title">
          <h2>{currentTestName}</h2>
          {test_type && (
            <div className={`test-type-badge-detail ${test_type}`}>
              {test_type.toUpperCase()} Test
            </div>
          )}
          <p className="test-case-id">Test Case ID: {testCaseId}</p>
          <p className="test-description">{currentTestDescription}</p>
          
          <p className="updated-at">Last updated: {formatDate(updated_at)}</p>
          {generationDuration && (
            <p className="generation-duration">Steps generation time: <span className="duration-value">{generationDuration}</span></p>
          )}
        </div>
        
        <div className={`test-steps-actions ${isRunning ? 'running' : ''}`}>

          
          <button 
            className="add-step-button action-button"
            onClick={handleAddStepClick}
            disabled={isGeneratingSteps || isRunning}
          >
            <FontAwesomeIcon icon={faPlus} /> Add Step
          </button>
          
          {test_type === 'ui' && (
            <div className="preconditions-checkbox-container">
              <label className="preconditions-checkbox">
                <input
                  type="checkbox"
                  checked={forceRequirePreconditions}
                  onChange={(e) => {
                    console.log('Preconditions checkbox clicked:', e.target.checked);
                    setForceRequirePreconditions(e.target.checked);
                    updateRequiresPreconditions(e.target.checked);
                  }}
                  disabled={isGeneratingSteps || isRunning}
                />
                <span className="preconditions-label">Requires API preconditions</span>
              </label>
            </div>
          )}
          
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
            {!isRunning ? (
              <button 
                className={`run-button action-button ${(!hasTestSteps || isGeneratingSteps) ? 'disabled' : ''}`}
                onClick={handleRunClick}
                disabled={!hasTestSteps || isGeneratingSteps}
                onMouseEnter={() => setShowRunTooltip(true)}
                onMouseLeave={() => setShowRunTooltip(false)}
              >
                <FontAwesomeIcon icon={faPlay} /> Run Test
              </button>
            ) : (
              <button 
                className="stop-button action-button"
                onClick={handleStopExecution}
                title="Stop test execution"
              >
                <FontAwesomeIcon icon={faStop} /> Stop Test
              </button>
            )}
            
            {showRunTooltip && !hasTestSteps && (
              <div className="tooltip run-tooltip">
                <FontAwesomeIcon icon={faInfoCircle} /> No test steps to run
              </div>
            )}
            
            {/* Execution Dropdown */}
            {showExecutionDropdown && (
              <div className="execution-dropdown">
                <div className="execution-dropdown-header">
                  <strong>Select Execution</strong>
                  <button 
                    className="close-dropdown-btn"
                    onClick={() => setShowExecutionDropdown(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                
                {inProgressExecutions.length > 0 ? (
                  inProgressExecutions.map(execution => (
                    <div 
                      key={execution.id}
                      className="execution-dropdown-option"
                      onClick={() => {
                        runTestWithExecution(execution.id);
                        setShowExecutionDropdown(false);
                      }}
                    >
                      <div className="execution-option-info">
                        <span className="execution-name">{execution.name}</span>
                        <div className="execution-details">
                          <span className={`execution-status ${execution.status.toLowerCase().replace(' ', '-')}`}>
                            {execution.status}
                          </span>
                          <span className="execution-date">
                            {new Date(execution.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="execution-dropdown-message">
                    <FontAwesomeIcon icon={faInfoCircle} /> No executions found for this project.
                  </div>
                )}
                
                <div className="execution-dropdown-separator"></div>
                
                <div 
                  className="execution-dropdown-option create-new"
                  onClick={() => {
                    setShowExecutionDropdown(false);
                    // TODO: Open create execution modal
                    alert('Create execution functionality coming soon!');
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} /> Create new execution
                </div>
                
                <div 
                  className="execution-dropdown-option standalone"
                  onClick={() => {
                    runTest();
                    setShowExecutionDropdown(false);
                  }}
                >
                  <FontAwesomeIcon icon={faPlay} /> Run without execution
                </div>
              </div>
            )}
          </div>
        </div>
                {/* Running Test Indicator */}
                <RunningTestIndicator 
          testCaseId={testCaseId}
          onRunningStateChange={(isRunning) => setIsRunning(isRunning)}
        />
      </div>

      {/* Test Dependencies Section - Between header and tabs */}
      {(dependencies.preconditions.length > 0 || dependencies.teardowns.length > 0) && (
        <div className="test-dependencies-section">
          {dependencies.preconditions.length > 0 && (
            <div className="dependencies-group">
              <h4 className="dependencies-title">
                <FontAwesomeIcon icon={faSignInAlt} /> Preconditions ({dependencies.preconditions.length})
              </h4>
              <div className="dependencies-list">
                {dependencies.preconditions.map((dep, index) => (
                  <div key={dep.dependency_id} className="dependency-item">
                    <span className="dependency-order">#{dep.execution_order}</span>
                    <div className="dependency-details">
                      <span className="dependency-name">{dep.prerequisite_name}</span>
                      <span className={`dependency-type-badge ${dep.prerequisite_type}`}>
                        {dep.prerequisite_type?.toUpperCase()}
                      </span>
                    </div>
                    <span className="dependency-description">{dep.prerequisite_description}</span>
                    <button 
                      className="dependency-delete-btn"
                      onClick={() => deleteDependency(dep.dependency_id)}
                      title="Remove this precondition"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {dependencies.teardowns.length > 0 && (
            <div className="dependencies-group">
              <h4 className="dependencies-title">
                <FontAwesomeIcon icon={faSignInAlt} /> Teardown ({dependencies.teardowns.length})
              </h4>
              <div className="dependencies-list">
                {dependencies.teardowns.map((dep, index) => (
                  <div key={dep.dependency_id} className="dependency-item">
                    <span className="dependency-order">#{dep.execution_order}</span>
                    <div className="dependency-details">
                      <span className="dependency-name">{dep.prerequisite_name}</span>
                      <span className={`dependency-type-badge ${dep.prerequisite_type}`}>
                        {dep.prerequisite_type?.toUpperCase()}
                      </span>
                    </div>
                    <span className="dependency-description">{dep.prerequisite_description}</span>
                    <button 
                      className="dependency-delete-btn"
                      onClick={() => deleteDependency(dep.dependency_id)}
                      title="Remove this teardown"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
          onClick={() => setActiveTab('description')}
        >
          Description
        </button>
        <button 
          className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Test Results
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'description' && (
          <div className="description-tab">
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

            <div className="test-steps-table-container">
              {test_type === 'api' ? (
                // API Test Steps Display
                <div className="api-steps-container">
                  {steps && steps.map((step, index) => {
                    let stepData;
                    try {
                      stepData = JSON.parse(step.description);
                    } catch (e) {
                      stepData = { method: 'Unknown', endpoint: step.description };
                    }
                    
                    return (
                      <div key={step.id} className="api-step-card">
                        <div className="api-step-header">
                          <span className="api-step-number">Step {index + 1}</span>
                          <span className={`api-method api-method-${stepData.method?.toLowerCase()}`}>
                            {stepData.method || 'API'}
                          </span>
                          <span className="api-endpoint">{stepData.endpoint}</span>
                        </div>
                        <div className="api-step-details">
                          {stepData.headers && (
                            <div className="api-section">
                              <strong>Headers:</strong>
                              <pre className="api-json">{JSON.stringify(stepData.headers, null, 2)}</pre>
                            </div>
                          )}
                          {stepData.body && (
                            <div className="api-section">
                              <strong>Body:</strong>
                              <pre className="api-json">{JSON.stringify(stepData.body, null, 2)}</pre>
                            </div>
                          )}
                          {stepData.expected_status && (
                            <div className="api-section">
                              <strong>Expected Status:</strong> {stepData.expected_status}
                            </div>
                          )}
                          {stepData.extract_variables && Object.keys(stepData.extract_variables).length > 0 && (
                            <div className="api-section">
                              <strong>Extract Variables:</strong>
                              <pre className="api-json">{JSON.stringify(stepData.extract_variables, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                        <div className="api-step-actions">
                          <button 
                            className="edit-api-step-btn"
                            onClick={() => handleEditApiStep(step)}
                            title="Edit API Step"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            className="delete-step-btn"
                            onClick={() => handleDeleteStepClick(step)}
                            title="Delete Step"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // UI Test Steps Display (existing table)
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
                        <div className="action-dropdown-container" ref={el => actionDropdownRefs.current[step.id] = el}>
                          <div 
                            className="action-dropdown-button"
                            onClick={() => toggleActionDropdown(step.id)}
                          >
                            <FontAwesomeIcon icon={faCog} className="action-icon" />
                            <span>
                              {step.action ? step.action.replace('_', ' ') : 'Select Action'}
                            </span>
                            <FontAwesomeIcon 
                              icon={actionDropdownStepId === step.id ? faChevronUp : faChevronDown} 
                              className="dropdown-icon" 
                            />
                          </div>
                          
                          {actionDropdownStepId === step.id && (
                            <div className="action-dropdown">
                              <div 
                                className={`action-option ${!step.action ? 'selected' : ''}`}
                                onClick={() => handleActionChange(step.id, '')}
                              >
                                <span>Select Action</span>
                              </div>
                              {STEP_ACTIONS.map((action) => (
                                <div 
                                  key={action} 
                                  className={`action-option ${step.action === action ? 'selected' : ''}`}
                                  onClick={() => handleActionChange(step.id, action)}
                                >
                                  <span>{action.replace('_', ' ')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
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
                        {step.action === 'api_request' ? (
                          <button 
                            className="edit-api-step-button"
                            onClick={() => handleEditApiStep(step)}
                          >
                            <FontAwesomeIcon icon={faEdit} /> Edit API Details
                          </button>
                        ) : (
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
                        )}
                      </td>
                      <td className="step-actions-cell">
                        {(step.has_screenshot || stepsWithScreenshots[step.id]) && (
                          <button 
                            className="view-screenshot-button"
                            onClick={() => openStepScreenshot(step.id)}
                            title="View screenshot"
                          >
                            <FontAwesomeIcon icon={faCamera} />
                          </button>
                        )}
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
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="results-tab">
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
                {localTestRuns.map((run) => (
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
              {localTestRuns.map((run) => (
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
                        <div className="test-run-exception">
                          <strong>Exception:</strong> {run.exception}
                        </div>
                      )}
                      {run.stdout && (
                        <div className="test-run-output">
                          <strong>Output:</strong>
                          <pre>{run.stdout}</pre>
                        </div>
                      )}
                      
                      {/* Step Execution Results */}
                      <div className="step-execution-results">
                        <h4>Step Execution Details</h4>
                        {stepExecutionResults[run.id] ? (
                          <div className="step-results-container">
                            {stepExecutionResults[run.id].length > 0 ? (
                              <table className="step-results-table">
                                <thead>
                                  <tr>
                                    <th>Step</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Duration</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {stepExecutionResults[run.id].map((stepResult) => (
                                    <tr key={stepResult.id} className={`step-result-row ${stepResult.status}`}>
                                      <td className="step-order">{stepResult.step_order}</td>
                                      <td className="step-description">
                                        <div className="step-action-info">
                                          <strong>{stepResult.action}</strong>
                                          {stepResult.actual_url && (
                                            <div className="step-actual-url">
                                              <strong>URL:</strong> {stepResult.method} {stepResult.actual_url}
                                            </div>
                                          )}
                                          {stepResult.element_path && (
                                            <div className="step-element-path">{stepResult.element_path}</div>
                                          )}
                                          {stepResult.value && (
                                            <div className="step-value">Value: {stepResult.value}</div>
                                          )}
                                        </div>
                                        <div className="step-description-text">
                                          {(() => {
                                            try {
                                              // Try to parse as JSON
                                              const jsonData = JSON.parse(stepResult.description);
                                              return (
                                                <pre className="step-json-description">
                                                  {JSON.stringify(jsonData, null, 2)}
                                                </pre>
                                              );
                                            } catch (e) {
                                              // If not JSON, display as regular text
                                              return stepResult.description;
                                            }
                                          })()}
                                        </div>
                                      </td>
                                      <td className="step-status">
                                        <span className={`status-indicator ${stepResult.status}`}>
                                          {stepResult.status === 'passed' && <FontAwesomeIcon icon={faCheckCircle} />}
                                          {stepResult.status === 'failed' && <FontAwesomeIcon icon={faTimesCircle} />}
                                          {stepResult.status === 'skipped' && <FontAwesomeIcon icon={faMinusCircle} />}
                                          {stepResult.status === 'running' && <FontAwesomeIcon icon={faSpinner} className="fa-spin" />}
                                          {stepResult.status}
                                        </span>
                                        {stepResult.error_message && (
                                          <div className="error-message">
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            {(() => {
                                              const message = stepResult.error_message;
                                              // Check if message contains "Response:" and try to format JSON
                                              if (message.includes('Response:')) {
                                                const parts = message.split('Response:');
                                                const beforeResponse = parts[0];
                                                const responseText = parts[1];
                                                
                                                try {
                                                  const jsonMatch = responseText.match(/\{.*\}/s);
                                                  if (jsonMatch) {
                                                    const jsonData = JSON.parse(jsonMatch[0]);
                                                    return (
                                                      <div>
                                                        <div>{beforeResponse}</div>
                                                        <div><strong>Response:</strong></div>
                                                        <pre className="response-json">
                                                          {JSON.stringify(jsonData, null, 2)}
                                                        </pre>
                                                      </div>
                                                    );
                                                  }
                                                } catch (e) {
                                                  // If JSON parsing fails, display as-is
                                                }
                                              }
                                              return message;
                                            })()}
                                          </div>
                                        )}
                                      </td>
                                      <td className="step-duration">
                                        {stepResult.execution_time_ms ? 
                                          `${stepResult.execution_time_ms}ms` : 'N/A'}
                                      </td>
                                      <td className="step-actions">
                                        {stepResult.has_screenshot && (
                                          <button 
                                            className="screenshot-btn"
                                            onClick={() => openStepScreenshot(stepResult.test_step_id)}
                                            title="View Screenshot"
                                          >
                                            <FontAwesomeIcon icon={faCamera} />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="no-step-results">
                                <p>No step execution details available for this run.</p>
                                <p>This may be an older test run from before step tracking was implemented.</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="loading-step-results">
                            <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                            Loading step execution details...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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

      {/* API Step Editor Modal */}
      {showApiStepEditor && (
        <div className="modal-overlay">
          <div className="modal-content api-step-editor-modal">
            <h3>Edit API Request Step</h3>
            <div className="form-group">
              <label>HTTP Method:</label>
              <select 
                value={apiStepData.method} 
                onChange={(e) => setApiStepData({...apiStepData, method: e.target.value})}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="form-group">
              <label>Endpoint:</label>
              <input 
                type="text" 
                value={apiStepData.endpoint} 
                onChange={(e) => setApiStepData({...apiStepData, endpoint: e.target.value})}
                placeholder="e.g., {{base_url}}/api/auth"
              />
            </div>
            <div className="form-group">
              <label>Headers (JSON):</label>
              <textarea 
                value={typeof apiStepData.headers === 'object' ? JSON.stringify(apiStepData.headers, null, 2) : apiStepData.headers} 
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setApiStepData({...apiStepData, headers: parsed});
                  } catch (err) {
                    // Allow invalid JSON while typing
                    setApiStepData({...apiStepData, headers: e.target.value});
                  }
                }}
                placeholder='{"Content-Type": "application/json", "Authorization": "Bearer {{access_token}}"}'
                rows="4"
              />
              <small className="form-help-text">Include Authorization, Content-Type, and other headers as JSON</small>
            </div>
            <div className="form-group">
              <label>Request Body (JSON):</label>
              <textarea 
                value={apiStepData.body} 
                onChange={(e) => setApiStepData({...apiStepData, body: e.target.value})}
                placeholder='{"key": "value"}'
                rows="8"
              />
            </div>
            <div className="form-group">
              <label>Expected Status Code:</label>
              <input 
                type="number" 
                value={apiStepData.expected_status} 
                onChange={(e) => setApiStepData({...apiStepData, expected_status: e.target.value})}
                placeholder="200"
              />
            </div>
            <div className="form-group">
              <label>Extract Variables (JSON):</label>
              <textarea 
                value={typeof apiStepData.extract_variables === 'object' ? JSON.stringify(apiStepData.extract_variables, null, 2) : apiStepData.extract_variables} 
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setApiStepData({...apiStepData, extract_variables: parsed});
                  } catch (err) {
                    // Allow invalid JSON while typing
                    setApiStepData({...apiStepData, extract_variables: e.target.value});
                  }
                }}
                placeholder='{"access_token": "$.token", "user_id": "$.user.id"}'
                rows="4"
              />
              <small className="form-help-text">Use JSONPath notation to extract values from response (e.g., $.token, $.user.id)</small>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowApiStepEditor(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleSaveApiStep} className="modal-button confirm">Save</button>
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
                      src={currentScreenshot}
                      alt="Test step screenshot" 
                      className={`step-screenshot ${isZoomed ? 'zoomed' : ''}`}
                      onClick={handleImageClick}
                      onLoad={(e) => {
                        console.log('Image loaded successfully:', e.target.src);
                        console.log('Image onLoad - currentBlobUrlRef.current:', currentBlobUrlRef.current);
                        console.log('Image onLoad - currentScreenshot state:', currentScreenshot);
                        handleImageLoad(e);
                      }}
                      onError={(e) => {
                        console.error('Image failed to load:', e.target.src);
                        console.error('Image onError - currentBlobUrlRef.current:', currentBlobUrlRef.current);
                        console.error('Image onError - currentScreenshot state:', currentScreenshot);
                        console.error('Image onError - Blob URL same as ref?', e.target.src === currentBlobUrlRef.current);
                        console.error('Image onError - Blob URL same as state?', e.target.src === currentScreenshot);
                        console.error('Image error event:', e);
                        setScreenshotError('Failed to display screenshot image');
                      }}
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
              <button onClick={() => {
                setShowScreenshotModal(false);
                setCurrentScreenshot(null);
              }} className="modal-button cancel">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCaseSteps;
