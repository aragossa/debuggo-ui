import React, { useEffect, useState } from 'react';
import './TestCaseTree.css';

const TestCaseTree = ({ onNodeClick }) => {
  const API_URL = process.env.REACT_APP_API_URL;
  const [treeData, setTreeData] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState({});

  useEffect(() => {
    fetch(`${API_URL}/api/get_tree`)
      .then((response) => response.json())
      .then((data) => {
        setTreeData(data);
      })
      .catch((error) => console.error('Error fetching tree data:', error));
  }, []);

  const toggleNode = (nodeId) => {
    setExpandedNodes((prevState) => ({
      ...prevState,
      [nodeId]: !prevState[nodeId],
    }));
  };

  const renderTreeNodes = (nodes, depth = 0) => {
    return (
      <ul>
        {nodes.map((node) => {
          const isExpanded = expandedNodes[node.id];
          const hasChildren = node.children && node.children.length > 0;

          return (
            <li key={node.id}>
              <div className="node-content">
                {hasChildren && (
                  <span
                    onClick={() => toggleNode(node.id)}
                    className="tree-node-toggle"
                  >
                    {isExpanded ? '▼' : '►'}
                  </span>
                )}
                {depth === 2 ? (
                  <div className="test-case-buttons">
                    <button
                      onClick={() => onNodeClick(node.id)}
                      className="tree-node-link"
                    >
                      {node.name}
                    </button>
                  </div>
                ) : (
                  <span
                    onClick={hasChildren ? () => toggleNode(node.id) : undefined}
                    className={hasChildren ? 'tree-node-label' : ''}
                  >
                    {node.name}
                  </span>
                )}
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
      <h2>Test Case Tree</h2>
      {treeData.length > 0 ? (
        renderTreeNodes(treeData)
      ) : (
        <p>No test cases yet</p>
      )}
    </div>
  );
};

export default TestCaseTree;
