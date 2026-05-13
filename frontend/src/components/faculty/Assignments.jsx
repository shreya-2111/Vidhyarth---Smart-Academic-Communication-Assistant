import React, { useState, useEffect } from 'react';
import './Assignments.css';
import { masterAPI } from '../../services/api';

function Assignments({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [formData, setFormData] = useState({
    course: '',
    title: '',
    description: '',
    fileUrl: '',
    deadline: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // NEW: State for dynamic dropdowns
  const [facultyClasses, setFacultyClasses] = useState([]);
  const [facultySubjects, setFacultySubjects] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');

  useEffect(() => {
    console.log('Assignments component mounted');
    console.log('User object:', user);
    console.log('User ID:', user.id);
    fetchAssignments();
    fetchFacultyClasses();
  }, [user.id]);

  // NEW: Fetch faculty classes
  const fetchFacultyClasses = async () => {
    try {
      setLoadingClasses(true);
      const classes = await masterAPI.getFacultyClasses(user.id);
      setFacultyClasses(classes);
      setLoadingClasses(false);
    } catch (error) {
      console.error('Error fetching faculty classes:', error);
      setFacultyClasses([]);
      setLoadingClasses(false);
    }
  };

  // NEW: Fetch subjects when class is selected
  const fetchFacultySubjects = async (classId) => {
    try {
      setLoadingSubjects(true);
      const subjects = await masterAPI.getFacultySubjects(user.id, classId);
      setFacultySubjects(subjects);
      setLoadingSubjects(false);
    } catch (error) {
      console.error('Error fetching faculty subjects:', error);
      setFacultySubjects([]);
      setLoadingSubjects(false);
    }
  };

  // NEW: Handle class selection
  const handleClassChange = (classId) => {
    setSelectedClassId(classId);
    setFormData(prev => ({ ...prev, course: '' }));
    setFacultySubjects([]);
    if (classId) {
      fetchFacultySubjects(classId);
    }
  };

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      // Try container scroll first, then fallback to window scroll
      const scrollContainer = document.querySelector('.assignments-page');
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
    const scrollContainer = document.querySelector('.assignments-page');
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

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      console.log('Fetching assignments for user:', user.id);
      
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/assignments/faculty/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error('Failed to fetch assignments');
      }
      
      const data = await response.json();
      console.log('Assignments fetched:', data);
      
      setAssignments(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openModal = (assignment = null) => {
    if (assignment) {
      setSelectedAssignment(assignment);
      setFormData({
        course: assignment.course,
        title: assignment.title,
        description: assignment.description || '',
        fileUrl: assignment.file_url || '',
        deadline: assignment.deadline
      });
    } else {
      setSelectedAssignment(null);
      setFormData({
        course: '',
        title: '',
        description: '',
        fileUrl: '',
        deadline: ''
      });
      setSelectedClassId('');
      setFacultySubjects([]);
    }
    setSelectedFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAssignment(null);
    setSelectedFile(null);
    setFormData({
      course: '',
      title: '',
      description: '',
      fileUrl: '',
      deadline: ''
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's a PDF
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file');
        e.target.value = '';
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      await uploadFileAutomatically(file);
    }
  };

  const uploadFileAutomatically = async (file) => {
    setUploadingFile(true);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/assignments/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'File upload failed');
      }

      const data = await response.json();
      
      // Set the file URL in form
      setFormData(prev => ({
        ...prev,
        fileUrl: data.fileUrl
      }));

      setUploadingFile(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file: ' + error.message);
      setUploadingFile(false);
      setSelectedFile(null); // Reset on failure
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const url = selectedAssignment 
        ? `https://backend-git-main-shreya-2111s-projects.vercel.app/api/assignments/${selectedAssignment.assignment_id}`
        : 'https://backend-git-main-shreya-2111s-projects.vercel.app/api/assignments';
      
      const method = selectedAssignment ? 'PUT' : 'POST';

      console.log('Submitting assignment:', formData);
      console.log('User ID:', user.id);
      console.log('Token:', token ? 'Present' : 'Missing');

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to save assignment');
      }

      alert(selectedAssignment ? 'Assignment updated successfully!' : 'Assignment created successfully!');
      closeModal();
      
      // Wait a moment before fetching to ensure database is updated
      setTimeout(() => {
        fetchAssignments();
      }, 500);
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert('Failed to save assignment: ' + error.message);
      setLoading(false);
    }
  };

  const deleteAssignment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/assignments/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to delete assignment');

        alert('Assignment deleted successfully!');
        fetchAssignments();
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Failed to delete assignment: ' + error.message);
      }
    }
  };

  const getStatusColor = (deadline) => {
    const today = new Date();
    const due = new Date(deadline);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 2) return 'urgent';
    return 'normal';
  };

  const getSubmissionStats = (assignment) => {
    const total = assignment.total_submissions || 0;
    const submitted = assignment.submitted_count || 0;
    const pending = assignment.pending_count || 0;
    const late = assignment.late_count || 0;
    
    return { total, submitted, pending, late };
  };

  // Calculate overall stats
  const totalAssignments = assignments.length;
  const activeAssignments = assignments.filter(a => new Date(a.deadline) >= new Date()).length;
  const overdueAssignments = assignments.filter(a => new Date(a.deadline) < new Date()).length;
  const totalSubmissions = assignments.reduce((sum, a) => sum + (a.submitted_count || 0), 0);
  const totalPending = assignments.reduce((sum, a) => sum + (a.pending_count || 0), 0);

  return (
    <div className="assignments-page">
      <div className="assignments-header">
        <div>
          <h2>📚 Assignments Management</h2>
          <p className="subtitle">Upload assignments, set deadlines, and track submissions</p>
        </div>
        <button className="btn-primary" onClick={() => openModal()}>
          ➕ Create Assignment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{totalAssignments}</div>
            <div className="stat-label">Total Assignments</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{activeAssignments}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-value">{overdueAssignments}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{totalSubmissions}</div>
            <div className="stat-label">Total Submissions</div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="assignments-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Assignments Yet</h3>
            <p>Create your first assignment to get started</p>
            <button className="btn-primary" onClick={() => openModal()}>
              ➕ Create Assignment
            </button>
          </div>
        ) : (
          <div className="assignments-grid">
            {assignments.map(assignment => {
              const stats = getSubmissionStats(assignment);
              const submissionRate = stats.total > 0 
                ? Math.round((stats.submitted / stats.total) * 100) 
                : 0;

              return (
                <div key={assignment.assignment_id} className="assignment-card">
                  <div className="card-header">
                    <div className="card-title-section">
                      <h3>{assignment.title}</h3>
                      <span className="badge badge-course">{assignment.course}</span>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="btn-icon" 
                        onClick={() => openModal(assignment)} 
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => deleteAssignment(assignment.assignment_id)} 
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {assignment.description && (
                    <p className="card-description">{assignment.description}</p>
                  )}

                  <div className="card-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span className="meta-text">
                        Created: {new Date(assignment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">⏰</span>
                      <span className={`badge badge-deadline ${getStatusColor(assignment.deadline)}`}>
                        Due: {new Date(assignment.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {assignment.file_url && (
                    <div className="card-file">
                      <a 
                        href={`https://backend-git-main-shreya-2111s-projects.vercel.app${assignment.file_url}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="file-link"
                      >
                        📄 View Assignment File
                      </a>
                    </div>
                  )}

                  {/* Submission Stats */}
                  <div className="submission-stats">
                    <div className="stats-header">
                      <span className="stats-title">Submission Status</span>
                      <span className="stats-percentage">{submissionRate}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${submissionRate}%` }}
                      ></div>
                    </div>
                    <div className="stats-breakdown">
                      <div className="stat-item submitted">
                        <span className="stat-dot"></span>
                        <span className="stat-text">Submitted: {stats.submitted}</span>
                      </div>
                      <div className="stat-item pending">
                        <span className="stat-dot"></span>
                        <span className="stat-text">Pending: {stats.pending}</span>
                      </div>
                      <div className="stat-item late">
                        <span className="stat-dot"></span>
                        <span className="stat-text">Late: {stats.late}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedAssignment ? '✏️ Edit Assignment' : '➕ Create Assignment'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Select Class *</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  required
                  disabled={loadingClasses}
                >
                  <option value="">
                    {loadingClasses ? 'Loading classes...' : 'Choose class...'}
                  </option>
                  {facultyClasses.map(cls => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.class_name} {cls.semester ? `(Sem ${cls.semester})` : ''}
                    </option>
                  ))}
                </select>
                {!loadingClasses && facultyClasses.length === 0 && (
                  <small style={{ color: '#f44336', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    No classes assigned. Contact admin.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Subject / Course *</label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  required
                  disabled={!selectedClassId || loadingSubjects}
                >
                  <option value="">
                    {loadingSubjects ? 'Loading subjects...' : 
                     !selectedClassId ? 'Select class first...' : 
                     'Choose subject...'}
                  </option>
                  {facultySubjects.map(sub => (
                    <option key={sub.subject_id} value={sub.subject_name}>
                      {sub.subject_name} {sub.subject_code ? `(${sub.subject_code})` : ''}
                    </option>
                  ))}
                </select>
                {selectedClassId && !loadingSubjects && facultySubjects.length === 0 && (
                  <small style={{ color: '#f44336', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    No subjects assigned for this class.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Assignment Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Chapter 4 - Quadratic Equations"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide assignment details and instructions..."
                  rows="4"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Assignment File (PDF)</label>
                <div className="file-upload-section">
                  <input
                    type="file"
                    id="pdfFile"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => document.getElementById('pdfFile').click()}
                  >
                    📁 Add PDF
                  </button>
                  {selectedFile && !uploadingFile && formData.fileUrl && (
                    <div className="file-selected" style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                      <span className="file-name" style={{ color: '#2e7d32' }}>✅ {selectedFile.name} attached</span>
                    </div>
                  )}
                  {uploadingFile && (
                    <div className="file-selected" style={{ padding: '10px', marginTop: '10px' }}>
                      <span className="file-name">⏳ Uploading... please wait</span>
                    </div>
                  )}

                </div>
                <small>Select a PDF file (max 10MB)</small>
              </div>

              <div className="form-group">
                <label>Deadline *</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (selectedAssignment ? 'Update Assignment' : 'Create Assignment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
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

export default Assignments;
