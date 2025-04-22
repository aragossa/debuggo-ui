import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEdit, faSearch, faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import './Clients.css';

const Clients = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/api/clients`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleNewClient = () => {
    navigate('/clients/new');
  };

  const handleEditClient = (clientId) => {
    // This is a placeholder for future edit functionality
    console.log(`Edit client with ID: ${clientId}`);
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    setIsDeleting(clientId);
    setError(null); // Clear any previous errors
    
    try {
      const response = await fetch(`${API_URL}/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete client');
      }

      // Remove the client from the local state
      setClients(clients.filter(client => client.id !== clientId));
    } catch (error) {
      setError(error.message);
      // Scroll error into view if it's not visible
      const errorElement = document.querySelector('.error');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Sort and filter clients
  const sortedClients = [...clients].sort((a, b) => {
    if (sortConfig.key === 'name') {
      return sortConfig.direction === 'ascending' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
      return sortConfig.direction === 'ascending' 
        ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
        : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
    }
    return 0;
  });

  const filteredClients = sortedClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  if (loading) {
    return (
      <div className="clients-container loading-container">
        <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="clients-container">
      <div className="clients-header">
        <h1>Clients</h1>
        <button onClick={handleNewClient} className="new-client-btn">
          <FontAwesomeIcon icon={faPlus} /> New Client
        </button>
      </div>

      {error && (
        <div className="error-container">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{error}</span>
        </div>
      )}

      <div className="clients-controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      <div className="clients-list">
        {filteredClients.length === 0 ? (
          <div className="no-clients">
            {searchTerm ? 'No clients match your search' : 'No clients found. Create your first client!'}
          </div>
        ) : (
          <div className="client-cards">
            {filteredClients.map((client) => (
              <div key={client.id} className="client-card">
                <div className="client-card-header">
                  <h3>{client.name}</h3>
                </div>
                <div className="client-card-body">
                  <div className="client-info">
                    <div className="info-item">
                      <span className="info-label">Created:</span>
                      <span className="info-value">{new Date(client.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Last Updated:</span>
                      <span className="info-value">{new Date(client.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="client-card-footer">
                  <button
                    onClick={() => handleEditClient(client.id)}
                    className="edit-btn"
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="delete-btn"
                    disabled={isDeleting === client.id}
                  >
                    {isDeleting === client.id ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin /> Deleting...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faTrash} /> Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
