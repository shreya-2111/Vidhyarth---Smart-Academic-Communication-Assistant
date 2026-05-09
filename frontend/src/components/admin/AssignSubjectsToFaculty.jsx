import React, { useState, useEffect } from 'react';
import './AssignSubjectsToFaculty.css';

function AssignSubjectsToFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newClass, setNewClass] = useState({ class_name: '', semester: '' });
  // department removed from newSubject - always 'Msc.IT'
  const [newSubject, setNewSubject] = useState({ subject_name: '', subject_code: '', class_id: '', credits: 3 });

  // Fetch faculty on mount
  useEffect(() => {
    fetchFaculty();
    fetchClasses();
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchSubjects(selectedClass);
    } else {
      setSubjects([]);
      setSelectedSubjects([]);
    }
  }, [selectedClass]);

  const fetchFaculty = async () => {
    try {
      setLoadingFaculty(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/faculty-subject-assignment/faculty', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFaculty(data);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
    } finally {
      setLoadingFaculty(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/faculty-subject-assignment/classes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchSubjects = async (classId) => {
    try {
      setLoadingSubjects(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-beryl-pi.vercel.app/api/faculty-subject-assignment/subjects/${classId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubjectToggle = (subjectId) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  const handleAssign = async () => {
    if (!selectedFaculty || !selectedClass || selectedSubjects.length === 0) {
      alert('Please select faculty, class, and at least one subject');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/faculty-subject-assignment/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          faculty_id: parseInt(selectedFaculty),
          class_id: parseInt(selectedClass),
          subject_ids: selectedSubjects,
          division: selectedDivision || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        
        // Reset form
        setSelectedFaculty('');
        setSelectedClass('');
        setSelectedSubjects([]);
        setSelectedDivision('');
        setSubjects([]);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to assign subjects');
      }
    } catch (error) {
      console.error('Error assigning subjects:', error);
      alert('Failed to assign subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!newClass.class_name) {
      alert('Class name is required');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/faculty-subject-assignment/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newClass)
      });

      if (response.ok) {
        alert('Class added successfully');
        setShowAddClassModal(false);
        setNewClass({ class_name: '', semester: '' });
        fetchClasses();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add class');
      }
    } catch (error) {
      console.error('Error adding class:', error);
      alert('Failed to add class');
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.subject_name || !newSubject.class_id) {
      alert('Subject name and class are required');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://backend-beryl-pi.vercel.app/api/faculty-subject-assignment/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSubject)
      });

      if (response.ok) {
        alert('Subject added successfully');
        setShowAddSubjectModal(false);
        setNewSubject({ subject_name: '', subject_code: '', class_id: '', credits: 3 });
        fetchSubjects(selectedClass);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add subject');
      }
    } catch (error) {
      console.error('Error adding subject:', error);
      alert('Failed to add subject');
    }
  };

  return (
    <div className="assign-subjects-container">
      <div className="assign-subjects-header">
        <h2>📚 Assign Subjects to Faculty</h2>
        <p>Assign multiple subjects from different classes to faculty members. Faculty can view their assignments in "My Subjects" page.</p>
      </div>

      <div className="assign-form-card">
        <h3>New Assignment</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Select Faculty *</label>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              disabled={loadingFaculty}
            >
              <option value="">
                {loadingFaculty ? 'Loading faculty...' : 'Choose faculty...'}
              </option>
              {faculty.map(f => (
                <option key={f.faculty_id} value={f.faculty_id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Class/Semester *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={loadingClasses}
                style={{ flex: 1 }}
              >
                <option value="">
                  {loadingClasses ? 'Loading classes...' : classes.length === 0 ? 'No classes available' : 'Choose class...'}
                </option>
                {classes.map(c => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_name} - {c.semester}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-add-quick"
                onClick={() => setShowAddClassModal(true)}
                title="Add new class"
              >
                ➕
              </button>
            </div>
            {!loadingClasses && classes.length === 0 && (
              <small style={{ color: '#f44336', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                No classes found. Click ➕ to add a class first.
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Division (Optional)</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
            >
              <option value="">No Division</option>
              <option value="A">Division A</option>
              <option value="B">Division B</option>
              <option value="C">Division C</option>
              <option value="D">Division D</option>
            </select>
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Assign to a specific division or leave empty for all students
            </small>
          </div>
        </div>

        {selectedClass && (
          <div className="form-group subjects-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Select Subjects * (Multiple selection allowed)</label>
              <button
                type="button"
                className="btn-add-subject"
                onClick={() => { setNewSubject({ subject_name: '', subject_code: '', class_id: selectedClass, credits: 3 }); setShowAddSubjectModal(true); }}
                title="Add new subject"
              >
                ➕ Add Subject
              </button>
            </div>
            {loadingSubjects ? (
              <div className="loading-subjects">Loading subjects...</div>
            ) : subjects.length === 0 ? (
              <div className="no-subjects">
                No subjects available for this class.
                <button
                  type="button"
                  className="btn-add-inline"
                  onClick={() => setShowAddSubjectModal(true)}
                  style={{ marginTop: '12px' }}
                >
                  ➕ Add First Subject
                </button>
              </div>
            ) : (
              <div className="subjects-list">
                {subjects.map(subject => (
                  <label key={subject.subject_id} className="subject-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject.subject_id)}
                      onChange={() => handleSubjectToggle(subject.subject_id)}
                    />
                    <span className="subject-info">
                      <span className="subject-name">{subject.subject_name}</span>
                      <span className="subject-code">({subject.subject_code})</span>
                      <span className="subject-credits">{subject.credits} credits</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {selectedSubjects.length > 0 && (
              <div className="selected-count">
                ✓ {selectedSubjects.length} subject(s) selected
              </div>
            )}
          </div>
        )}

        <button
          className="btn-assign"
          onClick={handleAssign}
          disabled={loading || !selectedFaculty || !selectedClass || selectedSubjects.length === 0}
        >
          {loading ? 'Assigning...' : `Assign ${selectedSubjects.length || ''} Subject(s)`}
        </button>
      </div>

      {/* Add Class Modal */}
      {showAddClassModal && (
        <div className="modal-overlay" onClick={() => setShowAddClassModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Class</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>Class Name *</label>
                <input
                  type="text"
                  value={newClass.class_name}
                  onChange={(e) => setNewClass({...newClass, class_name: e.target.value})}
                  placeholder="e.g., Msc.IT 1st Year"
                />
              </div>
              <div className="form-group">
                <label>Semester</label>
                <input
                  type="text"
                  value={newClass.semester}
                  onChange={(e) => setNewClass({...newClass, semester: e.target.value})}
                  placeholder="e.g., Semester 1"
                />
              </div>
              {/* Department is always Msc.IT - no input needed */}
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowAddClassModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleAddClass}>Add Class</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="modal-overlay" onClick={() => setShowAddSubjectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Subject</h3>
            <div className="modal-form">
              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  type="text"
                  value={newSubject.subject_name}
                  onChange={(e) => setNewSubject({...newSubject, subject_name: e.target.value})}
                  placeholder="e.g., Data Structures"
                />
              </div>
              <div className="form-group">
                <label>Subject Code</label>
                <input
                  type="text"
                  value={newSubject.subject_code}
                  onChange={(e) => setNewSubject({...newSubject, subject_code: e.target.value})}
                  placeholder="e.g., MSCIT201"
                />
              </div>
              <div className="form-group">
                <label>Class *</label>
                <select
                  value={newSubject.class_id}
                  onChange={(e) => setNewSubject({...newSubject, class_id: e.target.value})}
                >
                  <option value="">Select Class...</option>
                  {classes.map(c => (
                    <option key={c.class_id} value={c.class_id}>
                      {c.class_name} - {c.semester}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Credits</label>
                <input
                  type="number"
                  value={newSubject.credits}
                  onChange={(e) => setNewSubject({...newSubject, credits: parseInt(e.target.value)})}
                  min="1"
                  max="10"
                />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowAddSubjectModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleAddSubject}>Add Subject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignSubjectsToFaculty;
