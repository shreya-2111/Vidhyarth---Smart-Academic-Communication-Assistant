const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Configure multer for assignment submissions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/submissions';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|txt|zip|rar/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX, TXT, ZIP, RAR files allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ==================== DASHBOARD ====================
router.get('/dashboard/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Attendance percentage
    const [attRows] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM attendance WHERE student_id = ?
    `, [studentId]);
    const att = attRows[0];
    const attendancePercentage = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;

    // Pending assignments
    const [pendingRows] = await db.execute(`
      SELECT COUNT(*) as cnt
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id AND s.student_id = ?
      WHERE s.submission_id IS NULL
    `, [studentId]);

    // Upcoming deadlines (next 7 days)
    const [deadlineRows] = await db.execute(`
      SELECT COUNT(*) as cnt
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id AND s.student_id = ?
      WHERE s.submission_id IS NULL AND a.deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
    `, [studentId]);

    // Today's classes
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const [todayRows] = await db.execute(
      'SELECT COUNT(*) as cnt FROM timetable WHERE day = ?', [today]
    );

    res.json({
      attendancePercentage,
      pendingAssignments: pendingRows[0].cnt,
      upcomingDeadlines: deadlineRows[0].cnt,
      todayClasses: todayRows[0].cnt
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ==================== TIMETABLE ====================
router.get('/timetable/:studentId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT t.timetable_id, t.subject, t.day, t.start_time, t.end_time, t.room_no, f.name as faculty_name
      FROM timetable t
      JOIN faculty f ON t.faculty_id = f.faculty_id
      ORDER BY FIELD(t.day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), t.start_time
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// ==================== ANNOUNCEMENTS ====================
router.get('/announcements/:studentId', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT announcement_id as id, title, message, created_at
      FROM announcements
      WHERE target_type IN ('all','students')
      ORDER BY created_at DESC LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

router.get('/announcements', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [rows] = await db.execute(
      'SELECT title, message, created_at FROM announcements ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// ==================== ATTENDANCE ====================
router.get('/attendance/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month } = req.query;

    let dateFilter = '';
    const params = [studentId];
    if (month) { dateFilter = 'AND DATE_FORMAT(date, "%Y-%m") = ?'; params.push(month); }

    const [records] = await db.execute(`
      SELECT date, status, subject, remarks
      FROM attendance WHERE student_id = ? ${dateFilter}
      ORDER BY date DESC
    `, params);

    const [statsRows] = await db.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent
      FROM attendance WHERE student_id = ? ${dateFilter}
    `, params);

    const s = statsRows[0];
    const attendancePercentage = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;

    const [lowRows] = await db.execute(`
      SELECT subject,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        ROUND(SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) as percentage
      FROM attendance WHERE student_id = ? ${dateFilter}
      GROUP BY subject HAVING percentage < 75
    `, params);

    res.json({
      records,
      stats: {
        totalClasses: s.total,
        attendedClasses: s.present,
        attendancePercentage,
        lowAttendanceSubjects: lowRows
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance data' });
  }
});

// ==================== ASSIGNMENTS ====================
router.get('/assignments/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.query;

    let statusFilter = '';
    if (status === 'pending') statusFilter = 'AND s.submission_id IS NULL AND a.deadline >= NOW()';
    else if (status === 'submitted') statusFilter = 'AND s.submission_id IS NOT NULL';
    else if (status === 'overdue') statusFilter = 'AND s.submission_id IS NULL AND a.deadline < NOW()';

    const [rows] = await db.execute(`
      SELECT
        a.assignment_id, a.course, a.title, a.description, a.file_url, a.deadline, a.created_at,
        f.name as faculty_name,
        s.submission_id, s.submission_url, s.submitted_at, s.marks_obtained, s.feedback,
        CASE
          WHEN s.submission_id IS NOT NULL THEN 'submitted'
          WHEN a.deadline < NOW() THEN 'overdue'
          ELSE 'pending'
        END as status
      FROM assignments a
      JOIN faculty f ON a.faculty_id = f.faculty_id
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id AND s.student_id = ?
      WHERE 1=1 ${statusFilter}
      ORDER BY a.deadline ASC
    `, [studentId]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments', details: error.message });
  }
});

