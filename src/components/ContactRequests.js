import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ContactRequests.css';

const ContactRequests = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  const [contactRequests, setContactRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({ id: null, loading: false, error: null });

  useEffect(() => {
    fetchContactRequests();
  }, []);

  const fetchContactRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/contact-requests`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setContactRequests(data);
    } catch (err) {
      console.error('Error fetching contact requests:', err);
      setError('Failed to load contact requests. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      setUpdateStatus({ id: requestId, loading: true, error: null });
      
      const response = await fetch(`${API_URL}/api/contact-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Update the local state to reflect the change
      setContactRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );
      
      setUpdateStatus({ id: null, loading: false, error: null });
    } catch (err) {
      console.error(`Error updating request ${requestId} status:`, err);
      setUpdateStatus({ id: requestId, loading: false, error: 'Failed to update status' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new':
        return 'status-badge new';
      case 'in-progress':
        return 'status-badge in-progress';
      case 'resolved':
        return 'status-badge resolved';
      default:
        return 'status-badge';
    }
  };

  if (isLoading) {
    return <div className="loading-container">Loading contact requests...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="contact-requests-container">
      <div className="contact-requests-header">
        <h2>Contact Requests</h2>
        <button className="refresh-button" onClick={fetchContactRequests}>
          Refresh
        </button>
      </div>
      
      {contactRequests.length === 0 ? (
        <div className="no-requests">
          <p>No contact requests found.</p>
        </div>
      ) : (
        <div className="requests-list">
          {contactRequests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h3>{request.name}</h3>
                <span className={getStatusBadgeClass(request.status)}>
                  {request.status}
                </span>
              </div>
              
              <div className="request-date">
                Submitted: {formatDate(request.created_at)}
              </div>
              
              <div className="request-message">
                {request.message}
              </div>
              
              <div className="request-actions">
                <select
                  value={request.status}
                  onChange={(e) => handleStatusChange(request.id, e.target.value)}
                  disabled={updateStatus.id === request.id && updateStatus.loading}
                  className="status-select"
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                
                {updateStatus.id === request.id && updateStatus.loading && (
                  <span className="status-updating">Updating...</span>
                )}
                
                {updateStatus.id === request.id && updateStatus.error && (
                  <span className="status-error">{updateStatus.error}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactRequests;
