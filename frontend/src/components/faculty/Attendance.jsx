import React, { useState, useEffect } from 'react';
import './Attendance.css';
import { attendanceAPI } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { formatDateTo12Hour } from '../../utils/timeUtils';

function Attendance({ user }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    averageAttendance: 0
  });
  const [analyticsData, setAnalyticsData] = useState([]);
  const [frequentAbsentees, setFrequentAbsentees] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrSessionId, setQrSessionId] = useState('');
  const [qrExpiryTime, setQrExpiryTime] = useState(null);

  // NEW: State for faculty-specific classes and subjects from faculty_subjects table
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [facultyClasses, setFacultyClasses] = useState([]);
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [facultyDivisions, setFacultyDivisions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // NEW: Load faculty's assigned classes and subjects from faculty_subjects table
  useEffect(() => {
    loadFacultyAssignments();
  }, [user]);

  // Load subjects and divisions when class is selected
  useEffect(() => {
    if (selectedClass && facultyAssignments.length > 0) {
      const subjectsForClass = facultyAssignments
        .filter(assignment => assignment.class_id === parseInt(selectedClass))
        .map(assignment => ({
          subject_id: assignment.subject_id,
          subject_name: assignment.subject_name,
          subject_code: assignment.subject_code
        }));
      setFacultySubjects(subjectsForClass);

      // Extract unique divisions for this class
      const divisionsForClass = [
        ...new Set(
          facultyAssignments
            .filter(a => a.class_id === parseInt(selectedClass) && a.division)
            .map(a => a.division)
        )
      ];
      setFacultyDivisions(divisionsForClass);
      setSelectedDivision(divisionsForClass.length > 0 ? divisionsForClass[0] : '');

      if (subjectsForClass.length > 0 && !selectedSubject) {
        setSelectedSubject(subjectsForClass[0].subject_name);
      }
    } else {
      setFacultySubjects([]);
      setFacultyDivisions([]);
      setSelectedDivision('');
    }
  }, [selectedClass, facultyAssignments]);

  const loadFacultyAssignments = async () => {
    try {
      setLoadingAssignments(true);
      console.log('Loading faculty assignments for user:', user.id);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/faculty-subject-assignment/faculty/${user.id}/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const assignments = await response.json();
        console.log('Faculty assignments loaded:', assignments);
        setFacultyAssignments(assignments);
        
        // Extract unique classes by class_id (not class_name — same name exists for diff semesters)
        const seen = new Set();
        const classesData = assignments.reduce((acc, a) => {
          if (!seen.has(a.class_id)) {
            seen.add(a.class_id);
            acc.push({
              class_id: a.class_id,
              class_name: a.class_name,
              semester: a.semester,
              display_name: `${a.class_name} - ${a.semester}`
            });
          }
          return acc;
        }, []);
        setFacultyClasses(classesData);
        
        // Auto-select first class if available
        if (classesData.length > 0) {
          setSelectedClass(classesData[0].class_id);
        }
      } else {
        console.error('Failed to fetch faculty assignments:', response.status);
      }
      setLoadingAssignments(false);
    } catch (error) {
      console.error('Error loading faculty assignments:', error);
      setLoadingAssignments(false);
    }
  };

  // Helper: get class_name from selected class_id
  const getSelectedClassName = () => {
    const cls = facultyClasses.find(c => c.class_id === parseInt(selectedClass));
    return cls ? cls.class_name : selectedClass;
  };

  // Fetch attendance when date/class/division changes
  useEffect(() => {
    if (!selectedClass || !selectedDate || facultyClasses.length === 0) return;

    const classObj = facultyClasses.find(c => c.class_id === parseInt(selectedClass));
    const className = classObj ? classObj.class_name : null;
    if (!className) return;

    const loadAttendance = async () => {
      try {
        const data = await attendanceAPI.getAttendanceByDate(selectedDate, className, selectedDivision || null);
        const attendanceMap = {};
        if (Array.isArray(data)) {
          data.forEach(record => {
            attendanceMap[record.student_id] = record.status;
          });
        }
        setAttendance(attendanceMap);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setAttendance({});
      }
    };
    loadAttendance();
  }, [selectedDate, selectedClass, selectedDivision, facultyClasses]);

  useEffect(() => {
    const values = Object.values(attendance);
    const present = values.filter(v => v === 'Present').length;
    const absent = values.filter(v => v === 'Absent').length;
    const total = values.length;
    const avgAttendance = total > 0 ? Math.round((present / total) * 100) : 0;

    setStats({
      totalPresent: present,
      totalAbsent: absent,
      averageAttendance: avgAttendance
    });
  }, [attendance]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.attendance-page');
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

    const scrollContainer = document.querySelector('.attendance-page');
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

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await attendanceAPI.getStudents(getSelectedClassName());
      setStudents(Array.isArray(data) ? data : []);
      
      // Initialize attendance as empty
      const initialAttendance = {};
      const studentList = Array.isArray(data) ? data : [];
      studentList.forEach(student => {
        initialAttendance[student.student_id] = null;
      });
      setAttendance(initialAttendance);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      setLoading(false);
    }
  };

  const fetchAttendanceByDate = async () => {
    try {
      const data = await attendanceAPI.getAttendanceByDate(selectedDate, getSelectedClassName());
      
      // Map existing attendance to state
      const attendanceMap = {};
      const attendanceList = Array.isArray(data) ? data : [];
      attendanceList.forEach(record => {
        attendanceMap[record.student_id] = record.status;
      });
      
      // Merge with current students
      const updatedAttendance = {};
      students.forEach(student => {
        updatedAttendance[student.student_id] = attendanceMap[student.student_id] || null;
      });
      
      setAttendance(updatedAttendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await attendanceAPI.getAnalytics(getSelectedClassName());
      setAnalyticsData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData([]);
    }
  };

  const fetchAbsentees = async () => {
    try {
      const data = await attendanceAPI.getAbsentees(getSelectedClassName());
      setFrequentAbsentees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching absentees:', error);
      setFrequentAbsentees([]);
    }
  };

  const calculateStats = () => {
    const values = Object.values(attendance);
    const present = values.filter(v => v === 'Present').length;
    const absent = values.filter(v => v === 'Absent').length;
    const total = values.filter(v => v !== null).length;
    
    setStats({
      totalPresent: present,
      totalAbsent: absent,
      averageAttendance: total > 0 ? Math.round((present / total) * 100) : 0
    });
  };

  const markAttendance = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status
    }));
  };

  const forceMarkAbsent = async (studentId, studentName) => {
    if (!selectedClass || !selectedSubject) {
      alert('Please select class and subject first');
      return;
    }

    const confirmMessage = `Are you sure you want to force mark ${studentName} as ABSENT?\n\nThis will override any QR attendance and immediately mark them absent in the database.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/qr-attendance/mark-absent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: parseInt(studentId),
          subject: selectedSubject,
          className: getSelectedClassName(),
          date: selectedDate
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${studentName} has been marked as ABSENT successfully!`);
        
        // Update local state to reflect the change
        setAttendance(prev => ({
          ...prev,
          [studentId]: 'Absent'
        }));
        
        // Refresh the attendance data
        fetchAttendanceByDate();
      } else {
        const error = await response.json();
        alert(`Failed to mark absent: ${error.error}`);
      }
    } catch (error) {
      console.error('Error forcing absent:', error);
      alert('Failed to mark student as absent. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAllPresent = () => {
    const allPresent = {};
    students.forEach(student => {
      allPresent[student.student_id] = 'Present';
    });
    setAttendance(allPresent);
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedSubject) {
      alert('Please select class and subject');
      return;
    }

    // Check if any attendance is marked
    const markedCount = Object.values(attendance).filter(v => v !== null).length;
    if (markedCount === 0) {
      alert('Please mark attendance for at least one student');
      return;
    }

    setLoading(true);
    try {
      console.log('Saving attendance:', {
        date: selectedDate,
        subject: selectedSubject,
        className: selectedClass,
        markedStudents: markedCount
      });

      const result = await attendanceAPI.saveAttendance({
        date: selectedDate,
        subject: selectedSubject,
        className: getSelectedClassName(),
        attendance,
        division: selectedDivision || null
      });
      
      console.log('Save result:', result);
      alert(`Attendance saved successfully! (${markedCount} students marked)`);
      
      // Refresh analytics and absentees
      fetchAnalytics();
      fetchAbsentees();
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert(`Failed to save attendance: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPercentageClass = (percentage) => {
    if (percentage >= 85) return '';
    if (percentage >= 75) return 'medium';
    return 'low';
  };

  // QR Code Functions
  const generateQRSession = async () => {
    if (!selectedClass || !selectedSubject) {
      alert('Please select class and subject first');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/qr-attendance/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: selectedSubject,
          className: getSelectedClassName(),
          duration: 5 // 5 minutes
        })
      });

      if (response.ok) {
        const sessionData = await response.json();
        setQrSessionId(sessionData.sessionId);
        setQrExpiryTime(new Date(sessionData.expiresAt));
        setShowQRModal(true);
        
        // Auto-close when session expires
        const timeUntilExpiry = new Date(sessionData.expiresAt).getTime() - Date.now();
        setTimeout(() => {
          setShowQRModal(false);
          setQrSessionId('');
          setQrExpiryTime(null);
        }, timeUntilExpiry);
      } else {
        const error = await response.json();
        alert(`Failed to create QR session: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating QR session:', error);
      alert('Failed to create QR session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeQRModal = async () => {
    if (qrSessionId) {
      try {
        const token = localStorage.getItem('authToken');
        await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/qr-attendance/end-session/${qrSessionId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error ending QR session:', error);
      }
    }
    
    setShowQRModal(false);
    setQrSessionId('');
    setQrExpiryTime(null);
  };

  // Get QR data from backend session
  const getQRData = () => {
    if (!qrSessionId) return '';
    
    return JSON.stringify({
      sessionId: qrSessionId,
      facultyId: user.id,
      subject: selectedSubject,
      className: getSelectedClassName(),
      date: selectedDate,
      timestamp: Date.now()
    });
  };

  // Get student analytics data
  const getStudentAnalytics = (studentId) => {
    if (!Array.isArray(analyticsData)) return 0;
    const analytics = analyticsData.find(a => a.student_id === studentId);
    return analytics ? parseFloat(analytics.attendance_percentage) || 0 : 0;
  };

  // Calculate insights - with safety checks
  const excellentCount = Array.isArray(analyticsData) 
    ? analyticsData.filter(a => parseFloat(a.attendance_percentage) >= 85).length 
    : 0;
  const goodCount = Array.isArray(analyticsData)
    ? analyticsData.filter(a => {
        const pct = parseFloat(a.attendance_percentage);
        return pct >= 75 && pct < 85;
      }).length
    : 0;
  const needsAttentionCount = Array.isArray(analyticsData)
    ? analyticsData.filter(a => parseFloat(a.attendance_percentage) < 75).length
    : 0;

  // Fetch students and analytics when class is selected
  useEffect(() => {
    if (!selectedClass || facultyClasses.length === 0) return;

    // Resolve class_name from class_id directly inside the effect
    const classObj = facultyClasses.find(c => c.class_id === parseInt(selectedClass));
    const className = classObj ? classObj.class_name : null;

    if (!className) return;

    const loadStudents = async () => {
      try {
        setLoading(true);
        const data = await attendanceAPI.getStudents(className, selectedDivision || null);
        setStudents(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
        setLoading(false);
      }
    };

    const loadAnalytics = async () => {
      try {
        const data = await attendanceAPI.getAnalytics(className);
        setAnalyticsData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAnalyticsData([]);
      }
    };

    const loadAbsentees = async () => {
      try {
        const data = await attendanceAPI.getAbsentees(className);
        setFrequentAbsentees(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching absentees:', error);
        setFrequentAbsentees([]);
      }
    };

    loadStudents();
    loadAnalytics();
    loadAbsentees();
  }, [selectedClass, selectedDivision, facultyClasses]);

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <h2>📊 Attendance Management</h2>
        <div className="attendance-actions">
          <button className="btn-qr" onClick={generateQRSession}>
            📱 QR Attendance
          </button>
          <button className="btn-secondary" onClick={markAllPresent}>
            ✓ Mark All Present
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="attendance-stats">
        <div className="stat-card-attendance green">
          <h3>Present Today</h3>
          <p className="stat-number">{stats.totalPresent}</p>
        </div>
        <div className="stat-card-attendance red">
          <h3>Absent Today</h3>
          <p className="stat-number">{stats.totalAbsent}</p>
        </div>
        <div className="stat-card-attendance blue">
          <h3>Attendance Rate</h3>
          <p className="stat-number">{stats.averageAttendance}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="attendance-filters">
        <div className="filter-group">
          <label>Select Class *</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={loadingAssignments}
          >
            <option value="">
              {loadingAssignments ? 'Loading classes...' : 'Choose class...'}
            </option>
            {facultyClasses.map((cls) => (
              <option key={cls.class_id} value={cls.class_id}>
                {cls.display_name}
              </option>
            ))}
          </select>
          {!loadingAssignments && facultyClasses.length === 0 && (
            <small style={{ color: '#f44336', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              No classes assigned. Contact admin to assign subjects.
            </small>
          )}
          {facultyClasses.length > 0 && (
            <small style={{ color: '#4caf50', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {facultyClasses.length} class(es) assigned
            </small>
          )}
        </div>
        <div className="filter-group">
          <label>Select Subject *</label>
          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={!selectedClass}
          >
            <option value="">
              {!selectedClass ? 'Select class first...' : 'Choose subject...'}
            </option>
            {facultySubjects.map((sub) => (
              <option key={sub.subject_id} value={sub.subject_name}>
                {sub.subject_name} ({sub.subject_code})
              </option>
            ))}
          </select>
          {selectedClass && facultySubjects.length === 0 && (
            <small style={{ color: '#f44336', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              No subjects assigned for this class.
            </small>
          )}
          {facultySubjects.length > 0 && (
            <small style={{ color: '#4caf50', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              {facultySubjects.length} subject(s) for this class
            </small>
          )}
        </div>
        <div className="filter-group">
          <label>Date</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Division</label>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            disabled={!selectedClass}
          >
            <option value="">All Divisions</option>
            {facultyDivisions.map((div) => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
          {selectedClass && facultyDivisions.length === 0 && (
            <small style={{ color: '#999', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              No divisions assigned
            </small>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      {selectedClass ? (
        <div className="attendance-table-container">
          <div className="attendance-table-header">
            <h3>Class: {getSelectedClassName()}{selectedDivision ? ` - Div ${selectedDivision}` : ''} - {selectedSubject || 'All Subjects'}</h3>
            <span>{students.length} Students</span>
          </div>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll No</th>
                <th>Mark Attendance</th>
                <th>Manual Override</th>
                <th>Overall Attendance</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.student_id}>
                  <td>
                    <div className="student-info">
                      <div className="student-avatar">
                        {getInitials(student.name)}
                      </div>
                      <div className="student-details">
                        <span className="student-name">{student.name}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="student-roll">{student.roll_no}</span>
                  </td>
                  <td>
                    <div className="attendance-status">
                      <button
                        className={`status-btn present ${attendance[student.student_id] === 'Present' ? 'active' : ''}`}
                        onClick={() => markAttendance(student.student_id, 'Present')}
                      >
                        Present
                      </button>
                      <button
                        className={`status-btn absent ${attendance[student.student_id] === 'Absent' ? 'active' : ''}`}
                        onClick={() => markAttendance(student.student_id, 'Absent')}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="manual-override">
                      <button
                        className="btn-force-absent"
                        onClick={() => forceMarkAbsent(student.student_id, student.name)}
                        title="Force mark as absent (overrides QR attendance)"
                      >
                        🚫 Force Absent
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="attendance-percentage">
                      <div className="percentage-bar">
                        <div 
                          className={`percentage-fill ${getPercentageClass(getStudentAnalytics(student.student_id))}`}
                          style={{ width: `${getStudentAnalytics(student.student_id)}%` }}
                        ></div>
                      </div>
                      <span className="percentage-text">{getStudentAnalytics(student.student_id)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="attendance-table-container">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No Class Selected</h3>
            <p>Please select a class and subject to mark attendance</p>
          </div>
        </div>
      )}

      {/* Analytics */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>🚨 Frequent Absentees (Below 80%)</h3>
          <div className="absentee-list">
            {frequentAbsentees.length > 0 ? (
              frequentAbsentees.map(student => (
                <div key={student.student_id} className="absentee-item">
                  <div className="absentee-info">
                    <div className="student-avatar">
                      {getInitials(student.name)}
                    </div>
                    <div>
                      <div className="student-name">{student.name}</div>
                      <div className="student-roll">Roll No: {student.roll_no}</div>
                    </div>
                  </div>
                  <div className="absentee-count">{parseFloat(student.attendance_percentage || 0).toFixed(0)}%</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                No students with low attendance
              </div>
            )}
          </div>
        </div>

        <div className="analytics-card">
          <h3>📈 Attendance Insights</h3>
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Excellent (≥85%)</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {excellentCount} students
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Good (75-84%)</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {goodCount} students
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Needs Attention (&lt;75%)</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#f44336' }}>
                  {needsAttentionCount} students
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      {selectedClass && Object.values(attendance).some(v => v !== null) && (
        <button 
          className="save-attendance-btn" 
          onClick={saveAttendance}
          disabled={loading}
        >
          {loading ? 'Saving...' : '💾 Save Attendance'}
        </button>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="qr-modal-overlay" onClick={closeQRModal}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="qr-modal-header">
              <h3>📱 QR Code Attendance</h3>
              <button className="qr-close-btn" onClick={closeQRModal}>✕</button>
            </div>
            <div className="qr-modal-body">
              <div className="qr-info">
                <p><strong>Class:</strong> {getSelectedClassName()}</p>
                <p><strong>Subject:</strong> {selectedSubject}</p>
                <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                <p className="qr-expiry">
                  <strong>⏰ Valid until:</strong> {qrExpiryTime ? formatDateTo12Hour(qrExpiryTime) : 'N/A'}
                </p>
                <p><strong>Session ID:</strong> {qrSessionId}</p>
              </div>
              <div className="qr-code-container">
                <QRCodeSVG 
                  value={getQRData()} 
                  size={280}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="qr-instructions">
                <h4>📋 Instructions:</h4>
                <ol>
                  <li>Students should open the Vidhyarth mobile app</li>
                  <li>Tap the "Scan QR" button on the attendance page</li>
                  <li>Scan this QR code to mark attendance automatically</li>
                  <li>QR code expires in 30 minutes for security</li>
                  <li>Each student can scan only once per session</li>
                </ol>
              </div>
              <div className="qr-actions">
                <button className="btn-secondary" onClick={closeQRModal}>
                  End Session
                </button>
                <button className="btn-primary" onClick={() => window.print()}>
                  🖨️ Print QR Code
                </button>
              </div>
            </div>
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

export default Attendance;
