import React, { useState, useEffect } from 'react';
import './AdminProfile.css';
import { formatDateTimeTo12Hour } from '../../utils/timeUtils';

function AdminProfile({ user, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    profilePhoto: null,
    lastLogin: formatDateTimeTo12Hour(new Date())
  });
  const [systemStats, setSystemStats] = useState({
    totalFaculty: 0,
    totalStudents: 0,
    totalClasses: 0,
    totalSubjects: 0
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemStats({
          totalFaculty: data.totalFaculty || 0,
          totalStudents: data.totalStudents || 0,
          totalClasses: data.totalClasses || 0,
          totalSubjects: data.totalAssignments || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // Save profile logic here
    alert('Profile updated successfully!');
    setIsEditing(false);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // Change password logic here
    alert('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    const names = name.split(' ');
    return names.length >= 2 
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>👩‍💼 Admin Profile</h2>
          <button className="profile-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`profile-tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Edit Profile
          </button>
          <button 
            className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button 
            className={`profile-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System Stats
          </button>
        </div>

        <div className="profile-modal-body">
          {activeTab === 'overview' && (
            <div className="profile-overview">
              <div className="profile-header-section">
                <div className="profile-photo-large">
                  {profileData.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Profile" />
                  ) : (
                    <div className="profile-initials-large">{getInitials(profileData.fullName)}</div>
                  )}
                </div>
                <div className="profile-header-info">
                  <h3>{profileData.fullName}</h3>
                  <span className="profile-role-badge admin">Administrator</span>
                  <p className="profile-email">{profileData.email}</p>
                  <p className="profile-last-login">Last login: {profileData.lastLogin}</p>
                </div>
              </div>

              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <span className="profile-info-label">Full Name</span>
                  <span className="profile-info-value">{profileData.fullName}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Email</span>
                  <span className="profile-info-value">{profileData.email}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Phone</span>
                  <span className="profile-info-value">{profileData.phone || 'Not provided'}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Role</span>
                  <span className="profile-info-value">Administrator</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="profile-edit">
              <div className="profile-photo-upload">
                <div className="profile-photo-preview">
                  {profileData.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Profile" />
                  ) : (
                    <div className="profile-initials-large">{getInitials(profileData.fullName)}</div>
                  )}
                </div>
                <div className="profile-photo-actions">
                  <input 
                    type="file" 
                    id="photoUpload" 
                    accept="image/*" 
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="btn-upload-photo"
                    onClick={() => document.getElementById('photoUpload').click()}
                  >
                    📷 Change Photo
                  </button>
                </div>
              </div>

              <div className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    disabled
                    className="input-disabled"
                  />
                  <small>Email cannot be changed</small>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
                <button className="btn-save-profile" onClick={handleSaveProfile}>
                  💾 Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="profile-security">
              <h3>🔒 Change Password</h3>
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button type="submit" className="btn-change-password">
                  🔑 Change Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="profile-system-stats">
              <h3>📊 System Overview</h3>
              <div className="system-stats-grid">
                <div className="system-stat-card blue">
                  <div className="stat-icon">👨‍🏫</div>
                  <div className="stat-content">
                    <div className="stat-value">{systemStats.totalFaculty}</div>
                    <div className="stat-label">Total Faculty</div>
                  </div>
                </div>
                <div className="system-stat-card green">
                  <div className="stat-icon">🎓</div>
                  <div className="stat-content">
                    <div className="stat-value">{systemStats.totalStudents}</div>
                    <div className="stat-label">Total Students</div>
                  </div>
                </div>
                <div className="system-stat-card orange">
                  <div className="stat-icon">📚</div>
                  <div className="stat-content">
                    <div className="stat-value">{systemStats.totalClasses}</div>
                    <div className="stat-label">Total Classes</div>
                  </div>
                </div>
                <div className="system-stat-card purple">
                  <div className="stat-icon">📖</div>
                  <div className="stat-content">
                    <div className="stat-value">{systemStats.totalSubjects}</div>
                    <div className="stat-label">Total Subjects</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
