import React, { useState, useEffect } from 'react';
import './StudentAttendance.css';

function StudentAttendance({ user }) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [overallStats, setOverallStats] = useState({
    totalClasses: 0,
    attendedClasses: 0,
    attendancePercentage: 0,
    lowAttendanceSubjects: []
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [user.id, selectedMonth]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.student-attendance-page');
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

    const scrollContainer = document.querySelector('.student-attendance-page');
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

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      // Fetch attendance records
      const response = await fetch(
        `https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/attendance/${user.id}?month=${selectedMonth}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.records || []);
        setOverallStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'present': return { label: 'Present', class: 'present', icon: '✅' };
      case 'absent': return { label: 'Absent', class: 'absent', icon: '❌' };
      case 'late': return { label: 'Late', class: 'late', icon: '⏰' };
      default: return { label: status || 'Unknown', class: 'unknown', icon: '❓' };
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return '#4caf50';
    if (percentage >= 75) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <div className="student-attendance-page">
        <div className="loading-spinner">Loading attendance data...</div>
      </div>
    );
  }

  return (
    <div className="student-attendance-page">
      <div className="attendance-header">
        <h2>✓ My Attendance</h2>
        <div className="attendance-controls">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-selector"
          />
        </div>
      </div>

      {/* Overall Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.attendancePercentage}%</div>
            <div className="stat-label">Overall Attendance</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.attendedClasses}</div>
            <div className="stat-label">Classes Attended</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.totalClasses}</div>
            <div className="stat-label">Total Classes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{overallStats.lowAttendanceSubjects?.length || 0}</div>
            <div className="stat-label">Low Attendance Subjects</div>
          </div>
        </div>
      </div>

      {/* Low Attendance Warning */}
      {overallStats.lowAttendanceSubjects && overallStats.lowAttendanceSubjects.length > 0 && (
        <div className="warning-card">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h3>Low Attendance Alert</h3>
            <p>Your attendance is below 75% in the following subjects:</p>
            <div className="low-attendance-subjects">
              {overallStats.lowAttendanceSubjects.map((subject, index) => (
                <span key={index} className="low-attendance-subject">
                  {subject.subject} ({subject.percentage}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subject-wise Attendance */}
      <div className="attendance-content">
        <h3>Subject-wise Attendance</h3>
        
        {attendanceData.length > 0 ? (
          <div className="subjects-grid">
            {attendanceData.reduce((subjects, record) => {
              const statusLower = (record.status || '').toLowerCase();
              const existing = subjects.find(s => s.subject === record.subject);
              if (existing) {
                existing.records.push(record);
                existing.total++;
                if (statusLower === 'present') existing.present++;
                if (statusLower === 'late') existing.late++;
              } else {
                subjects.push({
                  subject: record.subject,
                  records: [record],
                  total: 1,
                  present: statusLower === 'present' ? 1 : 0,
                  late: statusLower === 'late' ? 1 : 0
                });
              }
              return subjects;
            }, []).map((subject) => {
              const percentage = Math.round(((subject.present + subject.late) / subject.total) * 100);
              return (
                <div key={subject.subject} className="subject-card">
                  <div className="subject-header">
                    <h4>{subject.subject}</h4>
                    <div 
                      className="attendance-percentage"
                      style={{ color: getAttendanceColor(percentage) }}
                    >
                      {percentage}%
                    </div>
                  </div>
                  
                  <div className="attendance-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: getAttendanceColor(percentage)
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="attendance-stats">
                    <div className="stat-item">
                      <span className="stat-label">Present:</span>
                      <span className="stat-value">{subject.present}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Late:</span>
                      <span className="stat-value">{subject.late}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total:</span>
                      <span className="stat-value">{subject.total}</span>
                    </div>
                  </div>

                  <div className="recent-records">
                    <h5>Recent Classes:</h5>
                    {subject.records.slice(-5).map((record, index) => {
                      const status = getAttendanceStatus(record.status);
                      return (
                        <div key={index} className={`record-item ${status.class}`}>
                          <span className="record-icon">{status.icon}</span>
                          <span className="record-date">
                            {new Date(record.date).toLocaleDateString()}
                          </span>
                          <span className="record-status">{status.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-attendance">
            <div className="no-attendance-icon">📊</div>
            <h3>No Attendance Records</h3>
            <p>No attendance data available for the selected month.</p>
          </div>
        )}
      </div>

      {/* Attendance Calendar View */}
      <div className="calendar-section">
        <h3>Monthly Calendar View</h3>
        <div className="calendar-container">
          {/* Calendar implementation would go here */}
          <div className="calendar-placeholder">
            <div className="calendar-icon">📅</div>
            <p>Calendar view coming soon...</p>
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

export default StudentAttendance;