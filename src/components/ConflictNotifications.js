import React, { useState, useEffect } from 'react';
import './ConflictNotifications.css';

const ConflictNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState(null);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 10 seconds
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:9000/api/conflict-notifications/pending', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching conflict notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:9000/api/conflict-notifications/${notificationId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('✅ Conflict resolution approved! Test generation will resume.');
                setSelectedNotification(null);
                fetchNotifications(); // Refresh list
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail || 'Failed to approve'}`);
            }
        } catch (error) {
            console.error('Error approving conflict:', error);
            alert('Error approving conflict resolution');
        }
    };

    const handleReject = async (notificationId) => {
        if (!window.confirm('Are you sure you want to reject this conflict resolution? Test generation will be cancelled.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:9000/api/conflict-notifications/${notificationId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('❌ Conflict resolution rejected. Test generation cancelled.');
                setSelectedNotification(null);
                fetchNotifications(); // Refresh list
            } else {
                const error = await response.json();
                alert(`Error: ${error.detail || 'Failed to reject'}`);
            }
        } catch (error) {
            console.error('Error rejecting conflict:', error);
            alert('Error rejecting conflict resolution');
        }
    };

    if (loading) {
        return <div className="conflict-notifications-loading">Loading notifications...</div>;
    }

    if (notifications.length === 0) {
        return (
            <div className="conflict-notifications-empty">
                <i className="fas fa-check-circle"></i>
                <h3>No Pending Conflicts</h3>
                <p>All API test generations are running smoothly!</p>
            </div>
        );
    }

    return (
        <div className="conflict-notifications-container">
            <div className="conflict-notifications-header">
                <h2>
                    <i className="fas fa-exclamation-triangle"></i>
                    API Documentation Conflicts
                </h2>
                <span className="conflict-count">{notifications.length} pending</span>
            </div>

            <div className="conflict-notifications-list">
                {notifications.map(notification => (
                    <div key={notification.id} className="conflict-notification-card">
                        <div className="conflict-card-header">
                            <div className="conflict-test-info">
                                <h3>{notification.test_case_name}</h3>
                                <span className="conflict-step-badge">Step {notification.step_number}</span>
                                <span className={`conflict-type-badge ${notification.conflict_type}`}>
                                    {notification.conflict_type}
                                </span>
                            </div>
                            <button 
                                className="conflict-details-btn"
                                onClick={() => setSelectedNotification(
                                    selectedNotification?.id === notification.id ? null : notification
                                )}
                            >
                                {selectedNotification?.id === notification.id ? 'Hide Details' : 'View Details'}
                            </button>
                        </div>

                        <div className="conflict-summary">
                            <p><strong>Issue:</strong> {notification.conflict_description}</p>
                        </div>

                        {selectedNotification?.id === notification.id && (
                            <div className="conflict-details">
                                <div className="conflict-section">
                                    <h4>Request Details</h4>
                                    <div className="conflict-code-block">
                                        <div><strong>Method:</strong> {notification.request.method}</div>
                                        <div><strong>Endpoint:</strong> {notification.request.endpoint}</div>
                                        {notification.request.body && (
                                            <div>
                                                <strong>Body:</strong>
                                                <pre>{JSON.stringify(notification.request.body, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="conflict-comparison">
                                    <div className="conflict-expected">
                                        <h4>📖 Expected (Documentation)</h4>
                                        <div className="status-badge expected">
                                            Status: {notification.expected_status}
                                        </div>
                                    </div>

                                    <div className="conflict-arrow">→</div>

                                    <div className="conflict-actual">
                                        <h4>🔍 Actual (Reality)</h4>
                                        <div className="status-badge actual">
                                            Status: {notification.actual_status}
                                        </div>
                                        <div className="response-preview">
                                            <pre>{JSON.stringify(notification.actual_response, null, 2)}</pre>
                                        </div>
                                    </div>
                                </div>

                                <div className="conflict-resolution">
                                    <h4>💡 Suggested Resolution</h4>
                                    <p>{notification.suggested_resolution}</p>
                                    <div className="corrected-expectation">
                                        <strong>Corrected Expected Status:</strong> {notification.corrected_expected_status}
                                    </div>
                                </div>

                                <div className="conflict-actions">
                                    <button 
                                        className="btn-approve"
                                        onClick={() => handleApprove(notification.id)}
                                    >
                                        <i className="fas fa-check"></i>
                                        Apply Corrected Result & Continue
                                    </button>
                                    <button 
                                        className="btn-reject"
                                        onClick={() => handleReject(notification.id)}
                                    >
                                        <i className="fas fa-times"></i>
                                        Cancel Test Generation
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConflictNotifications;
