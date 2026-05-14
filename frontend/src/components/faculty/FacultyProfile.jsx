import React, { useState, useEffect } from 'react';
import './FacultyProfile.css';

function FacultyProfile({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState({
    fullName: user.fullName || '',
    employeeId: user.employeeId || user.id || '',
    email: user.email || '',
    phone: user.phone || '',
    department: user.department || '',
    designation: user.designation || 'Professor',
    joiningDate: user.joiningDate || '',
    profilePhoto: user.profilePhoto || null
  });

  const [editData, setEditData] = useState({
    fullName: user.fullName || '',
    phone: user.phone || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [stats, setStats] = useState({
    subjectsAssigned: 0,
    classesAssigned: 0,
    totalStudents: 0,
    lecturesConducted: 0,
    attendanceSessions: 0,
    assignmentsCreated: 0,
    pendingSubmissions: 0
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    availabilityStatus: 'available'
  });

  useEffect(() => {
    fetchFacultyStats();
  }, []);

  const fetchFacultyStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/faculty/profile-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching faculty stats:', error);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profilePhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/faculty/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        alert('Profile updated successfully!');
        setProfileData({ ...profileData, ...editData });
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/faculty/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        alert('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password');
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('https://backend-beryl-pi.vercel.app/api/faculty/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationSettings)
      });
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  return (
    <div className="faculty-profile-overlay">
      <div className="faculty-profile-modal">
        <div className="faculty-profile-header">
          <h2>👨‍🏫 Faculty Profile</h2>
          <button className="faculty-profile-close" onClick={onClose}>✕</button>
        </div>

        <div className="faculty-profile-tabs">
          <button 
            className={activeTab === 'overview' ? 'tab-active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'academic' ? 'tab-active' : ''} 
            onClick={() => setActiveTab('academic')}
          >
            Academic Details
          </button>
          <button 
            className={activeTab === 'performance' ? 'tab-active' : ''} 
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
          <button 
            className={activeTab === 'edit' ? 'tab-active' : ''} 
            onClick={() => setActiveTab('edit')}
          >
            Edit Profile
          </button>
          <button 
            className={activeTab === 'security' ? 'tab-active' : ''} 
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button 
            className={activeTab === 'settings' ? 'tab-active' : ''} 
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        <div className="faculty-profile-content">
          {activeTab === 'overview' && (
            <div className="faculty-profile-overview">
              <div className="faculty-profile-photo-section">
                <div className="faculty-profile-photo">
                  {profileData.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Profile" />
                  ) : (
                    <div className="faculty-profile-photo-placeholder">
                      {profileData.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <label className="faculty-upload-photo-btn">
                  📷 Change Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="faculty-profile-info-grid">
                <div className="faculty-info-item">
                  <label>Full Name</label>
                  <p>{profileData.fullName}</p>
                </div>
                <div className="faculty-info-item">
                  <label>Employee ID</label>
                  <p>{profileData.employeeId}</p>
                </div>
                <div className="faculty-info-item">
                  <label>Email</label>
                  <p>{profileData.email}</p>
                </div>
                <div className="faculty-info-item">
                  <label>Phone</label>
                  <p>{profileData.phone || 'Not provided'}</p>
                </div>
                <div className="faculty-info-item">
                  <label>Department</label>
                  <p>{profileData.department}</p>
                </div>
                <div className="faculty-info-item">
                  <label>Designation</label>
                  <p>{profileData.designation}</p>
                </div>
                <div className="faculty-info-item">
                  <label>Joining Date</label>
                  <p>{profileData.joiningDate || 'Not available'}</p>
                </div>
                <div className="faculty-info-item">
                  <label>Role</label>
                  <p><span className="faculty-role-badge">Faculty</span></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="faculty-academic-details">
              <h3>Academic Information</h3>
              <div className="faculty-stats-grid">
                <div className="faculty-stat-card">
                  <div className="faculty-stat-icon">📚</div>
                  <div className="faculty-stat-info">
                    <h4>{stats.subjectsAssigned}</h4>
                    <p>Subjects Assigned</p>
                  </div>
                </div>
                <div className="faculty-stat-card">
                  <div className="faculty-stat-icon">🏫</div>
                  <div className="faculty-stat-info">
                    <h4>{stats.classesAssigned}</h4>
                    <p>Classes Assigned</p>
                  </div>
                </div>
                <div className="faculty-stat-card">
                  <div className="faculty-stat-icon">👥</div>
                  <div className="faculty-stat-info">
                    <h4>{stats.totalStudents}</h4>
                    <p>Total Students Handled</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="faculty-performance-overview">
              <h3>Performance Overview</h3>
              <div className="faculty-stats-grid">
                <div className="faculty-stat-card">
                  <div className="faculty-stat-icon">📖</div>
                  <div className="faculty-stat-info">
                    <h4>{stats.lecturesConducted}</h4>
                    <p>Lectures Conducted</p>
                  </div>
                </div>
                <div className="faculty-stat-card">
                  <div className="faculty-stat-icon">✅</div>
                  <div className="faculty-stat-info">
                    <h4>{stats.attendanceSessions}</h4>
                    <p>Attendance Sessions</p>
                  </div>
                </div>
                <div className="faculty-stat-card">
                  <div className="faculty-stat-icon">📝</div>
                  <div className="faculty-stat-info">
                    <h4>{stats.assignmentsCreated}</h4>
                    <p>Assignments Created</p>
                  </div>
                </div>
                <div className="faculty-stat-card">
                  <div className="faculty-stat-icon">⏳</div>
                  <div className="faculty-stat-info">
                    <h4>{stats.pendingSubmissions}</h4>
                    <p>Pending Submissions</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="faculty-edit-profile">
              <h3>Edit Profile</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="faculty-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editData.fullName}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="faculty-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <button type="submit" className="faculty-save-btn">💾 Save Changes</button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="faculty-security-settings">
              <h3>Change Password</h3>
              <form onSubmit={handlePasswordChange}>
                <div className="faculty-form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="faculty-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="faculty-form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="faculty-save-btn">🔒 Change Password</button>
              </form>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="faculty-communication-settings">
              <h3>Communication Settings</h3>
              <div className="faculty-settings-section">
                <h4>Notification Preferences</h4>
                <div className="faculty-setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                    />
                    Email Notifications
                  </label>
                </div>
                <div className="faculty-setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationSettings.inAppNotifications}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, inAppNotifications: e.target.checked })}
                    />
                    In-App Notifications
                  </label>
                </div>
              </div>

              <div className="faculty-settings-section">
                <h4>Availability Status</h4>
                <select
                  value={notificationSettings.availabilityStatus}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, availabilityStatus: e.target.value })}
                  className="faculty-status-select"
                >
                  <option value="available">🟢 Available</option>
                  <option value="busy">🟡 Busy</option>
                  <option value="away">🔴 Away</option>
                </select>
              </div>

              <button onClick={handleNotificationUpdate} className="faculty-save-btn">💾 Save Settings</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FacultyProfile;
