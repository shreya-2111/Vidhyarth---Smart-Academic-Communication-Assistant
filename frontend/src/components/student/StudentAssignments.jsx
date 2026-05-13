import React, { useState, useEffect } from 'react';
import './StudentAssignments.css';

function StudentAssignments({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [uploadingSubmission, setUploadingSubmission] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [user.id, activeTab]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.student-assignments-page');
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

    const scrollContainer = document.querySelector('.student-assignments-page');
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

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      console.log('Fetching assignments for student:', user.id);
      console.log('Active tab:', activeTab);
      
      const response = await fetch(
        `https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/assignments/${user.id}?status=${activeTab}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Assignments received:', data.length);
        console.log('Assignments data:', data);
        setAssignments(data);
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionModal(true);
    setSubmissionText('');
    setSubmissionFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSubmissionFile(file);
    }
  };

  const submitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionFile && !submissionText.trim()) {
      alert('Please provide either a file or text submission');
      return;
    }

    try {
      setUploadingSubmission(true);
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      
      formData.append('assignmentId', selectedAssignment.assignment_id);
      formData.append('studentId', user.id);
      formData.append('submissionText', submissionText);
      
      if (submissionFile) {
        formData.append('submissionFile', submissionFile);
      }

      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/student/submit-assignment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Assignment submitted successfully!');
        setShowSubmissionModal(false);
        fetchAssignments(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit assignment');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Failed to submit assignment');
    } finally {
      setUploadingSubmission(false);
    }
  };

  const getStatusBadge = (status, deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const isOverdue = now > deadlineDate;

    switch (status) {
      case 'submitted':
        return { label: 'Submitted', class: 'submitted', icon: '✅' };
      case 'pending':
        return isOverdue 
          ? { label: 'Overdue', class: 'overdue', icon: '⚠️' }
          : { label: 'Pending', class: 'pending', icon: '⏳' };
      case 'overdue':
        return { label: 'Overdue', class: 'overdue', icon: '⚠️' };
      case 'late':
        return { label: 'Late Submission', class: 'late', icon: '⏰' };
      default:
        return { label: 'Unknown', class: 'unknown', icon: '❓' };
    }
  };

  const getDaysUntilDeadline = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days left`;
  };

  const tabs = [
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'submitted', label: 'Submitted', icon: '✅' },
    { id: 'all', label: 'All', icon: '📝' }
  ];

  if (loading) {
    return (
      <div className="student-assignments-page">
        <div className="loading-spinner">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="student-assignments-page">
      <div className="assignments-header">
        <h2>📝 My Assignments</h2>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Assignments List */}
      <div className="assignments-content">
        {assignments.length > 0 ? (
          <div className="assignments-grid">
            {assignments.map((assignment) => {
              const status = getStatusBadge(assignment.status, assignment.deadline);
              const daysLeft = getDaysUntilDeadline(assignment.deadline);
              
              return (
                <div key={assignment.assignment_id} className="assignment-card">
                  <div className="assignment-header">
                    <div className="assignment-course">{assignment.course}</div>
                    <div className={`status-badge ${status.class}`}>
                      <span className="status-icon">{status.icon}</span>
                      <span className="status-label">{status.label}</span>
                    </div>
                  </div>

                  <h3 className="assignment-title">{assignment.title}</h3>
                  
                  <p className="assignment-description">
                    {assignment.description.length > 150 
                      ? assignment.description.substring(0, 150) + '...'
                      : assignment.description}
                  </p>

                  <div className="assignment-meta">
                    <div className="meta-item">
                      <span className="meta-label">Faculty:</span>
                      <span className="meta-value">Prof. {assignment.faculty_name}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Assigned:</span>
                      <span className="meta-value">
                        {new Date(assignment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Deadline:</span>
                      <span className="meta-value deadline">
                        {new Date(assignment.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="deadline-info">
                    <div className={`deadline-badge ${status.class}`}>
                      {daysLeft}
                    </div>
                  </div>

                  <div className="assignment-actions">
                    {assignment.file_url && (
                      <a 
                        href={`https://backend-git-main-shreya-2111s-projects.vercel.app${assignment.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download"
                      >
                        📄 Download
                      </a>
                    )}
                    
                    {(assignment.status === 'pending' || assignment.status === 'overdue') && (
                      <button 
                        className="btn-submit"
                        onClick={() => handleSubmitAssignment(assignment)}
                      >
                        📤 Submit
                      </button>
                    )}
                    
                    {assignment.status === 'submitted' && assignment.submission_url && (
                      <a 
                        href={`https://backend-git-main-shreya-2111s-projects.vercel.app${assignment.submission_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-view-submission"
                      >
                        👁️ View Submission
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-assignments">
            <div className="no-assignments-icon">📝</div>
            <h3>No Assignments Found</h3>
            <p>
              {activeTab === 'pending' 
                ? 'No pending assignments at the moment.'
                : activeTab === 'submitted'
                ? 'No submitted assignments yet.'
                : 'No assignments available.'}
            </p>
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Submit Assignment</h3>
              <button 
                className="modal-close"
                onClick={() => setShowSubmissionModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="assignment-info">
                <h4>{selectedAssignment?.title}</h4>
                <p>Course: {selectedAssignment?.course}</p>
                <p>Deadline: {new Date(selectedAssignment?.deadline).toLocaleDateString()}</p>
              </div>

              <form onSubmit={submitAssignment}>
                <div className="form-group">
                  <label>Submission Text (Optional):</label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter your submission text or notes..."
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Upload File (Optional):</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.zip"
                  />
                  {submissionFile && (
                    <div className="file-info">
                      Selected: {submissionFile.name} ({(submissionFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowSubmissionModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit-modal"
                    disabled={uploadingSubmission}
                  >
                    {uploadingSubmission ? 'Submitting...' : 'Submit Assignment'}
                  </button>
                </div>
              </form>
            </div>
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

export default StudentAssignments;