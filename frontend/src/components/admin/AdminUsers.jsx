import React, { useState, useEffect } from 'react';
import './AdminUsers.css';
import { masterAPI } from '../../services/api';

function AdminUsers() {
  const [activeTab, setActiveTab] = useState('faculty');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Msc.IT', // Fixed to MSCIT - no user input needed
    class: '',
    subject: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/users/${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('authToken');
      
      // Add faculty/student
      const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/users/${activeTab}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(`${activeTab === 'faculty' ? 'Faculty' : 'Student'} added successfully!`);
        
        // Reset form
        setShowModal(false);
        setFormData({ name: '', email: '', password: '', department: 'Msc.IT', class: '', subject: '' });
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add user');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('authToken');
        const idField = activeTab === 'faculty' ? 'faculty_id' : 'student_id';
        const response = await fetch(`https://backend-git-main-shreya-2111s-projects.vercel.app/api/admin/users/${activeTab}/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          alert('User deleted successfully!');
          fetchUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'faculty' ? 'active' : ''}`}
            onClick={() => setActiveTab('faculty')}
          >
            👨‍🏫 Faculty
          </button>
          <button
            className={`admin-tab ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            👨‍🎓 Students
          </button>
        </div>
        <button className="admin-add-btn" onClick={() => setShowModal(true)}>
          ➕ Add {activeTab === 'faculty' ? 'Faculty' : 'Student'}
        </button>
      </div>

      <div className="admin-users-table-container">
        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                {activeTab === 'student' && <th>Roll No</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user[activeTab === 'faculty' ? 'faculty_id' : 'student_id']}>
                  <td>{user[activeTab === 'faculty' ? 'faculty_id' : 'student_id']}</td>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar-small">
                        {user.name.charAt(0)}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className="admin-department-badge">{user.department}</span>
                  </td>
                  {activeTab === 'student' && <td>{user.roll_no || 'N/A'}</td>}
                  <td>
                    <div className="admin-action-buttons">
                      <button className="admin-btn-edit" title="Edit">✏️</button>
                      <button 
                        className="admin-btn-delete" 
                        onClick={() => handleDelete(user[activeTab === 'faculty' ? 'faculty_id' : 'student_id'])}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Add {activeTab === 'faculty' ? 'Faculty' : 'Student'}</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="admin-modal-body">
              <div className="admin-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {/* Department is fixed to Msc.IT - no input needed */}
              <div className="admin-form-group">
                <label>Department</label>
                <input
                  type="text"
                  value="Msc.IT"
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              {/* Faculty: Class and Subject as text fields */}
              {activeTab === 'faculty' && (
                <>
                  <div className="admin-form-group">
                    <label>Class</label>
                    <input
                      type="text"
                      name="class"
                      value={formData.class || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Msc.IT 1st Year"
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., Data Structures, Web Development"
                    />
                  </div>
                </>
              )}

              {activeTab === 'student' && (
                <div className="admin-form-group">
                  <label>Class</label>
                  <input
                    type="text"
                    name="class"
                    value={formData.class || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Msc.IT 1st Year"
                  />
                </div>
              )}
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-submit">
                  Add {activeTab === 'faculty' ? 'Faculty' : 'Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
