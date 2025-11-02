// UserRequests.js - Component for users to submit and view their bug reports and feature requests
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBug,
  faLightbulb,
  faPlus,
  faTimes,
  faExclamationCircle,
  faCheckCircle,
  faSpinner,
  faClock,
  faCheck,
  faBan,
  faArrowUp,
  faQuestion
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './UserRequests.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

const REQUEST_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: faBug, color: '#e74c3c' },
  { value: 'feature', label: 'Feature Request', icon: faLightbulb, color: '#3498db' },
  { value: 'improvement', label: 'Improvement', icon: faArrowUp, color: '#f39c12' },
  { value: 'question', label: 'Question', icon: faQuestion, color: '#9b59b6' }
];

const STATUS_CONFIG = {
  'new': { label: 'New', icon: faClock, color: '#3498db' },
  'in_progress': { label: 'In Progress', icon: faSpinner, color: '#f39c12' },
  'resolved': { label: 'Resolved', icon: faCheckCircle, color: '#2ecc71' },
  'closed': { label: 'Closed', icon: faCheck, color: '#95a5a6' },
  'rejected': { label: 'Rejected', icon: faBan, color: '#e74c3c' }
};

const UserRequests = () => {
  const { getAuthHeaders } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    request_type: 'bug',
    priority: 'medium',
    page_url: window.location.href,
    browser_info: getBrowserInfo()
  });
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let version = 'Unknown';
    
    if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Safari';
      version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    }
    
    const os = navigator.platform;
    return `${browserName} ${version} on ${os}`;
  }

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/user-requests/my`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/user-requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({
          title: '',
          description: '',
          request_type: 'bug',
          priority: 'medium',
          page_url: window.location.href,
          browser_info: getBrowserInfo()
        });
        fetchMyRequests();
      } else {
        alert('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getTypeConfig = (type) => {
    return REQUEST_TYPES.find(t => t.value === type) || REQUEST_TYPES[0];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="user-requests-container">
      <div className="user-requests-header">
        <div className="header-content">
          <h2>
            <FontAwesomeIcon icon={faBug} /> Bug Reports & Feature Requests
          </h2>
          <p className="header-subtitle">Submit bugs, request features, or ask questions</p>
        </div>
        <button className="submit-request-btn" onClick={() => setShowModal(true)}>
          <FontAwesomeIcon icon={faPlus} /> Submit New Request
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Loading your requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <FontAwesomeIcon icon={faExclamationCircle} size="3x" />
          <h3>No Requests Yet</h3>
          <p>You haven't submitted any bug reports or feature requests yet.</p>
          <button className="submit-request-btn" onClick={() => setShowModal(true)}>
            <FontAwesomeIcon icon={faPlus} /> Submit Your First Request
          </button>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map(request => {
            const typeConfig = getTypeConfig(request.request_type);
            const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.new;
            
            return (
              <div 
                key={request.id} 
                className="request-card"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="request-card-header">
                  <div className="request-type" style={{ backgroundColor: typeConfig.color }}>
                    <FontAwesomeIcon icon={typeConfig.icon} />
                    <span>{typeConfig.label}</span>
                  </div>
                  <div className="request-status" style={{ color: statusConfig.color }}>
                    <FontAwesomeIcon icon={statusConfig.icon} />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>
                
                <h3 className="request-title">{request.title}</h3>
                
                <p className="request-description">
                  {request.description.length > 150 
                    ? `${request.description.substring(0, 150)}...` 
                    : request.description}
                </p>
                
                <div className="request-meta">
                  <span className="request-priority priority-{request.priority}">
                    Priority: {request.priority}
                  </span>
                  <span className="request-date">
                    {formatDate(request.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Request Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FontAwesomeIcon icon={faPlus} /> Submit New Request
              </h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="request-form">
              <div className="form-group">
                <label>Request Type *</label>
                <div className="type-selector">
                  {REQUEST_TYPES.map(type => (
                    <label 
                      key={type.value} 
                      className={`type-option ${formData.request_type === type.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="request_type"
                        value={type.value}
                        checked={formData.request_type === type.value}
                        onChange={handleInputChange}
                      />
                      <div className="type-option-content" style={{ borderColor: type.color }}>
                        <FontAwesomeIcon icon={type.icon} style={{ color: type.color }} />
                        <span>{type.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief summary of the issue or request"
                  required
                  maxLength={255}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide detailed information about the bug or feature request"
                  required
                  rows={6}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="page_url">Page URL</label>
                  <input
                    type="text"
                    id="page_url"
                    name="page_url"
                    value={formData.page_url}
                    onChange={handleInputChange}
                    placeholder="URL where the issue occurred"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="browser_info">Browser Info</label>
                <input
                  type="text"
                  id="browser_info"
                  name="browser_info"
                  value={formData.browser_info}
                  onChange={handleInputChange}
                  readOnly
                  className="readonly-input"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Submitting...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} /> Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedRequest.title}</h2>
                <div className="request-meta-header">
                  <span className={`badge badge-${selectedRequest.request_type}`}>
                    <FontAwesomeIcon icon={getTypeConfig(selectedRequest.request_type).icon} />
                    {getTypeConfig(selectedRequest.request_type).label}
                  </span>
                  <span className={`badge badge-status badge-${selectedRequest.status}`}>
                    <FontAwesomeIcon icon={STATUS_CONFIG[selectedRequest.status]?.icon} />
                    {STATUS_CONFIG[selectedRequest.status]?.label}
                  </span>
                  <span className={`badge badge-priority-${selectedRequest.priority}`}>
                    {selectedRequest.priority}
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedRequest(null)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Description</h3>
                <p className="detail-text">{selectedRequest.description}</p>
              </div>

              {selectedRequest.page_url && (
                <div className="detail-section">
                  <h3>Page URL</h3>
                  <a href={selectedRequest.page_url} target="_blank" rel="noopener noreferrer" className="detail-link">
                    {selectedRequest.page_url}
                  </a>
                </div>
              )}

              {selectedRequest.browser_info && (
                <div className="detail-section">
                  <h3>Browser Information</h3>
                  <p className="detail-text">{selectedRequest.browser_info}</p>
                </div>
              )}

              {selectedRequest.admin_notes && (
                <div className="detail-section admin-notes">
                  <h3>Admin Notes</h3>
                  <p className="detail-text">{selectedRequest.admin_notes}</p>
                </div>
              )}

              <div className="detail-section">
                <h3>Timeline</h3>
                <div className="timeline">
                  <div className="timeline-item">
                    <strong>Created:</strong> {formatDate(selectedRequest.created_at)}
                  </div>
                  <div className="timeline-item">
                    <strong>Last Updated:</strong> {formatDate(selectedRequest.updated_at)}
                  </div>
                  {selectedRequest.resolved_at && (
                    <div className="timeline-item">
                      <strong>Resolved:</strong> {formatDate(selectedRequest.resolved_at)}
                      {selectedRequest.resolved_by_email && ` by ${selectedRequest.resolved_by_email}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRequests;
