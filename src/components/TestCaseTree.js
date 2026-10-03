import React, { useState, useMemo, useEffect } from 'react';
import {
  Trash2,
  Edit2,
  FolderPlus,
  Plus,
  ArrowRightLeft, // ExchangeAlt replacement
  ChevronDown,
  ChevronRight,
  FileText, // FileAlt replacement
  FileInput, // FileImport replacement
  Search,
  MoreHorizontal,
  CloudDownload
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './TestCaseTree.css';
import JiraImportModal from './JiraImportModal';

const TestCaseTree = ({ onNodeClick, selectedTestId, treeData, error, onTestCaseDeleted, projectId, onToggleVisibility, onGenerateFromFile }) => {
  // Load expanded state from localStorage on mount
  const [expandedNodes, setExpandedNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('testTreeExpandedNodes');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error loading expanded nodes from localStorage:', e);
      return {};
    }
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testCaseToDelete, setTestCaseToDelete] = useState(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showRenameGroupModal, setShowRenameGroupModal] = useState(false);
  const [showMoveTestCaseModal, setShowMoveTestCaseModal] = useState(false);
  const [showCreateTestCaseModal, setShowCreateTestCaseModal] = useState(false);
  const [showJiraImportModal, setShowJiraImportModal] = useState(false);
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
    project_id: projectId !== 'all' ? projectId : null,
    test_type: 'ui'  // Default to 'ui' type
  });
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = process.env.REACT_APP_API_URL;

  // Save expanded state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('testTreeExpandedNodes', JSON.stringify(expandedNodes));
    } catch (e) {
      console.error('Error saving expanded nodes to localStorage:', e);
    }
  }, [expandedNodes]);

  // Preserve expanded state when treeData changes
  useEffect(() => {
    if (treeData && treeData.length > 0 && Object.keys(expandedNodes).length === 0) {
      // On initial load, expand type_group nodes by default
      const initialExpanded = {};
      treeData.forEach(node => {
        if (node.type === 'type_group') {
          initialExpanded[node.id] = true;
        }
      });
      setExpandedNodes(initialExpanded);
    }
  }, [treeData]);

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleDeleteClick = (e, node) => {
    e.stopPropagation();
    setTestCaseToDelete(node);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!testCaseToDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

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

      setShowDeleteModal(false);
      setTestCaseToDelete(null);

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
    e.stopPropagation();
    setGroupToRename(group);
    setNewGroupName(group.name);
    setShowRenameGroupModal(true);
  };

  // Helper to fetch and flatten groups
  const fetchAndFlattenGroups = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found');

    const response = await fetch(`${API_URL}/api/test_groups`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch groups');

    const groups = await response.json();
    const flatGroups = [];
    const buildGroupPath = (group, parentPath = '') => {
      const currentPath = parentPath ? `${parentPath} / ${group.name}` : group.name;
      flatGroups.push({ id: group.id, name: group.name, path: currentPath, project_id: group.project_id });
      if (group.children) group.children.forEach(child => buildGroupPath(child, currentPath));
    };
    groups.forEach(group => buildGroupPath(group));
    setAvailableGroups(flatGroups);
  };

  const handleEditTestCaseClick = async (e, testCase) => {
    e.stopPropagation();
    setTestCaseToEdit(testCase);
    try {
      await fetchAndFlattenGroups();
      setShowEditTestCaseModal(true);
    } catch (error) {
      console.error(error);
      alert('Failed to load groups.');
    }
  };

  const handleMoveTestCaseClick = async (e, testCase) => {
    e.stopPropagation();
    setTestCaseToMove(testCase);
    try {
      await fetchAndFlattenGroups();
      setShowMoveTestCaseModal(true);
    } catch (error) {
      console.error(error);
      alert('Failed to load groups.');
    }
  };

  const handleCreateTestCaseClick = async (parentId = null, testType = 'ui') => {
    setNewTestCase({
      name: '',
      description: '',
      parent_id: parentId,
      project_id: projectId !== 'all' ? projectId : null,
      test_type: testType === 'api' ? 'api' : 'ui'
    });
    try {
      await fetchAndFlattenGroups();
      await fetchProjects();
      setShowCreateTestCaseModal(true);
    } catch (error) {
      console.error(error);
      alert('Failed to load data.');
    }
  };

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setAvailableProjects(data);

      if (projectId && projectId !== 'all') {
        setNewTestCase(prev => ({ ...prev, project_id: projectId }));
      } else if (data.length === 1) {
        setNewTestCase(prev => ({ ...prev, project_id: data[0].id }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // ... (API Action Handlers remain largely same logic, omitted for brevity but need to be included in full write)
  const handleConfirmCreateGroup = async () => {
    if (!newGroupName.trim()) { alert('Group name cannot be empty'); return; }
    try {
      const token = localStorage.getItem('token');
      const requestBody = { name: newGroupName.trim(), parent_id: selectedParentId };
      if (projectId && projectId !== 'all') requestBody.project_id = projectId;

      const response = await fetch(`${API_URL}/api/test_groups`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Failed');
      setShowCreateGroupModal(false);
      if (onTestCaseDeleted) onTestCaseDeleted(null);
    } catch (e) { alert(e.message); }
  };

  const handleConfirmRenameGroup = async () => {
    if (!newGroupName.trim() || !groupToRename) { alert('Invalid input'); return; }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/test_groups/${groupToRename.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() })
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Failed');
      setShowRenameGroupModal(false);
      if (onTestCaseDeleted) onTestCaseDeleted(null);
    } catch (e) { alert(e.message); }
  };

  const handleConfirmMoveTestCase = async () => {
    if (!testCaseToMove || !targetGroupId) { alert('Select target group'); return; }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/test_cases/move`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_case_id: testCaseToMove.id, target_group_id: targetGroupId })
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Failed');
      setShowMoveTestCaseModal(false);
      setTargetGroupId(null);
      if (onTestCaseDeleted) onTestCaseDeleted(null);
    } catch (e) { alert(e.message); }
  };

  const handleConfirmEditTestCase = async () => {
    if (!testCaseToEdit?.name.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/test_cases/${testCaseToEdit.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testCaseToEdit.name.trim(),
          description: testCaseToEdit.description || '',
          parent_id: testCaseToEdit.parent_id
        })
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Failed');
      setShowEditTestCaseModal(false);
      if (onTestCaseDeleted) onTestCaseDeleted(null);
    } catch (e) { alert(e.message); }
  };

  const handleConfirmCreateTestCase = async () => {
    if (!newTestCase.name.trim() || !newTestCase.project_id) return;
    try {
      const token = localStorage.getItem('token');
      const requestBody = {
        name: newTestCase.name.trim(),
        description: newTestCase.description.trim(),
        parent_id: newTestCase.parent_id ? parseInt(newTestCase.parent_id) : null,
        project_id: newTestCase.project_id,
        test_type: newTestCase.test_type || 'ui'
      };
      const response = await fetch(`${API_URL}/api/test_cases`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Failed');
      const created = await response.json();
      setShowCreateTestCaseModal(false);
      if (onTestCaseDeleted) onTestCaseDeleted(null);
      // Open the new test: the next thing to do with it is to generate or add its steps
      if (created && created.id && onNodeClick) onNodeClick(created.id);
    } catch (e) { alert(e.message); }
  };

  const onDragEnd = async (result) => {
    console.log('[DnD] Full Result:', JSON.stringify(result, null, 2));
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const testCaseId = parseInt(draggableId);
    let targetGroupId = null;

    // Handle "Drop on Header" (Hybrid Strategy)
    if (destination.droppableId.startsWith('target-group-')) {
      const groupIdStr = destination.droppableId.replace('target-group-', '');
      targetGroupId = parseInt(groupIdStr);
      console.log(`[DnD] Dropped ON Header of Group ${targetGroupId}`);
    }
    // Handle dropping into a list (standard reorder/move)
    else if (destination.droppableId.startsWith('group-')) {
      const groupIdStr = destination.droppableId.replace('group-', '');
      if (groupIdStr !== 'ROOT') {
        targetGroupId = parseInt(groupIdStr);
      }
    } else {
      return;
    }

    try {
      console.log(`[DnD] Moving Test Case ${testCaseId} to Group ${targetGroupId} (droppableId: ${destination.droppableId}). Destination Index: ${destination.index}`);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/test_cases/move`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_case_id: testCaseId, target_group_id: targetGroupId })
      });

      if (!response.ok) {
        throw new Error((await response.json()).detail || 'Failed to move');
      }

      // Refresh tree
      if (onTestCaseDeleted) onTestCaseDeleted(null);

    } catch (error) {
      console.error("Drag and drop failed:", error);
      alert(error.message);
    }
  };

  // Search Logic
  const filterTreeData = (nodes, term) => {
    if (!term) return nodes;
    return nodes.reduce((acc, node) => {
      const matches = node.name.toLowerCase().includes(term.toLowerCase());
      const children = node.children ? filterTreeData(node.children, term) : [];
      if (matches || children.length > 0) {
        acc.push({ ...node, children, expanded: true });
      }
      return acc;
    }, []);
  };

  const filteredTreeData = useMemo(() => filterTreeData(treeData, searchTerm), [treeData, searchTerm]);

  useEffect(() => {
    if (searchTerm) {
      const expandFiltered = (nodes) => {
        const newExpanded = {};
        const traverse = (n) => {
          newExpanded[n.id] = true;
          if (n.children) n.children.forEach(traverse);
        };
        nodes.forEach(traverse);
        setExpandedNodes(prev => ({ ...prev, ...newExpanded }));
      };
      expandFiltered(filteredTreeData);
    }
  }, [searchTerm, filteredTreeData]);

  // Render Logic
  const renderNode = (node, index, sectionType = 'ui') => {
    if (node.type === 'type_group') sectionType = node.test_type;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isSelected = selectedTestId === node.id;
    const isGroup = node.type === 'group' || node.type === 'type_group';

    // Test cases are always draggable. Groups are wrapped in Draggable to allow "Combine" (drop on header) to work,
    // but we can disable the actual dragging of groups if we don't want reordering yet.
    // For now, let's allow dragging groups too (why not?) or just keep them fixed. 
    // Let's set isDragDisabled={true} for groups so they are just drop targets.
    const isDraggable = node.type === 'test' || node.type === 'api_test';
    // We want the Group to be a Draggable so it can be a "Combine" target.
    // However, only 'group' type should be a target. 'type_group' (like "UI Tests") might not be a valid target or source.
    // Allows 'group' and 'type_group' to be targets for combine
    const canBeCombineTarget = node.type === 'group' || node.type === 'type_group';

    const wrapInHeaderDroppable = (content) => {
      // Hybrid Strategy:
      // The Group is a Draggable (to keep indexes correct), but we wrap the header content 
      // in a Droppable (to create a reliable drop target).
      if (!canBeCombineTarget) return content;

      return (
        <Droppable droppableId={`target-group-${node.id}`} type="TEST_CASE">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                backgroundColor: snapshot.isDraggingOver ? '#e0e7ff' : 'transparent',
                boxShadow: snapshot.isDraggingOver ? '0 0 0 2px #3b82f6 inset' : 'none',
                borderRadius: '4px',
                transition: 'all 0.1s'
              }}
            >
              {content}
              {/* Hide placeholder entirely to avoid expansion */}
              <div style={{ display: 'none' }}>{provided.placeholder}</div>
            </div>
          )}
        </Droppable>
      );
    };

    const headerContent = (
      <div
        className={`tree-node ${isDraggable ? 'draggable-item' : ''}`}
      >
        {wrapInHeaderDroppable(
          <div
            className={`node-content ${isSelected ? 'selected' : ''}`}
            data-type={node.type}
            onClick={() => {
              if (hasChildren || isGroup) toggleNode(node.id); // Toggle groups even if empty
              if (node.type === 'test' || node.type === 'api_test') onNodeClick(node.id);
            }}
          >
            {/* Chevron for Groups - acts as Main Icon now */}
            <div className="node-icon-area">
              {(hasChildren || isGroup) ? (
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
              ) : (
                <span className="node-spacer" />
              )}

              {/* File Icon only for Tests */}
              {!isGroup && <FileText size={14} className="file-icon" />}
            </div>

            <div className="node-content-text">
              <span className="node-name">{node.name}</span>
            </div>

            <div className="node-actions">
              {/* Group actions */}
              {(node.type === 'group' || node.type === 'api_group') && (
                <>
                  {node.type === 'group' && (
                    <button className="tree-action-button" onClick={(e) => { e.stopPropagation(); handleCreateTestCaseClick(node.id, sectionType); }} title={`Add ${sectionType === 'api' ? 'API' : 'UI'} test to this group`}>
                      <Plus size={14} />
                    </button>
                  )}
                  <button className="tree-action-button" onClick={(e) => { e.stopPropagation(); handleCreateGroupClick(node.id); }} title="Add subgroup">
                    <FolderPlus size={14} />
                  </button>
                  <button className="tree-action-button" onClick={(e) => handleRenameGroupClick(e, node)} title="Rename">
                    <Edit2 size={14} />
                  </button>
                  <button className="tree-action-button" onClick={(e) => handleDeleteClick(e, node)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </>
              )}

              {/* Type group actions - Simplified */}
              {node.type === 'type_group' && (
                <button className="tree-action-button" onClick={(e) => {
                  e.stopPropagation();
                  handleCreateTestCaseClick(null, node.test_type);
                }} title={`Add ${node.test_type === 'api' ? 'API' : 'UI'} test`}>
                  <Plus size={14} />
                </button>
              )}

              {/* Test case actions */}
              {(node.type === 'test' || node.type === 'api_test') && (
                <>
                  <button className="tree-action-button" onClick={(e) => handleEditTestCaseClick(e, node)} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  {/* Keep Move button as alternative */}
                  <button className="tree-action-button" onClick={(e) => handleMoveTestCaseClick(e, node)} title="Move">
                    <ArrowRightLeft size={14} />
                  </button>
                  <button className="tree-action-button" onClick={(e) => handleDeleteClick(e, node)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );

    const childrenContent = ((hasChildren && isExpanded) || (isGroup && isExpanded)) ? (
      <div className="node-children">
        {(node.type === 'group' || node.type === 'type_group') ? (
          <Droppable droppableId={`group-${node.id}`} type="TEST_CASE" isCombineEnabled={false}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`droppable-area ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                style={{
                  minHeight: '40px',
                  padding: '10px 0',
                  backgroundColor: snapshot.isDraggingOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  border: snapshot.isDraggingOver ? '1px dashed #3b82f6' : '1px dashed transparent',
                  transition: 'all 0.2s'
                }}
              >
                {(!node.children || node.children.length === 0) && snapshot.isDraggingOver && (
                  <div style={{ padding: '8px', color: '#6b7280', fontSize: '12px', textAlign: 'center' }}>
                    Drop into {node.name}
                  </div>
                )}
                {node.children && node.children.map((child, idx) => renderNode(child, idx, sectionType))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ) : (
          node.children && node.children.map((child, idx) => renderNode(child, idx, sectionType))
        )}
      </div>
    ) : null;

    // Use Draggable for ALL nodes to maintain index continuity (fixing the warning).
    // Disable drag for groups, but allow them to be "combine" targets.
    // Wrap ONLY the header in the Draggable so dragging OVER the header triggers combine.
    return (
      <div key={node.id}>
        <Draggable
          key={node.id}
          draggableId={String(node.id)}
          index={index}
          isDragDisabled={!isDraggable}
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                // No special styling here, handled by the internal Droppable
                borderRadius: '4px'
              }}
            >
              {headerContent}
            </div>
          )}
        </Draggable>
        {childrenContent}
      </div>
    );
  };

  if (error) return <div className="tree-error">{error}</div>;

  return (
    <div className="test-case-tree-container">
      <div className="test-case-tree-header">
        <div className="search-bar-container">
          <Search className="search-icon" size={14} />
          <input
            type="text"
            className="tree-search-input"
            placeholder="Filter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="tree-header-actions">
          <button className="icon-button" onClick={() => handleCreateGroupClick(null)} title="New Group">
            <FolderPlus size={16} />
          </button>
          <button className="icon-button primary" onClick={() => handleCreateTestCaseClick(null)} title="New Test Case">
            <Plus size={16} />
          </button>
          <button className="icon-button" onClick={onGenerateFromFile} title="Import from File">
            <FileInput size={16} />
          </button>
          <button className="icon-button" onClick={() => setShowJiraImportModal(true)} title="Import from Jira">
            Jira
          </button>
        </div>
      </div>

      <div className="test-case-tree">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="group-ROOT" type="TEST_CASE" isCombineEnabled={false}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`tree-root-droppable ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                style={{ minHeight: '100px' }}
              >
                {filteredTreeData.length === 0 ? (
                  <div className="tree-empty">No test cases</div>
                ) : (
                  filteredTreeData.map((node, index) => renderNode(node, index))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Modals remain mostly unchanged in logic, just re-rendered if needed by state */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete {testCaseToDelete?.type === 'group' ? 'Group' : 'Test Case'}</h3>
            <p className="mb-6">Are you sure you want to delete <strong>{testCaseToDelete?.name}</strong>? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-button cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="modal-button delete" onClick={handleConfirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Group</h3>
            <div className="form-group">
              <label>Group Name</label>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g. Authentication"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreateGroup()}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-button cancel" onClick={() => setShowCreateGroupModal(false)}>Cancel</button>
              <button className="modal-button confirm" onClick={handleConfirmCreateGroup}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showRenameGroupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Rename Group</h3>
            <div className="form-group">
              <label>Group Name</label>
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmRenameGroup()}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-button cancel" onClick={() => setShowRenameGroupModal(false)}>Cancel</button>
              <button className="modal-button confirm" onClick={handleConfirmRenameGroup}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showCreateTestCaseModal && (() => {
        const isApi = newTestCase.test_type === 'api';
        const projectFixed = projectId && projectId !== 'all';
        const projectName = (availableProjects.find(p => String(p.id) === String(newTestCase.project_id)) || {}).name;
        // Only the groups of the chosen project: a test cannot live in a group of another one
        const projectGroups = availableGroups.filter(g => !g.project_id || String(g.project_id) === String(newTestCase.project_id));
        const canCreate = newTestCase.name.trim() && newTestCase.project_id;
        const close = () => setShowCreateTestCaseModal(false);
        const onKeyDown = (e) => {
          if (e.key === 'Escape') close();
          // Enter creates from the name field; in the description it is a new line (Cmd/Ctrl+Enter creates)
          if (e.key === 'Enter' && canCreate && (e.target.tagName !== 'TEXTAREA' || e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleConfirmCreateTestCase();
          }
        };
        return (
          <div className="modal-overlay" onClick={close}>
            <div className="modal-content create-test-modal" onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
              <h3>
                New test case
                {projectFixed && projectName && <span className="create-test-project"> in {projectName}</span>}
              </h3>

              <div className="form-group">
                <label>Type</label>
                <div className="test-type-switch" role="radiogroup" aria-label="Test type">
                  <button
                    type="button" role="radio" aria-checked={!isApi}
                    className={`test-type-option ${!isApi ? 'active' : ''}`}
                    onClick={() => setNewTestCase({ ...newTestCase, test_type: 'ui' })}
                  >
                    UI test
                  </button>
                  <button
                    type="button" role="radio" aria-checked={isApi}
                    className={`test-type-option ${isApi ? 'active' : ''}`}
                    onClick={() => setNewTestCase({ ...newTestCase, test_type: 'api' })}
                  >
                    API test
                  </button>
                </div>
                <div className="form-hint">
                  {isApi
                    ? 'Steps are API requests. Generation builds them from the calls of the uploaded API schema.'
                    : 'Steps run in the browser. Generation can prepare data through the API when the project has a schema.'}
                </div>
              </div>

              {!projectFixed && (
                <div className="form-group">
                  <label>Project</label>
                  <select
                    value={newTestCase.project_id || ''}
                    onChange={(e) => setNewTestCase({ ...newTestCase, project_id: e.target.value, parent_id: null })}
                  >
                    <option value="">{isLoadingProjects ? 'Loading...' : 'Select project'}</option>
                    {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Name</label>
                <input
                  autoFocus
                  value={newTestCase.name}
                  onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
                  placeholder={isApi ? 'e.g. Brand: create, rename, delete' : 'e.g. Log in with a wrong password'}
                />
              </div>

              <div className="form-group">
                <label>What to test <span className="label-optional">(used to generate the steps)</span></label>
                <textarea
                  rows={4}
                  value={newTestCase.description}
                  onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
                  placeholder={isApi
                    ? 'Create a brand, read it and check its name, rename it, delete it and check that it is gone (404).'
                    : '1. Open the login page.\n2. Type the login and a wrong password, submit.\n3. Check that the error message is shown.'}
                />
              </div>

              <div className="form-group">
                <label>Group <span className="label-optional">(optional)</span></label>
                <select
                  value={newTestCase.parent_id || ''}
                  onChange={(e) => setNewTestCase({ ...newTestCase, parent_id: e.target.value || null })}
                  disabled={!newTestCase.project_id}
                >
                  <option value="">No group</option>
                  {projectGroups.map(g => <option key={g.id} value={g.id}>{g.path}</option>)}
                </select>
              </div>

              <div className="modal-actions">
                <button className="modal-button cancel" onClick={close}>Cancel</button>
                <button className="modal-button create" onClick={handleConfirmCreateTestCase} disabled={!canCreate}>
                  Create {isApi ? 'API' : 'UI'} test
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showMoveTestCaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Move Test Case</h3>
            <div className="form-group">
              <label>Select Target Group</label>
              <select value={targetGroupId || ''} onChange={(e) => setTargetGroupId(e.target.value)}>
                <option value="">Select Group...</option>
                {availableGroups.filter(g => !g.project_id || projectId === 'all' || String(g.project_id) === String(projectId)).map(g => (
                  <option key={g.id} value={g.id} disabled={g.id === testCaseToMove?.parent_id}>
                    {g.path}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button className="modal-button cancel" onClick={() => setShowMoveTestCaseModal(false)}>Cancel</button>
              <button className="modal-button confirm" onClick={handleConfirmMoveTestCase}>Move</button>
            </div>
          </div>
        </div>
      )}

      {showEditTestCaseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Test Case</h3>
            <div className="form-group">
              <label>Name</label>
              <input
                value={testCaseToEdit?.name || ''}
                onChange={(e) => setTestCaseToEdit({ ...testCaseToEdit, name: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-button cancel" onClick={() => setShowEditTestCaseModal(false)}>Cancel</button>
              <button className="modal-button update" onClick={handleConfirmEditTestCase}>Update</button>
            </div>
          </div>
        </div>
      )}

      {showJiraImportModal && (
        <JiraImportModal
          onClose={() => setShowJiraImportModal(false)}
          onImport={(result) => {
            alert(`Successfully imported ${result.imported_count} issues!`);
            if (onTestCaseDeleted) onTestCaseDeleted(null); // Trigger refresh
          }}
          targetGroupId={null} // Or selected parent ID if we want to allow importing into specific folder
          projectId={projectId}
          availableProjects={availableProjects}
        />
      )}

    </div>
  );
};

export default TestCaseTree;
