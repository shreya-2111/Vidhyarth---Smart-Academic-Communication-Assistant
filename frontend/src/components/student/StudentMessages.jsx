import React, { useState, useEffect } from 'react';
import './StudentMessages.css';

function StudentMessages({ user }) {
  const [showFooter, setShowFooter] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    recipientId: '',
    subject: '',
    message: ''
  });
  const [facultyList, setFacultyList] = useState([]);

  useEffect(() => {
    fetchMessages();
    fetchFacultyList();
  }, [user.id, activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.student-messages-page');
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

    const scrollContainer = document.querySelector('.student-messages-page');
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

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const endpoint = activeTab === 'inbox' ? 'inbox' : 'sent';

      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/messages/${endpoint}/${user.id}/student`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched student ${endpoint} messages:`, data);
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacultyList = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/messages/faculty', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFacultyList(data);
      }
    } catch (error) {
      console.error('Error fetching faculty list:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: newMessage.recipientId,
          senderType: 'student',
          receiverType: 'faculty',
          message: `Subject: ${newMessage.subject}\n\n${newMessage.message}`
        })
      });

      if (response.ok) {
        alert('Message sent successfully!');
        setShowComposeModal(false);
        setNewMessage({ recipientId: '', subject: '', message: '' });
        fetchMessages();
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  return (
    <div className="student-messages-page">
      <div className="messages-header">
        <h2>💬 Messages</h2>
        <button 
          className="btn-compose"
          onClick={() => setShowComposeModal(true)}
        >
          ✉️ Ask Faculty
        </button>
      </div>

      {/* Tabs */}
      <div className="messages-tabs">
        <button
          className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          📥 Inbox
        </button>
        <button
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          📤 Sent
        </button>
      </div>

      {/* Content */}
      <div className="messages-content">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <div className="messages-list">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.message_id} className="message-card">
                  <div className="message-header">
                    <span className="sender-name">
                      {activeTab === 'inbox' ? (
                        <>
                          <span className="faculty-label">Faculty</span>
                          {message.sender_name || 'Faculty'}
                        </>
                      ) : (
                        <>
                          <span className="to-label">To:</span>
                          <span className="faculty-label">Faculty</span>
                          {message.receiver_name || 'Faculty'}
                        </>
                      )}
                    </span>
                    <span className="message-date">
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="message-text">{message.message}</p>
                </div>
              ))
            ) : (
              <div className="no-data">
                <div className="no-data-icon">💬</div>
                <h3>No Messages</h3>
                <p>
                  {activeTab === 'inbox' 
                    ? 'Messages from faculty will appear here.'
                    : 'Messages you send to faculty will appear here.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Send Message to Faculty</h3>
              <button 
                className="modal-close"
                onClick={() => setShowComposeModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSendMessage} className="compose-form">
              <div className="form-group">
                <label>To Faculty:</label>
                <select
                  value={newMessage.recipientId}
                  onChange={(e) => setNewMessage({...newMessage, recipientId: e.target.value})}
                  required
                >
                  <option value="">Select Faculty</option>
                  {facultyList.map(faculty => (
                    <option key={faculty.faculty_id} value={faculty.faculty_id}>
                      Prof. {faculty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  placeholder="Enter subject"
                  required
                />
              </div>

              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  placeholder="Type your message here..."
                  rows="6"
                  required
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowComposeModal(false)}
                >
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

      <div style={{ height: '200px', background: 'transparent' }}></div>

      <footer className={`dashboard-footer ${showFooter ? 'show' : ''}`}>
        <div className="footer-bottom">
          <p>© 2026 Vidhyarth. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}

export default StudentMessages;