import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faUserPlus, 
  faUserCog, 
  faBuilding, 
  faSpinner, 
  faExclamationTriangle, 
  faCheck, 
  faSearch,
  faTimes,
  faEnvelope,
  faUser,
  faLock,
  faUserShield,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import './Users.css';

const Users = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  
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

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterRole = (e) => {
    setFilterRole(e.target.value);
  };

  const handleFilterClient = (e) => {
    setFilterClient(e.target.value);
  };

  // Filter and search users
  const filteredUsers = users.filter(user => {
    // Search term filter
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role filter
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    // Client filter
    const matchesClient = 
      filterClient === 'all' || 
      (filterClient === 'none' && !user.client_id) ||
      (user.client_id === filterClient);
    
    return matchesSearch && matchesRole && matchesClient;
  });

  if (loading) {
    return (
      <div className="users-container loading-container">
        <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h1>
          <FontAwesomeIcon icon={faUserCog} className="header-icon" /> 
          User Management
        </h1>
        <button 
          className="new-user-btn"
          onClick={() => setShowNewUserForm(!showNewUserForm)}
        >
          {showNewUserForm ? (
            <>
              <FontAwesomeIcon icon={faTimes} /> Cancel
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faUserPlus} /> Add New User
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="error-container">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{error}</span>
        </div>
      )}
      
      {showNewUserForm && (
        <div className="new-user-form-container">
          <h2><FontAwesomeIcon icon={faUserPlus} /> Create New User</h2>
          {formError && (
            <div className="form-error">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="form-success">
              <FontAwesomeIcon icon={faCheck} />
              <span>{formSuccess}</span>
            </div>
          )}
          <form onSubmit={handleNewUserSubmit} className="new-user-form">
            <div className="form-group">
              <label htmlFor="email">
                <FontAwesomeIcon icon={faEnvelope} /> Email*
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                required
                placeholder="user@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">
                <FontAwesomeIcon icon={faLock} /> Password*
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={newUser.password}
                onChange={handleNewUserChange}
                required
                placeholder="Secure password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="full_name">
                <FontAwesomeIcon icon={faUser} /> Full Name*
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={newUser.full_name}
                onChange={handleNewUserChange}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label htmlFor="role">
                <FontAwesomeIcon icon={faUserShield} /> Role
              </label>
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
            <div className="form-group">
              <label htmlFor="client_id">
                <FontAwesomeIcon icon={faBuilding} /> Client
              </label>
              <select
                id="client_id"
                name="client_id"
                value={newUser.client_id}
                onChange={handleNewUserChange}
                required={newUser.role === 'user'}
                className={newUser.role === 'user' && !newUser.client_id ? 'input-error' : ''}
              >
                <option value="">{newUser.role === 'user' ? 'Select a client*' : 'No Client'}</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {newUser.role === 'user' && !newUser.client_id && (
                <span className="field-error">Client is required for user role</span>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                <FontAwesomeIcon icon={faUserPlus} /> Create User
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="users-controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="filters-container">
          <div className="filter-group">
            <label>
              <FontAwesomeIcon icon={faUserShield} /> Role:
            </label>
            <select 
              value={filterRole} 
              onChange={handleFilterRole}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>
              <FontAwesomeIcon icon={faBuilding} /> Client:
            </label>
            <select 
              value={filterClient} 
              onChange={handleFilterClient}
              className="filter-select"
            >
              <option value="all">All Clients</option>
              <option value="none">No Client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {filteredUsers.length === 0 ? (
        <div className="no-users">
          <FontAwesomeIcon icon={faFilter} />
          <p>
            {searchTerm || filterRole !== 'all' || filterClient !== 'all' 
              ? 'No users match your search criteria' 
              : 'No users found. Create your first user!'}
          </p>
        </div>
      ) : (
        <div className="user-cards">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <h3>{user.full_name}</h3>
                <span className={`role-badge ${user.role}`}>
                  <FontAwesomeIcon icon={user.role === 'admin' ? faUserShield : faUser} />
                  {user.role === 'admin' ? ' Admin' : ' User'}
                </span>
              </div>
              <div className="user-card-body">
                <div className="user-info">
                  <div className="info-item">
                    <span className="info-label">
                      <FontAwesomeIcon icon={faEnvelope} /> Email:
                    </span>
                    <span className="info-value">{user.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <FontAwesomeIcon icon={faUserShield} /> Role:
                    </span>
                    <div className="select-wrapper">
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
                        <span className="updating-spinner">
                          <FontAwesomeIcon icon={faSpinner} spin />
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-label">
                      <FontAwesomeIcon icon={faBuilding} /> Client:
                    </span>
                    <div className="select-wrapper">
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
                        <span className="updating-spinner">
                          <FontAwesomeIcon icon={faSpinner} spin />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;
