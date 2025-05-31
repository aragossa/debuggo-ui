import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenRefreshInProgress, setTokenRefreshInProgress] = useState(false);
  const refreshTimeoutRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL;

  // Function to fetch user data with a token
  const fetchUser = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        if (response.status === 401) {
          // Token is invalid or expired
          throw new Error('Invalid or expired token');
        }
        throw new Error(`Failed to fetch user: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }, [API_URL]);

  // Calculate time to refresh (75% of token lifetime)
  const getRefreshTime = useCallback(() => {
    // Default token expiry is 60 minutes, refresh at 45 minutes
    return 45 * 60 * 1000; // 45 minutes in milliseconds
  }, []);

  // Function to log out the user
  const logout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Function to refresh the access token
  const refreshAccessToken = useCallback(async (refreshToken) => {
    if (tokenRefreshInProgress) return null;
    
    try {
      setTokenRefreshInProgress(true);
      const response = await fetch(`${API_URL}/api/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      
      // Re-fetch user data with new token
      await fetchUser(data.access_token);
      
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    } finally {
      setTokenRefreshInProgress(false);
    }
  }, [API_URL, fetchUser, tokenRefreshInProgress]);

  // Function to schedule token refresh
  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const refreshTime = getRefreshTime();
    console.log(`Scheduling token refresh in ${refreshTime/60000} minutes`);
    
    refreshTimeoutRef.current = setTimeout(async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && isAuthenticated) {
        try {
          await refreshAccessToken(refreshToken);
          // Schedule the next refresh after this one completes
          scheduleTokenRefresh();
        } catch (error) {
          console.error('Failed to refresh token:', error);
          logout();
        }
      }
    }, refreshTime);
  }, [getRefreshTime, isAuthenticated, refreshAccessToken, logout]);

  // Function to login the user
  const login = useCallback(async (tokenData) => {
    try {
      localStorage.setItem('token', tokenData.access_token);
      localStorage.setItem('refreshToken', tokenData.refresh_token);
      
      await fetchUser(tokenData.access_token);
      
      // Schedule token refresh
      scheduleTokenRefresh();
      
      return true;
    } catch (error) {
      logout();
      throw error;
    }
  }, [fetchUser, scheduleTokenRefresh, logout]);

  // Function to get auth headers
  const getAuthHeaders = useCallback((includeContentType = true) => {
    const token = localStorage.getItem('token');
    const headers = token ? {
      'Authorization': `Bearer ${token}`,
    } : {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }, []);

  // Wrap fetch calls to handle token expiration
  const authFetch = useCallback(async (url, options = {}) => {
    try {
      // Add auth headers if not provided
      if (!options.headers || !options.headers['Authorization']) {
        const headers = getAuthHeaders(false);
        options.headers = { ...options.headers, ...headers };
      }

      let response = await fetch(url, options);

      // If unauthorized, try to refresh the token and retry
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken && !tokenRefreshInProgress) {
          try {
            // Refresh the token
            const newToken = await refreshAccessToken(refreshToken);
            if (newToken) {
              // Update the Authorization header with the new token
              options.headers['Authorization'] = `Bearer ${newToken}`;
              
              // Retry the request
              response = await fetch(url, options);
            } else {
              logout();
              throw new Error('Failed to refresh token');
            }
          } catch (refreshError) {
            console.error('Failed to refresh token during fetch:', refreshError);
            logout();
            throw new Error('Session expired. Please log in again.');
          }
        } else {
          logout();
          throw new Error('Session expired. Please log in again.');
        }
      }

      return response;
    } catch (error) {
      console.error('Error in authFetch:', error);
      throw error;
    }
  }, [getAuthHeaders, refreshAccessToken, tokenRefreshInProgress, logout]);

  // Clear any existing refresh timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Initialize authentication on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (token && refreshToken) {
        try {
          await fetchUser(token);
          // Schedule token refresh
          scheduleTokenRefresh();
        } catch (error) {
          console.error('Error during auth initialization:', error);
          // Try to refresh the token if we have a refresh token
          if (refreshToken) {
            try {
              await refreshAccessToken(refreshToken);
            } catch (refreshError) {
              console.error('Failed to refresh token during initialization:', refreshError);
              logout();
            }
          } else {
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchUser, scheduleTokenRefresh, refreshAccessToken, logout]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      getAuthHeaders,
      authFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
