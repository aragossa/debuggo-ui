import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';

  // Function to fetch user data with a token
  const fetchUser = async (token) => {
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
  };

  // Function to log out the user
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Function to login the user
  const login = async (tokenData) => {
    try {
      // Store only the access token
      localStorage.setItem('token', tokenData.access_token);
      
      await fetchUser(tokenData.access_token);
      return true;
    } catch (error) {
      logout();
      throw error;
    }
  };

  // Function to get auth headers
  const getAuthHeaders = (includeContentType = true) => {
    const token = localStorage.getItem('token');
    const headers = token ? {
      'Authorization': `Bearer ${token}`,
    } : {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  };

  // Initialize authentication on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          await fetchUser(token);
        } catch (error) {
          console.error('Error during auth initialization:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      getAuthHeaders
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
