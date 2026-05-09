const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ==================== NEW ENDPOINTS FOR FACULTY-SPECIFIC DATA ====================

// Get classes assigned to logged-in faculty
router.get('/faculty/classes', authenticateToken, async (req, res) => {
  try {
    const facultyId = req.user.userId;

    const [classes] = await db.execute(
      `SELECT DISTINCT c.class_id, c.class_name, c.semester,
        CONCAT(c.class_name, ' - ', c.semester) as display_name
       FROM faculty_subjects fs
       JOIN classes c ON fs.class_id = c.class_id
       WHERE fs.faculty_id = ? AND fs.is_active = 1
       ORDER BY c.class_id`,
      [facultyId]
    );

    res.json(classes);
  } catch (error) {
    console.error('Error fetching faculty classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get subjects taught by faculty for a specific class (by class_id)
router.get('/faculty/subjects/byid/:classId', authenticateToken, async (req, res) => {
  try {
    const facultyId = req.user.userId;
    const { classId } = req.params;

    const [subjects] = await db.execute(
      `SELECT DISTINCT s.subject_name, s.subject_code
       FROM faculty_subjects fs
       JOIN subjects s ON fs.subject_id = s.subject_id
       WHERE fs.faculty_id = ? AND fs.class_id = ? AND fs.is_active = 1
       ORDER BY s.subject_name`,
      [facultyId, classId]
    );

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching faculty subjects by id:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get subjects taught by faculty for a specific class (by class_name - legacy)
router.get('/faculty/subjects/:className', authenticateToken, async (req, res) => {
  try {
    const facultyId = req.user.userId;
    const { className } = req.params;

    const [subjects] = await db.execute(
      `SELECT DISTINCT s.subject_name 
       FROM faculty_subjects fs
       JOIN classes c ON fs.class_id = c.class_id
       JOIN subjects s ON fs.subject_id = s.subject_id
       WHERE fs.faculty_id = ? AND c.class_name = ? AND fs.is_active = 1
       ORDER BY s.subject_name`,
      [facultyId, className]
    );

    res.json(subjects.map(s => s.subject_name));
  } catch (error) {
    console.error('Error fetching faculty subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Verify if faculty teaches a specific class and subject
router.get('/faculty/verify/:className/:subject', authenticateToken, async (req, res) => {
  try {
    const facultyId = req.user.userId;
    const { className, subject } = req.params;

    const [result] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM faculty_subjects fs
       JOIN classes c ON fs.class_id = c.class_id
       JOIN subjects s ON fs.subject_id = s.subject_id
       WHERE fs.faculty_id = ? AND c.class_name = ? AND s.subject_name = ? AND fs.is_active = 1`,
      [facultyId, className, subject]
    );

    res.json({ authorized: result[0].count > 0 });
  } catch (error) {
    console.error('Error verifying faculty authorization:', error);
    res.status(500).json({ error: 'Failed to verify authorization' });
  }
});

// ==================== EXISTING ENDPOINTS ====================

// Get attendance records for a faculty (all their records)
router.get('/faculty/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const [records] = await db.execute(
      `SELECT a.*, s.name as student_name, s.roll_no
       FROM attendance a
       JOIN student s ON a.student_id = s.student_id
       WHERE a.faculty_id = ?
       ORDER BY a.date DESC, s.name`,
      [facultyId]
    );
    res.json(records);
  } catch (error) {
    console.error('Error fetching faculty attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get distinct divisions for a class (by class_id) - from faculty_subjects assignment
router.get('/divisions/byid/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const facultyId = req.user.userId;

    // Get divisions assigned to this faculty for this class
    const [rows] = await db.execute(
      `SELECT DISTINCT fs.division 
       FROM faculty_subjects fs
       WHERE fs.faculty_id = ? AND fs.class_id = ? AND fs.is_active = 1
         AND fs.division IS NOT NULL
       ORDER BY fs.division`,
      [facultyId, classId]
    );
    res.json(rows.map(r => r.division));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch divisions' });
  }
});

// Get distinct divisions for a class
router.get('/divisions/:className', authenticateToken, async (req, res) => {
  try {
    const { className } = req.params;
    const [rows] = await db.execute(
      `SELECT DISTINCT division FROM student 
       WHERE class = ? AND department = 'Msc.IT' AND division IS NOT NULL
       ORDER BY division`,
      [className]
    );
    res.json(rows.map(r => r.division));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch divisions' });
  }
});

// Get students by class_id and optional division
router.get('/students/byid/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const { division } = req.query;

    let query = `SELECT s.student_id, s.name, s.roll_no, s.department, s.class, s.division 
       FROM student s JOIN classes c ON s.class = c.class_name
       WHERE c.class_id = ? AND s.department = 'Msc.IT'`;
    const params = [classId];

    if (division) { query += ' AND s.division = ?'; params.push(division); }
    query += ' ORDER BY s.roll_no, s.name';

    const [students] = await db.execute(query, params);
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get all students by class and optional division
router.get('/students/:className', authenticateToken, async (req, res) => {
  try {
    const { className } = req.params;
    const { division } = req.query;

    let query = "SELECT student_id, name, roll_no, department, class, division FROM student WHERE class = ? AND department = 'Msc.IT'";
    const params = [className];

    if (division) {
      query += ' AND division = ?';
      params.push(division);
    }

    query += ' ORDER BY roll_no, name';

    const [students] = await db.execute(query, params);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get attendance for a specific date and class
router.get('/date/:date/:className', authenticateToken, async (req, res) => {
  try {
    const { date, className } = req.params;
    const { division } = req.query;
    const facultyId = req.user.userId;

    let query = `SELECT a.*, s.name, s.roll_no 
       FROM attendance a
       JOIN student s ON a.student_id = s.student_id
       WHERE a.date = ? AND a.faculty_id = ? AND s.class = ? AND s.department = 'Msc.IT'`;
    const params = [date, facultyId, className];

    if (division) {
      query += ' AND a.division = ?';
      params.push(division);
    }

    const [attendance] = await db.execute(query, params);
    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Save attendance (bulk insert/update)
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { date, subject, className, attendance, division } = req.body;
    const facultyId = req.user.userId;

    console.log('Save attendance request:', {
      date, subject, className, division, facultyId,
      attendanceCount: Object.keys(attendance || {}).length
    });

    if (!date || !subject || !className || !attendance) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify faculty is authorized
    console.log('Authorization params:', { facultyId, className, subject });
    
    const [authCheck] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM faculty_subjects fs
       JOIN classes c ON fs.class_id = c.class_id
       JOIN subjects s ON fs.subject_id = s.subject_id
       WHERE fs.faculty_id = ? AND c.class_name = ? AND s.subject_name = ? AND fs.is_active = 1`,
      [facultyId, className, subject]
    );

    console.log('Authorization check result:', authCheck[0]);
    
    // Debug: Show what faculty_subjects exist
    const [debugFS] = await db.execute(
      `SELECT fs.*, c.class_name, s.subject_name 
       FROM faculty_subjects fs
       JOIN classes c ON fs.class_id = c.class_id
       JOIN subjects s ON fs.subject_id = s.subject_id
       WHERE fs.faculty_id = ? AND fs.is_active = 1`,
      [facultyId]
    );
    console.log('Faculty assignments:', debugFS);

    if (authCheck[0].count === 0) {
      return res.status(403).json({ 
        error: 'Unauthorized: You are not assigned to teach this class and subject' 
      });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Delete existing attendance for this date, faculty, subject
      // We need to delete all records for this date/faculty/subject combination
      // regardless of division to avoid duplicate key errors
      const deleteResult = await connection.execute(
        `DELETE FROM attendance 
         WHERE date = ? AND faculty_id = ? AND subject = ?`,
        [date, facultyId, subject]
      );

      console.log('Deleted existing records:', deleteResult[0].affectedRows);

      // Insert new attendance records
      const insertQuery = `
        INSERT INTO attendance (student_id, faculty_id, date, status, subject, division)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      let insertCount = 0;
      for (const [studentId, status] of Object.entries(attendance)) {
        if (status && status !== 'null') {
          console.log(`Inserting: Student ${studentId} - ${status}`);
          await connection.execute(insertQuery, [
            parseInt(studentId),
            facultyId,
            date,
            status,
            subject,
            division || null
          ]);
          insertCount++;
        }
      }

      await connection.commit();
      connection.release();

      console.log(`Successfully saved ${insertCount} attendance records`);
      res.json({ message: 'Attendance saved successfully', count: insertCount });
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ error: 'Failed to save attendance', details: error.message });
  }
});

// Get overall attendance percentage for students in a class
router.get('/analytics/:className', authenticateToken, async (req, res) => {
  try {
    const { className } = req.params;
    const facultyId = req.user.userId;

    const [analytics] = await db.execute(
      `SELECT 
        s.student_id,
        s.name,
        s.roll_no,
        COUNT(a.attendance_id) as total_days,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent_days,
        ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.attendance_id), 0)) * 100, 2) as attendance_percentage
      FROM student s
      LEFT JOIN attendance a ON s.student_id = a.student_id AND a.faculty_id = ?
      WHERE s.class = ? AND s.department = 'Msc.IT'
      GROUP BY s.student_id, s.name, s.roll_no
      ORDER BY s.roll_no`,
      [facultyId, className]
    );

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get today's attendance stats for all classes (dashboard overview)
router.get('/stats/today/all', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [stats] = await db.execute(
      `SELECT 
        COUNT(CASE WHEN status = 'Present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent
      FROM attendance
      WHERE date = ?`,
      [today]
    );

    res.json(stats[0] || { present: 0, absent: 0 });
  } catch (error) {
    console.error('Error fetching all stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get today's attendance stats
router.get('/stats/today/:className', authenticateToken, async (req, res) => {
  try {
    const { className } = req.params;
    const facultyId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    const [stats] = await db.execute(
      `SELECT 
        COUNT(CASE WHEN status = 'Present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent
      FROM attendance a
      JOIN student s ON a.student_id = s.student_id
      WHERE a.date = ? AND a.faculty_id = ? AND s.class = ? AND s.department = 'Msc.IT'`,
      [today, facultyId, className]
    );

    res.json(stats[0] || { present: 0, absent: 0 });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get frequent absentees (students with attendance < 80%)
router.get('/absentees/:className', authenticateToken, async (req, res) => {
  try {
    const { className } = req.params;
    const facultyId = req.user.userId;

    const [absentees] = await db.execute(
      `SELECT 
        s.student_id,
        s.name,
        s.roll_no,
        COUNT(a.attendance_id) as total_days,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days,
        ROUND((SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.attendance_id), 0)) * 100, 2) as attendance_percentage
      FROM student s
      LEFT JOIN attendance a ON s.student_id = a.student_id AND a.faculty_id = ?
      WHERE s.class = ? AND s.department = 'Msc.IT'
      GROUP BY s.student_id, s.name, s.roll_no
      HAVING attendance_percentage < 80 OR attendance_percentage IS NULL
      ORDER BY attendance_percentage ASC
      LIMIT 10`,
      [facultyId, className]
    );

    res.json(absentees);
  } catch (error) {
    console.error('Error fetching absentees:', error);
    res.status(500).json({ error: 'Failed to fetch absentees' });
  }
});

module.exports = router;

