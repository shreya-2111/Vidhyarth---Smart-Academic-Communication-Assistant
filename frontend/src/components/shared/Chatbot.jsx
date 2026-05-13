import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';
import { formatDateTo12Hour } from '../../utils/timeUtils';

function Chatbot({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const quickActions = [
    { label: '👋 Say Hello', query: 'Hello! What can you help me with?' },
    { label: '📅 My Timetable', query: "What's my timetable today?" },
    { label: '✅ Attendance', query: 'Show my attendance summary' },
    { label: '📝 Assignments', query: 'What assignments are pending?' },
    { label: '💡 Study Tips', query: 'Give me some effective study tips' },
    { label: '🧮 Help with Math', query: 'Can you help me with a math problem?' },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        type: 'ai',
        content: `Hi! I'm  your AI assistant. I can help with anything — general questions, academics, coding, writing, or your Vidhyarth data.\n\nWhat's on your mind?`,
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [inputMessage]);

  const sendMessage = async (messageText = inputMessage) => {
    const text = messageText.trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, { type: 'user', content: text, timestamp: new Date() }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, {
          type: 'ai',
          content: data.response,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'ai',
        content: "I ran into a hiccup on my end. Could you try rephrasing or asking again?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/chatbot/history', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (_) {}
    setMessages([{
      type: 'ai',
      content: "Chat cleared! How can I help you?",
      timestamp: new Date()
    }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(<ul key={`ul-${elements.length}`}>{listItems}</ul>);
        listItems = [];
      }
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();

      // Bullet list
      if (/^[•\-\*]\s/.test(trimmed)) {
        listItems.push(<li key={i}>{renderInline(trimmed.replace(/^[•\-\*]\s/, ''))}</li>);
        return;
      }

      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        listItems.push(<li key={i}>{renderInline(trimmed.replace(/^\d+\.\s/, ''))}</li>);
        return;
      }

      flushList();

      if (!trimmed) {
        elements.push(<br key={i} />);
      } else {
        elements.push(<p key={i}>{renderInline(trimmed)}</p>);
      }
    });

    flushList();
    return elements;
  };

  const renderInline = (text) => {
    // Handle **bold**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      /^\*\*[^*]+\*\*$/.test(part)
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );
  };

  return (
    <>
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? '✕' : '✨'}
      </button>

      {isOpen && (
        <div className="chatbot-window" role="dialog" aria-label="AI Assistant">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">✨</div>
              <div>
                <h3>Vidhya AI</h3>
                <span className="chatbot-status">
                  <span className="status-dot"></span> Online
                </span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-clear-btn" onClick={clearChat} title="Clear chat">🗑</button>
              <button className="chatbot-close" onClick={() => setIsOpen(false)} aria-label="Close">✕</button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.type}`}>
                {msg.type === 'ai' && <div className="message-avatar">✨</div>}
                <div className="message-content">
                  <div className="message-bubble">
                    {formatMessage(msg.content)}
                  </div>
                  <div className="message-time">
                    {formatDateTo12Hour(msg.timestamp)}
                  </div>
                </div>
                {msg.type === 'user' && (
                  <div className="message-avatar user">
                    {user?.fullName?.charAt(0) || user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="message ai">
                <div className="message-avatar">✨</div>
                <div className="message-content">
                  <div className="message-bubble typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="chatbot-quick-actions">
              <p className="quick-actions-title">Try asking:</p>
              <div className="quick-actions-grid">
                {quickActions.map((action, i) => (
                  <button key={i} className="quick-action-btn" onClick={() => sendMessage(action.query)}>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="chatbot-input">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows="1"
              disabled={isLoading}
              aria-label="Message input"
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Send message"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>

          <div className="chatbot-footer">
            <small>Powered by Google Gemini · Shift+Enter for new line</small>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;
