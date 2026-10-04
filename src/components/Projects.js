import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faPencilAlt, 
  faTrash, 
  faFolderOpen, 
  faProjectDiagram, 
  faBuilding, 
  faInfoCircle, 
  faSpinner,
  faTimes,
  faSearch,
  faExclamationTriangle,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '', client_id: null });
  const [editingProject, setEditingProject] = useState(null);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null); // { project, contents, deleteTests, deleting }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
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

  // The delete dialog: the project, what it holds, and whether its tests go with it
  const openDeleteDialog = async (project) => {
    setDeleteDialog({ project, contents: null, deleteTests: false, deleting: false });
    try {
      const response = await fetch(`${API_URL}/api/projects/${project.id}/contents`, { headers: getAuthHeaders() });
      if (response.ok) {
        const contents = await response.json();
        setDeleteDialog(prev => (prev && prev.project.id === project.id ? { ...prev, contents } : prev));
      }
    } catch (err) {
      console.error('Error fetching project contents:', err);
    }
  };

  const handleDeleteProject = async () => {
    const { project, deleteTests } = deleteDialog;
    setDeleteDialog(prev => ({ ...prev, deleting: true }));
    try {
      const response = await fetch(`${API_URL}/api/projects/${project.id}${deleteTests ? '?delete_tests=true' : ''}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        // The server says why: show it instead of a generic "try again"
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to delete project (HTTP ${response.status})`);
      }

      setError(null);
      await fetchProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err.message || 'Failed to delete project. Please try again.');
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject({ ...project });
    setShowForm(false); // Close create form if open
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
  };

  const handleViewProject = (projectId) => {
    // Navigate to project details page
    window.location.href = `/projects/${projectId}`;
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterClient = (e) => {
    setFilterClient(e.target.value);
  };

  // Filter projects based on search term and client filter
  const filteredProjects = projects.filter(project => {
    // Search term filter
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Client filter
    const matchesClient = 
      filterClient === 'all' || 
      (filterClient === 'none' && !project.client_id) ||
      (project.client_id === filterClient);
    
    return matchesSearch && matchesClient;
  });

  if (loading) {
    return (
      <div className="projects-container loading-container">
        <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>
          <FontAwesomeIcon icon={faProjectDiagram} className="header-icon" /> 
          Projects
        </h1>
        <button 
          className="create-project-button"
          onClick={() => {
            setShowForm(!showForm);
            if (editingProject) setEditingProject(null);
          }}
        >
          {showForm ? (
            <>
              <FontAwesomeIcon icon={faTimes} /> Cancel
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faPlus} /> New Project
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
      
      <div className="projects-controls">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        {user && user.role === 'admin' && clients.length > 0 && (
          <div className="filter-container">
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
        )}
      </div>
      
      {showForm && (
        <div className="project-form-container">
          <h2>
            <FontAwesomeIcon icon={faPlus} /> Create New Project
          </h2>
          <form onSubmit={handleCreateProject} className="project-form">
            <div className="form-group">
              <label htmlFor="name">
                <FontAwesomeIcon icon={faProjectDiagram} /> Project Name*
              </label>
              <input
                type="text"
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
                placeholder="Enter project name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">
                <FontAwesomeIcon icon={faInfoCircle} /> Description
              </label>
              <textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={3}
                placeholder="Enter project description"
              />
            </div>
            
            {user && user.role === 'admin' && (
              <div className="form-group">
                <label htmlFor="client_id">
                  <FontAwesomeIcon icon={faBuilding} /> Client*
                </label>
                <select
                  id="client_id"
                  value={newProject.client_id || ''}
                  onChange={(e) => setNewProject({ ...newProject, client_id: e.target.value })}
                  required
                  className="client-select"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="form-actions">
              <button type="submit" className="submit-button">
                <FontAwesomeIcon icon={faCheck} /> Create Project
              </button>
              <button 
                type="button" 
                className="cancel-button" 
                onClick={() => setShowForm(false)}
              >
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {editingProject && (
        <div className="project-form-container editing">
          <h2>
            <FontAwesomeIcon icon={faPencilAlt} /> Edit Project
          </h2>
          <form onSubmit={handleUpdateProject} className="project-form">
            <div className="form-group">
              <label htmlFor="edit-name">
                <FontAwesomeIcon icon={faProjectDiagram} /> Project Name*
              </label>
              <input
                type="text"
                id="edit-name"
                value={editingProject.name}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                required
                placeholder="Enter project name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="edit-description">
                <FontAwesomeIcon icon={faInfoCircle} /> Description
              </label>
              <textarea
                id="edit-description"
                value={editingProject.description || ''}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                placeholder="Enter project description"
              />
            </div>
            
            {user && user.role === 'admin' && (
              <div className="form-group">
                <label htmlFor="edit-client">
                  <FontAwesomeIcon icon={faBuilding} /> Client
                </label>
                <select
                  id="edit-client"
                  value={editingProject.client_id || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, client_id: e.target.value || null })}
                  className="client-select"
                >
                  <option value="">-- No Client --</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="form-actions">
              <button type="submit" className="submit-button update">
                <FontAwesomeIcon icon={faCheck} /> Update Project
              </button>
              <button 
                type="button" 
                className="cancel-button" 
                onClick={handleCancelEdit}
              >
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {filteredProjects.length === 0 ? (
        <div className="no-projects">
          <FontAwesomeIcon icon={faProjectDiagram} className="no-projects-icon" />
          <p>
            {searchTerm || filterClient !== 'all' 
              ? 'No projects match your search criteria' 
              : 'No projects found. Create your first project to get started!'}
          </p>
        </div>
      ) : (
        <div className="projects-list">
          {filteredProjects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3 title={project.name}>{project.name}</h3>
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
                    onClick={() => openDeleteDialog(project)}
                    title="Delete Project"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              <div className="project-card-body">
                <p className="project-description">
                  {project.description || 'No description provided.'}
                </p>
                {project.client_id && (
                  <div className="project-client">
                    <FontAwesomeIcon icon={faBuilding} className="client-icon" />
                    <span>
                      {clients.find(c => c.id === project.client_id)?.name || 'Unknown Client'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteDialog && (() => {
        const { project, contents, deleteTests, deleting } = deleteDialog;
        const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;
        const close = () => { if (!deleting) setDeleteDialog(null); };
        return (
          <div className="project-delete-overlay" onClick={close}>
            <div className="project-delete-dialog" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
              <h3>Delete project "{project.name}"?</h3>
              <p className="project-delete-contents">
                {contents
                  ? <>Deleted with the project: {plural(contents.environments, 'environment')}, {plural(contents.api_schemas, 'API schema')} with {contents.api_schemas === 1 ? 'its' : 'their'} calls, {plural(contents.suites, 'test suite')}, its execution plans and requirements. It also has {plural(contents.tests, 'test case')} in {plural(contents.groups, 'folder')}.</>
                  : 'Loading what the project holds...'}
              </p>
              <label className={`project-delete-option ${!deleteTests ? 'selected' : ''}`}>
                <input type="radio" name="delete-tests" checked={!deleteTests} disabled={deleting}
                  onChange={() => setDeleteDialog(prev => ({ ...prev, deleteTests: false }))} />
                <span>
                  <strong>Delete the project, keep its tests</strong>
                  <span>The test cases stay, without a project.</span>
                </span>
              </label>
              <label className={`project-delete-option danger ${deleteTests ? 'selected' : ''}`}>
                <input type="radio" name="delete-tests" checked={deleteTests} disabled={deleting}
                  onChange={() => setDeleteDialog(prev => ({ ...prev, deleteTests: true }))} />
                <span>
                  <strong>Delete the project and all its tests</strong>
                  <span>
                    {contents
                      ? `${plural(contents.tests, 'test case')}, ${plural(contents.groups, 'folder')} and ${plural(contents.runs, 'run')} with their steps and results are deleted too.`
                      : 'Its test cases, folders, steps and run history are deleted too.'} This cannot be undone.
                  </span>
                </span>
              </label>
              <div className="project-delete-actions">
                <button className="project-delete-cancel" onClick={close} disabled={deleting}>Cancel</button>
                <button className="project-delete-confirm" onClick={handleDeleteProject} disabled={deleting}>
                  {deleting ? 'Deleting...' : (deleteTests ? 'Delete project and tests' : 'Delete project')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Projects;
