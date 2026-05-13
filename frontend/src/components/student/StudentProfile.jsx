import React, { useState, useEffect } from 'react';
import './StudentProfile.css';

function StudentProfile({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState({
    fullName: user.fullName || '',
    rollNumber: user.rollNumber || user.id || '',
    email: user.email || '',
    phone: user.phone || '',
    department: user.department || '',
    year: user.year || '',
    semester: user.semester || '',
    class: user.class || '',
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

  const [academicStats, setAcademicStats] = useState({
    overallAttendance: 0,
    totalAssignments: 0,
    submittedAssignments: 0,
    pendingAssignments: 0,
    averageMarks: 0
  });

  const [announcements, setAnnouncements] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState([]);

  useEffect(() => {
    fetchStudentStats();
    fetchAnnouncements();
    fetchSubjectProgress();
  }, []);

  const fetchStudentStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/profile-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAcademicStats(data);
      }
    } catch (error) {
      console.error('Error fetching student stats:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/announcements?limit=5', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const fetchSubjectProgress = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/subject-progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubjectProgress(data);
      }
    } catch (error) {
      console.error('Error fetching subject progress:', error);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileData({ ...profileData, profilePhoto: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
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

  return (
    <div className="student-profile-overlay">
      <div className="student-profile-modal">
        <div className="student-profile-header">
          <h2>🎓 Student Profile</h2>
          <button className="student-profile-close" onClick={onClose}>✕</button>
        </div>

        <div className="student-profile-tabs">
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
            Academic Summary
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
        </div>

        <div className="student-profile-content">
          {activeTab === 'overview' && (
            <div className="student-profile-overview">
              <div className="student-profile-photo-section">
                <div className="student-profile-photo">
                  {profileData.profilePhoto ? (
                    <img src={profileData.profilePhoto} alt="Profile" />
                  ) : (
                    <div className="student-profile-photo-placeholder">
                      {profileData.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <label className="student-upload-photo-btn">
                  📷 Change Photo
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <div className="student-profile-info-grid">
                <div className="student-info-item">
                  <label>Full Name</label>
                  <p>{profileData.fullName}</p>
                </div>
                <div className="student-info-item">
                  <label>Roll Number</label>
                  <p>{profileData.rollNumber}</p>
                </div>
                <div className="student-info-item">
                  <label>Email</label>
                  <p>{profileData.email}</p>
                </div>
                <div className="student-info-item">
                  <label>Phone</label>
                  <p>{profileData.phone || 'Not provided'}</p>
                </div>
                <div className="student-info-item">
                  <label>Department</label>
                  <p>{profileData.department}</p>
                </div>
                <div className="student-info-item">
                  <label>Year / Semester</label>
                  <p>{profileData.year} / {profileData.semester}</p>
                </div>
                <div className="student-info-item">
                  <label>Class</label>
                  <p>{profileData.class}</p>
                </div>
                <div className="student-info-item">
                  <label>Role</label>
                  <p><span className="student-role-badge">Student</span></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="student-academic-summary">
              <h3>Academic Summary</h3>
              <div className="student-stats-grid">
                <div className="student-stat-card">
                  <div className="student-stat-icon">📊</div>
                  <div className="student-stat-info">
                    <h4>{academicStats.overallAttendance}%</h4>
                    <p>Overall Attendance</p>
                  </div>
                </div>
                <div className="student-stat-card">
                  <div className="student-stat-icon">✅</div>
                  <div className="student-stat-info">
                    <h4>{academicStats.submittedAssignments}</h4>
                    <p>Assignments Submitted</p>
                  </div>
                </div>
                <div className="student-stat-card">
                  <div className="student-stat-icon">⏳</div>
                  <div className="student-stat-info">
                    <h4>{academicStats.pendingAssignments}</h4>
                    <p>Pending Assignments</p>
                  </div>
                </div>
                <div className="student-stat-card">
                  <div className="student-stat-icon">📈</div>
                  <div className="student-stat-info">
                    <h4>{academicStats.averageMarks}%</h4>
                    <p>Average Marks</p>
                  </div>
                </div>
              </div>

              <div className="student-announcements-section">
                <h4>📢 Latest Announcements</h4>
                {announcements.length > 0 ? (
                  <div className="student-announcements-list">
                    {announcements.map((announcement, index) => (
                      <div key={index} className="student-announcement-item">
                        <div className="student-announcement-title">{announcement.title}</div>
                        <div className="student-announcement-date">
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="student-no-data">No announcements available</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="student-performance-snapshot">
              <h3>Performance Snapshot</h3>
              
              <div className="student-overall-performance">
                <div className="student-performance-card">
                  <h4>Average Marks</h4>
                  <div className="student-performance-value">{academicStats.averageMarks}%</div>
                  <div className="student-performance-bar">
                    <div 
                      className="student-performance-fill" 
                      style={{ width: `${academicStats.averageMarks}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="student-subject-progress-section">
                <h4>📚 Subject-wise Progress</h4>
                {subjectProgress.length > 0 ? (
                  <div className="student-subject-list">
                    {subjectProgress.map((subject, index) => (
                      <div key={index} className="student-subject-item">
                        <div className="student-subject-name">{subject.subject_name}</div>
                        <div className="student-subject-stats">
                          <span>Attendance: {subject.attendance}%</span>
                          <span>Marks: {subject.marks}%</span>
                        </div>
                        <div className="student-subject-bar">
                          <div 
                            className="student-subject-fill" 
                            style={{ width: `${subject.marks}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="student-no-data">No subject data available</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="student-edit-profile">
              <h3>Edit Profile</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="student-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editData.fullName}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="student-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <button type="submit" className="student-save-btn">💾 Save Changes</button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="student-security-settings">
              <h3>Change Password</h3>
              <form onSubmit={handlePasswordChange}>
                <div className="student-form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="student-form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="student-form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="student-save-btn">🔒 Change Password</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