// Submit assignment
router.post('/submit-assignment', authenticateToken, upload.single('submissionFile'), async (req, res) => {
  try {
    const { assignmentId, studentId, submissionText } = req.body;
    const submissionFile = req.file ? `/uploads/submissions/${req.file.filename}` : null;

    const [assignmentRows] = await db.execute(
      'SELECT * FROM assignments WHERE assignment_id = ?', [assignmentId]
    );
    if (assignmentRows.length === 0) return res.status(400).json({ error: 'Assignment not found' });

    const [existing] = await db.execute(
      'SELECT * FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );
    if (existing.length > 0) return res.status(400).json({ error: 'Assignment already submitted' });

    const assignment = assignmentRows[0];
    const status = new Date() > new Date(assignment.deadline) ? 'late' : 'submitted';
    const submissionUrl = submissionFile || submissionText || null;

    await db.execute(
      'INSERT INTO assignment_submissions (assignment_id, student_id, submission_url, status, submitted_at) VALUES (?, ?, ?, ?, NOW())',
      [assignmentId, studentId, submissionUrl, status]
    );

    const [studentRows] = await db.execute('SELECT name FROM student WHERE student_id = ?', [studentId]);
    const studentName = studentRows[0]?.name || 'A student';

    await db.execute(
      `INSERT INTO notifications (user_id, user_type, type, title, message, priority, is_read)
       VALUES (?, 'faculty', 'submission', ?, ?, 'medium', 0)`,
      [assignment.faculty_id,
       'New Assignment Submission',
       `${studentName} submitted "${assignment.title}"${status === 'late' ? ' (Late)' : ''}`]
    );

    res.json({ message: 'Assignment submitted successfully', status });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ error: 'Failed to submit assignment', details: error.message });
  }
});

// ==================== PERFORMANCE ====================
router.get('/performance/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get grades from grades table (faculty enters these via Reports)
    const [grades] = await db.execute(`
      SELECT subject, exam_type, marks_obtained, total_marks, percentage, grade_letter, exam_date, semester
      FROM grades WHERE student_id = ?
      ORDER BY exam_date DESC
    `, [studentId]);

    // Get performance summary
    const [summary] = await db.execute(`
      SELECT subject, percentage, grade_letter, attendance_percentage, status
      FROM performance_summary WHERE student_id = ?
      ORDER BY subject
    `, [studentId]);

    // Calculate overall average
    const avgPercentage = grades.length > 0
      ? (grades.reduce((sum, g) => sum + parseFloat(g.percentage || 0), 0) / grades.length).toFixed(1)
      : 0;

    // Faculty feedback (messages from faculty to this student)
    const [feedback] = await db.execute(`
      SELECT m.message as feedback, m.created_at as date, f.name as faculty_name
      FROM messages m
      JOIN faculty f ON m.sender_id = f.faculty_id
      WHERE m.receiver_id = ? AND m.sender_type = 'faculty'
      ORDER BY m.created_at DESC LIMIT 5
    `, [studentId]);

    res.json({
      overallGPA: parseFloat(avgPercentage),
      grades,
      summary,
      feedback
    });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// ==================== PROFILE STATS ====================
router.get('/profile-stats', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [attData] = await db.execute(`
      SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
      FROM attendance WHERE student_id = ?
    `, [studentId]);
    const overallAttendance = attData[0].total > 0
      ? Math.round((attData[0].present / attData[0].total) * 100) : 0;

    const [assignStats] = await db.execute(`
      SELECT COUNT(DISTINCT a.assignment_id) as total, COUNT(DISTINCT s.submission_id) as submitted
      FROM assignments a
      LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id AND s.student_id = ?
    `, [studentId]);

    const total = assignStats[0].total || 0;
    const submitted = assignStats[0].submitted || 0;

    const [marksData] = await db.execute(
      'SELECT AVG(percentage) as avg FROM grades WHERE student_id = ?', [studentId]
    );

    res.json({
      overallAttendance,
      totalAssignments: total,
      submittedAssignments: submitted,
      pendingAssignments: total - submitted,
      averageMarks: marksData[0].avg ? Math.round(marksData[0].avg) : 0
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ==================== SUBJECT PROGRESS ====================
router.get('/subject-progress', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [rows] = await db.query(`
      SELECT
        g.subject as subject_name,
        AVG(g.percentage) as marks,
        COALESCE(
          (SELECT ROUND(SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END)/COUNT(*)*100,1)
           FROM attendance a WHERE a.student_id = g.student_id AND a.subject = g.subject),
          0
        ) as attendance
      FROM grades g
      WHERE g.student_id = ?
      GROUP BY g.subject
    `, [studentId]);

    res.json(rows.map(r => ({
      subject_name: r.subject_name,
      attendance: Math.round(r.attendance || 0),
      marks: Math.round(r.marks || 0)
    })));
  } catch (error) {
    console.error('Error fetching subject progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== UPDATE PROFILE ====================
router.put('/update-profile', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { fullName, phone } = req.body;
    await db.execute('UPDATE student SET name = ?, phone = ? WHERE student_id = ?', [fullName, phone, studentId]);
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==================== CHANGE PASSWORD ====================
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    const [rows] = await db.execute('SELECT password FROM student WHERE student_id = ?', [studentId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE student SET password = ? WHERE student_id = ?', [hashed, studentId]);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
