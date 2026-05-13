import React, { useState, useEffect } from 'react';
import './StudentNotifications.css';

function StudentNotifications({ user }) {
  const [showFooter, setShowFooter] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    } else {
      fetchAnnouncements();
    }
  }, [user.id, activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.student-notifications-page');
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

    const scrollContainer = document.querySelector('.student-notifications-page');
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
      
      // Fetch notifications for student
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/notifications/${user.id}/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/announcements/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/notifications/mark-read/${notificationId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(notifications.map(notif => 
          notif.notification_id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsUnread = async (notificationId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/notifications/mark-unread/${notificationId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(notifications.map(notif => 
          notif.notification_id === notificationId 
            ? { ...notif, is_read: false }
            : notif
        ));
      }
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/notifications/mark-all-read/${user.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment': return '📝';
      case 'grade': return '📊';
      case 'attendance': return '✓';
      case 'announcement': return '📢';
      case 'deadline': return '⏰';
      case 'message': return '💬';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'assignment': return '#2196f3';
      case 'grade': return '#4caf50';
      case 'attendance': return '#ff9800';
      case 'announcement': return '#9c27b0';
      case 'deadline': return '#f44336';
      case 'message': return '#00bcd4';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <div className="student-notifications-page">
        <div className="loading-spinner">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="student-notifications-page">
      <div className="notifications-header">
        <h2>🔔 Notifications</h2>
      </div>

      {/* Tabs */}
      <div className="notifications-tabs">
        <button
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
        </button>
        <button
          className={`tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          📢 Announcements
        </button>
      </div>

      {/* Content */}
      <div className="notifications-content">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : activeTab === 'announcements' ? (
          // Display Announcements
          announcements.length === 0 ? (
            <div className="no-notifications">
              <div className="no-notifications-icon">📢</div>
              <h3>No Announcements</h3>
              <p>Faculty announcements will appear here.</p>
            </div>
          ) : (
            <div className="announcements-list">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="announcement-card">
                  <div className="announcement-header">
                    <div className="announcement-title-row">
                      <span className="announcement-icon">📢</span>
                      <h3>{announcement.title}</h3>
                    </div>
                    <span className="announcement-date">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="announcement-message">{announcement.message}</p>
                </div>
              ))}
            </div>
          )
        ) : notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div 
                key={notification.notification_id} 
                className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
              >
                <div className="notification-header">
                  <div className="notification-icon-wrapper">
                    <div 
                      className="notification-icon"
                      style={{ backgroundColor: getNotificationColor(notification.type) }}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    {!notification.is_read && <div className="unread-dot"></div>}
                  </div>
                  
                  <div className="notification-content">
                    <h3 className="notification-title">{notification.title}</h3>
                    <p className="notification-message">{notification.message}</p>
                    
                    <div className="notification-meta">
                      <span className="notification-type">
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </span>
                      <span className="notification-date">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="notification-actions">
                    {!notification.is_read ? (
                      <button 
                        className="btn-mark-read"
                        onClick={(e) => markAsRead(notification.notification_id, e)}
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    ) : (
                      <button 
                        className="btn-mark-unread"
                        onClick={(e) => markAsUnread(notification.notification_id, e)}
                        title="Mark as unread"
                      >
                        ↻
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-notifications">
            <div className="no-notifications-icon">🔔</div>
            <h3>No Notifications</h3>
            <p>You have no notifications yet.</p>
          </div>
        )}
      </div>

      <div style={{ height: '200px', background: 'transparent' }}></div>

      <footer className={`dashboard-footer ${showFooter ? 'show' : ''}`}>
        <div className="footer-bottom">
          <p>© 2026 Vidhyarth. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}

export default StudentNotifications;