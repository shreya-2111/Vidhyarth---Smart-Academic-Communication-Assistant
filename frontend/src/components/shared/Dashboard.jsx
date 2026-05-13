import React, { useState, useEffect } from 'react';
import '../faculty/FacultyDashboard.css'; // Faculty-specific CSS
import '../student/StudentDashboard.css'; // Student-specific CSS
import Timetable from '../faculty/Timetable';
import Attendance from '../faculty/Attendance';
import Assignments from '../faculty/Assignments';
import Messages from '../faculty/Messages';
import Reports from '../faculty/Reports';
import Documents from '../faculty/Documents';
import Notifications from '../faculty/Notifications';
import MySubjects from '../faculty/MySubjects';
import StudentTimetable from '../student/StudentTimetable';
import StudentAttendance from '../student/StudentAttendance';
import StudentAssignments from '../student/StudentAssignments';
import StudentPerformance from '../student/StudentPerformance';
import StudentMessages from '../student/StudentMessages';
import StudentResources from '../student/StudentResources';
import StudentNotifications from '../student/StudentNotifications';
import ProfileMenu from './ProfileMenu';
import FacultyProfile from '../faculty/FacultyProfile';
import StudentProfile from '../student/StudentProfile';
import Chatbot from './Chatbot';
import { getRealTimeGreeting, formatTo12Hour } from '../../utils/timeUtils';

function Dashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');

  if (user.userType === 'faculty') {
    return <FacultyDashboard user={user} onLogout={onLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
  } else {
    return <StudentDashboard user={user} onLogout={onLogout} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />;
  }
}

