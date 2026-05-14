import React, { useState, useEffect } from 'react';
import './StudentPerformance.css';

function StudentPerformance({ user }) {
  const [performanceData, setPerformanceData] = useState({
    overallGPA: 0,
    semesterGPA: 0,
    grades: [],
    trends: [],
    feedback: []
  });
  const [loading, setLoading] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    fetchPerformanceData();
  }, [user.id]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.student-performance-page');
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

    const scrollContainer = document.querySelector('.student-performance-page');
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

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://backend-beryl-pi.vercel.app/api/student/performance/${user.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setPerformanceData({
          overallGPA: data.overallGPA || 0,
          grades: data.grades || [],
          feedback: data.feedback || []
        });
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage) => {
    const p = parseFloat(percentage) || 0;
    if (p >= 85) return '#4caf50';
    if (p >= 70) return '#8bc34a';
    if (p >= 55) return '#ffc107';
    if (p >= 40) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <div className="student-performance-page">
        <div className="loading-spinner">Loading performance data...</div>
      </div>
    );
  }

  return (
    <div className="student-performance-page">
      <div className="performance-header">
        <h2>📊 My Performance</h2>
      </div>

      {/* Subject-wise Performance */}
      <div className="performance-content">
        <h3>Subject-wise Performance</h3>
        <div className="subjects-performance">
          {performanceData.grades && performanceData.grades.length > 0 ? (
            performanceData.grades.map((subject, index) => (
              <div key={index} className="subject-performance-card">
                <div className="subject-header">
                  <h4>{subject.subject_name || subject.subject}</h4>
                  <div 
                    className="grade-badge"
                    style={{ backgroundColor: getGradeColor(subject.percentage) }}
                  >
                    {subject.grade_letter} ({parseFloat(subject.percentage || 0).toFixed(1)}%)
                  </div>
                </div>
                
                <div className="performance-details">
                  <div className="detail-item">
                    <span className="detail-label">Exam Type:</span>
                    <span className="detail-value">{subject.exam_type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Marks:</span>
                    <span className="detail-value">{subject.marks_obtained} / {subject.total_marks}</span>
                  </div>
                  {subject.semester && (
                    <div className="detail-item">
                      <span className="detail-label">Semester:</span>
                      <span className="detail-value">{subject.semester}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">
                      {subject.exam_date ? new Date(subject.exam_date).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </div>

                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${parseFloat(subject.percentage || 0)}%`,
                      backgroundColor: getGradeColor(subject.percentage)
                    }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-performance">
              <div className="no-performance-icon">📊</div>
              <h3>No Performance Data</h3>
              <p>Your grades and performance data will appear here once faculty enters them.</p>
            </div>
          )}
        </div>
      </div>

      {/* Faculty Feedback and Performance Trends - Horizontal Layout */}
      <div className="horizontal-sections">
        {/* Faculty Feedback */}
        <div className="feedback-section">
          <h3>Faculty Feedback</h3>
          <div className="feedback-list">
            {performanceData.feedback && performanceData.feedback.length > 0 ? (
              performanceData.feedback.map((feedback, index) => (
                <div key={index} className="feedback-card">
                  <div className="feedback-header">
                    <div className="faculty-info">
                      <span className="faculty-name">Prof. {feedback.faculty_name}</span>
                      <span className="subject-name">{feedback.subject}</span>
                    </div>
                    <span className="feedback-date">
                      {new Date(feedback.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="feedback-text">{feedback.feedback}</p>
                </div>
              ))
            ) : (
              <div className="no-feedback">
                <div className="no-feedback-icon">💬</div>
                <h3>No Faculty Feedback</h3>
                <p>Faculty feedback and comments will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Trends */}
        <div className="trends-section">
          <h3>Performance Trends</h3>
          <div className="trends-placeholder">
            <div className="chart-icon">📈</div>
            <p>Performance charts and trends will be displayed here.</p>
          </div>
        </div>
      </div>

      {/* Test content to ensure scrolling */}
      <div style={{ height: '200px', background: 'transparent' }}></div>

      <footer className={`dashboard-footer ${showFooter ? 'show' : ''}`}>
        <div className="footer-bottom">
          <p>© 2026 Vidhyarth. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}

export default StudentPerformance;