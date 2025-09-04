import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faEdit, faTrash, faCheck, faTimes, faSave, 
  faEye, faEyeSlash, faCheckSquare, faSquare, faGripVertical
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './Checklists.css';

const Checklists = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  
  const [checklists, setChecklists] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddItemForm, setShowAddItemForm] = useState(false);

  // Form states
  const [newChecklist, setNewChecklist] = useState({
    title: '',
    description: '',
    is_active: true
  });
  
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    is_enabled: true,
    is_checked: false,
    order_index: 0
  });

  useEffect(() => {
    fetchChecklists();
  }, []);

  const fetchChecklists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/checklists`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setChecklists(data);
      } else {
        setError('Failed to fetch checklists');
      }
    } catch (error) {
      console.error('Error fetching checklists:', error);
      setError('Error fetching checklists');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChecklistDetails = async (checklistId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/checklists/${checklistId}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedChecklist(data);
      } else {
        setError('Failed to fetch checklist details');
      }
    } catch (error) {
      console.error('Error fetching checklist details:', error);
      setError('Error fetching checklist details');
    } finally {
      setIsLoading(false);
    }
  };

  const createChecklist = async () => {
    try {
      const response = await fetch(`${API_URL}/api/checklists`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newChecklist)
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setNewChecklist({ title: '', description: '', is_active: true });
        fetchChecklists();
      } else {
        setError('Failed to create checklist');
      }
    } catch (error) {
      console.error('Error creating checklist:', error);
      setError('Error creating checklist');
    }
  };

  const updateChecklist = async () => {
    try {
      const response = await fetch(`${API_URL}/api/checklists/${editingChecklist.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editingChecklist)
      });
      
      if (response.ok) {
        setShowEditModal(false);
        setEditingChecklist(null);
        fetchChecklists();
        if (selectedChecklist && selectedChecklist.id === editingChecklist.id) {
          fetchChecklistDetails(editingChecklist.id);
        }
      } else {
        setError('Failed to update checklist');
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      setError('Error updating checklist');
    }
  };

  const deleteChecklist = async (checklistId) => {
    if (!window.confirm('Are you sure you want to delete this checklist? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/checklists/${checklistId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        fetchChecklists();
        if (selectedChecklist && selectedChecklist.id === checklistId) {
          setSelectedChecklist(null);
        }
      } else {
        setError('Failed to delete checklist');
      }
    } catch (error) {
      console.error('Error deleting checklist:', error);
      setError('Error deleting checklist');
    }
  };

  const createChecklistItem = async () => {
    try {
      const response = await fetch(`${API_URL}/api/checklists/${selectedChecklist.id}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newItem)
      });
      
      if (response.ok) {
        setShowAddItemForm(false);
        setNewItem({ title: '', description: '', is_enabled: true, is_checked: false, order_index: 0 });
        fetchChecklistDetails(selectedChecklist.id);
      } else {
        setError('Failed to create checklist item');
      }
    } catch (error) {
      console.error('Error creating checklist item:', error);
      setError('Error creating checklist item');
    }
  };

  const updateChecklistItem = async (itemId, updates) => {
    try {
      const response = await fetch(`${API_URL}/api/checklist-items/${itemId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        fetchChecklistDetails(selectedChecklist.id);
        setEditingItem(null);
      } else {
        setError('Failed to update checklist item');
      }
    } catch (error) {
      console.error('Error updating checklist item:', error);
      setError('Error updating checklist item');
    }
  };

  const deleteChecklistItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/checklist-items/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        fetchChecklistDetails(selectedChecklist.id);
      } else {
        setError('Failed to delete checklist item');
      }
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      setError('Error deleting checklist item');
    }
  };

  const toggleItemCheck = async (item) => {
    await updateChecklistItem(item.id, { is_checked: !item.is_checked });
  };

  const toggleItemEnabled = async (item) => {
    await updateChecklistItem(item.id, { is_enabled: !item.is_enabled });
  };

  const saveEditingItem = async () => {
    if (editingItem) {
      await updateChecklistItem(editingItem.id, {
        title: editingItem.title,
        description: editingItem.description
      });
    }
  };

  return (
    <div className="checklists-container">
      <div className="checklists-sidebar">
        <div className="checklists-header">
          <h2>My Checklists</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} /> New Checklist
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="close-error">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="loading">Loading checklists...</div>
        ) : (
          <div className="checklists-list">
            {checklists.map(checklist => (
              <div 
                key={checklist.id} 
                className={`checklist-item ${selectedChecklist?.id === checklist.id ? 'selected' : ''}`}
                onClick={() => fetchChecklistDetails(checklist.id)}
              >
                <div className="checklist-item-header">
                  <h4>{checklist.title}</h4>
                  <div className="checklist-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingChecklist(checklist);
                        setShowEditModal(true);
                      }}
                      className="btn-icon"
                      title="Edit checklist"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChecklist(checklist.id);
                      }}
                      className="btn-icon danger"
                      title="Delete checklist"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
                {checklist.description && (
                  <p className="checklist-description">{checklist.description}</p>
                )}
                <div className="checklist-status">
                  <span className={`status-badge ${checklist.is_active ? 'active' : 'inactive'}`}>
                    {checklist.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="checklist-detail">
        {selectedChecklist ? (
          <div>
            <div className="checklist-detail-header">
              <h2>{selectedChecklist.title}</h2>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowAddItemForm(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Item
              </button>
            </div>
            
            {selectedChecklist.description && (
              <p className="checklist-detail-description">{selectedChecklist.description}</p>
            )}

            {showAddItemForm && (
              <div className="add-item-form">
                <h4>Add New Item</h4>
                <input
                  type="text"
                  placeholder="Item title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                />
                <textarea
                  placeholder="Item description (optional)"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                />
                <div className="form-actions">
                  <button onClick={createChecklistItem} className="btn btn-primary">
                    <FontAwesomeIcon icon={faSave} /> Save
                  </button>
                  <button onClick={() => setShowAddItemForm(false)} className="btn btn-secondary">
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="checklist-items">
              {selectedChecklist.items && selectedChecklist.items.length > 0 ? (
                selectedChecklist.items.map(item => (
                  <div key={item.id} className={`checklist-item-row ${!item.is_enabled ? 'disabled' : ''}`}>
                    <div className="item-controls">
                      <button 
                        onClick={() => toggleItemCheck(item)}
                        className={`check-button ${item.is_checked ? 'checked' : ''}`}
                        disabled={!item.is_enabled}
                      >
                        <FontAwesomeIcon icon={item.is_checked ? faCheckSquare : faSquare} />
                      </button>
                      <button 
                        onClick={() => toggleItemEnabled(item)}
                        className={`enable-button ${item.is_enabled ? 'enabled' : 'disabled'}`}
                        title={item.is_enabled ? 'Disable item' : 'Enable item'}
                      >
                        <FontAwesomeIcon icon={item.is_enabled ? faEye : faEyeSlash} />
                      </button>
                    </div>

                    <div className="item-content">
                      {editingItem?.id === item.id ? (
                        <div className="item-edit-form">
                          <input
                            type="text"
                            value={editingItem.title}
                            onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                          />
                          <textarea
                            value={editingItem.description || ''}
                            onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                          />
                          <div className="item-edit-actions">
                            <button onClick={saveEditingItem} className="btn btn-sm btn-primary">
                              <FontAwesomeIcon icon={faSave} />
                            </button>
                            <button onClick={() => setEditingItem(null)} className="btn btn-sm btn-secondary">
                              <FontAwesomeIcon icon={faTimes} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="item-display">
                          <h5 className={item.is_checked ? 'checked' : ''}>{item.title}</h5>
                          {item.description && <p>{item.description}</p>}
                        </div>
                      )}
                    </div>

                    <div className="item-actions">
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="btn-icon"
                        title="Edit item"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button 
                        onClick={() => deleteChecklistItem(item.id)}
                        className="btn-icon danger"
                        title="Delete item"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-items">
                  <p>No items in this checklist yet.</p>
                  <button onClick={() => setShowAddItemForm(true)} className="btn btn-primary">
                    <FontAwesomeIcon icon={faPlus} /> Add First Item
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-checklist-selected">
            <h3>Select a checklist to view details</h3>
            <p>Choose a checklist from the sidebar or create a new one to get started.</p>
          </div>
        )}
      </div>

      {/* Create Checklist Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Create New Checklist</h3>
              <button onClick={() => setShowCreateModal(false)} className="close-button">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newChecklist.title}
                  onChange={(e) => setNewChecklist({...newChecklist, title: e.target.value})}
                  placeholder="Enter checklist title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newChecklist.description}
                  onChange={(e) => setNewChecklist({...newChecklist, description: e.target.value})}
                  placeholder="Enter checklist description (optional)"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newChecklist.is_active}
                    onChange={(e) => setNewChecklist({...newChecklist, is_active: e.target.checked})}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={createChecklist} className="btn btn-primary">
                <FontAwesomeIcon icon={faSave} /> Create
              </button>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Checklist Modal */}
      {showEditModal && editingChecklist && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Checklist</h3>
              <button onClick={() => setShowEditModal(false)} className="close-button">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={editingChecklist.title}
                  onChange={(e) => setEditingChecklist({...editingChecklist, title: e.target.value})}
                  placeholder="Enter checklist title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingChecklist.description || ''}
                  onChange={(e) => setEditingChecklist({...editingChecklist, description: e.target.value})}
                  placeholder="Enter checklist description (optional)"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingChecklist.is_active}
                    onChange={(e) => setEditingChecklist({...editingChecklist, is_active: e.target.checked})}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={updateChecklist} className="btn btn-primary">
                <FontAwesomeIcon icon={faSave} /> Save Changes
              </button>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklists;
