import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faFolderPlus, faPlus, faExchangeAlt, faMinus } from '@fortawesome/free-solid-svg-icons';
import './TestCaseTree.css';

const TestCaseTree = ({ onNodeClick, selectedTestId, treeData, error, onTestCaseDeleted, projectId }) => {
  const [expandedNodes, setExpandedNodes] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testCaseToDelete, setTestCaseToDelete] = useState(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showRenameGroupModal, setShowRenameGroupModal] = useState(false);
  const [showMoveTestCaseModal, setShowMoveTestCaseModal] = useState(false);
  const [showCreateTestCaseModal, setShowCreateTestCaseModal] = useState(false);
  const [showEditTestCaseModal, setShowEditTestCaseModal] = useState(false);
  const [testCaseToEdit, setTestCaseToEdit] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [groupToRename, setGroupToRename] = useState(null);
  const [testCaseToMove, setTestCaseToMove] = useState(null);
  const [targetGroupId, setTargetGroupId] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [newTestCase, setNewTestCase] = useState({
    name: '',
    description: '',
    parent_id: null,
    project_id: projectId !== 'all' ? projectId : null
  });
  const API_URL = process.env.REACT_APP_API_URL;

  // By default, all nodes are collapsed when treeData changes
  React.useEffect(() => {
    if (treeData && treeData.length > 0) {
      // Default is to have all nodes collapsed
      setExpandedNodes({});
    }
  }, [treeData]);

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Expand all nodes in the tree
  const expandAll = () => {
    const allExpanded = {};
    
    const expandNodes = (nodes) => {
      if (!Array.isArray(nodes)) return;
      nodes.forEach(node => {
        if (node.type === 'root' || node.type === 'group') {
          allExpanded[node.id] = true;
        }
        if (node.children && node.children.length > 0) {
          expandNodes(node.children);
        }
      });
    };
    
    expandNodes(treeData);
    setExpandedNodes(allExpanded);
  };

  // Collapse all nodes in the tree
  const collapseAll = () => {
    setExpandedNodes({});
  };

  const handleDeleteClick = (e, node) => {
    e.stopPropagation(); // Prevent triggering the node click
    setTestCaseToDelete(node);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!testCaseToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const endpoint = testCaseToDelete.type === 'group' 
        ? `${API_URL}/api/test_groups/${testCaseToDelete.id}`
        : `${API_URL}/api/delete_test_case/${testCaseToDelete.id}`;
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete');
      }
      
      // Close the modal
      setShowDeleteModal(false);
      setTestCaseToDelete(null);
      
      // Notify parent component to refresh the tree
      if (onTestCaseDeleted) {
        onTestCaseDeleted(testCaseToDelete.id);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert(error.message || 'Failed to delete. Please try again.');
    }
  };

  const handleCreateGroupClick = (parentId = null) => {
    setNewGroupName('');
    setSelectedParentId(parentId);
    setShowCreateGroupModal(true);
  };

  const handleRenameGroupClick = (e, group) => {
    e.stopPropagation(); // Prevent triggering the node click
    setGroupToRename(group);
    setNewGroupName(group.name);
    setShowRenameGroupModal(true);
  };

  const handleEditTestCaseClick = async (e, testCase) => {
    e.stopPropagation(); // Prevent triggering the node click
    setTestCaseToEdit(testCase);
    
    // Fetch available groups for the dropdown
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/api/test_groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const groups = await response.json();
      
      // Transform groups into a flat list with paths
      const flatGroups = [];
      
      const buildGroupPath = (group, parentPath = '') => {
        const currentPath = parentPath ? `${parentPath} / ${group.name}` : group.name;
        flatGroups.push({
          id: group.id,
          name: group.name,
          path: currentPath
        });
        
        if (group.children && group.children.length > 0) {
          group.children.forEach(child => buildGroupPath(child, currentPath));
        }
      };
      
      groups.forEach(group => buildGroupPath(group));
      setAvailableGroups(flatGroups);
      
      setShowEditTestCaseModal(true);
    } catch (error) {
      console.error('Error fetching groups:', error);
      alert('Failed to load groups. Please try again.');
    }
  };

  const handleMoveTestCaseClick = async (e, testCase) => {
    e.stopPropagation(); // Prevent triggering the node click
    setTestCaseToMove(testCase);
    
    // Fetch available groups for the dropdown
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/api/test_groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const groups = await response.json();
      
      // Transform groups into a flat list with paths
      const flatGroups = [];
      
      const buildGroupPath = (group, parentPath = '') => {
        const currentPath = parentPath ? `${parentPath} / ${group.name}` : group.name;
        flatGroups.push({
          id: group.id,
          name: group.name,
          path: currentPath
        });
        
        if (group.children && group.children.length > 0) {
          group.children.forEach(child => buildGroupPath(child, currentPath));
        }
      };
      
      groups.forEach(group => buildGroupPath(group));
      setAvailableGroups(flatGroups);
      
      setShowMoveTestCaseModal(true);
    } catch (error) {
      console.error('Error fetching groups:', error);
      alert('Failed to load groups. Please try again.');
    }
  };

  const handleConfirmCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Group name cannot be empty');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const requestBody = {
        name: newGroupName.trim(),
        parent_id: selectedParentId
      };
      
      // Add project_id to the request if it's available and not 'all'
      if (projectId && projectId !== 'all') {
        requestBody.project_id = projectId;
      }
      
      const response = await fetch(`${API_URL}/api/test_groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create group');
      }
      
      // Close the modal
      setShowCreateGroupModal(false);
      
      // Notify parent component to refresh the tree
      if (onTestCaseDeleted) {
        onTestCaseDeleted(null); // Pass null to just refresh the tree
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert(error.message || 'Failed to create group. Please try again.');
    }
  };

  const handleConfirmRenameGroup = async () => {
    if (!newGroupName.trim() || !groupToRename) {
      alert('Group name cannot be empty');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/api/test_groups/${groupToRename.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newGroupName.trim()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to rename group');
      }
      
      // Close the modal
      setShowRenameGroupModal(false);
      setGroupToRename(null);
      
      // Notify parent component to refresh the tree
      if (onTestCaseDeleted) {
        onTestCaseDeleted(null); // Pass null to just refresh the tree
      }
    } catch (error) {
      console.error('Error renaming group:', error);
      alert(error.message || 'Failed to rename group. Please try again.');
    }
  };

  const handleConfirmMoveTestCase = async () => {
    if (!testCaseToMove || !targetGroupId) {
      alert('Please select a target group');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/api/test_cases/move`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          test_case_id: testCaseToMove.id,
          target_group_id: targetGroupId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to move test case');
      }
      
      // Close the modal
      setShowMoveTestCaseModal(false);
      setTestCaseToMove(null);
      setTargetGroupId(null);
      
      // Notify parent component to refresh the tree
      if (onTestCaseDeleted) {
        onTestCaseDeleted(null); // Pass null to just refresh the tree
      }
    } catch (error) {
      console.error('Error moving test case:', error);
      alert(`Failed to move test case: ${error.message}`);
    }
  };

  const handleConfirmEditTestCase = async () => {
    if (!testCaseToEdit || !testCaseToEdit.name.trim()) {
      alert('Test case name cannot be empty');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/api/test_cases/${testCaseToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: testCaseToEdit.name.trim(),
          description: testCaseToEdit.description || '',
          parent_id: testCaseToEdit.parent_id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update test case');
      }
      
      // Close the modal
      setShowEditTestCaseModal(false);
      setTestCaseToEdit(null);
      
      // Notify parent component to refresh the tree
      if (onTestCaseDeleted) {
        onTestCaseDeleted(null); // Pass null to just refresh the tree
      }
    } catch (error) {
      console.error('Error updating test case:', error);
      alert(`Failed to update test case: ${error.message}`);
    }
  };
  
  const handleCreateTestCaseClick = async (parentId = null) => {
    // Reset form
    setNewTestCase({
      name: '',
      description: '',
      parent_id: parentId,
      project_id: projectId !== 'all' ? projectId : null
    });
    
    // Fetch available groups for the dropdown
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/api/test_groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const groups = await response.json();
      
      // Transform groups into a flat list with paths
      const flatGroups = [];
      
      const buildGroupPath = (group, parentPath = '') => {
        const currentPath = parentPath ? `${parentPath} / ${group.name}` : group.name;
        flatGroups.push({
          id: group.id,
          name: group.name,
          path: currentPath
        });
        
        if (group.children && group.children.length > 0) {
          group.children.forEach(child => buildGroupPath(child, currentPath));
        }
      };
      
      groups.forEach(group => buildGroupPath(group));
      setAvailableGroups(flatGroups);
      
      // Fetch available projects
      fetchProjects();
      
      // Show modal
      setShowCreateTestCaseModal(true);
    } catch (error) {
      console.error('Error fetching groups:', error);
      alert('Failed to load groups. Please try again.');
    }
  };

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch projects');
      }
      
      const data = await response.json();
      setAvailableProjects(data);
      
      // If the current projectId is set and valid, select it by default
      if (projectId && projectId !== 'all') {
        setNewTestCase(prev => ({ ...prev, project_id: projectId }));
      }
      // If there's only one project, select it by default
      else if (data.length === 1) {
        setNewTestCase(prev => ({ ...prev, project_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      alert('Failed to load projects. Please try again.');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleConfirmCreateTestCase = async () => {
    if (!newTestCase.name.trim()) {
      alert('Test case name cannot be empty');
      return;
    }
    
    if (!newTestCase.project_id) {
      alert('Please select a project');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const requestBody = {
        name: newTestCase.name.trim(),
        description: newTestCase.description.trim(),
        parent_id: newTestCase.parent_id ? parseInt(newTestCase.parent_id) : null,
        project_id: newTestCase.project_id
      };
      
      const response = await fetch(`${API_URL}/api/test_cases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create test case');
      }
      
      // Close the modal
      setShowCreateTestCaseModal(false);
      
      // Notify parent component to refresh the tree
      if (onTestCaseDeleted) {
        onTestCaseDeleted(null); // Pass null to just refresh the tree
      }
    } catch (error) {
      console.error('Error creating test case:', error);
      alert(error.message || 'Failed to create test case. Please try again.');
    }
  };

  const renderNode = (node) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isSelected = selectedTestId === node.id;

    return (
      <div key={node.id} className="tree-node">
        <div 
          className={`node-content ${isSelected ? 'selected' : ''}`}
          data-type={node.type}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            // Only trigger click handler for test nodes
            if (node.type === 'test') {
              onNodeClick(node.id);
            }
          }}
        >
          {hasChildren && (
            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="node-name">{node.name}</span>
          
          <div className="node-actions">
            {/* Group actions */}
            {node.type === 'group' && (
              <>
                <button 
                  className="tree-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateGroupClick(node.id);
                  }}
                  title="Add subgroup"
                >
                  <FontAwesomeIcon icon={faFolderPlus} />
                </button>
                <button 
                  className="tree-action-button"
                  onClick={(e) => handleRenameGroupClick(e, node)}
                  title="Rename group"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button 
                  className="tree-action-button"
                  onClick={(e) => handleDeleteClick(e, node)}
                  title="Delete group"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </>
            )}
            
            {/* Test case actions */}
            {node.type === 'test' && (
              <>
                <button 
                  className="tree-action-button"
                  onClick={(e) => handleEditTestCaseClick(e, node)}
                  title="Edit test case"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button 
                  className="tree-action-button"
                  onClick={(e) => handleMoveTestCaseClick(e, node)}
                  title="Move to another group"
                >
                  <FontAwesomeIcon icon={faExchangeAlt} />
                </button>
                <button 
                  className="tree-action-button"
                  onClick={(e) => handleDeleteClick(e, node)}
                  title="Delete test case"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="node-children">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (error) {
    return <div className="tree-error">{error}</div>;
  }

  if (!treeData || treeData.length === 0) {
    return (
      <div className="test-case-tree-container">
        <div className="tree-empty">No test cases available.</div>
        <div className="tree-actions">
          <button 
            className="create-group-button"
            onClick={() => handleCreateGroupClick(null)}
          >
            <FontAwesomeIcon icon={faFolderPlus} /> Create Group
          </button>
          <button 
            className="create-test-button"
            onClick={handleCreateTestCaseClick}
          >
            <FontAwesomeIcon icon={faPlus} /> Create Test Case
          </button>
        </div>
        {/* Ensure create group modal is rendered even if tree is empty */}
        {showCreateGroupModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Create New Group</h3>
              <div className="form-group">
                <label>Group Name:</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowCreateGroupModal(false)} className="modal-button cancel">Cancel</button>
                <button onClick={handleConfirmCreateGroup} className="modal-button create">Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="test-case-tree-container">
      <div className="test-case-tree-header">
        <div className="header-title-section">
          <h3>Test Cases</h3>
          <div className="title-buttons">
            <button 
              className="create-group-button"
              onClick={() => handleCreateGroupClick(null)}
            >
              <FontAwesomeIcon icon={faFolderPlus} /> Create Group
            </button>
            <button 
              className="create-test-button"
              onClick={handleCreateTestCaseClick}
            >
              <FontAwesomeIcon icon={faPlus} /> Create Test Case
            </button>
          </div>
        </div>
      </div>
      
      <div className="test-case-tree">
        <div className="tree-controls">
          <button 
            className="tree-control-button collapse"
            onClick={collapseAll}
            title="Collapse All"
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <button 
            className="tree-control-button expand"
            onClick={expandAll}
            title="Expand All"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        {treeData.map(node => renderNode(node))}
      </div>
      
      {/* Confirmation Modal for Deleting */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete {testCaseToDelete?.type === 'group' ? 'Group' : 'Test Case'}</h3>
            {testCaseToDelete?.type === 'group' ? (
              <p>Are you sure you want to delete this group? This action cannot be undone. Note that you cannot delete groups that contain test cases or subgroups.</p>
            ) : (
              <p>Are you sure you want to delete this test case? This action cannot be undone.</p>
            )}
            <p><strong>Name:</strong> {testCaseToDelete?.name}</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleConfirmDelete} className="modal-button delete">Delete</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Group</h3>
            <div className="form-group">
              <label>Group Name:</label>
              <input 
                type="text" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateGroupModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleConfirmCreateGroup} className="modal-button create">Create</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Rename Group Modal */}
      {showRenameGroupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Rename Group</h3>
            <div className="form-group">
              <label>New Group Name:</label>
              <input 
                type="text" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter new group name"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowRenameGroupModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleConfirmRenameGroup} className="modal-button update">Update</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Move Test Case Modal */}
      {showMoveTestCaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Move Test Case</h3>
            <div className="form-group">
              <label>Select Target Group:</label>
              <select 
                value={targetGroupId || ''}
                onChange={(e) => setTargetGroupId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">-- Select a group --</option>
                {availableGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.path}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowMoveTestCaseModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleConfirmMoveTestCase} className="modal-button update">Move</button>
            </div>
          </div>
        </div>
      )}

      {showEditTestCaseModal && testCaseToEdit && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Test Case</h3>
            <div className="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                value={testCaseToEdit.name || ''}
                onChange={(e) => setTestCaseToEdit({...testCaseToEdit, name: e.target.value})}
                placeholder="Enter test case name"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea 
                value={testCaseToEdit.description || ''}
                onChange={(e) => setTestCaseToEdit({...testCaseToEdit, description: e.target.value})}
                placeholder="Enter test case description"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Group:</label>
              <select 
                value={testCaseToEdit.parent_id || ''}
                onChange={(e) => setTestCaseToEdit({...testCaseToEdit, parent_id: e.target.value ? parseInt(e.target.value) : null})}
              >
                <option value="">-- Root --</option>
                {availableGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.path}</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditTestCaseModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleConfirmEditTestCase} className="modal-button update">Update</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Test Case Modal */}
      {showCreateTestCaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Test Case</h3>
            <div className="form-group">
              <label>Test Case Name: <span className="required">*</span></label>
              <input 
                type="text" 
                value={newTestCase.name}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter test case name"
              />
            </div>
            <div className="form-group">
              <label>Test Case Description:</label>
              <textarea 
                value={newTestCase.description}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter test case description"
              />
            </div>
            <div className="form-group">
              <label>Select Parent Group:</label>
              <select
                value={newTestCase.parent_id || ''}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, parent_id: e.target.value ? e.target.value : null }))}
              >
                <option value="">-- Select a group --</option>
                {availableGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.path}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Project: <span className="required">*</span></label>
              <select
                value={newTestCase.project_id || ''}
                onChange={(e) => setNewTestCase(prev => ({ ...prev, project_id: e.target.value }))}
                required
              >
                <option value="">-- Select a project --</option>
                {availableProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {isLoadingProjects && <div className="loading-indicator">Loading projects...</div>}
              {availableProjects.length === 0 && !isLoadingProjects && (
                <div className="no-projects-warning">No projects available. Please create a project first.</div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateTestCaseModal(false)} className="modal-button cancel">Cancel</button>
              <button 
                onClick={handleConfirmCreateTestCase} 
                className="modal-button create"
                disabled={isLoadingProjects || availableProjects.length === 0}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCaseTree;
