import React, { useState, useEffect } from 'react';
import './Timetable.css';
import { timetableAPI, masterAPI } from '../../services/api';
import { formatTo12Hour, compareTimes } from '../../utils/timeUtils';
import TimePicker from '../shared/TimePicker';

function Timetable({ user }) {
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    endTime: '',
    roomNo: '',
    day: 'Monday'
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Load classes from database
  useEffect(() => {
    loadClasses();
    loadAvailableSubjects();
  }, [user.id]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      // Try container scroll first, then fallback to window scroll
      const scrollContainer = document.querySelector('.timetable-page');
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
    const scrollContainer = document.querySelector('.timetable-page');
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

  const loadClasses = async () => {
    try {
      const data = await timetableAPI.getAll(user.id);
      console.log('Loaded classes from database:', data);
      
      if (!data.error) {
        // Convert database format to component format
        const formattedClasses = data.map(c => ({
          id: c.timetable_id,
          subject: c.subject,
          day: c.day,
          startTime: c.start_time,
          endTime: c.end_time,
          roomNo: c.room_no,
          facultyName: c.faculty_name || user.fullName,
          facultyId: c.faculty_id
        }));
        console.log('Formatted classes:', formattedClasses);
        setClasses(formattedClasses);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadAvailableSubjects = async () => {
    try {
      // Fetch subjects from faculty assignments
      const assignments = await masterAPI.getFacultyAssignments(user.id);
      const uniqueSubjects = [...new Set(assignments.map(a => a.subject_name))];
      setAvailableSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
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
    setLoading(true);
    
    try {
      const classData = {
        facultyId: user.id,
        subject: formData.subject,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        roomNo: formData.roomNo
      };

      let response;
      if (editingClass) {
        response = await timetableAPI.update(editingClass.id, classData);
      } else {
        response = await timetableAPI.add(classData);
      }

      // Check for conflict error returned from backend
      if (response && response.error) {
        alert(response.error);
        setLoading(false);
        return;
      }

      // Reload classes from database
      await loadClasses();
      resetForm();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Failed to save class. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      subject: classItem.subject,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      roomNo: classItem.roomNo,
      day: classItem.day
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await timetableAPI.delete(id);
        await loadClasses();
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Failed to delete class. Please ensure backend is running.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      startTime: '',
      endTime: '',
      roomNo: '',
      day: 'Monday'
    });
    setEditingClass(null);
    setShowForm(false);
  };

  const getClassForSlot = (day, time) => {
    return classes.filter(c => {
      if (c.day !== day) return false;
      const classStart = c.startTime.substring(0, 5); // Get HH:MM format
      return classStart === time;
    });
  };

  const getTimeSlots = () => {
    if (classes.length === 0) {
      return ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    }

    const times = new Set();
    classes.forEach(c => {
      const startTime = c.startTime.substring(0, 5); // Get HH:MM format
      times.add(startTime);
    });

    return Array.from(times).sort(compareTimes);
  };

  const timeSlots = getTimeSlots();

  const exportToPDF = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Faculty Timetable - ${user.fullName}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              color: #333;
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #1e3a5f;
              padding-bottom: 15px;
            }
            .print-header h1 {
              color: #1e3a5f;
              margin: 0;
              font-size: 24px;
            }
            .print-header p {
              margin: 5px 0;
              color: #666;
            }
            .timetable-print {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .timetable-print th,
            .timetable-print td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: center;
              vertical-align: top;
            }
            .timetable-print th {
              background-color: #1e3a5f;
              color: white;
              font-weight: bold;
            }
            .class-cell-print {
              min-height: 60px;
              background-color: #f9f9f9;
            }
            .class-info-print {
              font-size: 11px;
              line-height: 1.3;
              margin-bottom: 5px;
            }
            .subject-print {
              font-weight: bold;
              color: #1e3a5f;
              margin-bottom: 2px;
            }
            .time-print {
              color: #666;
              margin-bottom: 1px;
            }
            .room-print {
              color: #888;
              font-size: 10px;
            }
            .legend-print {
              margin-top: 20px;
              page-break-inside: avoid;
            }
            .legend-print h4 {
              color: #1e3a5f;
              margin-bottom: 10px;
            }
            .legend-items-print {
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
            }
            .legend-item-print {
              display: flex;
              align-items: center;
              gap: 5px;
              font-size: 12px;
            }
            .legend-color-print {
              width: 15px;
              height: 15px;
              border: 1px solid #ddd;
              border-radius: 3px;
            }
            @media print {
              body { margin: 0; }
              .print-header { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generatePrintContent = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let tableRows = '';
    
    timeSlots.forEach(time => {
      let row = `<tr><td><strong>${formatTo12Hour(time)}</strong></td>`;
      
      days.forEach(day => {
        const classItems = getClassForSlot(day, time);
        if (classItems.length > 0) {
          const classItem = classItems[0];
          row += `
            <td class="class-cell-print">
              <div class="class-info-print">
                <div class="subject-print">${classItem.subject}</div>
                <div class="time-print">${formatTo12Hour(classItem.startTime)} - ${formatTo12Hour(classItem.endTime)}</div>
                <div class="room-print">Room: ${classItem.roomNo}</div>
              </div>
            </td>
          `;
        } else {
          row += '<td class="class-cell-print">-</td>';
        }
      });
      
      row += '</tr>';
      tableRows += row;
    });

    // Generate legend with unique subjects
    const uniqueSubjects = [...new Set(classes.map(c => c.subject))];
    const legendItems = uniqueSubjects.map(subject => 
      `<div class="legend-item-print">
        <span>${subject}</span>
      </div>`
    ).join('');

    return `
      <div class="print-header">
        <h1>Faculty Timetable</h1>
        <p><strong>Faculty:</strong> ${user.fullName}</p>
        <p><strong>Generated on:</strong> ${currentDate}</p>
      </div>
      
      <table class="timetable-print">
        <thead>
          <tr>
            <th>Time</th>
            ${days.map(day => `<th>${day}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      ${uniqueSubjects.length > 0 ? `
        <div class="legend-print">
          <h4>Subjects:</h4>
          <div class="legend-items-print">
            ${legendItems}
          </div>
        </div>
      ` : ''}
    `;
  };

  // Removed color function - timetable uses white background only

  return (
    <div className="timetable-page">
      <div className="timetable-header-section">
        <h2>📅 Timetable Management</h2>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Class
          </button>
          <button className="btn-secondary" onClick={exportToPDF}>
            📄 Export to PDF
          </button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label>Subject *</label>
                  {availableSubjects.length > 0 ? (
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Subject</option>
                      {availableSubjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Mathematics"
                    />
                  )}
                </div>
                <div className="form-field">
                  <label>Day *</label>
                  <select name="day" value={formData.day} onChange={handleInputChange} required>
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Start Time *</label>
                  <TimePicker
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>End Time *</label>
                  <TimePicker
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Room No *</label>
                  <input
                    type="text"
                    name="roomNo"
                    value={formData.roomNo}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 101"
                  />
                </div>
                <div className="form-field">
                  <label>Faculty Name</label>
                  <input
                    type="text"
                    value={user.fullName}
                    disabled
                    className="disabled-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingClass ? 'Update Class' : 'Add Class')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="timetable-calendar" id="timetable-print">
        <div className="calendar-header">
          <div className="time-column-header">Time</div>
          {days.map(day => (
            <div key={day} className="day-column-header">{day}</div>
          ))}
        </div>

        <div className="calendar-body">
          {timeSlots.length > 0 ? (
            timeSlots.map(time => (
              <div key={time} className="calendar-row">
                <div className="time-cell">{formatTo12Hour(time)}</div>
                {days.map(day => {
                  const classItems = getClassForSlot(day, time);
                  return (
                    <div key={`${day}-${time}`} className="class-cell">
                      {classItems.length > 0 && classItems.map(classItem => (
                        <div 
                          key={classItem.id}
                          className="class-card"
                        >
                          <div className="class-info">
                            <div className="class-subject">{classItem.subject}</div>
                            <div className="class-time">
                              {formatTo12Hour(classItem.startTime)} - {formatTo12Hour(classItem.endTime)}
                            </div>
                            <div className="class-room">Room: {classItem.roomNo}</div>
                            <div className="class-faculty" style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                              By: {classItem.facultyName}
                            </div>
                          </div>
                          {classItem.facultyId === user.id && (
                            <div className="class-actions no-print">
                              <button 
                                className="edit-btn"
                                onClick={() => handleEdit(classItem)}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button 
                                className="delete-btn"
                                onClick={() => handleDelete(classItem.id)}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="no-classes-message">
              <p>No classes scheduled yet. Click "+ Add Class" to create your timetable.</p>
            </div>
          )}
        </div>
      </div>
      
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

export default Timetable;
