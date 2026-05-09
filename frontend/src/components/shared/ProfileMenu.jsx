import React, { useState, useEffect, useRef } from 'react';
import './ProfileMenu.css';

function ProfileMenu({ user, onLogout, onOpenProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    if (onOpenProfile) {
      onOpenProfile();
    }
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get role badge color
  const getRoleBadgeColor = (userType) => {
    switch (userType) {
      case 'admin':
        return 'badge-admin';
      case 'faculty':
        return 'badge-faculty';
      case 'student':
        return 'badge-student';
      default:
        return 'badge-default';
    }
  };

  // Get role display name
  const getRoleDisplayName = (userType) => {
    switch (userType) {
      case 'admin':
        return 'Administrator';
      case 'faculty':
        return 'Faculty';
      case 'student':
        return 'Student';
      default:
        return 'User';
    }
  };

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <button className="profile-trigger" onClick={toggleMenu}>
        <div className="profile-avatar">
          {getInitials(user.fullName)}
        </div>
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <div className="profile-dropdown-avatar">
              {getInitials(user.fullName)}
            </div>
            <div className="profile-dropdown-info">
              <h4>{user.fullName}</h4>
              <p>{user.email}</p>
              {user.department && (
                <span className="profile-department">{user.department}</span>
              )}
            </div>
          </div>

          <div className="profile-dropdown-divider"></div>

          <div className="profile-dropdown-menu">
            <button className="profile-menu-item" onClick={handleProfileClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>My Profile</span>
            </button>

            <button className="profile-menu-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Settings</span>
            </button>

            <button className="profile-menu-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Help & Support</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
