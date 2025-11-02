// AdminRequests.js - Admin interface for managing all user requests
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBug,
  faLightbulb,
  faArrowUp,
  faQuestion,
  faSpinner,
  faFilter,
  faCheckCircle,
  faClock,
  faCheck,
  faBan,
  faTimes,
  faSave,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './AdminRequests.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

const REQUEST_TYPES = {
  'bug': { label: 'Bug', icon: faBug, color: '#e74c3c' },
  'feature': { label: 'Feature', icon: faLightbulb, color: '#3498db' },
  'improvement': { label: 'Improvement', icon: faArrowUp, color: '#f39c12' },
  'question': { label: 'Question', icon: faQuestion, color: '#9b59b6' }
};

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', icon: faClock, color: '#3498db' },
  { value: 'in_progress', label: 'In Progress', icon: faSpinner, color: '#f39c12' },
  { value: 'resolved', label: 'Resolved', icon: faCheckCircle, color: '#2ecc71' },
  { value: 'closed', label: 'Closed', icon: faCheck, color: '#95a5a6' },
  { value: 'rejected', label: 'Rejected', icon: faBan, color: '#e74c3c' }
];

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

const AdminRequests = () => {
  const { getAuthHeaders } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusData, setStatusData] = useState({
    status: '',
    priority: '',
    admin_notes: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAllRequests();
  }, [statusFilter, typeFilter]);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status_filter', statusFilter);
      if (typeFilter) params.append('type_filter', typeFilter);

      const response = await fetch(`${API_URL}/api/user-requests/all?${params}`, {
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

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;

    setUpdating(true);
    try {
      const response = await fetch(
        `${API_URL}/api/user-requests/${selectedRequest.id}/status`,
        {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify(statusData)
        }
      );

      if (response.ok) {
        setEditingStatus(false);
        fetchAllRequests();
        // Update selected request
        const updatedRequest = { ...selectedRequest, ...statusData, updated_at: new Date().toISOString() };
        setSelectedRequest(updatedRequest);
        setStatusData({ status: '', priority: '', admin_notes: '' });
      } else {
        alert('Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Error updating request');
    } finally {
      setUpdating(false);
    }
  };

  const openEditStatus = (request) => {
    setSelectedRequest(request);
    setStatusData({
      status: request.status,
      priority: request.priority,
      admin_notes: request.admin_notes || ''
    });
    setEditingStatus(true);
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

  const getTypeConfig = (type) => REQUEST_TYPES[type] || REQUEST_TYPES.bug;
  const getStatusConfig = (status) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  return (
    <div className="admin-requests-container">
      <div className="admin-requests-header">
        <div>
          <h2>
            <FontAwesomeIcon icon={faExclamationCircle} /> All User Requests
          </h2>
          <p className="header-subtitle">Manage bug reports, feature requests, and user questions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>
            <FontAwesomeIcon icon={faFilter} /> Status
          </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>
            <FontAwesomeIcon icon={faFilter} /> Type
          </label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="improvement">Improvement</option>
            <option value="question">Question</option>
          </select>
        </div>

        <div className="filter-stats">
          <strong>{requests.length}</strong> requests
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <FontAwesomeIcon icon={faExclamationCircle} size="3x" />
          <h3>No Requests Found</h3>
          <p>No user requests match the selected filters.</p>
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Title</th>
                <th>Submitted By</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => {
                const typeConfig = getTypeConfig(request.request_type);
                const statusConfig = getStatusConfig(request.status);
                
                return (
                  <tr key={request.id} onClick={() => setSelectedRequest(request)}>
                    <td>#{request.id}</td>
                    <td>
                      <span className="type-badge" style={{ backgroundColor: typeConfig.color }}>
                        <FontAwesomeIcon icon={typeConfig.icon} />
                        {typeConfig.label}
                      </span>
                    </td>
                    <td className="title-cell">{request.title}</td>
                    <td>{request.submitted_by}</td>
                    <td>
                      <span className={`priority-badge priority-${request.priority}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge" style={{ color: statusConfig.color }}>
                        <FontAwesomeIcon icon={statusConfig.icon} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(request.created_at)}</td>
                    <td>
                      <button
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditStatus(request);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && !editingStatus && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Request #{selectedRequest.id}</h2>
                <h3 className="request-title-modal">{selectedRequest.title}</h3>
                <div className="badges-row">
                  <span className="badge badge-type" style={{ backgroundColor: getTypeConfig(selectedRequest.request_type).color }}>
                    <FontAwesomeIcon icon={getTypeConfig(selectedRequest.request_type).icon} />
                    {getTypeConfig(selectedRequest.request_type).label}
                  </span>
                  <span className="badge badge-status" style={{ color: getStatusConfig(selectedRequest.status).color }}>
                    <FontAwesomeIcon icon={getStatusConfig(selectedRequest.status).icon} />
                    {getStatusConfig(selectedRequest.status).label}
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
                <h4>Description</h4>
                <p className="detail-text">{selectedRequest.description}</p>
              </div>

              <div className="detail-row">
                <div className="detail-section">
                  <h4>Submitted By</h4>
                  <p className="detail-text">{selectedRequest.submitted_by}</p>
                </div>
                <div className="detail-section">
                  <h4>Created</h4>
                  <p className="detail-text">{formatDate(selectedRequest.created_at)}</p>
                </div>
              </div>

              {selectedRequest.page_url && (
                <div className="detail-section">
                  <h4>Page URL</h4>
                  <a href={selectedRequest.page_url} target="_blank" rel="noopener noreferrer" className="detail-link">
                    {selectedRequest.page_url}
                  </a>
                </div>
              )}

              {selectedRequest.browser_info && (
                <div className="detail-section">
                  <h4>Browser Information</h4>
                  <p className="detail-text">{selectedRequest.browser_info}</p>
                </div>
              )}

              {selectedRequest.admin_notes && (
                <div className="detail-section admin-notes">
                  <h4>Admin Notes</h4>
                  <p className="detail-text">{selectedRequest.admin_notes}</p>
                </div>
              )}

              <div className="modal-actions">
                <button className="edit-status-btn" onClick={() => openEditStatus(selectedRequest)}>
                  <FontAwesomeIcon icon={faSave} /> Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingStatus && selectedRequest && (
        <div className="modal-overlay" onClick={() => setEditingStatus(false)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Request #{selectedRequest.id}</h2>
              <button className="close-btn" onClick={() => setEditingStatus(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Status *</label>
                <div className="status-options">
                  {STATUS_OPTIONS.map(status => (
                    <label key={status.value} className={`status-option ${statusData.status === status.value ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="status"
                        value={status.value}
                        checked={statusData.status === status.value}
                        onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                      />
                      <div className="status-option-content" style={{ borderColor: status.color }}>
                        <FontAwesomeIcon icon={status.icon} style={{ color: status.color }} />
                        <span>{status.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={statusData.priority}
                  onChange={(e) => setStatusData({ ...statusData, priority: e.target.value })}
                >
                  {PRIORITY_OPTIONS.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Admin Notes</label>
                <textarea
                  value={statusData.admin_notes}
                  onChange={(e) => setStatusData({ ...statusData, admin_notes: e.target.value })}
                  placeholder="Add notes visible to the user..."
                  rows={4}
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn" 
                  onClick={() => setEditingStatus(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  className="save-btn" 
                  onClick={handleUpdateStatus}
                  disabled={updating || !statusData.status}
                >
                  {updating ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Updating...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
