import React, { useState, useEffect } from 'react';
import { X, Search, Check, AlertCircle, Loader } from 'lucide-react';
import './JiraImportModal.css';

const STEPS = {
    CONNECT: 1,
    FILTER: 2,
    PREVIEW: 3
};

const JiraImportModal = ({ onClose, onImport, targetGroupId, projectId, availableProjects: auroProjects }) => {
    const [step, setStep] = useState(STEPS.CONNECT);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Connection State
    const [creds, setCreds] = useState({
        url: localStorage.getItem('jira_url') || '',
        email: localStorage.getItem('jira_email') || '',
        token: localStorage.getItem('jira_token') || ''
    });

    // Filter State
    const [mode, setMode] = useState('simple'); // 'simple' or 'jql'
    const [jiraProjects, setJiraProjects] = useState([]);
    const [priorities, setPriorities] = useState([]);
    const [filters, setFilters] = useState({
        project: '',
        priority: '',
        jql: ''
    });

    // Preview State
    const [issues, setIssues] = useState([]);
    const [selectedIssues, setSelectedIssues] = useState(new Set());
    const [targetProject, setTargetProject] = useState(projectId && projectId !== 'all' ? projectId : (auroProjects[0]?.id || ''));

    const API_URL = process.env.REACT_APP_API_URL;

    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const handleConnect = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/jira/item/connect`, { // Changed path to match backend
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(creds)
            });

            if (!res.ok) throw new Error((await res.json()).detail || 'Connection failed');

            // Save credentials if successful
            localStorage.setItem('jira_url', creds.url);
            localStorage.setItem('jira_email', creds.email);
            localStorage.setItem('jira_token', creds.token);

            // Fetch projects and priorities
            const [projRes, prioRes] = await Promise.all([
                fetch(`${API_URL}/api/jira/projects`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(creds) }),
                fetch(`${API_URL}/api/jira/priorities`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(creds) })
            ]);

            if (!projRes.ok || !prioRes.ok) throw new Error('Failed to fetch metadata');

            setJiraProjects(await projRes.json());
            setPriorities(await prioRes.json());
            setStep(STEPS.FILTER);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = { ...creds };
            if (mode === 'jql') {
                payload.jql = filters.jql;
            } else {
                payload.project_key = jiraProjects.find(p => p.id === filters.project)?.key;
                payload.priority = priorities.find(p => p.id === filters.priority)?.name;
            }

            const res = await fetch(`${API_URL}/api/jira/search`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error((await res.json()).detail || 'Search failed');

            const foundIssues = await res.json();
            setIssues(foundIssues);
            // Select all by default
            setSelectedIssues(new Set(foundIssues.map(i => i.id)));
            setStep(STEPS.PREVIEW);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (selectedIssues.size === 0) return;
        setLoading(true);
        setError(null);
        try {
            const issuesToImport = issues.filter(i => selectedIssues.has(i.id));
            const res = await fetch(`${API_URL}/api/jira/import`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    ...creds,
                    issues: issuesToImport,
                    project_id: targetProject,
                    group_id: targetGroupId
                })
            });

            if (!res.ok) throw new Error((await res.json()).detail || 'Import failed');

            const result = await res.json();
            if (onImport) onImport(result);
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleIssue = (id) => {
        const newSelected = new Set(selectedIssues);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIssues(newSelected);
    };

    const renderStepContent = () => {
        if (loading) return <div className="jira-loading"><Loader className="animate-spin" size={32} /></div>;

        switch (step) {
            case STEPS.CONNECT:
                return (
                    <div className="jira-step-content">
                        <div className="jira-form-group">
                            <label>Jira URL</label>
                            <input
                                value={creds.url}
                                onChange={e => setCreds({ ...creds, url: e.target.value })}
                                placeholder="https://your-domain.atlassian.net"
                            />
                        </div>
                        <div className="jira-form-group">
                            <label>Email</label>
                            <input
                                value={creds.email}
                                onChange={e => setCreds({ ...creds, email: e.target.value })}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="jira-form-group">
                            <label>API Token</label>
                            <input
                                type="password"
                                value={creds.token}
                                onChange={e => setCreds({ ...creds, token: e.target.value })}
                                placeholder="Your Jira API Token"
                            />
                        </div>
                    </div>
                );

            case STEPS.FILTER:
                return (
                    <div className="jira-step-content">
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                                <input
                                    type="radio"
                                    checked={mode === 'simple'}
                                    onChange={() => setMode('simple')}
                                />
                                Simple Filter
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                                <input
                                    type="radio"
                                    checked={mode === 'jql'}
                                    onChange={() => setMode('jql')}
                                />
                                JQL (Advanced)
                            </label>
                        </div>

                        {mode === 'simple' ? (
                            <>
                                <div className="jira-form-group">
                                    <label>Project</label>
                                    <select
                                        value={filters.project}
                                        onChange={e => setFilters({ ...filters, project: e.target.value })}
                                    >
                                        <option value="">Select Project</option>
                                        {jiraProjects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="jira-form-group">
                                    <label>Priority</label>
                                    <select
                                        value={filters.priority}
                                        onChange={e => setFilters({ ...filters, priority: e.target.value })}
                                    >
                                        <option value="">Any Priority</option>
                                        {priorities.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div className="jira-form-group">
                                <label>JQL Query</label>
                                <textarea
                                    value={filters.jql}
                                    onChange={e => setFilters({ ...filters, jql: e.target.value })}
                                    placeholder='project = "MYPROJ" AND status = "To Do"'
                                />
                            </div>
                        )}
                    </div>
                );

            case STEPS.PREVIEW:
                return (
                    <div className="jira-step-content">
                        <div className="jira-form-group">
                            <label>Import to AuroQA Project</label>
                            <select
                                value={targetProject}
                                onChange={e => setTargetProject(e.target.value)}
                                disabled={!!projectId && projectId !== 'all'}
                            >
                                {auroProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400">{selectedIssues.size} issues selected</span>
                            <button
                                className="text-blue-400 text-sm hover:text-blue-300"
                                onClick={() => {
                                    if (selectedIssues.size === issues.length) setSelectedIssues(new Set());
                                    else setSelectedIssues(new Set(issues.map(i => i.id)));
                                }}
                            >
                                {selectedIssues.size === issues.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="jira-issues-list">
                            {issues.map(issue => (
                                <div key={issue.id} className="jira-issue-item" onClick={() => toggleIssue(issue.id)}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIssues.has(issue.id)}
                                        onChange={() => toggleIssue(issue.id)}
                                        className="mr-3"
                                    />
                                    <span className="jira-issue-key">{issue.key}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="jira-issue-summary" title={issue.summary}>{issue.summary}</div>
                                        <div className="jira-issue-meta">
                                            <span>{issue.status}</span>
                                            <span>•</span>
                                            <span>{issue.priority}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {issues.length === 0 && (
                                <div className="p-4 text-center text-gray-500">No issues found</div>
                            )}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="jira-import-modal-overlay">
            <div className="jira-import-modal">
                <div className="jira-modal-header">
                    <h3>Import from Jira</h3>
                    <button className="jira-close-button" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="jira-modal-content">
                    <div className="jira-steps">
                        <div className={`jira-step ${step >= STEPS.CONNECT ? 'active' : ''}`}>1. Connect</div>
                        <div className={`jira-step ${step >= STEPS.FILTER ? 'active' : ''}`}>2. Filter</div>
                        <div className={`jira-step ${step >= STEPS.PREVIEW ? 'active' : ''}`}>3. Preview & Import</div>
                    </div>

                    {error && (
                        <div className="jira-error flex items-center gap-2">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {renderStepContent()}
                </div>

                <div className="jira-modal-footer">
                    {step > STEPS.CONNECT && (
                        <button className="jira-btn jira-btn-secondary" onClick={() => setStep(step - 1)}>
                            Back
                        </button>
                    )}
                    {step === STEPS.CONNECT && (
                        <button className="jira-btn jira-btn-primary" onClick={handleConnect} disabled={loading}>
                            Connect
                        </button>
                    )}
                    {step === STEPS.FILTER && (
                        <button className="jira-btn jira-btn-primary" onClick={handleSearch} disabled={loading}>
                            Search Issues
                        </button>
                    )}
                    {step === STEPS.PREVIEW && (
                        <button
                            className="jira-btn jira-btn-primary"
                            onClick={handleImport}
                            disabled={loading || selectedIssues.size === 0}
                        >
                            Import Selected ({selectedIssues.size})
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JiraImportModal;
