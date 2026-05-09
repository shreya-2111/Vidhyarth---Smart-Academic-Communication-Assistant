import React, { useState, useEffect } from 'react';
import './AdminMasterData.css';

function AdminMasterData() {
  const [activeTable, setActiveTable] = useState('faculty');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [classesList, setClassesList] = useState([]);

  const tables = [
    { id: 'faculty', label: 'Faculty', icon: '👨‍🏫' },
    { id: 'student', label: 'Students', icon: '👨‍🎓' },
    { id: 'classes', label: 'Classes', icon: '🏫' },
    { id: 'subjects', label: 'Subjects', icon: '📚' },
    { id: 'faculty_subjects', label: 'Faculty Subjects', icon: '📖' },
    { id: 'timetable', label: 'Timetable', icon: '📅' },
    { id: 'assignments', label: 'Assignments', icon: '📝' },
    { id: 'assignment_submissions', label: 'Submissions', icon: '📤' },
    { id: 'attendance', label: 'Attendance', icon: '✓' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'grades', label: 'Grades', icon: '📊' }
  ];

  useEffect(() => {
    fetchData();
  }, [activeTable]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    fetch('https://backend-beryl-pi.vercel.app/api/master/classes', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(d => setClassesList(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-beryl-pi.vercel.app/api/admin/master/${activeTable}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditMode(false);
    setCurrentRecord(null);
    setFormData(getEmptyFormData());
    setShowModal(true);
  };

  const handleEdit = (record) => {
    setEditMode(true);
    setCurrentRecord(record);
    setFormData(record);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-beryl-pi.vercel.app/api/admin/master/${activeTable}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Record deleted successfully!');
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('authToken');
      const url = editMode
        ? `https://backend-beryl-pi.vercel.app/api/admin/master/${activeTable}/${getPrimaryKey()}`
        : `https://backend-beryl-pi.vercel.app/api/admin/master/${activeTable}`;

      // Prepare data - remove empty password in edit mode
      const dataToSend = { ...formData };
      if (editMode) {
        // Remove empty password for user tables
        if ((activeTable === 'faculty' || activeTable === 'student')) {
          if (!dataToSend.password || dataToSend.password.trim() === '') {
            delete dataToSend.password;
          }
        }
        // Remove timestamp fields - they're auto-managed by database
        delete dataToSend.created_at;
        delete dataToSend.updated_at;
        delete dataToSend.assigned_at;
        delete dataToSend.submitted_at;
      }

      const response = await fetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        alert(`Record ${editMode ? 'updated' : 'created'} successfully!`);
        setShowModal(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${editMode ? 'update' : 'create'} record`);
      }
    } catch (error) {
      console.error('Error saving record:', error);
      alert('Failed to save record');
    }
  };

  const getPrimaryKey = () => {
    const keys = {
      faculty: formData.faculty_id,
      student: formData.student_id,
      classes: formData.class_id,
      subjects: formData.subject_id,
      faculty_subjects: formData.id,
      timetable: formData.timetable_id,
      assignments: formData.assignment_id,
      assignment_submissions: formData.submission_id,
      attendance: formData.attendance_id,
      messages: formData.message_id,
      notifications: formData.notification_id,
      announcements: formData.announcement_id,
      documents: formData.document_id,
      grades: formData.grade_id
    };
    return keys[activeTable];
  };

  const getEmptyFormData = () => {
    const templates = {
      faculty: { name: '', email: '', password: '', department: 'Msc.IT', class: '', subject: '', phone: '' },
      student: { name: '', email: '', password: '', department: 'Msc.IT', roll_no: '', phone: '', division: '' },
      classes: { class_name: '', semester: '', department: 'Msc.IT' },
      subjects: { subject_name: '', subject_code: '', class_id: '', credits: '' },
      faculty_subjects: { faculty_id: '', class_id: '', subject_id: '' },
      timetable: { faculty_id: '', subject: '', day: 'Monday', start_time: '', end_time: '', room_no: '' },
      assignments: { faculty_id: '', title: '', description: '', due_date: '', subject: '' },
      assignment_submissions: { assignment_id: '', student_id: '', file_name: '', file_path: '', file_size: '', file_type: '', comments: '' },
      attendance: { student_id: '', faculty_id: '', date: '', status: 'Present', subject: '' },
      messages: { sender_id: '', receiver_id: '', sender_type: 'faculty', receiver_type: 'student', message: '' },
      notifications: { user_id: '', user_type: 'student', title: '', message: '', type: 'info' },
      announcements: { title: '', content: '', created_by: '', target_audience: 'all', priority: 'normal' },
      documents: { faculty_id: '', title: '', description: '', file_name: '', file_path: '', file_size: '', file_type: '', subject: '', category: 'other' },
      grades: { student_id: '', subject_id: '', assignment_id: '', marks_obtained: '', total_marks: '', grade: '', remarks: '' }
    };
    return templates[activeTable] || {};
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderFormFields = () => {
    const fields = {
      faculty: [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: !editMode },
        { name: 'department', label: 'Department', type: 'text', required: true, readOnly: true },
        { name: 'class', label: 'Class', type: 'text', required: false },
        { name: 'subject', label: 'Subject', type: 'text', required: false },
        { name: 'phone', label: 'Phone', type: 'tel', required: false }
      ],
      student: [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: !editMode },
        { name: 'department', label: 'Department', type: 'text', required: true, readOnly: true },
        { name: 'roll_no', label: 'Roll Number', type: 'text', required: false },
        { name: 'phone', label: 'Phone', type: 'tel', required: false },
        { name: 'division', label: 'Division', type: 'select', options: ['A', 'B', 'C', 'D'], required: false }
      ],
      classes: [
        { name: 'class_name', label: 'Class Name', type: 'text', required: true },
        { name: 'semester', label: 'Semester', type: 'text', required: false },
        { name: 'department', label: 'Department', type: 'text', required: false, readOnly: true }
      ],
      subjects: [
        { name: 'subject_name', label: 'Subject Name', type: 'text', required: true },
        { name: 'subject_code', label: 'Subject Code', type: 'text', required: false },
        { name: 'class_id', label: 'Class', type: 'select', required: true,
          options: classesList.map(c => ({ value: c.class_id, label: `${c.class_name} - ${c.semester}` })) },
        { name: 'credits', label: 'Credits', type: 'number', required: false }
      ],
      faculty_subjects: [
        { name: 'faculty_id', label: 'Faculty ID', type: 'number', required: true },
        { name: 'class_id', label: 'Class ID', type: 'number', required: true },
        { name: 'subject_id', label: 'Subject ID', type: 'number', required: true }
      ],
      timetable: [
        { name: 'faculty_id', label: 'Faculty ID', type: 'number', required: true },
        { name: 'subject', label: 'Subject', type: 'text', required: true },
        { name: 'day', label: 'Day', type: 'select', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
        { name: 'start_time', label: 'Start Time', type: 'time', required: true },
        { name: 'end_time', label: 'End Time', type: 'time', required: true },
        { name: 'room_no', label: 'Room Number', type: 'text', required: true }
      ],
      assignments: [
        { name: 'faculty_id', label: 'Faculty ID', type: 'number', required: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'due_date', label: 'Due Date', type: 'date', required: true },
        { name: 'subject', label: 'Subject', type: 'text', required: true }
      ],
      assignment_submissions: [
        { name: 'assignment_id', label: 'Assignment ID', type: 'number', required: true },
        { name: 'student_id', label: 'Student ID', type: 'number', required: true },
        { name: 'file_name', label: 'File Name', type: 'text', required: true },
        { name: 'file_path', label: 'File Path', type: 'text', required: true },
        { name: 'file_size', label: 'File Size (bytes)', type: 'number', required: false },
        { name: 'file_type', label: 'File Type', type: 'text', required: false },
        { name: 'comments', label: 'Comments', type: 'textarea', required: false }
      ],
      attendance: [
        { name: 'student_id', label: 'Student ID', type: 'number', required: true },
        { name: 'faculty_id', label: 'Faculty ID', type: 'number', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: ['Present', 'Absent'], required: true },
        { name: 'subject', label: 'Subject', type: 'text', required: true }
      ],
      messages: [
        { name: 'sender_id', label: 'Sender ID', type: 'number', required: true },
        { name: 'receiver_id', label: 'Receiver ID', type: 'number', required: true },
        { name: 'sender_type', label: 'Sender Type', type: 'select', options: ['faculty', 'student'], required: true },
        { name: 'receiver_type', label: 'Receiver Type', type: 'select', options: ['faculty', 'student'], required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true }
      ],
      notifications: [
        { name: 'user_id', label: 'User ID', type: 'number', required: true },
        { name: 'user_type', label: 'User Type', type: 'select', options: ['faculty', 'student'], required: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
        { name: 'type', label: 'Type', type: 'text', required: false }
      ],
      announcements: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'content', label: 'Content', type: 'textarea', required: true },
        { name: 'created_by', label: 'Created By (Admin ID)', type: 'number', required: true },
        { name: 'target_audience', label: 'Target Audience', type: 'select', options: ['all', 'faculty', 'students'], required: true },
        { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'normal', 'high', 'urgent'], required: false }
      ],
      documents: [
        { name: 'faculty_id', label: 'Faculty ID', type: 'number', required: true },
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: false },
        { name: 'file_name', label: 'File Name', type: 'text', required: true },
        { name: 'file_path', label: 'File Path', type: 'text', required: true },
        { name: 'file_size', label: 'File Size (bytes)', type: 'number', required: true },
        { name: 'file_type', label: 'File Type', type: 'text', required: true },
        { name: 'subject', label: 'Subject', type: 'text', required: false },
        { name: 'category', label: 'Category', type: 'select', options: ['lecture_notes', 'slides', 'assignments', 'reference', 'syllabus', 'other'], required: false }
      ],
      grades: [
        { name: 'student_id', label: 'Student ID', type: 'number', required: true },
        { name: 'subject_id', label: 'Subject ID', type: 'number', required: true },
        { name: 'assignment_id', label: 'Assignment ID', type: 'number', required: false },
        { name: 'marks_obtained', label: 'Marks Obtained', type: 'number', required: true },
        { name: 'total_marks', label: 'Total Marks', type: 'number', required: true },
        { name: 'grade', label: 'Grade', type: 'text', required: false },
        { name: 'remarks', label: 'Remarks', type: 'textarea', required: false }
      ]
    };

    return (fields[activeTable] || []).map(field => (
      <div key={field.name} className="master-form-group">
        <label>{field.label} {field.required && '*'}</label>
        {field.type === 'textarea' ? (
          <textarea
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleInputChange}
            required={field.required}
            rows="3"
          />
        ) : field.type === 'select' ? (
          <select
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleInputChange}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options.map(opt => (
              typeof opt === 'object'
                ? <option key={opt.value} value={opt.value}>{opt.label}</option>
                : <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            name={field.name}
            value={formData[field.name] || ''}
            onChange={handleInputChange}
            required={field.required}
            readOnly={field.readOnly || false}
            style={field.readOnly ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
          />
        )}
      </div>
    ));
  };

  const renderTableHeaders = () => {
    const headers = {
      faculty: ['ID', 'Name', 'Email', 'Department', 'Class', 'Subject', 'Phone', 'Actions'],
      student: ['ID', 'Name', 'Email', 'Department', 'Roll No', 'Division', 'Phone', 'Actions'],
      classes: ['ID', 'Class Name', 'Semester', 'Department', 'Actions'],
      subjects: ['ID', 'Subject Name', 'Code', 'Class', 'Credits', 'Actions'],
      faculty_subjects: ['ID', 'Faculty', 'Class', 'Subject', 'Actions'],
      timetable: ['ID', 'Faculty', 'Subject', 'Day', 'Time', 'Room', 'Actions'],
      assignments: ['ID', 'Faculty', 'Title', 'Subject', 'Due Date', 'Actions'],
      assignment_submissions: ['ID', 'Assignment', 'Student', 'File', 'Submitted', 'Actions'],
      attendance: ['ID', 'Student', 'Faculty', 'Date', 'Status', 'Subject', 'Actions'],
      messages: ['ID', 'From', 'To', 'Message', 'Date', 'Actions'],
      notifications: ['ID', 'User', 'Title', 'Type', 'Read', 'Date', 'Actions'],
      announcements: ['ID', 'Title', 'Audience', 'Priority', 'Created By', 'Date', 'Actions'],
      documents: ['ID', 'Title', 'Faculty', 'Subject', 'Category', 'Size', 'Date', 'Actions'],
      grades: ['ID', 'Student', 'Subject', 'Assignment', 'Marks', 'Grade', 'Actions']
    };
    return headers[activeTable] || [];
  };

  const renderTableRow = (record) => {
    const renderCell = () => {
      switch (activeTable) {
        case 'faculty':
          return (
            <>
              <td>{record.faculty_id}</td>
              <td>
                <div className="master-user-cell">
                  <div className="master-avatar">{record.name ? record.name.charAt(0) : '?'}</div>
                  {record.name || 'N/A'}
                </div>
              </td>
              <td>{record.email || 'N/A'}</td>
              <td><span className="master-badge">{record.department || 'N/A'}</span></td>
              <td>{record.class || 'N/A'}</td>
              <td>{record.subject || 'N/A'}</td>
              <td>{record.phone || 'N/A'}</td>
            </>
          );
        case 'student':
          return (
            <>
              <td>{record.student_id}</td>
              <td>
                <div className="master-user-cell">
                  <div className="master-avatar">{record.name ? record.name.charAt(0) : '?'}</div>
                  {record.name || 'N/A'}
                </div>
              </td>
              <td>{record.email || 'N/A'}</td>
              <td><span className="master-badge">{record.department || 'N/A'}</span></td>
              <td>{record.roll_no || 'N/A'}</td>
              <td>{record.division || 'N/A'}</td>
              <td>{record.phone || 'N/A'}</td>
            </>
          );
        case 'classes':
          return (
            <>
              <td>{record.class_id}</td>
              <td><span className="master-badge blue">{record.class_name || 'N/A'}</span></td>
              <td>{record.semester || 'N/A'}</td>
              <td>{record.department || 'N/A'}</td>
            </>
          );
        case 'subjects':
          return (
            <>
              <td>{record.subject_id}</td>
              <td><span className="master-badge orange">{record.subject_name || 'N/A'}</span></td>
              <td>{record.subject_code || 'N/A'}</td>
              <td>{record.class_name || `ID: ${record.class_id}`}</td>
              <td>{record.credits || 'N/A'}</td>
            </>
          );
        case 'faculty_subjects':
          return (
            <>
              <td>{record.id}</td>
              <td>{record.faculty_name || `ID: ${record.faculty_id}`}</td>
              <td>{record.class_name || `ID: ${record.class_id}`}</td>
              <td><span className="master-badge orange">{record.subject_name || `ID: ${record.subject_id}`}</span></td>
            </>
          );
        case 'timetable':
          return (
            <>
              <td>{record.timetable_id}</td>
              <td>{record.faculty_name || `ID: ${record.faculty_id}`}</td>
              <td><span className="master-badge blue">{record.subject || 'N/A'}</span></td>
              <td>{record.day || 'N/A'}</td>
              <td>{record.start_time || 'N/A'} - {record.end_time || 'N/A'}</td>
              <td>{record.room_no || 'N/A'}</td>
            </>
          );
        case 'assignments':
          return (
            <>
              <td>{record.assignment_id}</td>
              <td>{record.faculty_name || `ID: ${record.faculty_id}`}</td>
              <td>{record.title || 'N/A'}</td>
              <td><span className="master-badge orange">{record.subject || 'N/A'}</span></td>
              <td>{record.due_date ? new Date(record.due_date).toLocaleDateString() : 'N/A'}</td>
            </>
          );
        case 'assignment_submissions':
          return (
            <>
              <td>{record.submission_id}</td>
              <td>{record.assignment_title || `ID: ${record.assignment_id}`}</td>
              <td>{record.student_name || `ID: ${record.student_id}`}</td>
              <td>{record.file_name || 'N/A'}</td>
              <td>{record.submitted_at ? new Date(record.submitted_at).toLocaleDateString() : 'N/A'}</td>
            </>
          );
        case 'attendance':
          return (
            <>
              <td>{record.attendance_id}</td>
              <td>{record.student_name || `ID: ${record.student_id}`}</td>
              <td>{record.faculty_name || `ID: ${record.faculty_id}`}</td>
              <td>{new Date(record.date).toLocaleDateString()}</td>
              <td>
                <span className={`master-status ${record.status ? record.status.toLowerCase() : 'absent'}`}>
                  {record.status || 'N/A'}
                </span>
              </td>
              <td>{record.subject || 'N/A'}</td>
            </>
          );
        case 'messages':
          return (
            <>
              <td>{record.message_id}</td>
              <td>{record.sender_type} #{record.sender_id}</td>
              <td>{record.receiver_type} #{record.receiver_id}</td>
              <td className="master-message-cell">
                {record.message ? record.message.substring(0, 50) + '...' : 'No message'}
              </td>
              <td>{new Date(record.created_at).toLocaleDateString()}</td>
            </>
          );
        case 'notifications':
          return (
            <>
              <td>{record.notification_id}</td>
              <td>{record.user_type} #{record.user_id}</td>
              <td>{record.title || 'N/A'}</td>
              <td><span className="master-badge">{record.type || 'info'}</span></td>
              <td>
                <span className={`master-read-status ${record.is_read ? 'read' : 'unread'}`}>
                  {record.is_read ? '✓ Read' : '○ Unread'}
                </span>
              </td>
              <td>{record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}</td>
            </>
          );
        case 'announcements':
          return (
            <>
              <td>{record.announcement_id}</td>
              <td>{record.title || 'N/A'}</td>
              <td><span className="master-badge">{record.target_audience || 'all'}</span></td>
              <td><span className="master-badge orange">{record.priority || 'normal'}</span></td>
              <td>{record.admin_name || `ID: ${record.created_by}`}</td>
              <td>{record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}</td>
            </>
          );
        case 'documents':
          return (
            <>
              <td>{record.document_id}</td>
              <td>{record.title || 'N/A'}</td>
              <td>{record.faculty_name || `ID: ${record.faculty_id}`}</td>
              <td><span className="master-badge">{record.subject || 'N/A'}</span></td>
              <td><span className="master-badge orange">{record.category || 'other'}</span></td>
              <td>{record.file_size ? (record.file_size / 1024).toFixed(2) + ' KB' : 'N/A'}</td>
              <td>{record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}</td>
            </>
          );
        case 'grades':
          return (
            <>
              <td>{record.grade_id}</td>
              <td>{record.student_name || `ID: ${record.student_id}`}</td>
              <td>{record.subject_name || `ID: ${record.subject_id}`}</td>
              <td>{record.assignment_title || (record.assignment_id ? `ID: ${record.assignment_id}` : 'N/A')}</td>
              <td>{record.marks_obtained || 0} / {record.total_marks || 0}</td>
              <td><span className="master-badge blue">{record.grade || 'N/A'}</span></td>
            </>
          );
        default:
          return <td colSpan="6">No data</td>;
      }
    };

    return (
      <tr key={getPrimaryKeyValue(record)}>
        {renderCell()}
        <td>
          <div className="master-action-buttons">
            <button
              className="master-btn-edit"
              onClick={() => handleEdit(record)}
              title="Edit"
            >
              ✏️
            </button>
            <button
              className="master-btn-delete"
              onClick={() => handleDelete(getPrimaryKeyValue(record))}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const getPrimaryKeyValue = (record) => {
    const keys = {
      faculty: record.faculty_id,
      student: record.student_id,
      classes: record.class_id,
      subjects: record.subject_id,
      faculty_subjects: record.id,
      timetable: record.timetable_id,
      assignments: record.assignment_id,
      assignment_submissions: record.submission_id,
      attendance: record.attendance_id,
      messages: record.message_id,
      notifications: record.notification_id,
      announcements: record.announcement_id,
      documents: record.document_id,
      grades: record.grade_id
    };
    return keys[activeTable];
  };

  const filteredData = data.filter(record => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return JSON.stringify(record).toLowerCase().includes(searchLower);
  });

  return (
    <div className="master-data-container">
      <div className="master-header">
        <h2>📊 Master Data Management</h2>
        <p>Manage all system data with full CRUD operations</p>
      </div>

      <div className="master-tabs">
        {tables.map(table => (
          <button
            key={table.id}
            className={`master-tab ${activeTable === table.id ? 'active' : ''}`}
            onClick={() => setActiveTable(table.id)}
          >
            <span className="master-tab-icon">{table.icon}</span>
            <span className="master-tab-label">{table.label}</span>
          </button>
        ))}
      </div>

      <div className="master-controls">
        <div className="master-search">
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="master-search-icon">🔍</span>
        </div>
        <button className="master-add-btn" onClick={handleAdd}>
          ➕ Add New {tables.find(t => t.id === activeTable)?.label}
        </button>
      </div>

      <div className="master-table-container">
        {loading ? (
          <div className="master-loading">
            <div className="master-spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="master-empty">
            <div className="master-empty-icon">📭</div>
            <h3>No Records Found</h3>
            <p>Start by adding a new record</p>
          </div>
        ) : (
          <table className="master-table">
            <thead>
              <tr>
                {renderTableHeaders().map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map(record => renderTableRow(record))}
            </tbody>
          </table>
        )}
      </div>

      <div className="master-footer-info">
        <p>Total Records: <strong>{filteredData.length}</strong></p>
      </div>

      {showModal && (
        <div className="master-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="master-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="master-modal-header">
              <h3>
                {editMode ? '✏️ Edit' : '➕ Add New'} {tables.find(t => t.id === activeTable)?.label}
              </h3>
              <button className="master-modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="master-modal-body">
              {renderFormFields()}
              <div className="master-modal-actions">
                <button
                  type="button"
                  className="master-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="master-btn-submit">
                  {editMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMasterData;
