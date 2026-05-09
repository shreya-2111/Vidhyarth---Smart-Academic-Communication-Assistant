import React, { useState, useEffect } from 'react';
import './StudentResources.css';

function StudentResources({ user }) {
  const [showFooter, setShowFooter] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, [user.id]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, selectedCategory]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.student-resources-page');
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

    const scrollContainer = document.querySelector('.student-resources-page');
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
      console.log('Fetching documents for student...');
      
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/documents/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Documents fetched:', data);
        // All documents from /all endpoint are already public (is_public = true)
        setDocuments(data);
      } else {
        console.error('Failed to fetch documents:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    setFilteredDocuments(filtered);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'ppt':
      case 'pptx': return '📊';
      case 'xls':
      case 'xlsx': return '📈';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      case 'zip':
      case 'rar': return '📦';
      default: return '📄';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-beryl-pi.vercel.app/api/documents/download/${documentId}`, {
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
      } else {
        console.error('Download failed:', response.status, response.statusText);
        alert('Failed to download document. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleView = async (documentId, fileName) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-beryl-pi.vercel.app/api/documents/download/${documentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up the URL after a delay to allow the browser to load it
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        console.error('View failed:', response.status, response.statusText);
        alert('Failed to view document. Please try again.');
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to view document. Please try again.');
    }
  };

  const categories = [
    { value: 'all', label: 'All Resources' },
    { value: 'lecture_notes', label: 'Lecture Notes' },
    { value: 'assignments', label: 'Assignment Materials' },
    { value: 'reference', label: 'Reference Materials' },
    { value: 'syllabus', label: 'Syllabus' },
    { value: 'other', label: 'Other' }
  ];

  if (loading) {
    return (
      <div className="student-resources-page">
        <div className="loading-spinner">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="student-resources-page">
      <div className="resources-header">
        <h2>📄 Study Resources</h2>
      </div>

      {/* Search and Filter */}
      <div className="resources-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search resources by title, subject, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Resources Grid */}
      <div className="resources-content">
        {filteredDocuments.length > 0 ? (
          <div className="documents-grid">
            {filteredDocuments.map((document) => (
              <div key={document.document_id} className="document-card">
                <div className="document-header">
                  <div className="file-icon">
                    {getFileIcon(document.file_name)}
                  </div>
                  <div className="document-info">
                    <h3 className="document-title">{document.title}</h3>
                    <p className="document-subject">{document.subject}</p>
                  </div>
                </div>

                <p className="document-description">
                  {document.description.length > 100 
                    ? document.description.substring(0, 100) + '...'
                    : document.description}
                </p>

                <div className="document-meta">
                  <div className="meta-item">
                    <span className="meta-label">Category:</span>
                    <span className="meta-value">{document.category.replace('_', ' ')}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Size:</span>
                    <span className="meta-value">{formatFileSize(document.file_size)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Uploaded:</span>
                    <span className="meta-value">
                      {new Date(document.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {document.faculty_name && (
                    <div className="meta-item">
                      <span className="meta-label">Faculty:</span>
                      <span className="meta-value">{document.faculty_name}</span>
                    </div>
                  )}
                </div>

                <div className="document-actions">
                  <button
                    onClick={() => handleDownload(document.document_id, document.file_name)}
                    className="btn-download"
                  >
                    📥 Download
                  </button>
                  <button
                    onClick={() => handleView(document.document_id, document.file_name)}
                    className="btn-view"
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-resources">
            <div className="no-resources-icon">📄</div>
            <h3>No Resources Found</h3>
            <p>
              {searchTerm || selectedCategory !== 'all' 
                ? 'No resources match your search criteria.'
                : 'No study resources have been uploaded yet.'}
            </p>
          </div>
        )}
      </div>

      <div style={{ height: '200px', background: 'transparent' }}></div>

      <footer className={`dashboard-footer ${showFooter ? 'show' : ''}`}>
        <div className="footer-bottom">
          <p>© 2026 Vidhyarth. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}

export default StudentResources;