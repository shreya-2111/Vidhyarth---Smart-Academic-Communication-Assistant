const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get performance dashboard data
router.get('/dashboard/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;

    const [totalStudents] = await db.execute(
      "SELECT COUNT(*) as count FROM student WHERE department = 'Msc.IT' AND is_active = 1"
    );

    const [totalSubjects] = await db.execute(
      'SELECT COUNT(DISTINCT subject_id) as count FROM faculty_subjects WHERE faculty_id = ? AND is_active = 1',
      [facultyId]
    );

    const [averagePerformance] = await db.execute(
      'SELECT AVG(percentage) as avg_percentage FROM grades WHERE faculty_id = ?',
      [facultyId]
    );

    const [attendanceStats] = await db.execute(`
      SELECT AVG(CASE WHEN status = 'Present' THEN 100 ELSE 0 END) as avg_attendance
      FROM attendance WHERE faculty_id = ?
    `, [facultyId]);

    res.json({
      totalStudents: totalStudents[0].count,
      totalSubjects: totalSubjects[0].count,
      averagePerformance: Math.round(averagePerformance[0].avg_percentage || 0),
      averageAttendance: Math.round(attendanceStats[0].avg_attendance || 0)
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get student performance data (MSCIT department only)
router.get('/student-performance/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { subject, semester } = req.query;

    let query = `
      SELECT 
        s.student_id,
        s.name,
        s.email,
        s.department,
        g.subject,
        ROUND(AVG(g.percentage), 1) as percentage,
        MAX(g.grade_letter) as grade_letter,
        ROUND(
          COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.attendance_id), 0)
        , 1) as attendance_percentage,
        CASE 
          WHEN AVG(g.percentage) >= 90 THEN 'excellent'
          WHEN AVG(g.percentage) >= 75 THEN 'good'
          WHEN AVG(g.percentage) >= 60 THEN 'average'
          WHEN AVG(g.percentage) >= 40 THEN 'poor'
          ELSE 'fail'
        END as status
      FROM student s
      JOIN grades g ON s.student_id = g.student_id AND g.faculty_id = ?
      LEFT JOIN attendance a ON s.student_id = a.student_id AND a.faculty_id = ?
      WHERE s.department = 'Msc.IT' AND s.is_active = 1
    `;

    const params = [facultyId, facultyId];

    if (subject) {
      query += ' AND g.subject = ?';
      params.push(subject);
    }

    query += ' GROUP BY s.student_id, s.name, s.email, s.department, g.subject ORDER BY s.name';

    const [students] = await db.execute(query, params);
    res.json(students);
  } catch (error) {
    console.error('Error fetching student performance:', error);
    res.status(500).json({ error: 'Failed to fetch student performance' });
  }
});

// Get performance charts data
router.get('/charts/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Grade distribution
    const [gradeDistribution] = await db.execute(`
      SELECT 
        grade_letter,
        COUNT(*) as count
      FROM grades 
      WHERE faculty_id = ?
      GROUP BY grade_letter
      ORDER BY grade_letter
    `, [facultyId]);

    // Performance trends (last 6 months)
    const [performanceTrends] = await db.execute(`
      SELECT 
        DATE_FORMAT(exam_date, '%Y-%m') as month,
        AVG(percentage) as avg_percentage,
        COUNT(*) as exam_count
      FROM grades 
      WHERE faculty_id = ? AND exam_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(exam_date, '%Y-%m')
      ORDER BY month
    `, [facultyId]);

    // Subject-wise performance
    const [subjectPerformance] = await db.execute(`
      SELECT 
        subject,
        AVG(percentage) as avg_percentage,
        COUNT(DISTINCT student_id) as student_count
      FROM grades 
      WHERE faculty_id = ?
      GROUP BY subject
      ORDER BY avg_percentage DESC
    `, [facultyId]);

    // Attendance vs Performance correlation
    const [attendancePerformance] = await db.execute(`
      SELECT 
        ps.attendance_percentage,
        ps.percentage as academic_percentage,
        s.name as student_name
      FROM performance_summary ps
      JOIN student s ON ps.student_id = s.student_id
      WHERE ps.attendance_percentage IS NOT NULL 
      AND ps.percentage IS NOT NULL
      ORDER BY ps.attendance_percentage
    `);

    res.json({
      gradeDistribution,
      performanceTrends,
      subjectPerformance,
      attendancePerformance
    });
  } catch (error) {
    console.error('Error fetching charts data:', error);
    res.status(500).json({ error: 'Failed to fetch charts data' });
  }
});

