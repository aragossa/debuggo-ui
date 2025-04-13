import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import './TestCaseTree.css';

const TestCaseTree = ({ onNodeClick, selectedTestId, treeData, error, onTestCaseDeleted }) => {
  const [expandedNodes, setExpandedNodes] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [testCaseToDelete, setTestCaseToDelete] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL;

  // Auto-expand all group nodes when treeData changes
  React.useEffect(() => {
    if (treeData && treeData.length > 0) {
      const initialExpanded = {};
      
      const expandNodes = (nodes) => {
        if (!Array.isArray(nodes)) return;
        nodes.forEach(node => {
          // Expand root and group nodes by default
          if (node.type === 'root' || node.type === 'group') {
            initialExpanded[node.id] = true;
          }
          // Recursively process children
          if (node.children && node.children.length > 0) {
            expandNodes(node.children);
          }
        });
      };
      
      expandNodes(treeData);
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
      
      const response = await fetch(`${API_URL}/api/delete_test_case/${testCaseToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete test case');
      }
      
      // Close the modal
      setShowDeleteModal(false);
      setTestCaseToDelete(null);
      
      // Notify parent component to refresh the tree
      if (onTestCaseDeleted) {
        onTestCaseDeleted(testCaseToDelete.id);
      }
    } catch (error) {
      console.error('Error deleting test case:', error);
      alert('Failed to delete test case. Please try again.');
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
          
          {/* Only show delete button for test nodes */}
          {node.type === 'test' && (
            <button 
              className="delete-test-button"
              onClick={(e) => handleDeleteClick(e, node)}
              title="Delete test case"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
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
    return <div className="tree-empty">No test cases available.</div>;
  }

  return (
    <div className="test-case-tree">
      {treeData.map(node => renderNode(node))}
      
      {/* Confirmation Modal for Deleting Test Case */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete Test Case</h3>
            <p>Are you sure you want to delete this test case? This action cannot be undone.</p>
            <p><strong>Test Case:</strong> {testCaseToDelete?.name}</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteModal(false)} className="modal-button cancel">Cancel</button>
              <button onClick={handleConfirmDelete} className="modal-button delete">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCaseTree;
