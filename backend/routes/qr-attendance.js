const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');

// ==================== FACULTY ROUTES ====================

// Manually mark student as absent (Faculty override)
router.post('/mark-absent', authenticateToken, async (req, res) => {
  try {
    const { studentId, subject, className, date } = req.body;
    const facultyId = req.user.userId;
    
    if (!studentId || !subject || !className || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Verify faculty is authorized to teach this subject
    const [authCheck] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM faculty_subjects fs
      JOIN classes c ON fs.class_id = c.class_id
      JOIN subjects s ON fs.subject_id = s.subject_id
      WHERE fs.faculty_id = ? AND c.class_name = ? AND s.subject_name = ? AND fs.is_active = 1
    `, [facultyId, className, subject]);
    
    if (authCheck[0].count === 0) {
      return res.status(403).json({ 
        error: 'Unauthorized: You are not assigned to teach this class and subject' 
      });
    }
    
    // Get student details for validation
    const [students] = await db.execute(
      'SELECT student_id, name, class, division FROM student WHERE student_id = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      return res.status(400).json({ error: 'Student not found' });
    }
    
    const student = students[0];
    
    // Check if attendance record exists
    const [existingRecord] = await db.execute(`
      SELECT * FROM attendance 
      WHERE student_id = ? AND faculty_id = ? AND date = ? AND subject = ?
    `, [studentId, facultyId, date, subject]);
    
    if (existingRecord.length > 0) {
      // Update existing record to Absent
      await db.execute(`
        UPDATE attendance 
        SET status = 'Absent', remarks = 'Manually marked absent by faculty'
        WHERE student_id = ? AND faculty_id = ? AND date = ? AND subject = ?
      `, [studentId, facultyId, date, subject]);
    } else {
      // Insert new record as Absent
      await db.execute(`
        INSERT INTO attendance (student_id, faculty_id, date, status, subject, remarks)
        VALUES (?, ?, ?, 'Absent', ?, 'Manually marked absent by faculty')
      `, [studentId, facultyId, date, subject]);
    }
    
    res.json({
      message: 'Student marked as absent successfully',
      student: student.name,
      subject,
      date,
      status: 'Absent'
    });
    
  } catch (error) {
    console.error('Error marking student absent:', error);
    res.status(500).json({ error: 'Failed to mark student absent' });
  }
});

// ==================== FACULTY ROUTES ====================

// Create QR attendance session (Faculty)
router.post('/create-session', authenticateToken, async (req, res) => {
  try {
    const { subject, className, duration = 30 } = req.body; // duration in minutes
    const facultyId = req.user.userId;
    
    if (!subject || !className) {
      return res.status(400).json({ error: 'Subject and class name are required' });
    }
    
    // Generate unique session ID
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    // Calculate session times
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const startTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
    const endTime = new Date(now.getTime() + duration * 60000).toTimeString().split(' ')[0];
    
    // Create QR code data (JSON string)
    const qrData = JSON.stringify({
      sessionId,
      facultyId,
      subject,
      className,
      date,
      timestamp: now.getTime()
    });
    
    // Deactivate any existing active sessions for this faculty
    await db.execute(
      'UPDATE qr_attendance_sessions SET is_active = FALSE WHERE faculty_id = ? AND is_active = TRUE',
      [facultyId]
    );
    
    // Insert new session
    await db.execute(`
      INSERT INTO qr_attendance_sessions 
      (session_id, faculty_id, subject, class_name, date, start_time, end_time, qr_code, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [sessionId, facultyId, subject, className, date, startTime, endTime, qrData]);
    
    res.json({
      sessionId,
      qrCode: qrData,
      subject,
      className,
      startTime,
      endTime,
      expiresAt: new Date(now.getTime() + duration * 60000).toISOString()
    });
    
  } catch (error) {
    console.error('Error creating QR session:', error);
    res.status(500).json({ error: 'Failed to create attendance session' });
  }
});

// Get active session (Faculty)
router.get('/active-session/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    const [sessions] = await db.execute(`
      SELECT session_id, subject, class_name, date, start_time, end_time, qr_code, created_at
      FROM qr_attendance_sessions 
      WHERE faculty_id = ? AND is_active = TRUE 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [facultyId]);
    
    if (sessions.length === 0) {
      return res.json({ activeSession: null });
    }
    
    const session = sessions[0];
    
    // Check if session is still valid (not expired)
    const now = new Date();
    const sessionDate = new Date(`${session.date}T${session.end_time}`);
    
    if (now > sessionDate) {
      // Session expired, deactivate it
      await db.execute(
        'UPDATE qr_attendance_sessions SET is_active = FALSE WHERE session_id = ?',
        [session.session_id]
      );
      return res.json({ activeSession: null });
    }
    
    // Get attendance count for this session
    const [attendanceCount] = await db.execute(`
      SELECT COUNT(*) as count
      FROM attendance 
      WHERE faculty_id = ? AND date = ? AND subject = ? AND status = 'Present'
    `, [facultyId, session.date, session.subject]);
    
    res.json({
      activeSession: {
        sessionId: session.session_id,
        subject: session.subject,
        className: session.class_name,
        qrCode: session.qr_code,
        startTime: session.start_time,
        endTime: session.end_time,
        attendanceCount: attendanceCount[0].count,
        createdAt: session.created_at
      }
    });
    
  } catch (error) {
    console.error('Error getting active session:', error);
    res.status(500).json({ error: 'Failed to get active session' });
  }
});

