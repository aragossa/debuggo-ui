import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, faTrash, faChevronDown, faChevronRight, faCamera, faPlay,
    faFolder, faFolderOpen, faFileAlt, faCog, faCheckCircle, faTimesCircle,
    faHourglassHalf, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './TestExecutionsTree.css';

const TestExecutionsTree = ({ selectedProjectId }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState({});
    const [testRunDetails, setTestRunDetails] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newExecution, setNewExecution] = useState({ name: '', description: '' });
    const [showScreenshotModal, setShowScreenshotModal] = useState(false);
    const [currentScreenshotUrl, setCurrentScreenshotUrl] = useState(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const fetchExecutions = async () => {
        if (!selectedProjectId) {
            setExecutions([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/projects/${selectedProjectId}/test-executions`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setExecutions(data.executions || []);
            } else {
                setError('Failed to fetch test executions');
            }
        } catch (err) {
            setError('Error fetching test executions');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const createExecution = async () => {
        if (!newExecution.name.trim()) {
            alert('Please enter a name for the execution');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/test-executions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    name: newExecution.name,
                    description: newExecution.description,
                    project_id: selectedProjectId
                })
            });

            if (response.ok) {
                setShowCreateModal(false);
                setNewExecution({ name: '', description: '' });
                fetchExecutions();
            } else {
                const error = await response.json();
                alert(`Failed to create execution: ${error.detail}`);
            }
        } catch (err) {
            alert('Error creating execution');
            console.error('Error:', err);
        }
    };

    const updateExecutionStatus = async (executionId, status) => {
        try {
            const response = await fetch(`${API_URL}/api/test-executions/${executionId}/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                fetchExecutions();
            } else {
                const error = await response.json();
                alert(`Failed to update status: ${error.detail}`);
            }
        } catch (err) {
            alert('Error updating status');
            console.error('Error:', err);
        }
    };

    const deleteExecution = async (executionId, executionName) => {
        if (!window.confirm(`Are you sure you want to delete execution "${executionName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/test-executions/${executionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                fetchExecutions();
            } else {
                const error = await response.json();
                alert(`Failed to delete execution: ${error.detail}`);
            }
        } catch (err) {
            alert('Error deleting execution');
            console.error('Error:', err);
        }
    };

    const toggleNode = async (nodeId, nodeType, parentId = null) => {
        const isExpanded = expandedNodes[nodeId];
        
        if (!isExpanded && nodeType === 'execution') {
            // Fetch test runs for execution
            try {
                const response = await fetch(`${API_URL}/api/test-executions/${nodeId}/test-runs`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    setTestRunDetails(prev => ({
                        ...prev,
                        [nodeId]: data.test_cases || []
                    }));
                }
            } catch (err) {
                console.error('Error fetching test runs:', err);
            }
        } else if (!isExpanded && nodeType === 'testrun') {
            // Fetch test steps for test run
            try {
                const response = await fetch(`${API_URL}/api/test_run/${nodeId}/steps`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    setTestRunDetails(prev => ({
                        ...prev,
                        [`steps_${nodeId}`]: data.steps || []
                    }));
                }
            } catch (err) {
                console.error('Error fetching test run steps:', err);
                setTestRunDetails(prev => ({
                    ...prev,
                    [`steps_${nodeId}`]: []
                }));
            }
        }

        setExpandedNodes(prev => ({
            ...prev,
            [nodeId]: !isExpanded
        }));
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'passed': case 'completed': case 'done':
                return { icon: faCheckCircle, className: 'status-icon-success' };
            case 'failed': case 'error':
                return { icon: faTimesCircle, className: 'status-icon-error' };
            case 'running': case 'in progress':
                return { icon: faHourglassHalf, className: 'status-icon-running' };
            case 'skipped':
                return { icon: faExclamationTriangle, className: 'status-icon-warning' };
            default:
                return { icon: faHourglassHalf, className: 'status-icon-default' };
        }
    };

    const viewScreenshot = async (stepId) => {
        try {
            console.log(`Requesting screenshot for step ID: ${stepId}`);
            
            // Use full API URL to avoid routing issues
            const response = await fetch(`${API_URL}/api/test_step_screenshot/${stepId}`, {
                headers: getAuthHeaders()
            });
            
            console.log(`Screenshot response status: ${response.status}`);
            console.log(`Screenshot response content-type: ${response.headers.get('content-type')}`);
            console.log(`Screenshot response headers:`, [...response.headers.entries()]);
            
            // Check if response is JSON (error response)
            if (response.headers.get('content-type')?.includes('application/json')) {
                const data = await response.json();
                console.log('Screenshot JSON response:', data);
                if (!data.screenshot_available) {
                    alert(`Screenshot not available: ${data.message || 'Unknown reason'}`);
                    return;
                }
            }

            if (response.ok && !response.headers.get('content-type')?.includes('application/json')) {
                const blob = await response.blob();
                console.log(`Screenshot blob size: ${blob.size} bytes, type: ${blob.type}`);
                
                if (blob.size === 0) {
                    alert('Screenshot is empty - no image data received');
                    return;
                }
                
                // Check if blob is actually an image
                if (!blob.type.startsWith('image/')) {
                    console.error('Invalid blob type received:', blob.type);
                    // Try to read as text to see what we got
                    const text = await blob.text();
                    console.error('Blob content:', text.substring(0, 500));
                    alert('Invalid image data received from server');
                    return;
                }
                
                const imageUrl = URL.createObjectURL(blob);
                console.log(`Created object URL: ${imageUrl}`);
                
                // Show in modal instead of new window
                setCurrentScreenshotUrl(imageUrl);
                setShowScreenshotModal(true);
            } else {
                console.error('Screenshot request failed:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error response body:', errorText);
                alert('Screenshot not available for this step');
            }
        } catch (err) {
            console.error('Error viewing screenshot:', err);
            alert('Error loading screenshot');
        }
    };

    const closeScreenshotModal = () => {
        if (currentScreenshotUrl) {
            URL.revokeObjectURL(currentScreenshotUrl);
        }
        setCurrentScreenshotUrl(null);
        setShowScreenshotModal(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    useEffect(() => {
        fetchExecutions();
    }, [selectedProjectId]);

    if (loading) {
        return <div className="test-executions-loading">Loading test executions...</div>;
    }

    if (error) {
        return <div className="test-executions-error">{error}</div>;
    }

    if (!selectedProjectId) {
        return <div className="test-executions-no-project">Please select a project to view test executions.</div>;
    }

    return (
        <div className="test-executions-tree">
            <div className="tree-header">
                <h2>Test Executions</h2>
                <button 
                    className="create-execution-btn"
                    onClick={() => setShowCreateModal(true)}
                >
                    <FontAwesomeIcon icon={faPlus} /> Create Execution
                </button>
            </div>

            {executions.length === 0 ? (
                <div className="tree-empty">
                    <p>No test executions found for this project.</p>
                    <button 
                        className="create-first-execution-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create your first execution
                    </button>
                </div>
            ) : (
                <div className="tree-container">
                    {executions.map(execution => (
                        <div key={execution.id} className="tree-node execution-node">
                            <div className="tree-node-header" onClick={() => toggleNode(execution.id, 'execution')}>
                                <div className="tree-node-content">
                                    <FontAwesomeIcon 
                                        icon={expandedNodes[execution.id] ? faChevronDown : faChevronRight} 
                                        className="tree-toggle-icon"
                                    />
                                    <FontAwesomeIcon 
                                        icon={expandedNodes[execution.id] ? faFolderOpen : faFolder} 
                                        className="tree-node-icon execution-icon"
                                    />
                                    <span className="tree-node-label">{execution.name}</span>
                                    <div className="tree-node-badges">
                                        <span className={`status-badge ${execution.status?.toLowerCase()?.replace(' ', '-')}`}>
                                            {execution.status}
                                        </span>
                                        <span className="count-badge">
                                            {execution.test_runs_count || 0} runs
                                        </span>
                                    </div>
                                </div>
                                <div className="tree-node-actions" onClick={(e) => e.stopPropagation()}>
                                    <select
                                        className="status-select"
                                        value={execution.status}
                                        onChange={(e) => updateExecutionStatus(execution.id, e.target.value)}
                                    >
                                        <option value="New">New</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteExecution(execution.id, execution.name)}
                                        title="Delete execution"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>

                            {execution.description && (
                                <div className="tree-node-description">
                                    {execution.description}
                                </div>
                            )}

                            <div className="tree-node-meta">
                                <span>Created: {formatDate(execution.created_at)}</span>
                                {execution.created_by_name && (
                                    <span>by {execution.created_by_name}</span>
                                )}
                            </div>

                            {expandedNodes[execution.id] && testRunDetails[execution.id] && (
                                <div className="tree-children">
                                    {testRunDetails[execution.id].map(testCase => (
                                        <div key={testCase.id} className="tree-node testcase-node">
                                            <div className="tree-node-header" onClick={() => toggleNode(testCase.id, 'testcase')}>
                                                <div className="tree-node-content">
                                                    <FontAwesomeIcon 
                                                        icon={expandedNodes[testCase.id] ? faChevronDown : faChevronRight} 
                                                        className="tree-toggle-icon"
                                                    />
                                                    <FontAwesomeIcon 
                                                        icon={faFileAlt} 
                                                        className="tree-node-icon testcase-icon"
                                                    />
                                                    <span className="tree-node-label">{testCase.name}</span>
                                                    <div className="tree-node-badges">
                                                        <span className="type-badge">{testCase.type}</span>
                                                        <span className="count-badge">{testCase.test_runs.length} runs</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedNodes[testCase.id] && (
                                                <div className="tree-children">
                                                    {testCase.test_runs.map(testRun => (
                                                        <div key={testRun.id} className="tree-node testrun-node">
                                                            <div className="tree-node-header" onClick={() => toggleNode(testRun.id, 'testrun')}>
                                                                <div className="tree-node-content">
                                                                    <FontAwesomeIcon 
                                                                        icon={expandedNodes[testRun.id] ? faChevronDown : faChevronRight} 
                                                                        className="tree-toggle-icon"
                                                                    />
                                                                    <FontAwesomeIcon 
                                                                        {...getStatusIcon(testRun.status)} 
                                                                        className={`tree-node-icon ${getStatusIcon(testRun.status).className}`}
                                                                    />
                                                                    <span className="tree-node-label">Run #{testRun.id}</span>
                                                                    <div className="tree-node-badges">
                                                                        <span className={`status-badge ${testRun.status?.toLowerCase()?.replace(' ', '-')}`}>
                                                                            {testRun.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="tree-node-meta">
                                                                    {formatDate(testRun.created_at)}
                                                                </div>
                                                            </div>

                                                            {expandedNodes[testRun.id] && testRunDetails[`steps_${testRun.id}`] && (
                                                                <div className="tree-children">
                                                                    {testRunDetails[`steps_${testRun.id}`].map((step, stepIndex) => (
                                                                        <div key={`${testRun.id}-${step.id}-${stepIndex}`} className="tree-node step-node">
                                                                            <div className="tree-node-content">
                                                                                <span className="step-number">{step.step_order || step.step_number}</span>
                                                                                <FontAwesomeIcon 
                                                                                    {...getStatusIcon(step.status)} 
                                                                                    className={`tree-node-icon ${getStatusIcon(step.status).className}`}
                                                                                />
                                                                                <span className="tree-node-label">
                                                                                    <strong>{step.action}</strong> {step.element_path || step.target}
                                                                                    {step.value && <em> "{step.value}"</em>}
                                                                                </span>
                                                                                <div className="tree-node-badges">
                                                                                    <span className={`status-badge ${step.status?.toLowerCase()?.replace(' ', '-')}`}>
                                                                                        {step.status || 'Unknown'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            {(step.screenshot_path || step.screenshot_base64) && (
                                                                                <div className="tree-node-actions">
                                                                                    <button
                                                                                        className="screenshot-btn"
                                                                                        onClick={() => viewScreenshot(step.test_step_id || step.id)}
                                                                                        title="View screenshot"
                                                                                    >
                                                                                        <FontAwesomeIcon icon={faCamera} />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Execution Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>Create Test Execution</h3>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={newExecution.name}
                                    onChange={(e) => setNewExecution(prev => ({...prev, name: e.target.value}))}
                                    placeholder="Enter execution name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newExecution.description}
                                    onChange={(e) => setNewExecution(prev => ({...prev, description: e.target.value}))}
                                    placeholder="Enter execution description (optional)"
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-create" onClick={createExecution}>
                                Create Execution
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Screenshot Modal */}
            {showScreenshotModal && currentScreenshotUrl && (
                <div className="modal-overlay screenshot-modal-overlay" onClick={closeScreenshotModal}>
                    <div className="modal screenshot-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Test Step Screenshot</h3>
                            <button className="modal-close" onClick={closeScreenshotModal}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body screenshot-modal-body">
                            <img 
                                src={currentScreenshotUrl} 
                                alt="Test step screenshot" 
                                className="screenshot-image"
                                onError={(e) => {
                                    console.error('Error loading screenshot image');
                                    console.error('Image src:', e.target.src);
                                    console.error('Current screenshot URL:', currentScreenshotUrl);
                                    alert('Error loading screenshot image. Check console for details.');
                                }}
                                onLoad={() => console.log('Screenshot image loaded successfully')}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '80vh',
                                    width: 'auto',
                                    height: 'auto',
                                    display: 'block'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestExecutionsTree;
