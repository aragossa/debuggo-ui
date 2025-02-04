import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    // You might want to show a loading spinner here
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && (!user || user.role !== 'admin')) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
