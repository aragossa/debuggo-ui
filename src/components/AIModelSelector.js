// AIModelSelector.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import './AIModelSelector.css';

const AIModelSelector = ({ onModelSelect, selectedModelId, onVlmChange }) => {
  const [aiModels, setAiModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [vlmEnabled, setVlmEnabled] = useState(false);
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
      // Fetch models
      const modelsResponse = await fetch(`${API_URL}/api/ai-models`, {
        headers: getAuthHeaders()
      });

      if (!modelsResponse.ok) {
        throw new Error('Failed to fetch AI models');
      }

      const modelsData = await modelsResponse.json();
      setAiModels(modelsData);

      // Fetch user preference for VLM (we need a separate endpoint or include it in models response, 
      // but for now we can try to fetch it from user-ai-model endpoint if it supported GET, 
      // or we just rely on what we have. 
      // Since we don't have a GET endpoint for user preference specifically, we might need to rely on 
      // the fact that we are setting it.
      // However, to get the initial state correct, we should probably check if any model is marked as user selected
      // and if we can get the VLM setting.
      // The current backend implementation of GET /api/ai-models doesn't seem to return user specific settings like vlm_enabled
      // directly in the model object unless we modified that endpoint too.
      // Let's assume for now we default to FALSE as per requirement, and if we had a way to fetch it we would.
      // Wait, we can use the fact that we just added vlm_enabled to user_ai_models.
      // We should probably add a GET endpoint for user preferences, but for now let's stick to the plan.
      // Actually, let's try to fetch the user preference if possible.
      // If not, we default to false.

      // If no model is selected yet, select the user's preferred model or the default one
      if (!selectedModel) {
        const userPreferred = modelsData.find(model => model.is_user_selected);
        const defaultModel = modelsData.find(model => model.is_default);
        setSelectedModel(userPreferred || defaultModel || modelsData[0]);

        // If we have user preference info attached to the model (which we might if the backend joins tables),
        // we could use it. If not, we might default to false.
        // Let's check if 'vlm_enabled' is in the userPreferred object.
        if (userPreferred && userPreferred.vlm_enabled !== undefined) {
          setVlmEnabled(userPreferred.vlm_enabled);
          if (onVlmChange) onVlmChange(userPreferred.vlm_enabled);
        } else {
          setVlmEnabled(false);
          if (onVlmChange) onVlmChange(false);
        }

        if (onModelSelect && (userPreferred || defaultModel || modelsData[0])) {
          onModelSelect((userPreferred || defaultModel || modelsData[0]).id);
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

    savePreference(model.id, vlmEnabled);
  };

  const handleVlmToggle = (e) => {
    const newValue = e.target.checked;
    setVlmEnabled(newValue);
    if (onVlmChange) {
      onVlmChange(newValue);
    }
    if (selectedModel) {
      savePreference(selectedModel.id, newValue);
    }
  };

  const savePreference = async (modelId, isVlmEnabled) => {
    try {
      await fetch(`${API_URL}/api/user-ai-model`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ai_model_id: modelId,
          vlm_enabled: isVlmEnabled
        })
      });
    } catch (error) {
      console.error('Error saving AI model preference:', error);
    }
  };

  return (
    <div className="ai-model-selector-container">
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

      <div className="vlm-toggle-container">
        <label className="vlm-toggle-label">
          <input
            type="checkbox"
            checked={vlmEnabled}
            onChange={handleVlmToggle}
          />
          <span className="vlm-toggle-text">VLM Enabled (Screenshots)</span>
        </label>
      </div>
    </div>
  );
};

export default AIModelSelector;
