import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTrash, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '', client_id: null });
  const [editingProject, setEditingProject] = useState(null);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders, user } = useAuth();

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchClients();
    }
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again later.');
    } finally {
      setLoading(false);
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
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newProject)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create project');
      }
      
      await fetchProjects();
      setNewProject({ name: '', description: '', client_id: null });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingProject.name,
          description: editingProject.description,
          client_id: editingProject.client_id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update project');
      }
      
      await fetchProjects();
      setEditingProject(null);
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? Test cases will be unassigned from this project but not deleted.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    }
  };

  const handleEditProject = (project) => {
    setEditingProject({ ...project });
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
  };

  const handleViewProject = (projectId) => {
    // Navigate to project details page
    window.location.href = `/projects/${projectId}`;
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>Projects</h1>
        <button 
          className="create-project-button"
          onClick={() => setShowForm(!showForm)}
        >
          <FontAwesomeIcon icon={faPlus} /> {showForm ? 'Cancel' : 'New Project'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {showForm && (
        <div className="project-form-container">
          <h2>Create New Project</h2>
          <form onSubmit={handleCreateProject} className="project-form">
            <div className="form-group">
              <label htmlFor="name">Project Name</label>
              <input
                type="text"
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={3}
              />
            </div>
            
            {user && user.role === 'admin' && (
              <div className="form-group">
                <label htmlFor="client_id">Client *</label>
                <select
                  id="client_id"
                  value={newProject.client_id || ''}
                  onChange={(e) => setNewProject({ ...newProject, client_id: e.target.value })}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="form-actions">
              <button type="submit">Create Project</button>
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      
      {editingProject && (
        <div className="project-form-container">
          <h2>Edit Project</h2>
          <form onSubmit={handleUpdateProject} className="project-form">
            <div className="form-group">
              <label htmlFor="edit-name">Project Name</label>
              <input
                type="text"
                id="edit-name"
                value={editingProject.name}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                value={editingProject.description || ''}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-client">Client</label>
              <select
                id="edit-client"
                value={editingProject.client_id || ''}
                onChange={(e) => setEditingProject({ ...editingProject, client_id: e.target.value || null })}
              >
                <option value="">-- Select Client --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-button">Update Project</button>
              <button type="button" className="cancel-button" onClick={handleCancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      
      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="no-projects">
            <p>No projects found. Create your first project to get started!</p>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3>{project.name}</h3>
                <div className="project-actions">
                  <button 
                    className="action-button view"
                    onClick={() => handleViewProject(project.id)}
                    title="View Project"
                  >
                    <FontAwesomeIcon icon={faFolderOpen} />
                  </button>
                  <button 
                    className="action-button edit"
                    onClick={() => handleEditProject(project)}
                    title="Edit Project"
                  >
                    <FontAwesomeIcon icon={faPencilAlt} />
                  </button>
                  <button 
                    className="action-button delete"
                    onClick={() => handleDeleteProject(project.id)}
                    title="Delete Project"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              <div className="project-card-body">
                <p className="project-description">{project.description || 'No description provided.'}</p>
                {project.client_id && (
                  <p className="project-client">
                    <strong>Client:</strong> {clients.find(c => c.id === project.client_id)?.name || 'Unknown'}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Projects;
