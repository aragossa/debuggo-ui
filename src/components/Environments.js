// Environments.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCheck, faTimes, faInfoCircle, faSignInAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './Environments.css';

const Environments = ({ projectId }) => {
  const [environments, setEnvironments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    base_url: '',
    login: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [generatingLogin, setGeneratingLogin] = useState(false);
  const [deletingEnvironmentId, setDeletingEnvironmentId] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    if (projectId && projectId !== 'all') {
      fetchEnvironments();
    } else {
      setEnvironments([]);
      setLoading(false);
    }
  }, [projectId]);

  const fetchEnvironments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/projects/${projectId}/environments`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch environments');
      }

      const data = await response.json();
      setEnvironments(data);
    } catch (error) {
      console.error('Error fetching environments:', error);
      setError('Failed to load environments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      base_url: '',
      login: '',
      password: ''
    });
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddForm(true);
    setShowEditForm(false);
  };

  const handleEditClick = (environment) => {
    setCurrentEnvironment(environment);
    setFormData({
      name: environment.name,
      base_url: environment.base_url,
      login: environment.login || '',
      password: environment.password || ''
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleDeleteClick = async (environmentId) => {
    if (!window.confirm('Are you sure you want to delete this environment?')) {
      return;
    }

    try {
      setDeletingEnvironmentId(environmentId);
      setError(null);

      const response = await fetch(`${API_URL}/api/environments/${environmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete environment');
      }

      // Show success message
      setSuccessMessage('Environment deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh the environments list
      fetchEnvironments();
    } catch (error) {
      console.error('Error deleting environment:', error);
      setError(`Failed to delete environment: ${error.message}`);
    } finally {
      setDeletingEnvironmentId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.base_url) {
      setError('Name and Base URL are required fields');
      return;
    }

    try {
      let url, method;

      if (showAddForm) {
        url = `${API_URL}/api/projects/${projectId}/environments`;
        method = 'POST';
      } else {
        url = `${API_URL}/api/environments/${currentEnvironment.id}`;
        method = 'PUT';
      }

      const requestBody = {
        ...formData
      };

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${showAddForm ? 'create' : 'update'} environment`);
      }

      // Reset form and fetch updated environments
      resetForm();
      setShowAddForm(false);
      setShowEditForm(false);
      setSuccessMessage(`Environment ${showAddForm ? 'created' : 'updated'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchEnvironments();
    } catch (error) {
      console.error('Error saving environment:', error);
      setError(`Failed to ${showAddForm ? 'create' : 'update'} environment: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    resetForm();
    setError(null);
  };


  if (!projectId || projectId === 'all') {
    return (
      <div className="environments-container">
        <div className="environments-header">
          <h2>Environments</h2>
        </div>
        <div className="environments-message">
          <FontAwesomeIcon icon={faInfoCircle} />
          <p>Please select a project to manage environments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="environments-container">
      <div className="environments-header">
        <h2>Environments</h2>
        <button
          className="add-environment-button"
          onClick={handleAddClick}
          disabled={showAddForm || showEditForm}
        >
          <FontAwesomeIcon icon={faPlus} /> Add Environment
        </button>
      </div>

      {error && (
        <div className="error-message">
          <FontAwesomeIcon icon={faInfoCircle} /> {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          <FontAwesomeIcon icon={faCheck} /> {successMessage}
        </div>
      )}

      {(showAddForm || showEditForm) && (
        <div className="environment-form-container">
          <h3>{showAddForm ? 'Add New Environment' : 'Edit Environment'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Production, Staging, Development, etc."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="base_url">Base URL*</label>
              <input
                type="text"
                id="base_url"
                name="base_url"
                value={formData.base_url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login">Login</label>
              <input
                type="text"
                id="login"
                name="login"
                value={formData.login}
                onChange={handleInputChange}
                placeholder="username or email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="password"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={handleCancel}>
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </button>
              <button type="submit" className="save-button">
                <FontAwesomeIcon icon={faCheck} /> {showAddForm ? 'Add' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-message">Loading environments...</div>
      ) : environments.length === 0 ? (
        <div className="no-environments-message">
          <p>No environments found for this project.</p>
          {!showAddForm && (
            <button className="add-first-environment-button" onClick={handleAddClick}>
              <FontAwesomeIcon icon={faPlus} /> Add your first environment
            </button>
          )}
        </div>
      ) : (
        <div className="environments-table-container">
          <table className="environments-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Base URL</th>
                <th>Login</th>
                <th>Password</th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {environments.map((env) => (
                <tr key={env.id}>
                  <td className="env-name">{env.name}</td>
                  <td className="env-url">{env.base_url}</td>
                  <td>{env.login || <span className="text-muted">-</span>}</td>
                  <td>{env.password ? '••••••••' : <span className="text-muted">-</span>}</td>
                  <td className="actions-cell">
                    <button
                      className="edit-button"
                      onClick={() => handleEditClick(env)}
                      disabled={showAddForm || showEditForm || generatingLogin}
                      title="Edit environment"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>

                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(env.id)}
                      disabled={showAddForm || showEditForm || generatingLogin || deletingEnvironmentId === env.id}
                      title="Delete environment"
                    >
                      <FontAwesomeIcon icon={deletingEnvironmentId === env.id ? faSpinner : faTrash} spin={deletingEnvironmentId === env.id} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Environments;
