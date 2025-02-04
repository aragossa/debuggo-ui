import React, { useState } from 'react';
import './TestCaseTree.css';

const TestCaseTree = ({ onNodeClick, selectedTestId, treeData, error }) => {
  const [expandedNodes, setExpandedNodes] = useState({});

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
    </div>
  );
};

export default TestCaseTree;
