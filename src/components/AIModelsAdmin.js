// AIModelsAdmin.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faSave, faTimes, faCheck, faRobot
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './AIModelsAdmin.css';

const AIModelsAdmin = () => {
  const [aiModels, setAiModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [newModel, setNewModel] = useState({
    name: '',
    model_id: '',
    description: '',
    is_active: true,
    is_default: false,
    input_price_per_1m: 0,
    output_price_per_1m: 0,
    tier_threshold: 0,
    input_price_per_1m_above: 0,
    output_price_per_1m_above: 0,
    cache_input_price_per_1m: 0,
    cache_input_price_per_1m_above: 0,
    cache_storage_price_per_1m_hour: 0
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modelToDelete, setModelToDelete] = useState(null);
  const { getAuthHeaders, user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchAIModels();
  }, []);

  const fetchAIModels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ai-models`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch AI models');
      }

      const data = await response.json();
      setAiModels(data);
    } catch (error) {
      console.error('Error fetching AI models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateModel = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai-models`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newModel)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create AI model');
      }

      // Reset form and refresh list
      setNewModel({
        name: '',
        model_id: '',
        description: '',
        is_active: true,
        is_default: false,
        input_price_per_1m: 0,
        output_price_per_1m: 0,
        tier_threshold: 0,
        input_price_per_1m_above: 0,
        output_price_per_1m_above: 0,
        cache_input_price_per_1m: 0,
        cache_input_price_per_1m_above: 0,
        cache_storage_price_per_1m_hour: 0
      });
      setIsCreating(false);
      fetchAIModels();
    } catch (error) {
      console.error('Error creating AI model:', error);
      alert(error.message);
    }
  };

  const handleUpdateModel = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/ai-models/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingModel)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update AI model');
      }

      setEditingModel(null);
      fetchAIModels();
    } catch (error) {
      console.error('Error updating AI model:', error);
      alert(error.message);
    }
  };

  const handleDeleteModel = async () => {
    if (!modelToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/api/ai-models/${modelToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete AI model');
      }

      setShowDeleteModal(false);
      setModelToDelete(null);
      fetchAIModels();
    } catch (error) {
      console.error('Error deleting AI model:', error);
      alert(error.message);
    }
  };

  const startEditing = (model) => {
    setEditingModel({ ...model });
  };

  const cancelEditing = () => {
    setEditingModel(null);
  };

  const confirmDelete = (model) => {
    setModelToDelete(model);
    setShowDeleteModal(true);
  };

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="ai-models-admin-container">
        <div className="access-denied">
          <FontAwesomeIcon icon={faRobot} size="3x" />
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-models-admin-container">
      <div className="ai-models-header">
        <h2>AI Models Management</h2>
        {!isCreating && (
          <button className="add-model-btn" onClick={() => setIsCreating(true)}>
            <FontAwesomeIcon icon={faPlus} /> Add New Model
          </button>
        )}
      </div>

      {isCreating && (
        <div className="model-form new-model-form">
          <h3>Add New AI Model</h3>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={newModel.name}
              onChange={(e) => setNewModel({...newModel, name: e.target.value})}
              placeholder="e.g., Gemini Pro"
            />
          </div>
          <div className="form-group">
            <label>Model ID:</label>
            <input
              type="text"
              value={newModel.model_id}
              onChange={(e) => setNewModel({...newModel, model_id: e.target.value})}
              placeholder="e.g., gemini-1.5-pro"
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={newModel.description}
              onChange={(e) => setNewModel({...newModel, description: e.target.value})}
              placeholder="Brief description of the model"
            />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={newModel.is_active}
                onChange={(e) => setNewModel({...newModel, is_active: e.target.checked})}
              />
              Active
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={newModel.is_default}
                onChange={(e) => setNewModel({...newModel, is_default: e.target.checked})}
              />
              Default
            </label>
          </div>
          
          <h4>Pricing Configuration (per 1M tokens)</h4>
          <div className="form-group">
            <label>Input Price (base tier):</label>
            <input
              type="number"
              step="0.000001"
              value={newModel.input_price_per_1m}
              onChange={(e) => setNewModel({...newModel, input_price_per_1m: parseFloat(e.target.value) || 0})}
              placeholder="e.g., 1.25"
            />
          </div>
          <div className="form-group">
            <label>Output Price (base tier):</label>
            <input
              type="number"
              step="0.000001"
              value={newModel.output_price_per_1m}
              onChange={(e) => setNewModel({...newModel, output_price_per_1m: parseFloat(e.target.value) || 0})}
              placeholder="e.g., 10.00"
            />
          </div>
          
          <h4>Tiered Pricing (Optional)</h4>
          <div className="form-group">
            <label>Tier Threshold (tokens):</label>
            <input
              type="number"
              value={newModel.tier_threshold}
              onChange={(e) => setNewModel({...newModel, tier_threshold: parseInt(e.target.value) || 0})}
              placeholder="e.g., 200000"
            />
          </div>
          <div className="form-group">
            <label>Input Price (above tier):</label>
            <input
              type="number"
              step="0.000001"
              value={newModel.input_price_per_1m_above}
              onChange={(e) => setNewModel({...newModel, input_price_per_1m_above: parseFloat(e.target.value) || 0})}
              placeholder="e.g., 2.50"
            />
          </div>
          <div className="form-group">
            <label>Output Price (above tier):</label>
            <input
              type="number"
              step="0.000001"
              value={newModel.output_price_per_1m_above}
              onChange={(e) => setNewModel({...newModel, output_price_per_1m_above: parseFloat(e.target.value) || 0})}
              placeholder="e.g., 15.00"
            />
          </div>
          
          <h4>Context Caching Pricing (Optional)</h4>
          <div className="form-group">
            <label>Cache Input Price (base tier):</label>
            <input
              type="number"
              step="0.000001"
              value={newModel.cache_input_price_per_1m}
              onChange={(e) => setNewModel({...newModel, cache_input_price_per_1m: parseFloat(e.target.value) || 0})}
              placeholder="e.g., 0.125"
            />
          </div>
          <div className="form-group">
            <label>Cache Input Price (above tier):</label>
            <input
              type="number"
              step="0.000001"
              value={newModel.cache_input_price_per_1m_above}
              onChange={(e) => setNewModel({...newModel, cache_input_price_per_1m_above: parseFloat(e.target.value) || 0})}
              placeholder="e.g., 0.25"
            />
          </div>
          <div className="form-group">
            <label>Cache Storage Price (per 1M tokens/hour):</label>
            <input
              type="number"
              step="0.000001"
              value={newModel.cache_storage_price_per_1m_hour}
              onChange={(e) => setNewModel({...newModel, cache_storage_price_per_1m_hour: parseFloat(e.target.value) || 0})}
              placeholder="e.g., 4.50"
            />
          </div>
          
          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setIsCreating(false)}>
              <FontAwesomeIcon icon={faTimes} /> Cancel
            </button>
            <button className="save-btn" onClick={handleCreateModel}>
              <FontAwesomeIcon icon={faSave} /> Save
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading AI models...</div>
      ) : (
        <div className="ai-models-list">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Model ID</th>
                <th>Description</th>
                <th>Input Price</th>
                <th>Output Price</th>
                <th>Status</th>
                <th>Default</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {aiModels.map(model => (
                <tr key={model.id} className={editingModel && editingModel.id === model.id ? 'editing' : ''}>
                  {editingModel && editingModel.id === model.id ? (
                    // Editing mode
                    <>
                      <td>
                        <input
                          type="text"
                          value={editingModel.name}
                          onChange={(e) => setEditingModel({...editingModel, name: e.target.value})}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingModel.model_id}
                          onChange={(e) => setEditingModel({...editingModel, model_id: e.target.value})}
                        />
                      </td>
                      <td>
                        <textarea
                          value={editingModel.description}
                          onChange={(e) => setEditingModel({...editingModel, description: e.target.value})}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.000001"
                          value={editingModel.input_price_per_1m}
                          onChange={(e) => setEditingModel({...editingModel, input_price_per_1m: parseFloat(e.target.value) || 0})}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.000001"
                          value={editingModel.output_price_per_1m}
                          onChange={(e) => setEditingModel({...editingModel, output_price_per_1m: parseFloat(e.target.value) || 0})}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={editingModel.is_active}
                          onChange={(e) => setEditingModel({...editingModel, is_active: e.target.checked})}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={editingModel.is_default}
                          onChange={(e) => setEditingModel({...editingModel, is_default: e.target.checked})}
                        />
                      </td>
                      <td className="actions">
                        <button className="save-btn" onClick={() => handleUpdateModel(model.id)}>
                          <FontAwesomeIcon icon={faSave} />
                        </button>
                        <button className="cancel-btn" onClick={cancelEditing}>
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </td>
                    </>
                  ) : (
                    // View mode
                    <>
                      <td>{model.name}</td>
                      <td>{model.model_id}</td>
                      <td>{model.description}</td>
                      <td>${(parseFloat(model.input_price_per_1m) || 0).toFixed(6)}</td>
                      <td>${(parseFloat(model.output_price_per_1m) || 0).toFixed(6)}</td>
                      <td>
                        <span className={`status-badge ${model.is_active ? 'active' : 'inactive'}`}>
                          {model.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {model.is_default ? (
                          <FontAwesomeIcon icon={faCheck} className="default-icon" />
                        ) : ''}
                      </td>
                      <td className="actions">
                        <button className="edit-btn" onClick={() => startEditing(model)}>
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => confirmDelete(model)}
                          disabled={model.is_default}
                          title={model.is_default ? "Cannot delete default model" : "Delete model"}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {aiModels.length === 0 && (
                <tr>
                  <td colSpan="8" className="no-models">No AI models found. Add one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && modelToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete the AI model "{modelToDelete.name}"?</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="delete-btn" onClick={handleDeleteModel}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIModelsAdmin;
