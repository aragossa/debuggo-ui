import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Users.css';

const Users = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    Promise.all([fetchUsers(), fetchClients()]).then(() => {
      setLoading(false);
    }).catch(error => {
      setError(error.message);
      setLoading(false);
    });
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      throw error;
    }
  };

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
    } catch (error) {
      throw error;
    }
  };

  const handleClientChange = async (userId, clientId) => {
    setUpdating(userId);
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/client`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId === '' ? null : clientId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user');
      }

      // Update local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          const selectedClient = clients.find(c => c.id === clientId);
          return {
            ...user,
            client_id: clientId || null,
            client_name: selectedClient ? selectedClient.name : null
          };
        }
        return user;
      }));
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="users-container">Loading...</div>;
  }

  if (error) {
    return <div className="users-container error">{error}</div>;
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>Users</h1>
      </div>
      <div className="users-list">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Client</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.full_name}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <select
                    value={user.client_id || ''}
                    onChange={(e) => handleClientChange(user.id, e.target.value || null)}
                    disabled={updating === user.id}
                    className="client-select"
                  >
                    <option value="">No Client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {updating === user.id && (
                    <span className="updating-spinner">Updating...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
