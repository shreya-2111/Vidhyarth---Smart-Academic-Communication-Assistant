import React, { useState, useEffect } from 'react';
import './Notifications.css';

function Notifications({ user }) {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [groupedNotifications, setGroupedNotifications] = useState({
    today: [],
    this_week: [],
    older: []
  });
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFooter, setShowFooter] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    byType: [],
    byPriority: []
  });

  useEffect(() => {
    if (activeTab === 'announcement') {
      fetchAnnouncements();
    } else {
      fetchNotifications();
    }
    fetchUnreadCount();
    fetchStats();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.notifications-page');
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

    const scrollContainer = document.querySelector('.notifications-page');
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
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();
      
      // For submission tab, filter by submission type
      if (activeTab === 'submission') {
        params.append('type', 'submission');
      }
      // For all tab, get all notifications (no filter)

      const url = `https://backend-git-main-shreya-2111s-projects.vercel.app/api/notifications/${user.id}/${user.userType}?${params}`;
      console.log('=== FETCHING FACULTY NOTIFICATIONS ===');
      console.log('URL:', url);
      console.log('Active Tab:', activeTab);
      console.log('User ID:', user.id);
      console.log('User Type:', user.userType);

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Response Status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Notifications received:', data.notifications?.length || 0);
        console.log('Submission notifications:', data.notifications?.filter(n => n.type === 'submission').length || 0);
        console.log('All notifications:', data.notifications);
        setNotifications(data.notifications || []);
        setGroupedNotifications(data.grouped || { today: [], this_week: [], older: [] });
      } else {
        console.error('Failed to fetch notifications:', response.statusText);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://backend-git-main-shreya-2111s-projects.vercel.app/api/messages/announcements/${user.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://backend-git-main-shreya-2111s-projects.vercel.app/api/notifications/count/${user.id}/${user.userType}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://backend-git-main-shreya-2111s-projects.vercel.app/api/notifications/stats/${user.id}/${user.userType}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/notifications/read/${notificationId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/notifications/read-all/${user.id}/${user.userType}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
      fetchUnreadCount();
      alert('All notifications marked as read!');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      alert('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      deadline: '⏰',
      meeting: '📅',
      submission: '📝',
      announcement: '📢',
      reminder: '🔔',
      system: '⚙️',
      assignment: '📋'
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      urgent: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotificationGroup = (title, notificationList) => {
    if (notificationList.length === 0) return null;

    return (
      <div className="notification-group">
        <h3 className="group-title">{title}</h3>
        <div className="notification-list">
          {notificationList.map((notification) => (
            <div
              key={notification.notification_id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              onClick={() => !notification.is_read && markAsRead(notification.notification_id)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notification.title}</h4>
                  <div className="notification-meta">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(notification.priority) }}
                    >
                      {notification.priority.toUpperCase()}
                    </span>
                    <span className="notification-time">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                </div>
                <p className="notification-message">{notification.message}</p>
                <div className="faculty-notification-actions">
                  {!notification.is_read && (
                    <button 
                      className="faculty-btn-mark-read"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.notification_id);
                      }}
                    >
                      Mark as Read
                    </button>
                  )}
                  <button 
                    className="faculty-btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.notification_id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {!notification.is_read && <div className="unread-dot"></div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h2>🔔 Notifications</h2>
        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button className="btn-mark-all-read" onClick={markAllAsRead}>
              ✅ Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      <div className="notifications-stats">
        <div className="stat-item">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.unread}</span>
          <span className="stat-label">Unread</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{stats.byType.length}</span>
          <span className="stat-label">Types</span>
        </div>
      </div>

      <div className="notifications-tabs">
        <button
          className={`notifications-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📋 All
        </button>
        <button
          className={`notifications-tab ${activeTab === 'announcement' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcement')}
        >
          📢 Announcements
        </button>
        <button
          className={`notifications-tab ${activeTab === 'submission' ? 'active' : ''}`}
          onClick={() => setActiveTab('submission')}
        >
          📝 Submissions
        </button>
      </div>

      <div className="notifications-content">
        {loading ? (
          <div className="loading">Loading notifications...</div>
        ) : activeTab === 'announcement' ? (
          // Display Announcements
          announcements.length === 0 ? (
            <div className="no-notifications">
              <div className="empty-state">
                <span className="empty-icon">📢</span>
                <h3>No announcements</h3>
                <p>You haven't sent any announcements yet.</p>
              </div>
            </div>
          ) : (
            <div className="announcements-list">
              {announcements.map((announcement) => (
                <div key={announcement.announcement_id} className="announcement-card">
                  <div className="announcement-header">
                    <div className="announcement-title-row">
                      <span className="announcement-icon">📢</span>
                      <h3>{announcement.title}</h3>
                    </div>
                    <div className="announcement-meta">
                      <span className="announcement-target">
                        {announcement.target_type === 'all' 
                          ? 'All Students' 
                          : `Class: ${announcement.target_value}`}
                      </span>
                      <span className="announcement-date">
                        {formatTimeAgo(announcement.created_at)}
                      </span>
                    </div>
                  </div>
                  <p className="announcement-message">{announcement.message}</p>
                </div>
              ))}
            </div>
          )
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="empty-state">
              <span className="empty-icon">{activeTab === 'submission' ? '📝' : '🔔'}</span>
              <h3>No {activeTab === 'submission' ? 'submission' : ''} notifications</h3>
              <p>
                {activeTab === 'submission' 
                  ? 'No student submissions yet.' 
                  : 'You\'re all caught up! No new notifications at the moment.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="notifications-groups">
            {renderNotificationGroup('Today', groupedNotifications.today)}
            {renderNotificationGroup('This Week', groupedNotifications.this_week)}
            {renderNotificationGroup('Older', groupedNotifications.older)}
          </div>
        )}
      </div>
      
      <footer className={`dashboard-footer ${showFooter ? 'show' : ''}`}>
        <div className="footer-bottom">
          <p>© 2026 Vidhyarth. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}

export default Notifications;