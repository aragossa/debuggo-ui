// AIModelSelector.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './AIModelSelector.css';

const AIModelSelector = ({ onModelSelect, selectedModelId }) => {
  const [aiModels, setAiModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const { getAuthHeaders } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchAIModels();
  }, []);

  useEffect(() => {
    if (selectedModelId && aiModels.length > 0) {
      const model = aiModels.find(m => m.id === selectedModelId);
      if (model) {
        setSelectedModel(model);
      }
    }
  }, [selectedModelId, aiModels]);

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
      
      // If no model is selected yet, select the user's preferred model or the default one
      if (!selectedModel) {
        const userPreferred = data.find(model => model.is_user_selected);
        const defaultModel = data.find(model => model.is_default);
        setSelectedModel(userPreferred || defaultModel || data[0]);
        if (onModelSelect && (userPreferred || defaultModel || data[0])) {
          onModelSelect((userPreferred || defaultModel || data[0]).id);
        }
      }
    } catch (error) {
      console.error('Error fetching AI models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelSelect = async (model) => {
    setSelectedModel(model);
    setIsDropdownOpen(false);
    
    if (onModelSelect) {
      onModelSelect(model.id);
    }
    
    // Save user preference
    try {
      await fetch(`${API_URL}/api/user-ai-model`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ai_model_id: model.id })
      });
    } catch (error) {
      console.error('Error saving AI model preference:', error);
    }
  };

  return (
    <div className="ai-model-selector">
      <div className="ai-model-selector-label">AI Model:</div>
      <div className="ai-model-dropdown">
        <div 
          className="ai-model-selected" 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <FontAwesomeIcon icon={faRobot} className="ai-icon" />
          <span>{selectedModel ? selectedModel.name : (isLoading ? 'Loading...' : 'Select AI Model')}</span>
          <FontAwesomeIcon 
            icon={isDropdownOpen ? faChevronUp : faChevronDown} 
            className="dropdown-icon" 
          />
        </div>
        
        {isDropdownOpen && (
          <div className="ai-model-options">
            {aiModels.map(model => (
              <div 
                key={model.id} 
                className={`ai-model-option ${selectedModel && selectedModel.id === model.id ? 'selected' : ''}`}
                onClick={() => handleModelSelect(model)}
              >
                <div className="model-name">{model.name}</div>
                <div className="model-description">{model.description}</div>
                {model.is_default && <div className="model-tag default">Default</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIModelSelector;
