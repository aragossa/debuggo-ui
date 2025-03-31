import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFolderOpen, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './TestCaseProjectAssociation.css';

const TestCaseProjectAssociation = ({ testCaseId, onUpdate }) => {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    if (testCaseId) {
      fetchTestCaseProject();
      fetchProjects();
    }
  }, [testCaseId]);

  const fetchTestCaseProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/test_cases/${testCaseId}/project`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // Test case doesn't have a project assigned
          setCurrentProject(null);
        } else {
          throw new Error('Failed to fetch test case project');
        }
      } else {
        const data = await response.json();
        setCurrentProject(data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching test case project:', err);
      setError('Failed to load project information');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    }
  };

  const handleAssignProject = async (projectId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/test_cases/${testCaseId}/project`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id: projectId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign project');
      }
      
      // Refresh project data
      await fetchTestCaseProject();
      setShowProjectSelector(false);
      
      // Notify parent component of the update
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error assigning project:', err);
      setError('Failed to assign project');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/test_cases/${testCaseId}/project`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove project');
      }
      
      setCurrentProject(null);
      
      // Notify parent component of the update
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error removing project:', err);
      setError('Failed to remove project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="project-association-loading">Loading...</div>;
  }

  return (
    <div className="test-case-project-association">
      {error && (
        <div className="project-association-error">
          <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
        </div>
      )}
      
      {!showProjectSelector ? (
        <div className="current-project">
          <div className="project-label">Project:</div>
          {currentProject ? (
            <div className="project-info">
              <FontAwesomeIcon icon={faFolderOpen} className="project-icon" />
              <span className="project-name">{currentProject.name}</span>
              <button 
                className="change-project-button"
                onClick={() => setShowProjectSelector(true)}
              >
                Change
              </button>
              <button 
                className="remove-project-button"
                onClick={handleRemoveProject}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="no-project">
              <span>Not assigned to any project</span>
              <button 
                className="assign-project-button"
                onClick={() => setShowProjectSelector(true)}
              >
                Assign to Project
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="project-selector">
          <h4>Select Project</h4>
          {projects.length === 0 ? (
            <div className="no-projects-available">
              No projects available. Please create a project first.
            </div>
          ) : (
            <div className="projects-list">
              {projects.map(project => (
                <div 
                  key={project.id} 
                  className={`project-item ${currentProject && currentProject.id === project.id ? 'current' : ''}`}
                  onClick={() => handleAssignProject(project.id)}
                >
                  <FontAwesomeIcon icon={faFolder} className="project-icon" />
                  <span className="project-name">{project.name}</span>
                </div>
              ))}
            </div>
          )}
          <button 
            className="cancel-button"
            onClick={() => setShowProjectSelector(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default TestCaseProjectAssociation;
