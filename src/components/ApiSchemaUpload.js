import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash, faFileCode, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './ApiSchemaUpload.css';

const ApiSchemaUpload = ({ projectId }) => {
  const [schemas, setSchemas] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [schemaName, setSchemaName] = useState('');
  const [schemaDescription, setSchemaDescription] = useState('');
  const { getAuthHeaders } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (projectId && projectId !== 'all') {
      fetchSchemas();
    }
  }, [projectId]);

  const fetchSchemas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/api-schemas`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchemas(data.schemas || []);
      }
    } catch (error) {
      console.error('Error fetching schemas:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    
    // Auto-fill name from filename if empty
    if (file && !schemaName) {
      setSchemaName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !schemaName) {
      alert('Please select a file and provide a name');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', schemaName);
      formData.append('description', schemaDescription);

      // No Content-Type here: the browser sets multipart/form-data with the boundary itself
      const response = await fetch(`${API_URL}/api/projects/${projectId}/api-schemas/upload`, {
        method: 'POST',
        headers: getAuthHeaders(false),
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Schema "${schemaName}" uploaded successfully!`);
        
        // Reset form
        setSelectedFile(null);
        setSchemaName('');
        setSchemaDescription('');
        document.getElementById('schema-file-input').value = '';
        
        // Refresh list
        fetchSchemas();
      } else {
        const error = await response.json();
        // A 422 from FastAPI carries a list of field errors, not a string
        const detail = Array.isArray(error.detail)
          ? error.detail.map((e) => `${(e.loc || []).join('.')}: ${e.msg}`).join('; ')
          : error.detail;
        alert(`Failed to upload schema: ${detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading schema:', error);
      alert('Failed to upload schema');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (schemaId) => {
    if (!window.confirm('Are you sure you want to delete this schema?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/api-schemas/${schemaId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        alert('Schema deleted successfully');
        fetchSchemas();
      } else {
        alert('Failed to delete schema');
      }
    } catch (error) {
      console.error('Error deleting schema:', error);
      alert('Failed to delete schema');
    }
  };

  if (!projectId || projectId === 'all') {
    return (
      <div className="api-schema-upload">
        <p className="no-project-message">Please select a specific project to manage API schemas</p>
      </div>
    );
  }

  return (
    <div className="api-schema-upload">
      <h3><FontAwesomeIcon icon={faFileCode} /> API Schema Management</h3>
      
      <div className="upload-section">
        <h4>Upload New Schema</h4>
        <div className="upload-form">
          <div className="form-group">
            <label>Schema File (JSON):</label>
            <input
              id="schema-file-input"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              placeholder="e.g., Main API Schema"
              disabled={uploading}
            />
          </div>
          
          <div className="form-group">
            <label>Description (optional):</label>
            <textarea
              value={schemaDescription}
              onChange={(e) => setSchemaDescription(e.target.value)}
              placeholder="Description of this API schema"
              disabled={uploading}
            />
          </div>
          
          <button
            className="upload-button"
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !schemaName}
          >
            <FontAwesomeIcon icon={faUpload} />
            {uploading ? ' Uploading...' : ' Upload Schema'}
          </button>
        </div>
      </div>

      <div className="schemas-list">
        <h4>Uploaded Schemas</h4>
        {schemas.length === 0 ? (
          <p className="no-schemas">No schemas uploaded yet. Upload a schema to enable accurate API test generation.</p>
        ) : (
          <div className="schemas-grid">
            {schemas.map(schema => (
              <div key={schema.id} className="schema-card">
                <div className="schema-header">
                  <FontAwesomeIcon icon={faCheckCircle} className="schema-icon" />
                  <h5>{schema.name}</h5>
                </div>
                <p className="schema-description">{schema.description || 'No description'}</p>
                <div className="schema-meta">
                  <span className="schema-type">{schema.schema_type}</span>
                  <span className="schema-date">
                    {new Date(schema.created_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  className="delete-schema-button"
                  onClick={() => handleDelete(schema.id)}
                >
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiSchemaUpload;
