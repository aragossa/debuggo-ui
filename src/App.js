import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
import './App.css';

const AdminMenu = () => {
  const { user } = useAuth();
  
  return useMemo(() => {
    if (!user || user.role !== 'admin') {
      return null;
    }

    return (
      <div className="admin-menu">
        <Link to="/clients" className="admin-menu-item">Clients</Link>
        <Link to="/users" className="admin-menu-item">Users</Link>
      </div>
    );
  }, [user]);
};

const MainMenu = () => {
  const { isAuthenticated } = useAuth();

  return useMemo(() => {
    if (!isAuthenticated) {
      return null;
    }

    return (
      <div className="main-menu">
        <Link to="/dashboard" className="menu-item">Dashboard</Link>
        <Link to="/projects" className="menu-item">Projects</Link>
      </div>
    );
  }, [isAuthenticated]);
};

const NavAuth = () => {
  const { isAuthenticated } = useAuth();

  return useMemo(() => {
    if (isAuthenticated) {
      return <UserMenu />;
    }

    return (
      <div className="nav-auth">
        <Link to="/login">Login</Link>
      </div>
    );
  }, [isAuthenticated]);
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <nav className="top-nav">
            <div className="nav-brand">
              <Link to="/">AuroQA</Link>
            </div>
            <div className="nav-menu">
              <MainMenu />
              <AdminMenu />
            </div>
            <NavAuth />
          </nav>
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