// End session (Faculty)
router.post('/end-session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const facultyId = req.user.userId;
    
    await db.execute(
      'UPDATE qr_attendance_sessions SET is_active = FALSE WHERE session_id = ? AND faculty_id = ?',
      [sessionId, facultyId]
    );
    
    res.json({ message: 'Session ended successfully' });
    
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// ==================== STUDENT ROUTES ====================

// Mark attendance via QR scan (Student)
router.post('/mark-attendance', authenticateToken, async (req, res) => {
  try {
    const { qrData } = req.body;
    const studentId = req.user.userId;
    
    console.log('=== QR ATTENDANCE SCAN ===');
    console.log('Student ID:', studentId);
    console.log('QR Data received:', qrData ? 'Yes' : 'No');
    
    if (!qrData) {
      return res.status(400).json({ error: 'QR data is required' });
    }
    
    // Parse QR data
    let sessionData;
    try {
      sessionData = JSON.parse(qrData);
      console.log('Parsed session data:', sessionData);
    } catch (e) {
      console.log('QR parse error:', e.message);
      return res.status(400).json({ error: 'Invalid QR code format' });
    }
    
    const { sessionId, facultyId, subject, className, date } = sessionData;
    
    // Verify session exists and is active
    const [sessions] = await db.execute(`
      SELECT * FROM qr_attendance_sessions 
      WHERE session_id = ? AND is_active = TRUE
    `, [sessionId]);
    
    if (sessions.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired QR code' });
    }
    
    const session = sessions[0];
    
    // Check if session is still valid (not expired)
    const now = new Date();
    const sessionEndTime = new Date(`${session.date}T${session.end_time}`);
    
    if (now > sessionEndTime) {
      // Deactivate expired session
      await db.execute(
        'UPDATE qr_attendance_sessions SET is_active = FALSE WHERE session_id = ?',
        [sessionId]
      );
      return res.status(400).json({ error: 'QR code has expired' });
    }
    
    // Get student details
    const [students] = await db.execute(
      'SELECT student_id, name, class, division FROM student WHERE student_id = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      return res.status(400).json({ error: 'Student not found' });
    }
    
    const student = students[0];
    
    // Validate if student is enrolled in this subject
    const [enrollment] = await db.execute(`
      SELECT fs.*, s.subject_name, c.class_name
      FROM faculty_subjects fs
      JOIN subjects s ON fs.subject_id = s.subject_id
      JOIN classes c ON fs.class_id = c.class_id
      WHERE fs.faculty_id = ? 
        AND s.subject_name = ? 
        AND c.class_name = ? 
        AND fs.division = ?
        AND fs.is_active = 1
    `, [facultyId, subject, student.class, student.division]);
    
    if (enrollment.length === 0) {
      return res.status(400).json({ 
        error: `You are not enrolled in ${subject} for ${className}. Your class: ${student.class}, Division: ${student.division}` 
      });
    }
    
    // Check if student already marked attendance for this session
    console.log('Checking existing attendance for:', { studentId, facultyId, date, subject });
    const [existingAttendance] = await db.execute(`
      SELECT * FROM attendance 
      WHERE student_id = ? AND faculty_id = ? AND date = ? AND subject = ?
    `, [studentId, facultyId, date, subject]);
    
    console.log('Existing attendance records found:', existingAttendance.length);
    if (existingAttendance.length > 0) {
      console.log('Existing record status:', existingAttendance[0].status);
      console.log('Existing record remarks:', existingAttendance[0].remarks);
    }
    
    if (existingAttendance.length > 0) {
      // If already marked as Present, don't allow re-scanning
      if (existingAttendance[0].status === 'Present') {
        console.log('❌ Blocking QR scan - already marked as Present');
        return res.status(400).json({ error: 'Attendance already marked as Present for this session' });
      }
      // If marked as Absent by faculty, allow QR scan to change to Present
      console.log('✅ Allowing QR scan - student was marked Absent, can change to Present');
    }
    
    // Mark attendance as present (insert or update)
    if (existingAttendance.length > 0) {
      // Update existing record to Present
      console.log('Updating existing attendance record:', {
        studentId, facultyId, date, subject,
        currentStatus: existingAttendance[0].status
      });
      
      const updateResult = await db.execute(`
        UPDATE attendance 
        SET status = 'Present', remarks = 'QR Code Attendance - Updated from Absent'
        WHERE student_id = ? AND faculty_id = ? AND date = ? AND subject = ?
      `, [studentId, facultyId, date, subject]);
      
      console.log('Update result:', updateResult[0]);
    } else {
      // Insert new record as Present
      console.log('Inserting new attendance record as Present');
      await db.execute(`
        INSERT INTO attendance (student_id, faculty_id, date, status, subject, remarks)
        VALUES (?, ?, ?, 'Present', ?, 'QR Code Attendance')
      `, [studentId, facultyId, date, subject]);
    }
    
    res.json({
      message: 'Attendance marked successfully',
      student: student.name,
      subject,
      className: student.class,
      division: student.division,
      date,
      time: now.toLocaleTimeString()
    });
    
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get student attendance history
router.get('/student-attendance/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month } = req.query;
    
    let dateFilter = '';
    const params = [studentId];
    
    if (month) {
      dateFilter = 'AND DATE_FORMAT(date, "%Y-%m") = ?';
      params.push(month);
    }
    
    const [records] = await db.execute(`
      SELECT 
        a.date, 
        a.status, 
        a.subject, 
        a.remarks,
        f.name as faculty_name
      FROM attendance a
      JOIN faculty f ON a.faculty_id = f.faculty_id
      WHERE a.student_id = ? ${dateFilter}
      ORDER BY a.date DESC, a.subject
    `, params);
    
    // Get attendance statistics
    const [stats] = await db.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent
      FROM attendance 
      WHERE student_id = ? ${dateFilter}
    `, params);
    
    const totalClasses = stats[0].total;
    const presentClasses = stats[0].present;
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
    
    res.json({
      records,
      stats: {
        totalClasses,
        presentClasses,
        absentClasses: stats[0].absent,
        attendancePercentage
      }
    });
    
  } catch (error) {
    console.error('Error getting student attendance:', error);
    res.status(500).json({ error: 'Failed to get attendance records' });
  }
});

module.exports = router;