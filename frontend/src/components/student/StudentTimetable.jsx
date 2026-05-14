import React, { useState, useEffect } from 'react';
import './StudentTimetable.css';
import { formatTo12Hour, compareTimes } from '../../utils/timeUtils';

function StudentTimetable({ user }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [uniqueTimeSlots, setUniqueTimeSlots] = useState([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchTimetable();
  }, [user.id]);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.student-timetable-page');
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

    const scrollContainer = document.querySelector('.student-timetable-page');
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

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://backend-beryl-pi.vercel.app/api/student/timetable/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTimetable(data);
        
        // Extract unique time slots from actual timetable data
        const timeSlots = new Set();
        data.forEach(classItem => {
          const startHour = classItem.start_time.substring(0, 5); // Get HH:MM format
          timeSlots.add(startHour);
        });
        
        // Sort time slots
        const sortedTimeSlots = Array.from(timeSlots).sort(compareTimes);
        setUniqueTimeSlots(sortedTimeSlots);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  // Removed color generation - timetable uses white background only

  const getClassForSlot = (day, time) => {
    return timetable.find(c => 
      c.day === day && c.start_time.substring(0, 5) === time
    );
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Timetable - ${user.fullName}</title>
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
            .room-print,
            .faculty-print {
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
    
    uniqueTimeSlots.forEach(time => {
      let row = `<tr><td><strong>${formatTo12Hour(time)}</strong></td>`;
      
      days.forEach(day => {
        const classItem = getClassForSlot(day, time);
        if (classItem) {
          row += `
            <td class="class-cell-print">
              <div class="class-info-print">
                <div class="subject-print">${classItem.subject}</div>
                <div class="time-print">${formatTo12Hour(classItem.start_time)} - ${formatTo12Hour(classItem.end_time)}</div>
                <div class="room-print">Room: ${classItem.room_no}</div>
                <div class="faculty-print">Prof. ${classItem.faculty_name}</div>
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

    return `
      <div class="print-header">
        <h1>Student Timetable</h1>
        <p><strong>Student:</strong> ${user.fullName}</p>
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
    `;
  };

  if (loading) {
    return (
      <div className="student-timetable-page">
        <div className="loading-spinner">Loading timetable...</div>
      </div>
    );
  }

  return (
    <div className="student-timetable-page">
      <div className="timetable-header">
        <h2>📅 My Timetable</h2>
        <div className="timetable-controls">
          <button className="btn-print" onClick={handlePrint}>
            🖨️ Print
          </button>
        </div>
      </div>

      <div className="timetable-container">
        {timetable.length > 0 ? (
          <>
            <div className="timetable-grid">
              <div className="timetable-header-row">
                <div className="time-header">Time</div>
                {days.map(day => (
                  <div key={day} className="day-header">{day}</div>
                ))}
              </div>

              {uniqueTimeSlots.map(time => (
                <div key={time} className="timetable-row">
                  <div className="time-slot">{formatTo12Hour(time)}</div>
                  {days.map(day => {
                    const classItem = getClassForSlot(day, time);
                    return (
                      <div 
                        key={`${day}-${time}`} 
                        className={`class-cell ${classItem ? 'has-class' : 'empty'}`}
                      >
                        {classItem && (
                          <div className="class-info">
                            <div className="class-subject">{classItem.subject}</div>
                            <div className="class-time">
                              {formatTo12Hour(classItem.start_time)} - {formatTo12Hour(classItem.end_time)}
                            </div>
                            <div className="class-room">Room: {classItem.room_no}</div>
                            <div className="class-faculty">Prof. {classItem.faculty_name}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Removed color legend - timetable uses white background only */}
          </>
        ) : (
          <div className="no-timetable">
            <div className="no-timetable-icon">📅</div>
            <h3>No Timetable Available</h3>
            <p>Your class schedule will appear here once it's published by the faculty.</p>
          </div>
        )}
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

export default StudentTimetable;