import React, { useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import Clients from './components/Clients';
import NewClient from './components/NewClient';
import Users from './components/Users';
import UserMenu from './components/UserMenu';
import Projects from './components/Projects';
import ProjectDetail from './components/ProjectDetail';
import AIModelsAdmin from './components/AIModelsAdmin';
import ContactRequests from './components/ContactRequests';
import UserRequests from './components/UserRequests';
import AdminRequests from './components/AdminRequests';
import MonitoringDashboard from './components/MonitoringDashboard';
import AIInsights from './components/AIInsights';
import GenerationCostAnalytics from './components/GenerationCostAnalytics';
import MetricsDashboard from './components/MetricsDashboard';
import StatusBar from './components/StatusBar';
import './App.css';

import Navbar from './components/Navbar';

// Component to handle token detection and redirection
const TokenHandler = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      // Remove the token from URL to prevent it from being visible
      window.history.replaceState({}, document.title, window.location.pathname);

      // Login with the token
      const handleTokenLogin = async () => {
        try {
          await login({ access_token: token });
          navigate('/dashboard');
        } catch (err) {
          console.error('SSO auth error:', err);
          // Redirect to login page on error
          navigate('/login');
        }
      };

      handleTokenLogin();
    }
  }, [location, login, navigate]);

  return null; // This component doesn't render anything
};

const ConditionalStatusBar = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Only render StatusBar if user is authenticated and not on landing page or login page
  if (isAuthenticated && location.pathname !== '/' && location.pathname !== '/login') {
    return <StatusBar />;
  }

  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <TokenHandler />
        <div className="app">
          <Routes>
            <Route path="/" element={null} />
            <Route path="/login" element={null} />
            <Route path="*" element={<Navbar />} />
          </Routes>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute adminOnly>
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/new"
              element={
                <ProtectedRoute adminOnly>
                  <NewClient />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-models"
              element={
                <ProtectedRoute adminOnly>
                  <AIModelsAdmin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contact-requests"
              element={
                <ProtectedRoute adminOnly>
                  <ContactRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-requests"
              element={
                <ProtectedRoute>
                  <UserRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-requests"
              element={
                <ProtectedRoute adminOnly>
                  <AdminRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring"
              element={
                <ProtectedRoute adminOnly>
                  <MonitoringDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-insights"
              element={
                <ProtectedRoute adminOnly>
                  <AIInsights />
                </ProtectedRoute>
              }
            />
            <Route path="/phase4" element={<Navigate to="/ai-insights" replace />} />
            <Route
              path="/cost-analytics"
              element={
                <ProtectedRoute adminOnly>
                  <GenerationCostAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/metrics"
              element={
                <ProtectedRoute>
                  <MetricsDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
          <ConditionalStatusBar />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
