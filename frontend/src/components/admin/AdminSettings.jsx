import React, { useState, useEffect } from 'react';
import './AdminSettings.css';

function AdminSettings() {
  const [settings, setSettings] = useState({
    systemName: 'Vidhyarth University',
    systemEmail: 'admin@vidhyarth.edu',
    academicYear: '2025-2026',
    semester: 'Spring 2026',
    enableNotifications: true,
    enableEmailAlerts: true,
    autoBackup: true,
    maintenanceMode: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [systemStats, setSystemStats] = useState({
    databaseSize: '0 MB',
    totalRecords: 0,
    lastBackup: 'Never',
    uptime: '0 days'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
    fetchSystemStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/system-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSystemStats(data);
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters!' });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/change-password', {
        method: 'POST',
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
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDatabase = async () => {
    if (!window.confirm('Create a database backup? This may take a few moments.')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Database backup created successfully!' });
        fetchSystemStats();
      } else {
        setMessage({ type: 'error', text: 'Failed to create backup' });
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setMessage({ type: 'error', text: 'Failed to create backup' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Clear system cache? This will improve performance.')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/clear-cache', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cache cleared successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to clear cache' });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      setMessage({ type: 'error', text: 'Failed to clear cache' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-settings-container">
      <div className="admin-settings-header">
        <h2>⚙️ System Settings</h2>
        <p>Manage system configuration and preferences</p>
      </div>

      {message.text && (
        <div className={`admin-message ${message.type}`}>
          {message.type === 'success' ? '✓' : '⚠'} {message.text}
        </div>
      )}

      <div className="admin-settings-grid">
        {/* General Settings */}
        <div className="admin-settings-card">
          <h3>🏫 General Settings</h3>
          <div className="admin-settings-form">
            <div className="admin-form-group">
              <label>System Name</label>
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => handleSettingChange('systemName', e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>System Email</label>
              <input
                type="email"
                value={settings.systemEmail}
                onChange={(e) => handleSettingChange('systemEmail', e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Academic Year</label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => handleSettingChange('academicYear', e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label>Current Semester</label>
              <input
                type="text"
                value={settings.semester}
                onChange={(e) => handleSettingChange('semester', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="admin-settings-card">
          <h3>🔔 Notification Settings</h3>
          <div className="admin-settings-toggles">
            <div className="admin-toggle-item">
              <div className="admin-toggle-info">
                <span className="admin-toggle-label">Enable Notifications</span>
                <span className="admin-toggle-desc">Send system notifications to users</span>
              </div>
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                />
                <span className="admin-toggle-slider"></span>
              </label>
            </div>
            <div className="admin-toggle-item">
              <div className="admin-toggle-info">
                <span className="admin-toggle-label">Email Alerts</span>
                <span className="admin-toggle-desc">Send email notifications</span>
              </div>
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.enableEmailAlerts}
                  onChange={(e) => handleSettingChange('enableEmailAlerts', e.target.checked)}
                />
                <span className="admin-toggle-slider"></span>
              </label>
            </div>
            <div className="admin-toggle-item">
              <div className="admin-toggle-info">
                <span className="admin-toggle-label">Auto Backup</span>
                <span className="admin-toggle-desc">Automatic daily database backup</span>
              </div>
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                />
                <span className="admin-toggle-slider"></span>
              </label>
            </div>
            <div className="admin-toggle-item">
              <div className="admin-toggle-info">
                <span className="admin-toggle-label">Maintenance Mode</span>
                <span className="admin-toggle-desc">Disable user access temporarily</span>
              </div>
              <label className="admin-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                />
                <span className="admin-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="admin-settings-card">
          <h3>💾 System Information</h3>
          <div className="admin-system-info">
            <div className="admin-info-item">
              <span className="admin-info-label">Database Size</span>
              <span className="admin-info-value">{systemStats.databaseSize}</span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">Total Records</span>
              <span className="admin-info-value">{systemStats.totalRecords}</span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">Last Backup</span>
              <span className="admin-info-value">{systemStats.lastBackup}</span>
            </div>
            <div className="admin-info-item">
              <span className="admin-info-label">System Uptime</span>
              <span className="admin-info-value">{systemStats.uptime}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="admin-settings-card">
          <h3>🔒 Change Password</h3>
          <form onSubmit={handlePasswordChange} className="admin-settings-form">
            <div className="admin-form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="admin-form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength="6"
              />
            </div>
            <div className="admin-form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength="6"
              />
            </div>
            <button type="submit" className="admin-btn-primary" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* System Actions */}
        <div className="admin-settings-card large">
          <h3>🛠️ System Actions</h3>
          <div className="admin-action-grid">
            <button className="admin-action-card blue" onClick={handleBackupDatabase} disabled={loading}>
              <div className="admin-action-icon">💾</div>
              <div className="admin-action-content">
                <div className="admin-action-title">Backup Database</div>
                <div className="admin-action-desc">Create a full database backup</div>
              </div>
            </button>
            <button className="admin-action-card orange" onClick={handleClearCache} disabled={loading}>
              <div className="admin-action-icon">🗑️</div>
              <div className="admin-action-content">
                <div className="admin-action-title">Clear Cache</div>
                <div className="admin-action-desc">Clear system cache and temp files</div>
              </div>
            </button>
            <button className="admin-action-card green" onClick={fetchSystemStats} disabled={loading}>
              <div className="admin-action-icon">🔄</div>
              <div className="admin-action-content">
                <div className="admin-action-title">Refresh Stats</div>
                <div className="admin-action-desc">Update system statistics</div>
              </div>
            </button>
            <button className="admin-action-card purple" disabled>
              <div className="admin-action-icon">📊</div>
              <div className="admin-action-content">
                <div className="admin-action-title">Generate Report</div>
                <div className="admin-action-desc">Create system report (Coming Soon)</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="admin-settings-footer">
        <button className="admin-btn-secondary" onClick={fetchSettings}>
          Reset Changes
        </button>
        <button className="admin-btn-primary" onClick={handleSaveSettings} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default AdminSettings;
