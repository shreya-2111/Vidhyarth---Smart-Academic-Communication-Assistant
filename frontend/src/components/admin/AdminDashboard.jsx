import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import AdminUsers from './AdminUsers';
import AdminMasterData from './AdminMasterData';
import AdminAnalytics from './AdminAnalytics';
import AdminSettings from './AdminSettings';
import AdminProfile from './AdminProfile';
import AssignSubjectsToFaculty from './AssignSubjectsToFaculty';
import ExcelImport from './ExcelImport';
import ProfileMenu from '../shared/ProfileMenu';

function AdminDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalStudents: 0,
    totalAssignments: 0,
    totalClasses: 0
  });
  const [systemStatus, setSystemStatus] = useState({
    database: { status: 'Checking...', message: '' },
    apiServer: { status: 'Checking...', message: '' },
    storage: { status: 'Checking...', message: '', percentage: 0 },
    backup: { status: 'Checking...', message: '' }
  });

  useEffect(() => {
    fetchStats();
    fetchSystemStatus();
    
    // Refresh system status every 30 seconds
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.admin-dashboard-body');
      let scrollTop, scrollHeight, clientHeight;
      
      if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        scrollTop = scrollContainer.scrollTop;
        scrollHeight = scrollContainer.scrollHeight;
        clientHeight = scrollContainer.clientHeight;
      } else {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      }
      
      // Show footer when user scrolls down (more than 100px from top)
      const hasScrolled = scrollTop > 100;
      setShowFooter(hasScrolled);
    };

    const scrollContainer = document.querySelector('.admin-dashboard-body');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeMenu]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/system-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
      setSystemStatus({
        database: { status: 'Offline', message: 'Connection failed' },
        apiServer: { status: 'Error', message: 'Cannot connect' },
        storage: { status: 'Unknown', message: 'N/A', percentage: 0 },
        backup: { status: 'Unknown', message: 'N/A' }
      });
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('online') || statusLower.includes('running') || statusLower.includes('up to date') || statusLower === 'good') {
      return 'success';
    } else if (statusLower.includes('warning') || statusLower.includes('outdated')) {
      return 'warning';
    } else if (statusLower.includes('offline') || statusLower.includes('error') || statusLower.includes('critical')) {
      return 'danger';
    }
    return 'info';
  };

  const menuItems = [
    { icon: '🏠', label: 'Dashboard' },
    { icon: '👥', label: 'Users' },
    { icon: '📥', label: 'Import Students' },
    { icon: '📚', label: 'Assign Subjects' },
    { icon: '📊', label: 'Master Data' },
    { icon: '📈', label: 'Analytics' },
    { icon: '⚙️', label: 'Settings' },
    { icon: '🚪', label: 'Logout', action: 'logout' }
  ];

  const handleMenuClick = (item) => {
    if (item.action === 'logout') {
      onLogout();
    } else {
      setActiveMenu(item.label);
    }
  };

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo-container">
            <div className="admin-logo">
              <img src="/logo.svg" alt="Vidhyarth" />
            </div>
            {!sidebarCollapsed && <span className="admin-logo-text">Admin Panel</span>}
          </div>
          <button 
            className="admin-collapse-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`admin-nav-item ${activeMenu === item.label ? 'active' : ''}`}
              onClick={() => handleMenuClick(item)}
              title={item.label}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="admin-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className="admin-main-content">
        <header className="admin-top-header">
          <h1 className="admin-page-title">
            {activeMenu === 'Dashboard' ? 'Admin Dashboard' : activeMenu}
          </h1>
          <div className="admin-header-actions">
            <button className="admin-icon-btn" onClick={() => setActiveMenu('Dashboard')} title="Home">🏠</button>
            <button className="admin-icon-btn" onClick={() => setActiveMenu('Analytics')} title="Analytics">📊</button>
            <button className="admin-icon-btn" title="Notifications">🔔</button>
            <ProfileMenu user={user} onLogout={onLogout} onOpenProfile={() => setShowProfile(true)} />
          </div>
        </header>

        <div className="admin-dashboard-body">
          {showProfile && <AdminProfile user={user} onClose={() => setShowProfile(false)} />}
          {activeMenu === 'Dashboard' && (
            <>
              <div className="admin-welcome-section">
                <h2>Welcome back, {user.fullName}!</h2>
                <p>Here's what's happening with your platform today.</p>
              </div>

              <div className="admin-stats-grid">
                <div className="admin-stat-card blue">
                  <div className="admin-stat-icon">👨‍🏫</div>
                  <div className="admin-stat-content">
                    <div className="admin-stat-value">{stats.totalFaculty}</div>
                    <div className="admin-stat-label">Total Faculty</div>
                  </div>
                </div>

                <div className="admin-stat-card green">
                  <div className="admin-stat-icon">👨‍🎓</div>
                  <div className="admin-stat-content">
                    <div className="admin-stat-value">{stats.totalStudents}</div>
                    <div className="admin-stat-label">Total Students</div>
                  </div>
                </div>

                <div className="admin-stat-card orange">
                  <div className="admin-stat-icon">📚</div>
                  <div className="admin-stat-content">
                    <div className="admin-stat-value">{stats.totalAssignments}</div>
                    <div className="admin-stat-label">Assignments</div>
                  </div>
                </div>

                <div className="admin-stat-card purple">
                  <div className="admin-stat-icon">🏫</div>
                  <div className="admin-stat-content">
                    <div className="admin-stat-value">{stats.totalClasses}</div>
                    <div className="admin-stat-label">Active Classes</div>
                  </div>
                </div>
              </div>

              <div className="admin-content-grid">
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3>Recent Activities</h3>
                    <button className="admin-view-all">View All →</button>
                  </div>
                  <div className="admin-activity-list">
                    <div className="admin-activity-item">
                      <div className="admin-activity-icon blue">👤</div>
                      <div className="admin-activity-content">
                        <div className="admin-activity-title">New Faculty Registered</div>
                        <div className="admin-activity-time">2 hours ago</div>
                      </div>
                    </div>
                    <div className="admin-activity-item">
                      <div className="admin-activity-icon green">📝</div>
                      <div className="admin-activity-content">
                        <div className="admin-activity-title">Assignment Created</div>
                        <div className="admin-activity-time">5 hours ago</div>
                      </div>
                    </div>
                    <div className="admin-activity-item">
                      <div className="admin-activity-icon orange">👥</div>
                      <div className="admin-activity-content">
                        <div className="admin-activity-title">Student Batch Imported</div>
                        <div className="admin-activity-time">1 day ago</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3>System Status</h3>
                  </div>
                  <div className="admin-status-list">
                    <div className="admin-status-item">
                      <span className="admin-status-label">Database</span>
                      <span className={`admin-status-badge ${getStatusBadgeClass(systemStatus.database.status)}`}>
                        {systemStatus.database.status}
                      </span>
                    </div>
                    <div className="admin-status-item">
                      <span className="admin-status-label">API Server</span>
                      <span className={`admin-status-badge ${getStatusBadgeClass(systemStatus.apiServer.status)}`}>
                        {systemStatus.apiServer.status}
                      </span>
                    </div>
                    <div className="admin-status-item">
                      <span className="admin-status-label">Storage</span>
                      <span className={`admin-status-badge ${getStatusBadgeClass(systemStatus.storage.status)}`}>
                        {systemStatus.storage.message}
                      </span>
                    </div>
                    <div className="admin-status-item">
                      <span className="admin-status-label">Backup</span>
                      <span className={`admin-status-badge ${getStatusBadgeClass(systemStatus.backup.status)}`}>
                        {systemStatus.backup.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>Quick Actions</h3>
                </div>
                <div className="admin-quick-actions">
                  <button className="admin-action-btn blue">
                    <span className="admin-action-icon">➕</span>
                    <span>Add Faculty</span>
                  </button>
                  <button className="admin-action-btn green">
                    <span className="admin-action-icon">👥</span>
                    <span>Add Students</span>
                  </button>
                  <button className="admin-action-btn orange">
                    <span className="admin-action-icon">📊</span>
                    <span>Generate Report</span>
                  </button>
                  <button className="admin-action-btn purple">
                    <span className="admin-action-icon">⚙️</span>
                    <span>System Settings</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeMenu === 'Users' && <AdminUsers />}
          {activeMenu === 'Import Students' && <ExcelImport />}
          {activeMenu === 'Assign Subjects' && <AssignSubjectsToFaculty />}
          {activeMenu === 'Master Data' && <AdminMasterData />}
          {activeMenu === 'Analytics' && <AdminAnalytics />}
          {activeMenu === 'Settings' && <AdminSettings />}
          
          {(activeMenu === 'Reports' || activeMenu === 'Notifications') && (
            <div className="admin-coming-soon">
              <div className="admin-coming-soon-icon">🚧</div>
              <h2>{activeMenu}</h2>
              <p>This feature is coming soon!</p>
            </div>
          )}
        </div>
        
        <footer className={`dashboard-footer ${showFooter ? 'show' : ''}`}>
          <div className="footer-bottom">
            <p>© 2026 Vidhyarth. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AdminDashboard;
