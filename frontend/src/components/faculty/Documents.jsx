import React, { useState, useEffect } from 'react';
import './Documents.css';
import { masterAPI } from '../../services/api';
import { formatDateTimeTo12Hour } from '../../utils/timeUtils';

function Documents({ user }) {
  const [activeTab, setActiveTab] = useState('my-documents');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showFooter, setShowFooter] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalDownloads: 0,
    categoryStats: [],
    subjectStats: [],
    recentActivity: []
  });

  // Filters
  const [filters, setFilters] = useState({
    subjects: [],
    semesters: [],
    classes: [],
    categories: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    subject: '',
    category: '',
    semester: ''
  });

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    subject: '',
    category: 'lecture_notes',
    semester: '',
    isPublic: true,
    file: null
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    subject: '',
    category: 'lecture_notes',
    semester: '',
    isPublic: true
  });

  useEffect(() => {
    if (activeTab === 'my-documents') {
      fetchDocuments();
      fetchStats();
    } else if (activeTab === 'public-documents') {
      fetchPublicDocuments();
    }
    fetchFilters();
  }, [activeTab, selectedFilters]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.documents-page');
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

    const scrollContainer = document.querySelector('.documents-page');
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

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams(selectedFilters);
      const response = await fetch(
        `https://backend-git-main-shreya-2111s-projects.vercel.app/api/documents/faculty/${user.id}?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setLoading(false);
    }
  };

  const fetchPublicDocuments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams(selectedFilters);
      const response = await fetch(
        `https://backend-git-main-shreya-2111s-projects.vercel.app/api/documents/public?${params}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching public documents:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/documents/stats/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFilters = async () => {
    try {
      // Fetch subjects from faculty assignments
      const assignments = await masterAPI.getFacultyAssignments(user.id);
      const uniqueSubjects = [...new Set(assignments.map(a => a.subject_name))];
      
      // Fetch semesters from master data
      const semesters = await masterAPI.getSemesters();
      
      // Fetch classes for additional filtering
      const classes = await masterAPI.getClasses();
      
      // Categories are static (document types)
      const categories = ['lecture_notes', 'slides', 'assignments', 'reference', 'syllabus', 'other'];
      
      setFilters({
        subjects: uniqueSubjects,
        semesters: semesters,
        classes: classes,
        categories: categories
      });
    } catch (error) {
      console.error('Error fetching filters:', error);
      // Set fallback empty arrays to prevent errors
      setFilters({
        subjects: [],
        semesters: [],
        classes: [],
        categories: ['lecture_notes', 'slides', 'assignments', 'reference', 'syllabus', 'other']
      });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      alert('Please select a file to upload');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('document', uploadForm.file);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('subject', uploadForm.subject);
      formData.append('category', uploadForm.category);
      formData.append('semester', uploadForm.semester);
      formData.append('isPublic', uploadForm.isPublic);

      const response = await fetch('https://backend-git-main-shreya-2111s-projects.vercel.app/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Document uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({
          title: '',
          description: '',
          subject: '',
          category: 'lecture_notes',
          semester: '',
          isPublic: true,
          file: null
        });
        fetchDocuments();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/documents/${selectedDocument.document_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        alert('Document updated successfully!');
        setShowEditModal(false);
        setSelectedDocument(null);
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Failed to update document');
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Document deleted successfully!');
        fetchDocuments();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/documents/download/${documentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const openEditModal = (document) => {
    setSelectedDocument(document);
    setEditForm({
      title: document.title,
      description: document.description || '',
      subject: document.subject || '',
      category: document.category,
      semester: document.semester || '',
      isPublic: document.is_public
    });
    setShowEditModal(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('text')) return '📃';
    return '📁';
  };

  const getCategoryColor = (category) => {
    const colors = {
      lecture_notes: '#4CAF50',
      slides: '#2196F3',
      assignments: '#FF9800',
      reference: '#9C27B0',
      syllabus: '#F44336',
      other: '#607D8B'
    };
    return colors[category] || '#607D8B';
  };

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h2>📚 Document Repository</h2>
        <div className="documents-actions">
          <button className="btn-upload" onClick={() => setShowUploadModal(true)}>
            📤 Upload Document
          </button>
        </div>
      </div>

      <div className="documents-tabs">
        <button
          className={`documents-tab ${activeTab === 'my-documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-documents')}
        >
          📁 My Documents
        </button>
        <button
          className={`documents-tab ${activeTab === 'public-documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('public-documents')}
        >
          🌐 Public Documents
        </button>
        <button
          className={`documents-tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          📊 Statistics
        </button>
      </div>

      <div className="documents-content">
        {activeTab === 'statistics' && (
          <div className="statistics-section">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <h3>{stats.totalDocuments}</h3>
                  <p>Total Documents</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⬇️</div>
                <div className="stat-content">
                  <h3>{stats.totalDownloads}</h3>
                  <p>Total Downloads</p>
                </div>
              </div>
            </div>

            <div className="stats-charts">
              <div className="chart-card">
                <h3>📊 Documents by Category</h3>
                <div className="category-chart">
                  {stats.categoryStats.map((cat, index) => (
                    <div key={index} className="category-bar">
                      <span className="category-name">{cat.category.replace('_', ' ')}</span>
                      <div 
                        className="category-fill"
                        style={{ 
                          width: `${(cat.count / Math.max(...stats.categoryStats.map(c => c.count))) * 100}%`,
                          backgroundColor: getCategoryColor(cat.category)
                        }}
                      ></div>
                      <span className="category-count">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>📚 Documents by Subject</h3>
                <div className="subject-chart">
                  {stats.subjectStats.map((subj, index) => (
                    <div key={index} className="subject-item">
                      <span>{subj.subject}</span>
                      <span className="subject-count">{subj.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>🕒 Recent Activity</h3>
              <div className="activity-list">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <span className="activity-icon">
                      {activity.access_type === 'download' ? '⬇️' : '👁️'}
                    </span>
                    <div className="activity-content">
                      <p><strong>{activity.user_name}</strong> {activity.access_type}ed <em>{activity.title}</em></p>
                      <span className="activity-time">
                        {formatDateTimeTo12Hour(activity.accessed_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'my-documents' || activeTab === 'public-documents') && (
          <>
            <div className="filters-row">
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
                value={selectedFilters.category}
                onChange={(e) => setSelectedFilters({...selectedFilters, category: e.target.value})}
              >
                <option value="">All Categories</option>
                {filters.categories.map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </option>
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
              <div className="loading">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="no-documents">
                <p>📭 No documents found</p>
                {activeTab === 'my-documents' && (
                  <button className="btn-upload-empty" onClick={() => setShowUploadModal(true)}>
                    Upload your first document
                  </button>
                )}
              </div>
            ) : (
              <div className="documents-grid">
                {documents.map((doc) => (
                  <div key={doc.document_id} className="document-card">
                    <div className="document-header">
                      <div className="document-icon">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div className="document-info">
                        <h4>{doc.title}</h4>
                        <p className="document-description">{doc.description}</p>
                      </div>
                      {!doc.is_public && (
                        <span className="private-badge">🔒 Private</span>
                      )}
                    </div>

                    <div className="document-meta">
                      <div className="meta-row">
                        <span>📁 {doc.file_name}</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                      </div>
                      {doc.subject && (
                        <div className="meta-row">
                          <span>📚 Subject:</span>
                          <span>{doc.subject}</span>
                        </div>
                      )}
                      <div className="meta-row">
                        <span>🏷️ Category:</span>
                        <span 
                          className="category-badge"
                          style={{ backgroundColor: getCategoryColor(doc.category) }}
                        >
                          {doc.category.replace('_', ' ')}
                        </span>
                      </div>
                      {doc.semester && (
                        <div className="meta-row">
                          <span>📅 Semester:</span>
                          <span>{doc.semester}</span>
                        </div>
                      )}
                      <div className="meta-row">
                        <span>⬇️ Downloads:</span>
                        <span>{doc.download_count}</span>
                      </div>
                      <div className="meta-row">
                        <span>👨‍🏫 By:</span>
                        <span>{doc.faculty_name}</span>
                      </div>
                      <div className="meta-row">
                        <span>📅 Uploaded:</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="document-actions">
                      <button 
                        className="btn-download-doc"
                        onClick={() => handleDownload(doc.document_id, doc.file_name)}
                      >
                        ⬇️ Download
                      </button>
                      {activeTab === 'my-documents' && (
                        <>
                          <button 
                            className="btn-edit"
                            onClick={() => openEditModal(doc)}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDelete(doc.document_id)}
                          >
                            🗑️ Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📤 Upload Document</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpload} className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                  placeholder="Document title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  placeholder="Brief description of the document"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <select
                    value={uploadForm.subject}
                    onChange={(e) => setUploadForm({...uploadForm, subject: e.target.value})}
                  >
                    <option value="">Select Subject</option>
                    {filters.subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <select
                    value={uploadForm.semester}
                    onChange={(e) => setUploadForm({...uploadForm, semester: e.target.value})}
                  >
                    <option value="">Select Semester</option>
                    {filters.semesters.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                    required
                  >
                    <option value="lecture_notes">Lecture Notes</option>
                    <option value="slides">Slides</option>
                    <option value="assignments">Assignments</option>
                    <option value="reference">Reference Material</option>
                    <option value="syllabus">Syllabus</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Visibility</label>
                  <select
                    value={uploadForm.isPublic}
                    onChange={(e) => setUploadForm({...uploadForm, isPublic: e.target.value === 'true'})}
                  >
                    <option value="true">🌐 Public (Students can access)</option>
                    <option value="false">🔒 Private (Only you can access)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>File *</label>
                <input
                  type="file"
                  onChange={(e) => setUploadForm({...uploadForm, file: e.target.files[0]})}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                  required
                />
                <small>Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, Images (Max: 50MB)</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Document</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEdit} className="modal-body">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({...editForm, subject: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <input
                    type="text"
                    value={editForm.semester}
                    onChange={(e) => setEditForm({...editForm, semester: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    required
                  >
                    <option value="lecture_notes">Lecture Notes</option>
                    <option value="slides">Slides</option>
                    <option value="assignments">Assignments</option>
                    <option value="reference">Reference Material</option>
                    <option value="syllabus">Syllabus</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Visibility</label>
                  <select
                    value={editForm.isPublic}
                    onChange={(e) => setEditForm({...editForm, isPublic: e.target.value === 'true'})}
                  >
                    <option value="true">🌐 Public</option>
                    <option value="false">🔒 Private</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Document
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

export default Documents;