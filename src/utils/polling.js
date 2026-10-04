import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '';

// Calls fn now and then every intervalMs, but only while the tab is visible.
// Returns a function that stops the polling.
export function pollWhileVisible(fn, intervalMs) {
  let timer = null;

  const start = () => {
    if (timer !== null || document.hidden) return;
    fn();
    timer = setInterval(fn, intervalMs);
  };

  const stop = () => {
    clearInterval(timer);
    timer = null;
  };

  const handleVisibilityChange = () => (document.hidden ? stop() : start());

  document.addEventListener('visibilitychange', handleVisibilityChange);
  start();

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    stop();
  };
}

// One timer and one request per tick, shared by every component that
// subscribes. Polling runs only while there is at least one subscriber.
function createSharedPoller(fetchData, intervalMs, initialData) {
  const initialState = { data: initialData, loaded: false };
  const listeners = new Set();
  let state = initialState;
  let stopPolling = null;

  const refresh = async () => {
    let data = state.data;
    try {
      const fresh = await fetchData();
      // undefined means the request failed: keep the previous data
      if (fresh !== undefined) data = fresh;
    } catch (error) {
      console.error('Polling error:', error);
    }
    if (listeners.size === 0) return;
    state = { data, loaded: true };
    listeners.forEach(listener => listener(state));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    if (listeners.size === 1) {
      stopPolling = pollWhileVisible(refresh, intervalMs);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        stopPolling();
        stopPolling = null;
        state = initialState;
      }
    };
  };

  return { subscribe, refresh, getState: () => state };
}

function useSharedPoller(poller) {
  const [state, setState] = useState(poller.getState);

  useEffect(() => {
    setState(poller.getState());
    return poller.subscribe(setState);
  }, [poller]);

  return { ...state, refresh: poller.refresh };
}

const fetchJson = async (path) => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });
  return response.ok ? response.json() : undefined;
};

const runningTestsPoller = createSharedPoller(async () => {
  const data = await fetchJson('/api/running-tests');
  return data && (data.running_tests || []);
}, 3000, []);

const pendingConflictsPoller = createSharedPoller(async () => {
  const data = await fetchJson('/api/conflict-notifications/pending');
  return data && (data.notifications || []);
}, 5000, []);

// Both return { data, loaded, refresh }: data is the last successful response,
// loaded turns true after the first attempt, refresh() fetches right away.
export const useRunningTests = () => useSharedPoller(runningTestsPoller);
export const usePendingConflicts = () => useSharedPoller(pendingConflictsPoller);
