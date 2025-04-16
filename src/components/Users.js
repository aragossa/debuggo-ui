import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Users.css';

const Users = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  
  // New user form state
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    client_id: '',
    role: 'user'
  });
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

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
      const response = await fetch(`${API_URL}/api/clients/for-user-management`, {
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

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: newRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update user role');
      }

      // Update local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            role: newRole
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

  // Handle new user form input changes
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  // Handle new user form submission
  const handleNewUserSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    
    try {
      // Validate form
      if (!newUser.email || !newUser.password || !newUser.full_name) {
        setFormError('Please fill in all required fields');
        return;
      }
      
      if (newUser.role === 'user' && !newUser.client_id) {
        setFormError('Client is required for user role');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/users/create`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          client_id: newUser.client_id || null,
          role: newUser.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create user');
      }

      const createdUser = await response.json();
      
      // Add the new user to the list
      setUsers([...users, createdUser]);
      
      // Reset form
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        client_id: '',
        role: 'user'
      });
      
      setFormSuccess('User created successfully');
      
      // Close form after a delay
      setTimeout(() => {
        setShowNewUserForm(false);
        setFormSuccess(null);
      }, 2000);
      
    } catch (error) {
      setFormError(error.message);
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
        <button 
          className="new-user-btn"
          onClick={() => setShowNewUserForm(!showNewUserForm)}
        >
          {showNewUserForm ? 'Cancel' : 'Add New User'}
        </button>
      </div>
      
      {showNewUserForm && (
        <div className="new-user-form-container">
          <h2>Create New User</h2>
          {formError && <div className="form-error">{formError}</div>}
          {formSuccess && <div className="form-success">{formSuccess}</div>}
          <form onSubmit={handleNewUserSubmit} className="new-user-form">
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                name="password"
                value={newUser.password}
                onChange={handleNewUserChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="full_name">Full Name*</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={newUser.full_name}
                onChange={handleNewUserChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="client_id">Client</label>
              <select
                id="client_id"
                name="client_id"
                value={newUser.client_id}
                onChange={handleNewUserChange}
                required={newUser.role === 'user'}
                style={newUser.role === 'user' ? { borderColor: newUser.client_id ? '' : 'red' } : {}}
              >
                <option value="">{newUser.role === 'user' ? 'Select a client*' : 'No Client'}</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {newUser.role === 'user' && !newUser.client_id && (
                <span className="form-error" style={{ color: 'red', fontSize: '0.9em' }}>Client is required for user role</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={newUser.role}
                onChange={handleNewUserChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="submit-btn">Create User</button>
          </form>
        </div>
      )}
      
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
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updating === user.id}
                    className="role-select"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {updating === user.id && (
                    <span className="updating-spinner">Updating...</span>
                  )}
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
