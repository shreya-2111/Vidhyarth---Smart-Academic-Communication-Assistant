import React, { useState, useEffect } from 'react';
import './MySubjects.css';

function MySubjects({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedByClass, setGroupedByClass] = useState({});

  useEffect(() => {
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-beryl-pi.vercel.app/api/faculty-subject-assignment/faculty/${user.id}/assignments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
        
        // Group by class_id (not class_name, since same name exists for different semesters)
        const grouped = data.reduce((acc, assignment) => {
          const key = assignment.class_id;
          if (!acc[key]) {
            acc[key] = {
              class_id: assignment.class_id,
              class_name: assignment.class_name,
              semester: assignment.semester,
              subjects: []
            };
          }
          acc[key].subjects.push({
            subject_id: assignment.subject_id,
            subject_name: assignment.subject_name,
            subject_code: assignment.subject_code,
            credits: assignment.credits
          });
          return acc;
        }, {});
        
        setGroupedByClass(grouped);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-subjects-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your subjects...</p>
        </div>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="my-subjects-container">
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No Subjects Assigned</h3>
          <p>You don't have any subjects assigned yet.</p>
          <p style={{ fontSize: '14px', color: '#999', marginTop: '10px' }}>
            Contact admin to assign subjects to you.
          </p>
        </div>
      </div>
    );
  }

  const totalClasses = Object.keys(groupedByClass).length;
  const totalSubjects = assignments.length;

  return (
    <div className="my-subjects-container">
      <div className="subjects-header">
        <h2>📚 My Assigned Subjects</h2>
        <div className="subjects-summary">
          <span className="summary-badge">{totalClasses} Class(es)</span>
          <span className="summary-badge">{totalSubjects} Subject(s)</span>
        </div>
      </div>

      <div className="subjects-grid">
        {Object.values(groupedByClass).map((classData) => (
          <div key={classData.class_id} className="class-card">
            <div className="class-card-header">
              <div className="class-info">
                <h3>{classData.class_name}</h3>
                <p className="class-meta">
                  {classData.semester && <span>{classData.semester}</span>}
                </p>
              </div>
              <div className="subject-count-badge">
                {classData.subjects.length} {classData.subjects.length === 1 ? 'Subject' : 'Subjects'}
              </div>
            </div>
            
            <div className="subjects-list">
              {classData.subjects.map((subject) => (
                <div key={subject.subject_id} className="subject-item">
                  <div className="subject-icon">📖</div>
                  <div className="subject-details">
                    <div className="subject-name">{subject.subject_name}</div>
                    <div className="subject-meta">
                      <span className="subject-code">{subject.subject_code}</span>
                      <span className="subject-credits">{subject.credits} Credits</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="subjects-footer">
        <p>💡 Tip: You can mark attendance for any of these subjects from the Attendance page.</p>
      </div>
    </div>
  );
}

export default MySubjects;
