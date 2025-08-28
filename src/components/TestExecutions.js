import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faChevronDown, faChevronUp, faEye } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './TestExecutions.css';

const TestExecutions = ({ selectedProjectId }) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedExecutions, setExpandedExecutions] = useState({});
    const [expandedTestCases, setExpandedTestCases] = useState({});
    const [expandedTestRuns, setExpandedTestRuns] = useState({});
    const [testRunDetails, setTestRunDetails] = useState({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newExecution, setNewExecution] = useState({
        name: '',
        description: ''
    });

    // Get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    // Fetch executions for the selected project
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

    // Create new test execution
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

    // Update execution status
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

    // Delete execution
    const deleteExecution = async (executionId, executionName) => {
        if (!window.confirm(`Are you sure you want to delete execution "${executionName}"? This action cannot be undone.`)) {
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

    // Toggle execution expansion
    const toggleExecutionExpansion = async (executionId) => {
        const isExpanded = expandedExecutions[executionId];
        
        if (!isExpanded) {
            // Fetch test runs for this execution
            try {
                const response = await fetch(`${API_URL}/api/test-executions/${executionId}/test-runs`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    setTestRunDetails(prev => ({
                        ...prev,
                        [executionId]: data.test_cases || []
                    }));
                }
            } catch (err) {
                console.error('Error fetching test runs:', err);
            }
        }

        setExpandedExecutions(prev => ({
            ...prev,
            [executionId]: !isExpanded
        }));
    };

    // Toggle test case expansion
    const toggleTestCaseExpansion = (testCaseId) => {
        setExpandedTestCases(prev => ({
            ...prev,
            [testCaseId]: !prev[testCaseId]
        }));
    };

    // Toggle test run expansion (for viewing steps)
    const toggleTestRunExpansion = async (testRunId) => {
        const isExpanded = expandedTestRuns[testRunId];
        
        if (!isExpanded) {
            // Fetch test run steps using the correct endpoint
            try {
                const response = await fetch(`${API_URL}/api/test_run/${testRunId}/steps`, {
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    const data = await response.json();
                    // Add null checks to prevent errors
                    if (data && data.steps) {
                        setTestRunDetails(prev => ({
                            ...prev,
                            [`steps_${testRunId}`]: data.steps
                        }));
                    } else {
                        setTestRunDetails(prev => ({
                            ...prev,
                            [`steps_${testRunId}`]: []
                        }));
                    }
                } else {
                    console.error('Failed to fetch test run steps:', response.status);
                    setTestRunDetails(prev => ({
                        ...prev,
                        [`steps_${testRunId}`]: []
                    }));
                }
            } catch (err) {
                console.error('Error fetching test run steps:', err);
                setTestRunDetails(prev => ({
                    ...prev,
                    [`steps_${testRunId}`]: []
                }));
            }
        }

        setExpandedTestRuns(prev => ({
            ...prev,
            [testRunId]: !isExpanded
        }));
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'New':
                return 'status-new';
            case 'In Progress':
                return 'status-in-progress';
            case 'Done':
                return 'status-done';
            default:
                return 'status-new';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    // Format duration
    const formatDuration = (execution) => {
        if (!execution.started_at) return 'Not started';
        
        const startTime = new Date(execution.started_at);
        const endTime = execution.completed_at ? new Date(execution.completed_at) : new Date();
        const duration = Math.floor((endTime - startTime) / 1000); // seconds
        
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = duration % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };

    // Handle screenshot view
    const viewScreenshot = async (stepId) => {
        try {
            const response = await fetch(`/api/test_step_screenshot/${stepId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.headers.get('content-type')?.includes('application/json')) {
                const data = await response.json();
                if (!data.screenshot_available) {
                    alert('Screenshot not available for this step');
                    return;
                }
            }

            if (response.ok && !response.headers.get('content-type')?.includes('application/json')) {
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                
                // Open in new window
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                    newWindow.document.write(`
                        <html>
                            <head><title>Test Step Screenshot</title></head>
                            <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0;">
                                <img src="${imageUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                            </body>
                        </html>
                    `);
                    newWindow.document.close();
                }
            } else {
                alert('Screenshot not available for this step');
            }
        } catch (err) {
            console.error('Error viewing screenshot:', err);
            alert('Error loading screenshot');
        }
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
        <div className="test-executions">
            <div className="test-executions-header">
                <h2>Test Executions</h2>
                <button 
                    className="create-execution-btn"
                    onClick={() => setShowCreateModal(true)}
                >
                    <i className="fas fa-plus"></i> Create Execution
                </button>
            </div>

            {executions.length === 0 ? (
                <div className="no-executions">
                    <p>No test executions found for this project.</p>
                    <button 
                        className="create-first-execution-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create your first execution
                    </button>
                </div>
            ) : (
                <div className="executions-list">
                    {executions.map(execution => (
                        <div key={execution.id} className="execution-item">
                            <div className="execution-header" onClick={() => toggleExecutionExpansion(execution.id)}>
                                <div className="execution-info">
                                    <div className="execution-name">
                                        <i className={`fas fa-chevron-${expandedExecutions[execution.id] ? 'down' : 'right'}`}></i>
                                        {execution.name}
                                    </div>
                                    <div className="execution-meta">
                                        <span className={`status-badge ${getStatusBadgeClass(execution.status)}`}>
                                            {execution.status}
                                        </span>
                                        <span className="test-runs-count">
                                            {execution.test_runs_count || 0} test runs
                                        </span>
                                        <span className="execution-date">
                                            Created: {formatDate(execution.created_at)}
                                        </span>
                                    </div>
                                </div>
                                <div className="execution-actions" onClick={(e) => e.stopPropagation()}>
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
                                        className="delete-execution-btn"
                                        onClick={() => deleteExecution(execution.id, execution.name)}
                                        title="Delete execution"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>

                            {execution.description && (
                                <div className="execution-description">
                                    {execution.description}
                                </div>
                            )}

                            <div className="execution-details">
                                <div className="execution-detail-item">
                                    <strong>Duration:</strong> {formatDuration(execution)}
                                </div>
                                {execution.created_by_name && (
                                    <div className="execution-detail-item">
                                        <strong>Created by:</strong> {execution.created_by_name}
                                    </div>
                                )}
                            </div>

                            <div className="execution-test-runs">
                                <div className="test-cases-list">
                                    <h4>Test Cases ({testRunDetails[execution.id] ? testRunDetails[execution.id].length : 0})</h4>
                                    {testRunDetails[execution.id] && testRunDetails[execution.id].length > 0 ? (
                                        <>
                                            {testRunDetails[execution.id].map(testCase => (
                                                <div key={testCase.id} className="test-case-item">
                                                    <div 
                                                        className="test-case-header"
                                                        onClick={() => toggleTestCaseExpansion(testCase.id)}
                                                    >
                                                        <div className="test-case-info">
                                                            <i className={`fas fa-chevron-${expandedTestCases[testCase.id] ? 'down' : 'right'}`}></i>
                                                            <span className="test-case-name">{testCase.name}</span>
                                                            <span className="test-case-type">{testCase.type}</span>
                                                            <span className="test-runs-count">{testCase.test_runs.length} runs</span>
                                                        </div>
                                                    </div>

                                                    {expandedTestCases[testCase.id] && (
                                                        <div className="test-case-runs">
                                                            <h5>Test Runs ({testCase.test_runs.length})</h5>
                                                            {testCase.test_runs.map(testRun => (
                                                                <div key={testRun.id} className="test-run-item">
                                                                    <div 
                                                                        className="test-run-header"
                                                                        onClick={() => toggleTestRunExpansion(testRun.id)}
                                                                    >
                                                                        <div className="test-run-info">
                                                                            <i className={`fas fa-chevron-${expandedTestRuns[testRun.id] ? 'down' : 'right'}`}></i>
                                                                            <span className="test-run-name">Run #{testRun.id}</span>
                                                                            <span className={`test-run-status status-${testRun.status}`}>
                                                                                {testRun.status}
                                                                            </span>
                                                                            <span className="test-run-date">
                                                                                {formatDate(testRun.created_at)}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {expandedTestRuns[testRun.id] && testRunDetails[`steps_${testRun.id}`] && (
                                                                        <div className="test-run-steps">
                                                                            <h5>Test Steps</h5>
                                                                            {testRunDetails[`steps_${testRun.id}`].map((step, stepIndex) => (
                                                                                <div key={`${execution.id}-${testRun.id}-${step.id}-${stepIndex}`} className="test-step-item">
                                                                                    <div className="test-step-info">
                                                                                        <span className="step-number">{step.step_order || step.step_number}</span>
                                                                                        <span className="step-action">{step.action}</span>
                                                                                        <span className="step-target">{step.element_path || step.target}</span>
                                                                                        {step.value && (
                                                                                            <span className="step-value">"{step.value}"</span>
                                                                                        )}
                                                                                        <span className={`step-status ${step.status || 'unknown'}`}>
                                                                                            {step.status || 'Unknown'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="test-step-actions">
                                                                                        <button
                                                                                            className="view-screenshot-btn"
                                                                                            onClick={() => viewScreenshot(step.id)}
                                                                                            title="View screenshot"
                                                                                        >
                                                                                            <i className="fas fa-image"></i>
                                                                                        </button>
                                                                                    </div>
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
                                        </>
                                    ) : (
                                        <p>No test cases found for this execution.</p>
                                    )}
                                </div>
                            </div>
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
                                <i className="fas fa-times"></i>
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
        </div>
    );
};

export default TestExecutions;
