import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './UserMenu.css';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userContent = useMemo(() => {
    const userInitial = user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase();
    const displayName = user.full_name || user.email;
    
    return { userInitial, displayName };
  }, [user]);

  return (
    <div className="user-menu" ref={dropdownRef}>
      <button className="user-menu-button" onClick={() => setIsOpen(!isOpen)}>
        <div className="user-icon">
          {userContent.userInitial}
        </div>
      </button>
      {isOpen && (
        <div className="user-dropdown">
          <div className="user-info">
            <span className="user-name">{userContent.displayName}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
