import React, { useState, useEffect } from 'react';
import './TestDependencies.css';

const TestDependencies = ({ testCaseId, onClose }) => {
    const [dependencies, setDependencies] = useState([]);
    const [availableTestCases, setAvailableTestCases] = useState([]);
    const [selectedDependencyType, setSelectedDependencyType] = useState('precondition');
    const [selectedTestCase, setSelectedTestCase] = useState('');
    const [executionOrder, setExecutionOrder] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDependencies();
        fetchAvailableTestCases();
    }, [testCaseId, selectedDependencyType]);

    const fetchDependencies = async () => {
        try {
            const response = await fetch(`/api/test-cases/${testCaseId}/dependencies?dependency_type=${selectedDependencyType}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setDependencies(data.dependencies || []);
            } else {
                setError('Failed to fetch dependencies');
            }
        } catch (err) {
            setError('Error fetching dependencies: ' + err.message);
        }
    };

    const fetchAvailableTestCases = async () => {
        try {
            const response = await fetch('/api/get_test_cases', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Filter out the current test case and existing dependencies
                const existingDependencyIds = dependencies.map(dep => dep.prerequisite_test_case_id);
                const filtered = data.filter(tc => 
                    tc.id !== testCaseId && 
                    !existingDependencyIds.includes(tc.id)
                );
                setAvailableTestCases(filtered);
            }
        } catch (err) {
            setError('Error fetching test cases: ' + err.message);
        }
    };

    const addDependency = async () => {
        if (!selectedTestCase) {
            setError('Please select a test case');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/test-cases/${testCaseId}/dependencies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    prerequisite_test_case_id: parseInt(selectedTestCase),
                    dependency_type: selectedDependencyType,
                    execution_order: executionOrder
                })
            });

            if (response.ok) {
                await fetchDependencies();
                await fetchAvailableTestCases();
                setSelectedTestCase('');
                setExecutionOrder(dependencies.length + 1);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to add dependency');
            }
        } catch (err) {
            setError('Error adding dependency: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const removeDependency = async (prerequisiteTestCaseId) => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`/api/test-cases/${testCaseId}/dependencies/${prerequisiteTestCaseId}?dependency_type=${selectedDependencyType}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                await fetchDependencies();
                await fetchAvailableTestCases();
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to remove dependency');
            }
        } catch (err) {
            setError('Error removing dependency: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="test-dependencies-modal">
            <div className="test-dependencies-content">
                <div className="test-dependencies-header">
                    <h3>Manage Test Dependencies</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="dependency-type-selector">
                    <label>
                        <input
                            type="radio"
                            value="precondition"
                            checked={selectedDependencyType === 'precondition'}
                            onChange={(e) => setSelectedDependencyType(e.target.value)}
                        />
                        Preconditions (run before)
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="teardown"
                            checked={selectedDependencyType === 'teardown'}
                            onChange={(e) => setSelectedDependencyType(e.target.value)}
                        />
                        Teardown (run after)
                    </label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="add-dependency-section">
                    <h4>Add New {selectedDependencyType}</h4>
                    <div className="add-dependency-form">
                        <select
                            value={selectedTestCase}
                            onChange={(e) => setSelectedTestCase(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Select a test case...</option>
                            {availableTestCases.map(tc => (
                                <option key={tc.id} value={tc.id}>
                                    {tc.name} ({tc.test_type?.toUpperCase()})
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={executionOrder}
                            onChange={(e) => setExecutionOrder(parseInt(e.target.value) || 1)}
                            min="1"
                            placeholder="Order"
                            disabled={loading}
                        />
                        <button 
                            onClick={addDependency}
                            disabled={loading || !selectedTestCase}
                        >
                            {loading ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </div>

                <div className="existing-dependencies-section">
                    <h4>Current {selectedDependencyType}s</h4>
                    {dependencies.length === 0 ? (
                        <p className="no-dependencies">No {selectedDependencyType}s configured.</p>
                    ) : (
                        <div className="dependencies-list">
                            {dependencies.map((dep, index) => (
                                <div key={dep.dependency_id} className="dependency-item">
                                    <div className="dependency-info">
                                        <span className="dependency-order">#{dep.execution_order}</span>
                                        <span className="dependency-name">{dep.prerequisite_name}</span>
                                        <span className="dependency-type-badge">
                                            {dep.prerequisite_type?.toUpperCase()}
                                        </span>
                                        <span className="dependency-description">
                                            {dep.prerequisite_description}
                                        </span>
                                    </div>
                                    <button
                                        className="remove-btn"
                                        onClick={() => removeDependency(dep.prerequisite_test_case_id)}
                                        disabled={loading}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="test-dependencies-footer">
                    <p className="info-text">
                        <strong>Preconditions</strong> execute before the main test and must pass for the test to continue.<br/>
                        <strong>Teardown</strong> actions execute after the main test completes (even if it fails).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TestDependencies;
