import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Clients.css';

const Clients = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);

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

  if (loading) {
    return <div className="clients-container">Loading...</div>;
  }

  if (error) {
    return <div className="clients-container error">{error}</div>;
  }

  return (
    <div className="clients-container">
      <div className="clients-header">
        <h1>Clients</h1>
        <button onClick={handleNewClient} className="new-client-btn">
          New Client
        </button>
      </div>
      <div className="clients-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>{client.name}</td>
                <td>{new Date(client.created_at).toLocaleString()}</td>
                <td>{new Date(client.updated_at).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="delete-btn"
                    disabled={isDeleting === client.id}
                  >
                    {isDeleting === client.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clients;
