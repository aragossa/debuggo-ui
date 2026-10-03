import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './ApiCoverage.css';

// State of a call: a symbol and a label next to the colour, so the colour never carries it alone
const STATES = {
  full: { symbol: '✓✓', label: 'Success and error statuses checked' },
  basic: { symbol: '✓', label: 'One kind of check only' },
  failing: { symbol: '✕', label: 'A step failed in its last run' },
  uncovered: { symbol: '–', label: 'No test sends it' },
};
const STATE_ORDER = ['full', 'basic', 'failing', 'uncovered'];

const ApiCoverage = ({ projectId, onOpenTest }) => {
  const [schemas, setSchemas] = useState([]);
  const [schemaId, setSchemaId] = useState('');
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // the call whose tests are listed
  const detailRef = useRef(null);
  const { getAuthHeaders } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    if (!projectId || projectId === 'all') return;
    setSchemas([]); setSchemaId(''); setCoverage(null); setSelected(null);
    fetch(`${API_URL}/api/projects/${projectId}/api-schemas`, { headers: getAuthHeaders() })
      .then(response => response.ok ? response.json() : { schemas: [] })
      .then(data => {
        const list = data.schemas || [];
        setSchemas(list);
        if (list.length > 0) setSchemaId(String(list[0].id));
      })
      .catch(() => setSchemas([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadCoverage = useCallback(async () => {
    if (!schemaId) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${API_URL}/api/api-schemas/${schemaId}/coverage`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
      setCoverage(data);
      setSelected(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemaId]);

  useEffect(() => { loadCoverage(); }, [loadCoverage]);

  // The tests of a call are listed under the grid: bring them into view when a call is picked
  useEffect(() => {
    if (selected && detailRef.current) detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selected]);

  if (!projectId || projectId === 'all') {
    return <div className="api-coverage"><p className="coverage-empty">Please select a specific project to see its API coverage</p></div>;
  }

  const summary = coverage ? coverage.summary : null;
  const percent = summary && summary.total ? Math.round((summary.covered / summary.total) * 100) : 0;

  return (
    <div className="api-coverage">
      <div className="coverage-header">
        <h3>API Coverage</h3>
        <div className="coverage-controls">
          {schemas.length > 1 && (
            <select value={schemaId} onChange={(e) => setSchemaId(e.target.value)}>
              {schemas.map(schema => <option key={schema.id} value={schema.id}>{schema.name}</option>)}
            </select>
          )}
          <button className="coverage-refresh" onClick={loadCoverage} disabled={loading || !schemaId}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {schemas.length === 0 && !loading && (
        <p className="coverage-empty">No API schema in this project. Upload one on the API Schemas page: coverage is counted against its calls.</p>
      )}
      {error && <p className="coverage-error">Failed to load the coverage: {error}</p>}

      {summary && (
        <>
          <div className="coverage-summary">
            <div className="coverage-tile coverage-tile-main">
              <div className="coverage-tile-value">{percent}%</div>
              <div className="coverage-tile-label">{summary.covered} of {summary.total} calls are sent by a test</div>
            </div>
            {STATE_ORDER.map(state => (
              <div key={state} className="coverage-tile">
                <div className="coverage-tile-value">
                  <span className={`coverage-swatch state-${state}`}>{STATES[state].symbol}</span>
                  {summary[state]}
                </div>
                <div className="coverage-tile-label">{STATES[state].label}</div>
              </div>
            ))}
          </div>

          <div className="coverage-grid">
            {coverage.resources.map(resource => (
              <div key={resource.name} className="coverage-row">
                <div className="coverage-resource" title={resource.name}>
                  {resource.name}
                  <span className="coverage-resource-count">
                    {resource.operations.filter(call => call.state !== 'uncovered').length}/{resource.operations.length}
                  </span>
                </div>
                <div className="coverage-cells">
                  {resource.operations.map(call => (
                    <button
                      key={call.id}
                      className={`coverage-cell state-${call.state} ${selected && selected.id === call.id ? 'selected' : ''}`}
                      onClick={() => setSelected(selected && selected.id === call.id ? null : call)}
                      title={`${call.method} ${call.path}\n${STATES[call.state].label}` +
                        (call.tests.length ? `\n${call.tests.length} test${call.tests.length === 1 ? '' : 's'}, statuses: ${call.statuses.join(', ')}` : '')}
                    >
                      <span className="coverage-cell-method">{call.method}</span>
                      <span className="coverage-cell-path">{call.path}</span>
                      <span className="coverage-cell-symbol">{STATES[call.state].symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {coverage.unmatched_steps > 0 && (
            <p className="coverage-note">
              {coverage.unmatched_steps} API step{coverage.unmatched_steps === 1 ? '' : 's'} of this project send a request that is not in the schema; they are not counted.
            </p>
          )}

          {selected && (
            <div className="coverage-detail" ref={detailRef}>
              <h4>
                <span className={`coverage-swatch state-${selected.state}`}>{STATES[selected.state].symbol}</span>
                {selected.method} {selected.path}
              </h4>
              <p className="coverage-detail-summary">
                {selected.summary || selected.name}{selected.requires_auth ? ' · needs authorization' : ''} · {STATES[selected.state].label}
              </p>
              {selected.tests.length === 0 ? (
                <p className="coverage-empty">No test sends this call. "Suggest scenarios (AI)" on the API Schemas page prefers calls that are not covered.</p>
              ) : (
                <table className="coverage-tests">
                  <thead>
                    <tr><th>Test</th><th>Type</th><th>Expected statuses</th><th>Last run of the step</th></tr>
                  </thead>
                  <tbody>
                    {selected.tests.map(test => (
                      <tr key={test.id}>
                        <td>
                          {onOpenTest
                            ? <button className="coverage-test-link" onClick={() => onOpenTest(test.id)}>#{test.id} {test.name}</button>
                            : <>#{test.id} {test.name}</>}
                        </td>
                        <td>{(test.test_type || '').toUpperCase()}</td>
                        <td>{test.statuses.join(', ')}</td>
                        <td>{test.last_status || 'not run yet'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ApiCoverage;