function FacultyDashboard({ user, onLogout, activeMenu, setActiveMenu }) {
  const [todayClasses, setTodayClasses] = useState([]);
  const [timetableClasses, setTimetableClasses] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [showFooter, setShowFooter] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    todayClasses: 0,
    pendingAssignments: 0,
    absentStudents: 0,
    totalStudents: 0,
    totalAssignments: 0,
    attendanceToday: 0
  });
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [attendanceOverview, setAttendanceOverview] = useState({
    percentage: 0,
    present: 0,
    absent: 0,
    total: 0
  });
  const [topStudents, setTopStudents] = useState([]);

  const menuItems = [
    { icon: '🏠', label: 'Dashboard' },
    { icon: '📚', label: 'My Subjects' },
    { icon: '📅', label: 'Timetable' },
    { icon: '📝', label: 'Assignments' },
    { icon: '✓', label: 'Attendance' },
    { icon: '💬', label: 'Messages' },
    { icon: '📊', label: 'Reports' },
    { icon: '📄', label: 'Documents' },
    { icon: '🔔', label: 'Notifications' },
    { icon: '🚪', label: 'Logout', action: 'logout' }
  ];

  // Update greeting in real-time
  useEffect(() => {
    const updateGreeting = () => {
      const greetingText = getRealTimeGreeting();
      const title = user.userType === 'faculty' ? 'Prof.' : '';
      setGreeting(`${greetingText}, ${title} ${user.fullName}`);
    };

    updateGreeting();
    // Update greeting every minute to reflect real-time changes
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, [user.fullName, user.userType]);

  // Get today's day name
  const getTodayDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch assignments stats
      const assignmentsResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/assignments/stats/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch recent assignments
      const recentAssignmentsResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/assignments/faculty/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch attendance stats for today
      const attendanceResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/attendance/stats/today/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch total students count
      const studentsResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/messages/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch recent messages (student queries)
      const messagesResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/messages/inbox/${user.id}/faculty`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch announcements
      const announcementsResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/messages/announcements/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch today's timetable count directly (avoids stale state)
      const timetableResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/timetable/today/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let assignmentStats = { total: 0, submitted: 0, pending: 0 };
      let attendanceStats = { present: 0, absent: 0, total: 0 };
      let totalStudents = 0;
      let assignments = [];
      let messages = [];
      let announcements = [];
      let students = [];
      let todayClassesCount = 0;

      if (assignmentsResponse.ok) {
        assignmentStats = await assignmentsResponse.json();
      }

      if (recentAssignmentsResponse.ok) {
        assignments = await recentAssignmentsResponse.json();
        setRecentAssignments(assignments.slice(0, 3));
      }

      if (attendanceResponse.ok) {
        attendanceStats = await attendanceResponse.json();
      }

      if (timetableResponse.ok) {
        const todayData = await timetableResponse.json();
        todayClassesCount = Array.isArray(todayData) ? todayData.length : 0;
      }

      if (studentsResponse.ok) {
        students = await studentsResponse.json();
        totalStudents = students.length;
        
        const totalAttendanceRecords = attendanceStats.present + attendanceStats.absent;
        const attendancePercentage = totalAttendanceRecords > 0 
          ? Math.round((attendanceStats.present / totalAttendanceRecords) * 100) 
          : 0;
        
        setAttendanceOverview({
          percentage: attendancePercentage,
          present: attendanceStats.present,
          absent: attendanceStats.absent,
          total: totalAttendanceRecords
        });

        const topPerformers = students.slice(0, 3).map(student => ({
          id: student.student_id,
          name: student.name,
          department: student.department,
          attendance: Math.floor(Math.random() * 20) + 80
        }));
        setTopStudents(topPerformers);
      }

      if (messagesResponse.ok) {
        messages = await messagesResponse.json();
        setRecentMessages(messages.slice(0, 2));
      }

      if (announcementsResponse.ok) {
        announcements = await announcementsResponse.json();
        setRecentAnnouncements(announcements.slice(0, 2));
      }

      setDashboardStats(prev => ({
        ...prev,
        pendingAssignments: assignmentStats.pending || 0,
        absentStudents: attendanceStats.absent || 0,
        totalStudents: totalStudents,
        totalAssignments: assignmentStats.total || 0,
        attendanceToday: attendanceStats.present || 0
      }));

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Load timetable data
  useEffect(() => {
    const loadTimetableData = async () => {
      try {
        const { timetableAPI } = await import('../../services/api');
        const data = await timetableAPI.getAll(user.id);
        
        if (!data.error) {
          const formattedClasses = data.map(c => ({
            id: c.timetable_id,
            subject: c.subject,
            day: c.day,
            startTime: c.start_time,
            endTime: c.end_time,
            roomNo: c.room_no
          }));
          
          setTimetableClasses(formattedClasses);
          
          // Filter today's classes
          const today = getTodayDay();
          const todaysClasses = formattedClasses.filter(c => c.day === today);
          setTodayClasses(todaysClasses);
          setDashboardStats(prev => ({ ...prev, todayClasses: todaysClasses.length }));
        }
      } catch (error) {
        console.error('Error loading timetable:', error);
      }
    };

    loadTimetableData();
  }, [user.id, activeMenu]);

  // Fetch dashboard stats once on mount
  useEffect(() => {
    fetchDashboardStats();
  }, [user.id]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.dashboard-body');
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

    const scrollContainer = document.querySelector('.dashboard-body');
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

  // Removed color function - timetable uses white background only

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="sidebar-logo">
              <img src="/logo.svg" alt="Vidhyarth" />
            </div>
            {!sidebarCollapsed && <span className="logo-text">Vidhyarth</span>}
          </div>
          <button 
            className="collapse-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activeMenu === item.label ? 'active' : ''}`}
              onClick={() => item.action === 'logout' ? onLogout() : setActiveMenu(item.label)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <h1 className="page-title">Faculty Dashboard</h1>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setActiveMenu('Dashboard')} title="Home">🏠</button>
            <button className="icon-btn" onClick={() => setActiveMenu('Documents')} title="Documents">📁</button>
            <button className="icon-btn" onClick={() => setActiveMenu('Messages')} title="Messages">✉️</button>
            <ProfileMenu user={user} onLogout={onLogout} onOpenProfile={() => setShowProfile(true)} />
          </div>
        </header>

        <div className="dashboard-body">
          {activeMenu === 'My Subjects' ? (
            <MySubjects user={user} />
          ) : activeMenu === 'Timetable' ? (
            <Timetable user={user} />
          ) : activeMenu === 'Attendance' ? (
            <Attendance user={user} />
          ) : activeMenu === 'Assignments' ? (
            <Assignments user={user} />
          ) : activeMenu === 'Messages' ? (
            <Messages user={user} />
          ) : activeMenu === 'Reports' ? (
            <Reports user={user} />
          ) : activeMenu === 'Documents' ? (
            <Documents user={user} />
          ) : activeMenu === 'Notifications' ? (
            <Notifications user={user} />
          ) : (
            <>
          <div className="greeting-section">
            <h2 className="welcome-text">{greeting}</h2>
            <p className="current-time">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <div className="stat-label">Today's Classes</div>
                <div className="stat-value">{dashboardStats.todayClasses}</div>
              </div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <div className="stat-label">Total Assignments</div>
                <div className="stat-value">{dashboardStats.totalAssignments}</div>
              </div>
            </div>
            <div className="stat-card blue-light">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-label">Total Students</div>
                <div className="stat-value">{dashboardStats.totalStudents}</div>
              </div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Present Today</div>
                <div className="stat-value">{dashboardStats.attendanceToday}</div>
              </div>
            </div>
          </div>

          <div className="content-grid">
            <div className="content-left">
              <div className="card timetable-card">
                <div className="card-header">
                  <h3>📅 Smart Timetable</h3>
                  <button className="view-link" onClick={() => setActiveMenu('Timetable')}>View ›</button>
                </div>
                <div className="timetable-grid">
                  <div className="timetable-header-row">
                    <div className="time-header">Time</div>
                    <div className="day-header">Mon</div>
                    <div className="day-header">Tue</div>
                    <div className="day-header">Wed</div>
                    <div className="day-header">Thu</div>
                    <div className="day-header">Fri</div>
                    <div className="day-header">Sat</div>
                  </div>
                  {timetableClasses.length > 0 ? (
                    (() => {
                      // Get unique time slots from actual timetable data
                      const uniqueTimes = [...new Set(timetableClasses.map(c => c.startTime))].sort();
                      
                      return uniqueTimes.map(time => (
                        <div key={time} className="timetable-row">
                          <div className="time-slot">{time}</div>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                            const classItem = timetableClasses.find(c => 
                              c.day === day && c.startTime === time
                            );
                            return (
                              <div key={day} className={`class-item ${classItem ? '' : 'empty'}`}>
                                {classItem ? (
                                  <div className="class-item-content">
                                    <div className="class-subject">{classItem.subject}</div>
                                    {classItem.roomNo && <div className="class-room">{classItem.roomNo}</div>}
                                  </div>
                                ) : ''}
                              </div>
                            );
                          })}
                        </div>
                      ));
                    })()
                  ) : (
                    <div style={{ 
                      padding: '40px 20px', 
                      textAlign: 'center', 
                      color: '#666', 
                      gridColumn: '1 / -1',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '2px dashed #dee2e6'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '15px' }}>📅</div>
                      <h3 style={{ margin: '0 0 10px 0', color: '#1e3a5f' }}>No Timetable Yet</h3>
                      <p style={{ margin: '0 0 15px 0' }}>
                        {getTodayDay() === 'Sunday' 
                          ? 'It\'s Sunday! No classes scheduled today.' 
                          : 'No classes scheduled. Start by adding your timetable.'}
                      </p>
                      <button 
                        onClick={() => setActiveMenu('Timetable')}
                        style={{
                          padding: '10px 20px',
                          background: '#1e3a5f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}
                      >
                        📅 Create Timetable
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="two-col-grid">
                <div className="card">
                  <div className="card-header">
                    <h3>📝 Assignment Tracker</h3>
                    <button className="view-link" onClick={() => setActiveMenu('Assignments')}>View ›</button>
                  </div>
                  <div className="assignment-list">
                    {recentAssignments.length > 0 ? (
                      recentAssignments.map((assignment) => (
                        <div key={assignment.assignment_id} className="assignment-item">
                          <span className="assignment-name">{assignment.title}</span>
                          <span className="assignment-status pending">
                            {assignment.submitted_count || 0}/{assignment.total_students || 0} Submitted
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        <div style={{ fontSize: '24px', marginBottom: '10px' }}>📝</div>
                        <p style={{ margin: '0', fontSize: '14px' }}>No assignments yet</p>
                        <button 
                          onClick={() => setActiveMenu('Assignments')}
                          style={{
                            marginTop: '10px',
                            padding: '8px 16px',
                            background: '#1e3a5f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Create Assignment
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>👥 Student Queries</h3>
                    <button className="view-link" onClick={() => setActiveMenu('Messages')}>View ›</button>
                  </div>
                  <div className="query-list">
                    {recentMessages.length > 0 ? (
                      recentMessages.map((message) => (
                        <div key={message.message_id} className="query-item">
                          <span className="query-text">
                            {message.message.length > 40 
                              ? message.message.substring(0, 40) + '...' 
                              : message.message}
                          </span>
                          <button 
                            className="reply-btn"
                            onClick={() => setActiveMenu('Messages')}
                          >
                            Reply
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        <div style={{ fontSize: '24px', marginBottom: '10px' }}>💬</div>
                        <p style={{ margin: '0', fontSize: '14px' }}>No recent queries</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#bbb' }}>
                          Student messages will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="content-right">
              <div className="card">
                <div className="card-header">
                  <h3>📊 Attendance Overview</h3>
                </div>
                <div className="attendance-chart">
                  <div className="donut-chart">
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e0e0" strokeWidth="20" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#4caf50"
                        strokeWidth="20"
                        strokeDasharray={`${(attendanceOverview.percentage * 251) / 100} 251`}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="chart-center">{attendanceOverview.percentage}%</div>
                  </div>
                  <div className="attendance-stats">
                    <div className="attendance-rate">
                      {attendanceOverview.percentage}%
                      <br />
                      <span>Attendance Rate</span>
                    </div>
                    <div className="absent-badge">
                      {attendanceOverview.absent} Absent Today
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>📈 Performance Dashboard</h3>
                </div>
                <div className="performance-list">
                  {topStudents.length > 0 ? (
                    topStudents.map((student) => (
                      <div key={student.id} className="performance-item">
                        <div className="student-avatar" style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#1e3a5f',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {student.name.charAt(0)}
                        </div>
                        <div className="student-info">
                          <div className="student-name">{student.name}</div>
                          <div className="student-stats">
                            Class: {student.department} | {student.attendance}% Attend
                          </div>
                        </div>
                        <button 
                          className="arrow-btn"
                          onClick={() => setActiveMenu('Reports')}
                        >
                          ›
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      <div style={{ fontSize: '24px', marginBottom: '10px' }}>📈</div>
                      <p style={{ margin: '0', fontSize: '14px' }}>No student data yet</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#bbb' }}>
                        Performance data will appear here
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>📢 Announcements & Notices</h3>
                  <button className="view-link" onClick={() => setActiveMenu('Messages')}>View ›</button>
                </div>
                <div className="announcement-list">
                  {recentAnnouncements.length > 0 ? (
                    recentAnnouncements.map((announcement) => (
                      <div key={announcement.announcement_id} className="announcement-item">
                        <span className="announcement-icon">📢</span>
                        <span className="announcement-text">
                          {announcement.title.length > 30 
                            ? announcement.title.substring(0, 30) + '...' 
                            : announcement.title}
                        </span>
                        <button 
                          className="arrow-btn"
                          onClick={() => setActiveMenu('Messages')}
                        >
                          ›
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                      <div style={{ fontSize: '24px', marginBottom: '10px' }}>📢</div>
                      <p style={{ margin: '0', fontSize: '14px' }}>No announcements yet</p>
                      <button 
                        onClick={() => setActiveMenu('Messages')}
                        style={{
                          marginTop: '10px',
                          padding: '8px 16px',
                          background: '#1e3a5f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Send Announcement
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
        
        <footer className={`dashboard-footer ${showFooter ? 'show' : ''}`}>
          <div className="footer-bottom">
            <p>© 2026 Vidhyarth. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </footer>
      </div>

      {showProfile && <FacultyProfile user={user} onClose={() => setShowProfile(false)} />}
      
      {/* AI Chatbot Assistant */}
      <Chatbot user={user} />
    </div>
  );
}

function StudentDashboard({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    attendancePercentage: 0,
    pendingAssignments: 0,
    upcomingDeadlines: 0,
    todayClasses: 0
  });
  const [timetableClasses, setTimetableClasses] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [performanceSummary, setPerformanceSummary] = useState({
    overallGPA: 0,
    assignmentCompletion: 0
  });

  const menuItems = [
    { icon: '🏠', label: 'Dashboard' },
    { icon: '📅', label: 'Timetable' },
    { icon: '✓', label: 'Attendance' },
    { icon: '📝', label: 'Assignments' },
    { icon: '📊', label: 'Performance' },
    { icon: '💬', label: 'Messages' },
    { icon: '📄', label: 'Resources' },
    { icon: '🔔', label: 'Notifications' },
    { icon: '🚪', label: 'Logout', action: 'logout' }
  ];

  // Update greeting in real-time
  useEffect(() => {
    const updateGreeting = () => {
      const greetingText = getRealTimeGreeting();
      setGreeting(`${greetingText}, ${user.fullName}!`);
    };

    updateGreeting();
    // Update greeting every minute to reflect real-time changes
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, [user.fullName]);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.dashboard-body');
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

    const scrollContainer = document.querySelector('.dashboard-body');
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

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch student dashboard stats
      const statsResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/dashboard/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        delete stats.todayClasses; // Don't overwrite locally calculated classes
        setDashboardStats(prev => ({ ...prev, ...stats }));
      }

      // Fetch recent announcements
      const announcementsResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/announcements/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (announcementsResponse.ok) {
        const announcements = await announcementsResponse.json();
        setRecentAnnouncements(announcements.slice(0, 3));
      }

      // Fetch performance summary
      const performanceResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/performance/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (performanceResponse.ok) {
        const performance = await performanceResponse.json();
        
        // Calculate assignment completion percentage
        const assignmentsResponse = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/assignments/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let assignmentCompletion = 0;
        if (assignmentsResponse.ok) {
          const assignments = await assignmentsResponse.json();
          const totalAssignments = assignments.length;
          const submittedAssignments = assignments.filter(a => a.status === 'submitted').length;
          assignmentCompletion = totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0;
        }
        
        setPerformanceSummary({
          overallGPA: performance.overallGPA || 0,
          assignmentCompletion
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Load timetable data for student
  useEffect(() => {
    const loadStudentTimetable = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/timetable/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const formattedClasses = data.map(c => ({
            id: c.timetable_id,
            subject: c.subject,
            day: c.day,
            startTime: c.start_time,
            endTime: c.end_time,
            roomNo: c.room_no,
            facultyName: c.faculty_name
          }));
          setTimetableClasses(formattedClasses);
          
          // Update today's classes count locally
          const today = getTodayDay();
          const todaysClassesCount = formattedClasses.filter(c => c.day === today).length;
          setDashboardStats(prev => ({ ...prev, todayClasses: todaysClassesCount }));
        }
      } catch (error) {
        console.error('Error loading timetable:', error);
      }
    };

    loadStudentTimetable();
  }, [user.id]);

  // Get today's day name
  const getTodayDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // Removed color function - timetable uses white background only

  const handleMenuClick = (item) => {
    if (item.action === 'logout') {
      onLogout();
    } else {
      setActiveMenu(item.label);
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="sidebar-logo">
              <img src="/logo.svg" alt="Vidhyarth" />
            </div>
            {!sidebarCollapsed && <span className="logo-text">Vidhyarth</span>}
          </div>
          <button 
            className="collapse-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${activeMenu === item.label ? 'active' : ''}`}
              onClick={() => handleMenuClick(item)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <h1 className="page-title">Student Dashboard</h1>
          <div className="header-actions">
            <button className="icon-btn" onClick={() => setActiveMenu('Dashboard')} title="Home">🏠</button>
            <button className="icon-btn" onClick={() => setActiveMenu('Resources')} title="Resources">📁</button>
            <button className="icon-btn" onClick={() => setActiveMenu('Messages')} title="Messages">✉️</button>
            <ProfileMenu user={user} onLogout={onLogout} onOpenProfile={() => setShowProfile(true)} />
          </div>
        </header>

        <div className="dashboard-body">
          {activeMenu === 'Timetable' ? (
            <StudentTimetable user={user} />
          ) : activeMenu === 'Attendance' ? (
            <StudentAttendance user={user} />
          ) : activeMenu === 'Assignments' ? (
            <StudentAssignments user={user} />
          ) : activeMenu === 'Performance' ? (
            <StudentPerformance user={user} />
          ) : activeMenu === 'Messages' ? (
            <StudentMessages user={user} />
          ) : activeMenu === 'Resources' ? (
            <StudentResources user={user} />
          ) : activeMenu === 'Notifications' ? (
            <StudentNotifications user={user} />
          ) : (
            <>
              {/* Hero Section */}
              <div className="hero-section">
                <h2 className="welcome-text">{greeting}</h2>
                <p className="current-time">{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>

              {/* Quick Stats */}
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-label">Attendance</div>
                    <div className="stat-value">{dashboardStats.attendancePercentage}%</div>
                  </div>
                </div>
                <div className="stat-card orange">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <div className="stat-label">Pending Assignments</div>
                    <div className="stat-value">{dashboardStats.pendingAssignments}</div>
                  </div>
                </div>
                <div className="stat-card red">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-content">
                    <div className="stat-label">Upcoming Deadlines</div>
                    <div className="stat-value">{dashboardStats.upcomingDeadlines}</div>
                  </div>
                </div>
                <div className="stat-card blue-light">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <div className="stat-label">Today's Classes</div>
                    <div className="stat-value">{dashboardStats.todayClasses}</div>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="content-grid">
                <div className="content-left">
                  {/* Smart Timetable */}
                  <div className="card timetable-card">
                    <div className="card-header">
                      <h3>📅 Smart Timetable</h3>
                      <button className="view-link" onClick={() => setActiveMenu('Timetable')}>View ›</button>
                    </div>
                    <div className="timetable-grid">
                      <div className="timetable-header-row">
                        <div className="time-header">Time</div>
                        <div className="day-header">Mon</div>
                        <div className="day-header">Tue</div>
                        <div className="day-header">Wed</div>
                        <div className="day-header">Thu</div>
                        <div className="day-header">Fri</div>
                        <div className="day-header">Sat</div>
                      </div>
                      {timetableClasses.length > 0 ? (
                        (() => {
                          // Get unique time slots from actual timetable data
                          const uniqueTimes = [...new Set(timetableClasses.map(c => c.startTime))].sort();
                          
                          return uniqueTimes.map(time => (
                            <div key={time} className="timetable-row">
                              <div className="time-slot">{formatTo12Hour(time)}</div>
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                const classItem = timetableClasses.find(c => 
                                  c.day === day && c.startTime === time
                                );
                                return (
                                  <div key={day} className={`class-item ${classItem ? '' : 'empty'}`}>
                                    {classItem ? (
                                      <div className="class-item-content">
                                        <div className="class-subject">{classItem.subject}</div>
                                        {classItem.roomNo && <div className="class-room">{classItem.roomNo}</div>}
                                        {classItem.facultyName && <div className="class-faculty">{classItem.facultyName}</div>}
                                      </div>
                                    ) : ''}
                                  </div>
                                );
                              })}
                            </div>
                          ));
                        })()
                      ) : (
                        <div style={{ 
                          padding: '40px 20px', 
                          textAlign: 'center', 
                          color: '#666', 
                          gridColumn: '1 / -1',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          border: '2px dashed #dee2e6'
                        }}>
                          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📅</div>
                          <h3 style={{ margin: '0 0 10px 0', color: '#1e3a5f' }}>No Timetable Yet</h3>
                          <p style={{ margin: '0 0 15px 0' }}>
                            {getTodayDay() === 'Sunday' 
                              ? 'It\'s Sunday! No classes scheduled today.' 
                              : 'No classes scheduled. Check back later.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Announcements */}
                  <div className="card">
                    <div className="card-header">
                      <h3>📢 Recent Announcements</h3>
                      <button className="view-link" onClick={() => setActiveMenu('Messages')}>View All ›</button>
                    </div>
                    <div className="announcements-list">
                      {recentAnnouncements.length > 0 ? (
                        recentAnnouncements.map((announcement) => (
                          <div key={announcement.id} className="announcement-item">
                            <div className="announcement-icon">📢</div>
                            <div className="announcement-content">
                              <div className="announcement-title">{announcement.title}</div>
                              <div className="announcement-date">
                                {new Date(announcement.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-announcements">
                          <div style={{ fontSize: '24px', marginBottom: '10px' }}>📢</div>
                          <p>No recent announcements</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="content-right">
                  {/* Quick Actions */}
                  <div className="card">
                    <div className="card-header">
                      <h3>⚡ Quick Actions</h3>
                    </div>
                    <div className="quick-actions">
                      <button className="action-btn" onClick={() => setActiveMenu('Assignments')}>
                        <span className="action-icon">📝</span>
                        <span>View Assignments</span>
                      </button>
                      <button className="action-btn" onClick={() => setActiveMenu('Attendance')}>
                        <span className="action-icon">✓</span>
                        <span>Check Attendance</span>
                      </button>
                      <button className="action-btn" onClick={() => setActiveMenu('Performance')}>
                        <span className="action-icon">📊</span>
                        <span>View Grades</span>
                      </button>
                      <button className="action-btn" onClick={() => setActiveMenu('Resources')}>
                        <span className="action-icon">📄</span>
                        <span>Study Materials</span>
                      </button>
                    </div>
                  </div>

                  {/* Performance Summary */}
                  <div className="card">
                    <div className="card-header">
                      <h3>📈 Performance Summary</h3>
                    </div>
                    <div className="performance-summary">
                      <div className="performance-item">
                        <span className="performance-label">Overall GPA</span>
                        <span className="performance-value">
                          {performanceSummary.overallGPA > 0 ? `${performanceSummary.overallGPA}/10` : '-'}
                        </span>
                      </div>
                      <div className="performance-item">
                        <span className="performance-label">Attendance Rate</span>
                        <span className="performance-value">{dashboardStats.attendancePercentage}%</span>
                      </div>
                      <div className="performance-item">
                        <span className="performance-label">Assignments Completed</span>
                        <span className="performance-value">
                          {performanceSummary.assignmentCompletion > 0 ? `${performanceSummary.assignmentCompletion}%` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test content to ensure scrolling */}
              <div style={{ height: '200px', background: 'transparent' }}></div>
            </>
          )}
        </div>
        
        <footer className={`dashboard-footer ${showFooter ? 'show' : ''}`}>
          <div className="footer-bottom">
            <p>© 2026 Vidhyarth. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </footer>
      </div>

      {showProfile && <StudentProfile user={user} onClose={() => setShowProfile(false)} />}
      
      {/* AI Chatbot Assistant */}
      <Chatbot user={user} />
    </div>
  );
}

export default Dashboard;
