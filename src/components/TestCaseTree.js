import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './TestCaseTree.css';

const TestCaseTree = ({ onNodeClick, selectedTestId }) => {
  const API_URL = process.env.REACT_APP_API_URL;
  const { getAuthHeaders } = useAuth();
  const [treeData, setTreeData] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTreeData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/get_tree`, {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          console.warn('Tree data is not an array:', data);
          setTreeData([]);
          return;
        }

        setTreeData(data);
        // Auto-expand all group nodes
        const initialExpanded = {};
        const expandGroups = (nodes) => {
          if (!Array.isArray(nodes)) return;
          nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
              initialExpanded[node.id] = true;
              expandGroups(node.children);
            }
          });
        };
        expandGroups(data);
        setExpandedNodes(initialExpanded);
        setError(null);
      } catch (error) {
        console.error('Error fetching tree data:', error);
        setError('Failed to load test cases. Please try again later.');
        setTreeData([]);
      }
    };

    fetchTreeData();
  }, [API_URL, getAuthHeaders]);

  const toggleNode = (nodeId) => {
    setExpandedNodes((prevState) => ({
      ...prevState,
      [nodeId]: !prevState[nodeId],
    }));
  };

  const renderTreeNodes = (nodes, depth = 0) => {
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return null;
    }

    return (
      <ul>
        {nodes.map((node) => {
          const isExpanded = expandedNodes[node.id];
          const hasChildren = node.children && node.children.length > 0;
          const isSelected = node.id === selectedTestId;

          return (
            <li key={node.id}>
              <div className="node-content">
                {hasChildren && (
                  <span
                    onClick={() => toggleNode(node.id)}
                    className="tree-node-toggle"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </span>
                )}
                <span
                  className={`tree-node-label ${isSelected ? 'selected' : ''}`}
                  onClick={() => onNodeClick && onNodeClick(node.id)}
                >
                  {node.name}
                </span>
              </div>
              {hasChildren && isExpanded && renderTreeNodes(node.children, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="test-case-tree">
      {error && <div className="error-message">{error}</div>}
      {!error && (!Array.isArray(treeData) || treeData.length === 0) ? (
        <div className="no-data-message">No test cases available</div>
      ) : (
        renderTreeNodes(treeData)
      )}
    </div>
  );
};

export default TestCaseTree;