// Get weak students (students needing attention) - only poor performance OR low attendance
router.get('/weak-students/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;

    const [weakStudents] = await db.execute(`
      SELECT 
        s.student_id,
        s.name,
        s.department,
        g.subject,
        ROUND(AVG(g.percentage), 1) as percentage,
        ROUND(
          COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.attendance_id), 0)
        , 1) as attendance_percentage,
        CASE 
          WHEN AVG(g.percentage) < 50 AND 
               COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.attendance_id), 0) < 70 
               THEN 'Critical'
          WHEN AVG(g.percentage) < 50 THEN 'Poor Performance'
          WHEN COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.attendance_id), 0) < 70 
               THEN 'Poor Attendance'
          ELSE 'At Risk'
        END as concern_level,
        CASE 
          WHEN AVG(g.percentage) >= 75 THEN 'good'
          WHEN AVG(g.percentage) >= 50 THEN 'average'
          ELSE 'poor'
        END as status
      FROM student s
      JOIN grades g ON s.student_id = g.student_id AND g.faculty_id = ?
      LEFT JOIN attendance a ON s.student_id = a.student_id AND a.faculty_id = ?
      WHERE s.department = 'Msc.IT' AND s.is_active = 1
      GROUP BY s.student_id, s.name, s.department, g.subject
      HAVING 
        AVG(g.percentage) < 50
        OR (COUNT(CASE WHEN a.status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(a.attendance_id), 0)) < 70
      ORDER BY AVG(g.percentage) ASC
    `, [facultyId, facultyId]);

    res.json(weakStudents);
  } catch (error) {
    console.error('Error fetching weak students:', error);
    res.status(500).json({ error: 'Failed to fetch weak students' });
  }
});

// Get available filters (subjects, semesters) - department filter removed, MSCIT only
router.get('/filters', authenticateToken, async (req, res) => {
  try {
    // No department filter needed - system is MSCIT only
    const [subjects] = await db.execute(
      'SELECT DISTINCT subject FROM grades ORDER BY subject'
    );

    const [semesters] = await db.execute(
      'SELECT DISTINCT semester FROM performance_summary ORDER BY semester'
    );

    res.json({
      subjects: subjects.map(s => s.subject),
      semesters: semesters.map(s => s.semester)
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// Add/Update student grade
router.post('/add-grade', authenticateToken, async (req, res) => {
  try {
    const { 
      studentId, 
      facultyId, 
      subject, 
      examType, 
      marksObtained, 
      totalMarks, 
      gradeLetter, 
      examDate 
    } = req.body;

    if (!studentId || !subject || !marksObtained || !totalMarks) {
      return res.status(400).json({ error: 'Student, subject, marks obtained and total marks are required' });
    }

    const percentage = (parseFloat(marksObtained) / parseFloat(totalMarks)) * 100;

    const [result] = await db.execute(
      `INSERT INTO grades (student_id, faculty_id, subject, exam_type, marks_obtained, total_marks, percentage, grade_letter, exam_date, semester)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [studentId, facultyId, subject, examType, marksObtained, totalMarks, percentage.toFixed(2), gradeLetter, examDate, null]
    );

    // Update performance summary
    await updatePerformanceSummary(studentId, subject);

    res.status(201).json({
      message: 'Grade added successfully',
      gradeId: result.insertId
    });
  } catch (error) {
    console.error('Error adding grade:', error);
    res.status(500).json({ error: 'Failed to add grade', details: error.message });
  }
});

// Helper function to update performance summary
async function updatePerformanceSummary(studentId, subject) {
  try {
    const [totals] = await db.execute(`
      SELECT 
        SUM(marks_obtained) as total_obtained,
        SUM(total_marks) as total_possible
      FROM grades 
      WHERE student_id = ? AND subject = ?
    `, [studentId, subject]);

    if (totals[0].total_possible > 0) {
      const percentage = (totals[0].total_obtained / totals[0].total_possible) * 100;
      let gradeLetter = 'F'; let status = 'fail';

      if (percentage >= 90)      { gradeLetter = 'A+'; status = 'excellent'; }
      else if (percentage >= 85) { gradeLetter = 'A';  status = 'excellent'; }
      else if (percentage >= 80) { gradeLetter = 'A-'; status = 'good'; }
      else if (percentage >= 75) { gradeLetter = 'B+'; status = 'good'; }
      else if (percentage >= 70) { gradeLetter = 'B';  status = 'average'; }
      else if (percentage >= 65) { gradeLetter = 'B-'; status = 'average'; }
      else if (percentage >= 60) { gradeLetter = 'C+'; status = 'average'; }
      else if (percentage >= 55) { gradeLetter = 'C';  status = 'poor'; }
      else if (percentage >= 50) { gradeLetter = 'C-'; status = 'poor'; }
      else if (percentage >= 40) { gradeLetter = 'D';  status = 'poor'; }

      const [attendance] = await db.execute(`
        SELECT COUNT(CASE WHEN status = 'Present' THEN 1 END) * 100.0 / COUNT(*) as attendance_percentage
        FROM attendance WHERE student_id = ?
      `, [studentId]);

      const attendancePercentage = attendance[0]?.attendance_percentage || 0;

      await db.execute(`
        INSERT INTO performance_summary 
          (student_id, subject, total_marks, obtained_marks, percentage, grade_letter, attendance_percentage, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_marks = VALUES(total_marks),
          obtained_marks = VALUES(obtained_marks),
          percentage = VALUES(percentage),
          grade_letter = VALUES(grade_letter),
          attendance_percentage = VALUES(attendance_percentage),
          status = VALUES(status)
      `, [studentId, subject, totals[0].total_possible, totals[0].total_obtained, percentage.toFixed(2), gradeLetter, attendancePercentage, status]);
    }
  } catch (error) {
    console.error('Error updating performance summary:', error);
  }
}

module.exports = router;