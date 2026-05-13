export const API_URL = (process.env.REACT_APP_API_URL || 'https://backend-git-main-shreya-2111s-projects.vercel.app') + '/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Set auth headerscd fr  
const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Auth APIs
export const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    return data;
  }
};

// Timetable APIs
export const timetableAPI = {
  getAll: async (facultyId) => {
    const response = await fetch(`${API_URL}/timetable/faculty/${facultyId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getToday: async (facultyId) => {
    const response = await fetch(`${API_URL}/timetable/today/${facultyId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getStudentTimetable: async (studentId) => {
    const response = await fetch(`${API_URL}/timetable/student/${studentId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  add: async (classData) => {
    const response = await fetch(`${API_URL}/timetable`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(classData)
    });
    return response.json();
  },

  update: async (id, classData) => {
    const response = await fetch(`${API_URL}/timetable/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(classData)
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/timetable/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  }
};

// Faculty APIs
export const facultyAPI = {
  getProfile: async (id) => {
    const response = await fetch(`${API_URL}/faculty/profile/${id}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  updateProfile: async (id, profileData) => {
    const response = await fetch(`${API_URL}/faculty/profile/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    return response.json();
  }
};

// Attendance APIs
export const attendanceAPI = {
  // NEW: Get classes assigned to logged-in faculty
  getFacultyClasses: async () => {
    try {
      const response = await fetch(`${API_URL}/attendance/faculty/classes`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('API Error - getFacultyClasses:', error);
      return [];
    }
  },

  // NEW: Get subjects taught by faculty for a specific class
  getFacultySubjects: async (className) => {
    try {
      const response = await fetch(`${API_URL}/attendance/faculty/subjects/${className}`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('API Error - getFacultySubjects:', error);
      return [];
    }
  },

  // NEW: Verify if faculty teaches a specific class and subject
  verifyFacultyAuthorization: async (className, subject) => {
    try {
      const response = await fetch(`${API_URL}/attendance/faculty/verify/${className}/${subject}`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('API Error - verifyFacultyAuthorization:', error);
      return { authorized: false };
    }
  },

  getStudents: async (className, division = null) => {
    try {
      const url = division
        ? `${API_URL}/attendance/students/${className}?division=${encodeURIComponent(division)}`
        : `${API_URL}/attendance/students/${className}`;
      const response = await fetch(url, { headers: getHeaders() });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('API Error - getStudents:', error);
      return [];
    }
  },

  getAttendanceByDate: async (date, className, division = null) => {
    try {
      const url = division
        ? `${API_URL}/attendance/date/${date}/${className}?division=${encodeURIComponent(division)}`
        : `${API_URL}/attendance/date/${date}/${className}`;
      const response = await fetch(url, { headers: getHeaders() });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('API Error - getAttendanceByDate:', error);
      return [];
    }
  },

  saveAttendance: async (attendanceData) => {
    const response = await fetch(`${API_URL}/attendance/save`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(attendanceData)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  getAnalytics: async (className) => {
    try {
      const response = await fetch(`${API_URL}/attendance/analytics/${className}`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('API Error - getAnalytics:', error);
      return [];
    }
  },

  getTodayStats: async (className) => {
    try {
      const response = await fetch(`${API_URL}/attendance/stats/today/${className}`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('API Error - getTodayStats:', error);
      return { present: 0, absent: 0, late: 0 };
    }
  },

  getAbsentees: async (className) => {
    try {
      const response = await fetch(`${API_URL}/attendance/absentees/${className}`, {
        headers: getHeaders()
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('API Error - getAbsentees:', error);
      return [];
    }
  },

  scanQRCode: async (sessionId, studentId) => {
    const response = await fetch(`${API_URL}/attendance/qr-scan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessionId, studentId })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to scan QR code');
    }
    return response.json();
  }
};

// Admin APIs
export const adminAPI = {
  getStats: async () => {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getUsers: async (type) => {
    const response = await fetch(`${API_URL}/admin/users/${type}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  addUser: async (type, userData) => {
    const response = await fetch(`${API_URL}/admin/users/${type}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  deleteUser: async (type, id) => {
    const response = await fetch(`${API_URL}/admin/users/${type}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  },

  getAssignments: async () => {
    const response = await fetch(`${API_URL}/admin/assignments`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getAttendanceStats: async () => {
    const response = await fetch(`${API_URL}/admin/attendance/stats`, {
      headers: getHeaders()
    });
    return response.json();
  }
};

// Assignments APIs
export const assignmentsAPI = {
  getAll: async (facultyId) => {
    const response = await fetch(`${API_URL}/assignments/${facultyId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  create: async (formData) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/assignments`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData // FormData for file upload
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/assignments/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  },

  getStats: async (facultyId) => {
    const response = await fetch(`${API_URL}/assignments/stats/${facultyId}`, {
      headers: getHeaders()
    });
    return response.json();
  }
};

// Messages APIs
export const messagesAPI = {
  getInbox: async (userId, userType) => {
    const response = await fetch(`${API_URL}/messages/inbox/${userId}/${userType}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getSent: async (userId, userType) => {
    const response = await fetch(`${API_URL}/messages/sent/${userId}/${userType}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  sendMessage: async (messageData) => {
    const response = await fetch(`${API_URL}/messages/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(messageData)
    });
    return response.json();
  },

  markAsRead: async (messageId) => {
    const response = await fetch(`${API_URL}/messages/read/${messageId}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return response.json();
  },

  getUnreadCount: async (userId, userType) => {
    const response = await fetch(`${API_URL}/messages/unread/${userId}/${userType}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getStudents: async () => {
    // department filter removed - MSCIT only
    const response = await fetch(`${API_URL}/messages/students`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getDepartments: async () => {
    // Returns empty array - department selection not needed for MSCIT-only system
    return [];
  },

  sendAnnouncement: async (announcementData) => {
    const response = await fetch(`${API_URL}/messages/announcement`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(announcementData)
    });
    return response.json();
  },

  getAnnouncements: async (facultyId) => {
    const response = await fetch(`${API_URL}/messages/announcements/${facultyId}`, {
      headers: getHeaders()
    });
    return response.json();
  }
};
// Reports APIs
export const reportsAPI = {
  getDashboard: async (facultyId) => {
    const response = await fetch(`${API_URL}/reports/dashboard/${facultyId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getStudentPerformance: async (facultyId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/reports/student-performance/${facultyId}?${params}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getCharts: async (facultyId) => {
    const response = await fetch(`${API_URL}/reports/charts/${facultyId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getWeakStudents: async (facultyId) => {
    const response = await fetch(`${API_URL}/reports/weak-students/${facultyId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getFilters: async () => {
    const response = await fetch(`${API_URL}/reports/filters`, {
      headers: getHeaders()
    });
    return response.json();
  },

  addGrade: async (gradeData) => {
    const response = await fetch(`${API_URL}/reports/add-grade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(gradeData)
    });
    return response.json();
  }
};
// Documents APIs
export const documentsAPI = {
  getFacultyDocuments: async (facultyId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/documents/faculty/${facultyId}?${params}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getPublicDocuments: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/documents/public?${params}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  uploadDocument: async (formData) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData // FormData for file upload
    });
    return response.json();
  },

  downloadDocument: async (documentId) => {
    const response = await fetch(`${API_URL}/documents/download/${documentId}`, {
      headers: getHeaders()
    });
    return response;
  },

  updateDocument: async (documentId, documentData) => {
    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(documentData)
    });
    return response.json();
  },

  deleteDocument: async (documentId) => {
    const response = await fetch(`${API_URL}/documents/${documentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  },

  getDocumentStats: async (facultyId) => {
    const response = await fetch(`${API_URL}/documents/stats/${facultyId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getDocumentFilters: async (facultyId) => {
    const response = await fetch(`${API_URL}/documents/filters/${facultyId}`, {
      headers: getHeaders()
    });
    return response.json();
  }
};
// Notifications APIs
export const notificationsAPI = {
  getNotifications: async (userId, userType, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/notifications/${userId}/${userType}?${params}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getUnreadCount: async (userId, userType) => {
    const response = await fetch(`${API_URL}/notifications/count/${userId}/${userType}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  markAsRead: async (notificationId) => {
    const response = await fetch(`${API_URL}/notifications/read/${notificationId}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return response.json();
  },

  markAllAsRead: async (userId, userType) => {
    const response = await fetch(`${API_URL}/notifications/read-all/${userId}/${userType}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return response.json();
  },

  deleteNotification: async (notificationId) => {
    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  },

  createNotification: async (notificationData) => {
    const response = await fetch(`${API_URL}/notifications/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(notificationData)
    });
    return response.json();
  },

  getPreferences: async (userId, userType) => {
    const response = await fetch(`${API_URL}/notifications/preferences/${userId}/${userType}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  updatePreferences: async (userId, userType, preferences) => {
    const response = await fetch(`${API_URL}/notifications/preferences/${userId}/${userType}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(preferences)
    });
    return response.json();
  },

  getStats: async (userId, userType) => {
    const response = await fetch(`${API_URL}/notifications/stats/${userId}/${userType}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  generateDeadlineReminders: async () => {
    const response = await fetch(`${API_URL}/notifications/generate-deadline-reminders`, {
      method: 'POST',
      headers: getHeaders()
    });
    return response.json();
  },

  generateSubmissionAlert: async (assignmentId, studentId) => {
    const response = await fetch(`${API_URL}/notifications/generate-submission-alerts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assignmentId, studentId })
    });
    return response.json();
  }
};

// Master Data APIs
export const masterAPI = {
  // NOTE: getDepartments/getDepartment removed - system is MSCIT only

  // Classes (MSCIT only - no department filter)
  getClasses: async () => {
    try {
      const response = await fetch(`${API_URL}/master/classes`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    } catch (error) {
      console.error('API Error - getClasses:', error);
      return [];
    }
  },

  getClass: async (id) => {
    try {
      const response = await fetch(`${API_URL}/master/classes/${id}`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch class');
      return response.json();
    } catch (error) {
      console.error('API Error - getClass:', error);
      return null;
    }
  },

  // Subjects (optionally filtered by class_id - no department filter)
  getSubjects: async (classId = null) => {
    try {
      const url = classId
        ? `${API_URL}/master/subjects?class_id=${classId}`
        : `${API_URL}/master/subjects`;
      const response = await fetch(url, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    } catch (error) {
      console.error('API Error - getSubjects:', error);
      return [];
    }
  },

  getSubject: async (id) => {
    try {
      const response = await fetch(`${API_URL}/master/subjects/${id}`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch subject');
      return response.json();
    } catch (error) {
      console.error('API Error - getSubject:', error);
      return null;
    }
  },

  // Faculty Assignments
  getFacultyClasses: async (facultyId) => {
    try {
      const response = await fetch(`${API_URL}/master/faculty/${facultyId}/classes`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch faculty classes');
      return response.json();
    } catch (error) {
      console.error('API Error - getFacultyClasses:', error);
      return [];
    }
  },

  getFacultySubjects: async (facultyId, classId) => {
    try {
      const response = await fetch(`${API_URL}/master/faculty/${facultyId}/classes/${classId}/subjects`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch faculty subjects');
      return response.json();
    } catch (error) {
      console.error('API Error - getFacultySubjects:', error);
      return [];
    }
  },

  getFacultyAssignments: async (facultyId) => {
    try {
      const response = await fetch(`${API_URL}/master/faculty/${facultyId}/assignments`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch faculty assignments');
      return response.json();
    } catch (error) {
      console.error('API Error - getFacultyAssignments:', error);
      return [];
    }
  },

  // Students by class (getStudentsByDepartment removed - MSCIT only)
  getStudentsByClass: async (classId) => {
    try {
      const response = await fetch(`${API_URL}/master/students/class/${classId}`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    } catch (error) {
      console.error('API Error - getStudentsByClass:', error);
      return [];
    }
  },

  // Semesters
  getSemesters: async () => {
    try {
      const response = await fetch(`${API_URL}/master/semesters`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch semesters');
      return response.json();
    } catch (error) {
      console.error('API Error - getSemesters:', error);
      return [];
    }
  },

  // Get all dropdown data at once (no departments - MSCIT only)
  getDropdowns: async () => {
    try {
      const response = await fetch(`${API_URL}/master/dropdowns`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch dropdown data');
      return response.json();
    } catch (error) {
      console.error('API Error - getDropdowns:', error);
      return {
        classes: [],
        subjects: [],
        semesters: []
      };
    }
  }
};


// Faculty Assignments APIs
export const facultyAssignmentsAPI = {
  // Get all faculty
  getFaculty: async () => {
    try {
      const response = await fetch(`${API_URL}/faculty-assignments/faculty`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch faculty');
      return response.json();
    } catch (error) {
      console.error('API Error - getFaculty:', error);
      return [];
    }
  },

  // Get all classes
  getClasses: async () => {
    try {
      const response = await fetch(`${API_URL}/faculty-assignments/classes`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    } catch (error) {
      console.error('API Error - getClasses:', error);
      return [];
    }
  },

  // Get subjects by class
  getSubjectsByClass: async (classId) => {
    try {
      const response = await fetch(`${API_URL}/faculty-assignments/subjects/${classId}`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch subjects');
      return response.json();
    } catch (error) {
      console.error('API Error - getSubjectsByClass:', error);
      return [];
    }
  },

  // Get all assignments
  getAssignments: async () => {
    try {
      const response = await fetch(`${API_URL}/faculty-assignments/assignments`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    } catch (error) {
      console.error('API Error - getAssignments:', error);
      return [];
    }
  },

  // Create new assignment
  createAssignment: async (assignmentData) => {
    try {
      const response = await fetch(`${API_URL}/faculty-assignments/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(assignmentData)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create assignment');
      }
      return response.json();
    } catch (error) {
      console.error('API Error - createAssignment:', error);
      throw error;
    }
  },

  // Delete assignment
  deleteAssignment: async (assignmentId) => {
    try {
      const response = await fetch(`${API_URL}/faculty-assignments/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to delete assignment');
      return response.json();
    } catch (error) {
      console.error('API Error - deleteAssignment:', error);
      throw error;
    }
  },

  // Get assignments by faculty
  getFacultyAssignments: async (facultyId) => {
    try {
      const response = await fetch(`${API_URL}/faculty-assignments/faculty/${facultyId}/assignments`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch faculty assignments');
      return response.json();
    } catch (error) {
      console.error('API Error - getFacultyAssignments:', error);
      return [];
    }
  }
};
