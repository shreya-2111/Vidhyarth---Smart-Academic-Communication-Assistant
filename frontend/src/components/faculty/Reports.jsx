import React, { useState, useEffect } from 'react';
import './Reports.css';
import { masterAPI, messagesAPI } from '../../services/api';

function Reports({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  
  // Dashboard data
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    averagePerformance: 0,
    averageAttendance: 0
  });

  // Performance data
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [chartsData, setChartsData] = useState({
    gradeDistribution: [],
    performanceTrends: [],
    subjectPerformance: [],
    attendancePerformance: []
  });
  const [weakStudents, setWeakStudents] = useState([]);

  // Filters (department removed - MSCIT only)
  const [filters, setFilters] = useState({
    subjects: [],
    semesters: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    subject: '',
    semester: ''
  });

  // Add Grade Modal
  const [showAddGradeModal, setShowAddGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    studentId: '',
    subject: '',
    examType: 'quiz',
    marksObtained: '',
    totalMarks: '',
    gradeLetter: '',
    examDate: new Date().toISOString().split('T')[0]
  });
  const [studentsList, setStudentsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchFilters();
    fetchStudentsAndSubjects();
    if (activeTab === 'performance') {
      fetchStudentPerformance();
    } else if (activeTab === 'charts') {
      fetchChartsData();
    } else if (activeTab === 'weak-students') {
      fetchWeakStudents();
    }
  }, [activeTab, selectedFilters]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.reports-page');
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

    const scrollContainer = document.querySelector('.reports-page');
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

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-beryl-pi.vercel.app/api/reports/dashboard/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchStudentPerformance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams(selectedFilters);
      const response = await fetch(
        `https://backend-beryl-pi.vercel.app/api/reports/student-performance/${user.id}?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setStudentPerformance(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student performance:', error);
      setLoading(false);
    }
  };

  const fetchChartsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-beryl-pi.vercel.app/api/reports/charts/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChartsData(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching charts data:', error);
      setLoading(false);
    }
  };

  const fetchWeakStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-beryl-pi.vercel.app/api/reports/weak-students/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWeakStudents(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weak students:', error);
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const assignments = await masterAPI.getFacultyAssignments(user.id);
      const uniqueSubjects = [...new Set(assignments.map(a => a.subject_name))];
      const semesters = await masterAPI.getSemesters();
      setFilters({ subjects: uniqueSubjects, semesters: semesters });
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchStudentsAndSubjects = async () => {
    try {
      const [students, assignments] = await Promise.all([
        messagesAPI.getStudents(),
        masterAPI.getFacultyAssignments(user.id)
      ]);
      setStudentsList(Array.isArray(students) ? students : []);
      const seen = new Set();
      const uniqueSubjects = assignments.filter(a => {
        if (seen.has(a.subject_name)) return false;
        seen.add(a.subject_name);
        return true;
      });
      setSubjectsList(uniqueSubjects);
    } catch (error) {
      console.error('Error fetching students/subjects:', error);
    }
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/reports/add-grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...gradeForm,
          facultyId: user.id
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Grade added successfully!');
        setShowAddGradeModal(false);
        setGradeForm({
          studentId: '',
          subject: '',
          examType: 'quiz',
          marksObtained: '',
          totalMarks: '',
          gradeLetter: '',
          examDate: new Date().toISOString().split('T')[0]
        });
        fetchDashboardData();
        if (activeTab === 'performance') fetchStudentPerformance();
      } else {
        alert('Failed to add grade: ' + (data.details || data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding grade:', error);
      alert('Failed to add grade: ' + error.message);
    }
  };

  const downloadReport = (type) => {
    // This would integrate with a PDF/Excel generation library
    alert(`Downloading ${type} report... (Feature to be implemented with PDF/Excel library)`);
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return '#4CAF50'; // Green
    if (percentage >= 80) return '#8BC34A'; // Light Green
    if (percentage >= 70) return '#FFC107'; // Yellow
    if (percentage >= 60) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getStatusBadge = (status) => {
    const colors = {
      excellent: '#4CAF50',
      good: '#8BC34A',
      average: '#FFC107',
      poor: '#FF9800',
      fail: '#F44336'
    };
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: colors[status] || '#999' }}
      >
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>📊 Performance Dashboard</h2>
        <div className="reports-actions">
          <button className="btn-add-grade" onClick={() => setShowAddGradeModal(true)}>
            ➕ Add Grade
          </button>
          <button className="btn-download" onClick={() => downloadReport('PDF')}>
            📄 Download PDF
          </button>
          <button className="btn-download" onClick={() => downloadReport('Excel')}>
            📊 Download Excel
          </button>
        </div>
      </div>

      <div className="reports-tabs">
        <button
          className={`reports-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📈 Overview
        </button>
        <button
          className={`reports-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          👥 Student Performance
        </button>
        <button
          className={`reports-tab ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          📊 Analytics
        </button>
        <button
          className={`reports-tab ${activeTab === 'weak-students' ? 'active' : ''}`}
          onClick={() => setActiveTab('weak-students')}
        >
          ⚠️ At Risk Students
        </button>
      </div>

      <div className="reports-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>{dashboardStats.totalStudents}</h3>
                  <p>Total Students</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <h3>{dashboardStats.totalSubjects}</h3>
                  <p>Subjects Taught</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>{dashboardStats.averagePerformance}%</h3>
                  <p>Average Performance</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>{dashboardStats.averageAttendance}%</h3>
                  <p>Average Attendance</p>
                </div>
              </div>
            </div>

            <div className="quick-insights">
              <h3>📋 Quick Insights</h3>
              <div className="insights-grid">
                <div className="insight-card">
                  <h4>Performance Trend</h4>
                  <p>Overall class performance is {dashboardStats.averagePerformance >= 75 ? 'Good' : 'Needs Improvement'}</p>
                </div>
                <div className="insight-card">
                  <h4>Attendance Status</h4>
                  <p>Class attendance is {dashboardStats.averageAttendance >= 80 ? 'Satisfactory' : 'Below Expected'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="performance-section">
            <div className="filters-row">
              {/* Department filter removed - system is MSCIT only */}
              <select
                value={selectedFilters.subject}
                onChange={(e) => setSelectedFilters({...selectedFilters, subject: e.target.value})}
              >
                <option value="">All Subjects</option>
                {filters.subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <select
                value={selectedFilters.semester}
                onChange={(e) => setSelectedFilters({...selectedFilters, semester: e.target.value})}
              >
                <option value="">All Semesters</option>
                {filters.semesters.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="loading">Loading performance data...</div>
            ) : (
              <div className="performance-table-container">
                <table className="performance-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Subject</th>
                      <th>Percentage</th>
                      <th>Grade</th>
                      <th>Attendance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentPerformance.map((student, index) => (
                      <tr key={index}>
                        <td>
                          <div className="student-cell">
                            <div className="student-avatar">
                              {student.name?.charAt(0)}
                            </div>
                            <div>
                              <div className="student-name">{student.name}</div>
                              <div className="student-email">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{student.subject}</td>
                        <td>
                          <div className="percentage-cell">
                            <div 
                              className="percentage-bar"
                              style={{ 
                                width: `${parseFloat(student.percentage || 0)}%`,
                                backgroundColor: getPerformanceColor(parseFloat(student.percentage || 0))
                              }}
                            ></div>
                            <span>{parseFloat(student.percentage || 0).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="grade-badge">{student.grade_letter || 'N/A'}</span>
                        </td>
                        <td>{parseFloat(student.attendance_percentage || 0).toFixed(1)}%</td>
                        <td>{getStatusBadge(student.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="charts-section">
            {loading ? (
              <div className="loading">Loading analytics...</div>
            ) : (
              <div className="chart-card-single">
                <h3>📊 Grade Distribution</h3>
                <div className="chart-placeholder">
                  {chartsData.gradeDistribution.length > 0 ? (
                    <div className="grade-bars">
                      {chartsData.gradeDistribution.map((grade, index) => (
                        <div key={index} className="grade-bar">
                          <div className="bar-label">{grade.grade_letter}</div>
                          <div 
                            className="bar-fill"
                            style={{ height: `${(grade.count / Math.max(...chartsData.gradeDistribution.map(g => g.count))) * 100}%` }}
                          ></div>
                          <div className="bar-count">{grade.count}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No grade data available</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'weak-students' && (
          <div className="weak-students-section">
            <h3>⚠️ Students Needing Attention</h3>
            {loading ? (
              <div className="loading">Loading at-risk students...</div>
            ) : weakStudents.length === 0 ? (
              <div className="no-data">
                <p>🎉 Great! No students are currently at risk.</p>
              </div>
            ) : (
              <div className="weak-students-grid">
                {weakStudents.map((student, index) => (
                  <div key={index} className="weak-student-card">
                    <div className="student-header">
                      <div className="student-avatar">{student.name?.charAt(0)}</div>
                      <div>
                        <h4>{student.name}</h4>
                        <p>Msc.IT</p>
                      </div>
                      <span className={`concern-badge ${student.concern_level?.toLowerCase().replace(' ', '-')}`}>
                        {student.concern_level}
                      </span>
                    </div>
                    <div className="student-metrics">
                      <div className="metric">
                        <span>Subject:</span>
                        <span>{student.subject}</span>
                      </div>
                      <div className="metric">
                        <span>Performance:</span>
                        <span style={{ color: getPerformanceColor(parseFloat(student.percentage || 0)) }}>
                          {parseFloat(student.percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="metric">
                        <span>Attendance:</span>
                        <span>{parseFloat(student.attendance_percentage || 0).toFixed(1)}%</span>
                      </div>
                      <div className="metric">
                        <span>Status:</span>
                        {getStatusBadge(student.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Grade Modal */}
      {showAddGradeModal && (
        <div className="modal-overlay" onClick={() => setShowAddGradeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Add Student Grade</h3>
              <button className="modal-close" onClick={() => setShowAddGradeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddGrade} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Student *</label>
                  <select
                    value={gradeForm.studentId}
                    onChange={(e) => setGradeForm({...gradeForm, studentId: e.target.value})}
                    required
                  >
                    <option value="">Select Student</option>
                    {studentsList.map(s => (
                      <option key={s.student_id} value={s.student_id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject *</label>
                  <select
                    value={gradeForm.subject}
                    onChange={(e) => setGradeForm({...gradeForm, subject: e.target.value})}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjectsList.map((s, i) => (
                      <option key={i} value={s.subject_name}>{s.subject_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Exam Type *</label>
                  <select
                    value={gradeForm.examType}
                    onChange={(e) => setGradeForm({...gradeForm, examType: e.target.value})}
                    required
                  >
                    <option value="quiz">Quiz</option>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Exam Date *</label>
                  <input
                    type="date"
                    value={gradeForm.examDate}
                    onChange={(e) => setGradeForm({...gradeForm, examDate: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Marks Obtained *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gradeForm.marksObtained}
                    onChange={(e) => setGradeForm({...gradeForm, marksObtained: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Total Marks *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gradeForm.totalMarks}
                    onChange={(e) => setGradeForm({...gradeForm, totalMarks: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Grade Letter *</label>
                <select
                  value={gradeForm.gradeLetter}
                  onChange={(e) => setGradeForm({...gradeForm, gradeLetter: e.target.value})}
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="B-">B-</option>
                  <option value="C+">C+</option>
                  <option value="C">C</option>
                  <option value="C-">C-</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddGradeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Grade
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

export default Reports;