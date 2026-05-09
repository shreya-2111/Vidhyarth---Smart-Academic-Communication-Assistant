import React, { useState, useEffect } from 'react';
import './Messages.css';

function Messages({ user }) {
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  // departments state removed - MSCIT only, no department filter needed
  const [loading, setLoading] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showFacultyMessageModal, setShowFacultyMessageModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFooter, setShowFooter] = useState(false);

  // Compose message form
  const [composeForm, setComposeForm] = useState({
    receiverId: '',
    message: ''
  });

  // Faculty message form
  const [facultyMessageForm, setFacultyMessageForm] = useState({
    receiverId: '',
    message: ''
  });

  // Announcement form
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    targetType: 'all',
    targetValue: ''
  });

  useEffect(() => {
    fetchMessages();
    fetchStudents();
    fetchFacultyList();
    fetchUnreadCount();
  }, [activeTab]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      // Try container scroll first, then fallback to window scroll
      const scrollContainer = document.querySelector('.messages-container');
      let scrollTop, scrollHeight, clientHeight;
      
      if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        // Use container scroll if it's scrollable
        scrollTop = scrollContainer.scrollTop;
        scrollHeight = scrollContainer.scrollHeight;
        clientHeight = scrollContainer.clientHeight;
      } else {
        // Fallback to window scroll
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      }
      
      // Show footer when user scrolls down (more than 100px from top)
      const hasScrolled = scrollTop > 100;
      setShowFooter(hasScrolled);
    };

    // Add listeners to both container and window
    const scrollContainer = document.querySelector('.messages-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const endpoint = activeTab === 'inbox' ? 'inbox' : 'sent';
      
      const response = await fetch(
        `https://backend-beryl-pi.vercel.app/api/messages/${endpoint}/${user.id}/faculty`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched messages:', data);
        console.log('Active tab:', activeTab);
        setMessages(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      // MSCIT only - fetch all students directly via messages API
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/messages/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchFacultyList = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/messages/faculty', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out current user from the list
        const otherFaculty = data.filter(faculty => faculty.faculty_id !== user.id);
        setFacultyList(otherFaculty);
      }
    } catch (error) {
      console.error('Error fetching faculty list:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://backend-beryl-pi.vercel.app/api/messages/unread/${user.id}/faculty`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          senderId: user.id,
          senderType: 'faculty',
          receiverId: composeForm.receiverId,
          receiverType: 'student',
          message: composeForm.message
        })
      });

      if (response.ok) {
        alert('Message sent successfully!');
        setShowComposeModal(false);
        setComposeForm({ receiverId: '', message: '' });
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const handleSendFacultyMessage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          senderId: user.id,
          senderType: 'faculty',
          receiverId: facultyMessageForm.receiverId,
          receiverType: 'faculty',
          message: facultyMessageForm.message
        })
      });

      if (response.ok) {
        alert('Message sent to faculty successfully!');
        setShowFacultyMessageModal(false);
        setFacultyMessageForm({ receiverId: '', message: '' });
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending faculty message:', error);
      alert('Failed to send message to faculty');
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/messages/announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          facultyId: user.id,
          ...announcementForm
        })
      });

      if (response.ok) {
        alert('Announcement sent successfully!');
        setShowAnnouncementModal(false);
        setAnnouncementForm({ title: '', message: '', targetType: 'all', targetValue: '' });
      }
    } catch (error) {
      console.error('Error sending announcement:', error);
      alert('Failed to send announcement');
    }
  };

  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`https://backend-beryl-pi.vercel.app/api/messages/read/${messageId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchMessages();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const formatDate = (dateString) => {
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

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h2>📬 Communication Hub</h2>
        <div className="messages-actions">
          <button className="btn-compose" onClick={() => setShowComposeModal(true)}>
            ✉️ New Message
          </button>
          <button className="btn-announcement" onClick={() => setShowAnnouncementModal(true)}>
            📢 Send Announcement
          </button>
        </div>
      </div>

      <div className="messages-tabs">
        <button
          className={`messages-tab ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          📥 Inbox {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
        <button
          className={`messages-tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          📤 Sent
        </button>
      </div>

      <div className="messages-list">
        {loading ? (
          <div className="messages-loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="messages-empty">
            <p>📭 No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.message_id}
              className={`message-item ${!msg.is_read && activeTab === 'inbox' ? 'unread' : ''}`}
              data-sender-type={msg.sender_type}
              onClick={() => activeTab === 'inbox' && !msg.is_read && markAsRead(msg.message_id)}
            >
              <div className="message-avatar">
                {activeTab === 'inbox' 
                  ? msg.sender_name?.charAt(0) 
                  : msg.receiver_name?.charAt(0)}
              </div>
              <div className="message-content">
                <div className="message-header-row">
                  <span className="message-sender">
                    {activeTab === 'inbox' 
                      ? (msg.sender_type === 'student' 
                          ? <><span className="student-label">Student</span>{msg.sender_name || 'Unknown'}</> 
                          : msg.sender_name || 'Unknown')
                      : msg.receiver_name || 'Unknown'}
                  </span>
                  <span className="message-time">{formatDate(msg.created_at)}</span>
                </div>
                <div className="message-text">{msg.message}</div>
              </div>
              {!msg.is_read && activeTab === 'inbox' && (
                <div className="message-unread-dot"></div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="modal-overlay" onClick={() => setShowComposeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✉️ New Message</h3>
              <button className="modal-close" onClick={() => setShowComposeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSendMessage} className="modal-body">
              {/* Department filter removed - MSCIT only, all students shown */}
              <div className="form-group">
                <label>To (Student) *</label>
                <select
                  value={composeForm.receiverId}
                  onChange={(e) => setComposeForm({ ...composeForm, receiverId: e.target.value })}
                  required
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student.student_id} value={student.student_id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Message *</label>
                <textarea
                  value={composeForm.message}
                  onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                  placeholder="Type your message here..."
                  rows="6"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowComposeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-send">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📢 Send Announcement</h3>
              <button className="modal-close" onClick={() => setShowAnnouncementModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSendAnnouncement} className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Send To *</label>
                <select
                  value={announcementForm.targetType}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, targetType: e.target.value, targetValue: '' })}
                  required
                >
                  <option value="all">All Students (Msc.IT)</option>
                  <option value="class">Specific Class</option>
                </select>
              </div>
              {announcementForm.targetType === 'class' && (
                <div className="form-group">
                  <label>Select Class *</label>
                  <select
                    value={announcementForm.targetValue}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, targetValue: e.target.value })}
                    required
                  >
                    <option value="">Select Class</option>
                    {/* Classes are fetched from DB - all MSCIT classes */}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Message *</label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  placeholder="Type your announcement here..."
                  rows="6"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAnnouncementModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-send">
                  Send Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Test content to ensure scrolling */}
      <div style={{ height: '200px', background: 'transparent' }}></div>

      {/* Floating Action Button for Faculty Messages */}
      <button 
        className="floating-action-btn"
        onClick={() => setShowFacultyMessageModal(true)}
        title="Send Message to Faculty"
      >
        👥
      </button>

      {/* Faculty Message Modal */}
      {showFacultyMessageModal && (
        <div className="modal-overlay" onClick={() => setShowFacultyMessageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Message to Faculty</h3>
              <button className="modal-close" onClick={() => setShowFacultyMessageModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSendFacultyMessage} className="modal-body">
              <div className="form-group">
                <label>To Faculty:</label>
                <select
                  value={facultyMessageForm.receiverId}
                  onChange={(e) => setFacultyMessageForm({ ...facultyMessageForm, receiverId: e.target.value })}
                  required
                >
                  <option value="">Select Faculty</option>
                  {facultyList.map((faculty) => (
                    <option key={faculty.faculty_id} value={faculty.faculty_id}>
                      {faculty.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={facultyMessageForm.message}
                  onChange={(e) => setFacultyMessageForm({ ...facultyMessageForm, message: e.target.value })}
                  placeholder="Type your message here..."
                  rows="6"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowFacultyMessageModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-send">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <footer className={`dashboard-footer ${showFooter ? 'show' : ''}`}>
        <div className="footer-bottom">
          <p>© 2026 Vidhyarth. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}

export default Messages;
