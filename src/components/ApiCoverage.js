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
// Whose requests count: the API steps of the tests, what the browser of the UI tests sent, or both
const VIEWS = [
  { id: 'api', label: 'API tests', hint: 'are sent by an API step of a test' },
  { id: 'ui', label: 'UI tests', hint: 'were sent by the browser during UI test runs' },
  { id: 'all', label: 'Both', hint: 'are sent by an API step or by the browser of a UI test' },
];

const ApiCoverage = ({ projectId, onOpenTest }) => {
  const [schemas, setSchemas] = useState([]);
  const [schemaId, setSchemaId] = useState('');
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // the call whose tests are listed
  const [view, setView] = useState('api');
  const [pages, setPages] = useState(null); // pages the UI tests were on
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

  const loadPages = useCallback(async () => {
    if (!projectId || projectId === 'all') return;
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/page-coverage`, { headers: getAuthHeaders() });
      setPages(response.ok ? await response.json() : null);
    } catch (e) {
      setPages(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => { loadPages(); }, [loadPages]);

  // The tests of a call are listed under the grid: bring them into view when a call is picked
  useEffect(() => {
    if (selected && detailRef.current) detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selected]);

  if (!projectId || projectId === 'all') {
    return <div className="api-coverage"><p className="coverage-empty">Please select a specific project to see its API coverage</p></div>;
  }

  const summary = coverage ? coverage.summary[view] : null;
  const stateOf = (call) => call.states[view];
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
          <div className="coverage-views" role="group" aria-label="Whose requests count">
            {VIEWS.map(item => (
              <button key={item.id} className={view === item.id ? 'active' : ''} title={`Calls that ${item.hint}`}
                onClick={() => setView(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <button className="coverage-refresh" onClick={() => { loadCoverage(); loadPages(); }} disabled={loading}>
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
              <div className="coverage-tile-label">
                {summary.covered} of {summary.total} calls {VIEWS.find(item => item.id === view).hint}
              </div>
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
                    {resource.operations.filter(call => stateOf(call) !== 'uncovered').length}/{resource.operations.length}
                  </span>
                </div>
                <div className="coverage-cells">
                  {resource.operations.map(call => (
                    <button
                      key={call.id}
                      className={`coverage-cell state-${stateOf(call)} ${selected && selected.id === call.id ? 'selected' : ''}`}
                      onClick={() => setSelected(selected && selected.id === call.id ? null : call)}
                      title={`${call.method} ${call.path}\n${STATES[stateOf(call)].label}` +
                        `\nAPI tests: ${call.tests.length}${call.statuses.length ? ` (statuses ${call.statuses.join(', ')})` : ''}` +
                        `\nUI tests: ${call.ui_tests.length}${call.ui_statuses.length ? ` (statuses ${call.ui_statuses.join(', ')})` : ''}`}
                    >
                      <span className="coverage-cell-method">{call.method}</span>
                      <span className="coverage-cell-path">{call.path}</span>
                      <span className="coverage-cell-symbol">{STATES[stateOf(call)].symbol}</span>
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
                <span className={`coverage-swatch state-${stateOf(selected)}`}>{STATES[stateOf(selected)].symbol}</span>
                {selected.method} {selected.path}
              </h4>
              <p className="coverage-detail-summary">
                {selected.summary || selected.name}{selected.requires_auth ? ' · needs authorization' : ''} · {STATES[stateOf(selected)].label}
              </p>
              {selected.ui_tests.length > 0 && (
                <table className="coverage-tests">
                  <thead>
                    <tr><th>UI test whose browser sent it</th><th>Type</th><th>Statuses answered</th><th>Times in the last run</th></tr>
                  </thead>
                  <tbody>
                    {selected.ui_tests.map(test => (
                      <tr key={test.id}>
                        <td>
                          {onOpenTest
                            ? <button className="coverage-test-link" onClick={() => onOpenTest(test.id)}>#{test.id} {test.name}</button>
                            : <>#{test.id} {test.name}</>}
                        </td>
                        <td>UI</td>
                        <td>{test.statuses.join(', ') || 'not caught'}</td>
                        <td>{test.hits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {selected.tests.length === 0 ? (
                <p className="coverage-empty">No API step sends this call. "Suggest scenarios (AI)" on the API Schemas page prefers calls that are not covered.</p>
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

      {pages && (
        <div className="coverage-pages">
          <h3>Pages visited by UI tests</h3>
          {pages.pages.length === 0 ? (
            <p className="coverage-empty">
              No page recorded yet. The pages a UI test was on are recorded when it runs: run the UI tests of this project.
            </p>
          ) : (
            <>
              <p className="coverage-note">
                {pages.pages.length} page{pages.pages.length === 1 ? '' : 's'} visited by {pages.traced_tests} of {pages.ui_tests} UI
                test{pages.ui_tests === 1 ? '' : 's'}, in the last run of each. Only visited pages are listed: pages no test opens are not known yet.
                Pages with the fewest tests come first.
              </p>
              <table className="coverage-tests">
                <thead>
                  <tr><th>Page</th><th>Tests</th><th>Visited by</th></tr>
                </thead>
                <tbody>
                  {pages.pages.map(page => (
                    <tr key={page.page}>
                      <td className="coverage-page-name" title={page.example_url}>{page.page}</td>
                      <td>{page.tests.length}</td>
                      <td>
                        {page.tests.map((test, index) => (
                          <span key={test.id}>
                            {index > 0 && ', '}
                            {onOpenTest
                              ? <button className="coverage-test-link" onClick={() => onOpenTest(test.id)}>#{test.id} {test.name}</button>
                              : <>#{test.id} {test.name}</>}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiCoverage;
