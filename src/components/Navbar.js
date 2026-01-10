import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ChevronDown,
    Users,
    Settings,
    Activity,
    MessageSquare,
    FileText,
    BarChart,
    Layout,
    Code,
    LayoutDashboard,
    Folder,
    Inbox
} from 'lucide-react';
import UserMenu from './UserMenu';
import './Navbar.css';

const NavItem = ({ to, children, exact = false, icon }) => {
    const location = useLocation();
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

    return (
        <Link to={to} className={`navbar-link ${isActive ? 'active' : ''}`}>
            {icon}
            <span>{children}</span>
        </Link>
    );
};

const Navbar = () => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return (
            <nav className="top-nav">
                <div className="nav-brand">
                    <Link to="/">
                        <img src="/debuggo-logo.svg" alt="Debuggo" className="nav-logo" />
                    </Link>
                </div>
                <div className="nav-actions" style={{ marginLeft: 'auto' }}>
                    <Link to="/login" className="nav-auth-btn">Login</Link>
                </div>
            </nav>
        );
    }

    const isAdmin = user?.role === 'admin';
    const isAdminActive = location.pathname.match(/^\/(clients|users|ai-models|contact-requests|admin-requests|monitoring|phase4|cost-analytics)/);

    return (
        <nav className="top-nav">
            <div className="nav-brand">
                <Link to="/">
                    <img src="/debuggo-logo.svg" alt="Debuggo" className="nav-logo" />
                </Link>
            </div>

            <div className="navbar-nav">
                <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />}>Dashboard</NavItem>
                <NavItem to="/projects" icon={<Folder size={18} />}>Projects</NavItem>
                <NavItem to="/my-requests" icon={<Inbox size={18} />}>My Requests</NavItem>

                {isAdmin && (
                    <div className="nav-dropdown-container">
                        <div className={`navbar-link nav-dropdown-trigger ${isAdminActive ? 'active' : ''}`}>
                            <Settings size={18} />
                            <span>Administration</span>
                            <ChevronDown size={14} />
                        </div>
                        <div className="nav-dropdown-menu">
                            <Link to="/clients" className="dropdown-item">
                                <Users size={16} /> Clients
                            </Link>
                            <Link to="/users" className="dropdown-item">
                                <Users size={16} /> Users
                            </Link>
                            <Link to="/ai-models" className="dropdown-item">
                                <Code size={16} /> AI Models
                            </Link>
                            <Link to="/contact-requests" className="dropdown-item">
                                <MessageSquare size={16} /> Contact Requests
                            </Link>
                            <Link to="/admin-requests" className="dropdown-item">
                                <FileText size={16} /> User Requests
                            </Link>
                            <Link to="/monitoring" className="dropdown-item">
                                <Activity size={16} /> Monitoring
                            </Link>
                            <Link to="/phase4" className="dropdown-item">
                                <Layout size={16} /> Phase 4
                            </Link>
                            <Link to="/cost-analytics" className="dropdown-item">
                                <BarChart size={16} /> Cost Analytics
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="nav-actions">
                <UserMenu />
            </div>
        </nav>
    );
};

export default Navbar;
