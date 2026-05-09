const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// NOTE: Department endpoints removed - system is MSCIT only.
// All data is implicitly scoped to the Msc.IT department.

// ==================== CLASSES ====================

// Get all classes (MSCIT only)
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    const [classes] = await db.execute(
      `SELECT class_id, class_name, semester, department
       FROM classes
       WHERE is_active = 1
       ORDER BY class_name`
    );
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get class by ID
router.get('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const [classes] = await db.execute(
      'SELECT class_id, class_name, semester, department FROM classes WHERE class_id = ?',
      [req.params.id]
    );
    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.json(classes[0]);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// ==================== SUBJECTS ====================

// Get all subjects (optionally filtered by class_id)
router.get('/subjects', authenticateToken, async (req, res) => {
  try {
    const { class_id } = req.query;
    let query = 'SELECT subject_id, subject_name, subject_code, class_id, credits FROM subjects WHERE is_active = 1';
    const params = [];

    if (class_id) {
      query += ' AND class_id = ?';
      params.push(class_id);
    }

    query += ' ORDER BY subject_name';
    const [subjects] = await db.execute(query, params);
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get subject by ID
router.get('/subjects/:id', authenticateToken, async (req, res) => {
  try {
    const [subjects] = await db.execute(
      'SELECT subject_id, subject_name, subject_code, class_id, credits FROM subjects WHERE subject_id = ?',
      [req.params.id]
    );
    if (subjects.length === 0) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json(subjects[0]);
  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// ==================== FACULTY ASSIGNMENTS ====================

// Get classes assigned to a faculty
router.get('/faculty/:facultyId/classes', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const [classes] = await db.execute(
      `SELECT DISTINCT c.class_id, c.class_name, c.semester
       FROM faculty_subjects fs
       INNER JOIN classes c ON fs.class_id = c.class_id
       WHERE fs.faculty_id = ? AND fs.is_active = 1 AND c.is_active = 1
       ORDER BY c.class_name`,
      [facultyId]
    );
    res.json(classes);
  } catch (error) {
    console.error('Error fetching faculty classes:', error);
    res.status(500).json({ error: 'Failed to fetch faculty classes' });
  }
});

// Get subjects assigned to a faculty for a specific class
router.get('/faculty/:facultyId/classes/:classId/subjects', authenticateToken, async (req, res) => {
  try {
    const { facultyId, classId } = req.params;
    const [subjects] = await db.execute(
      `SELECT DISTINCT s.subject_id, s.subject_code, s.subject_name, s.credits
       FROM faculty_subjects fs
       INNER JOIN subjects s ON fs.subject_id = s.subject_id
       WHERE fs.faculty_id = ? AND fs.class_id = ? AND fs.is_active = 1 AND s.is_active = 1
       ORDER BY s.subject_name`,
      [facultyId, classId]
    );
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching faculty subjects:', error);
    res.status(500).json({ error: 'Failed to fetch faculty subjects' });
  }
});

// Get all assignments for a faculty
router.get('/faculty/:facultyId/assignments', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const [assignments] = await db.execute(
      `SELECT fs.id, fs.faculty_id, fs.class_id, fs.subject_id, fs.is_active,
              c.class_name, s.subject_name
       FROM faculty_subjects fs
       INNER JOIN classes c ON fs.class_id = c.class_id
       INNER JOIN subjects s ON fs.subject_id = s.subject_id
       WHERE fs.faculty_id = ? AND fs.is_active = 1
       ORDER BY c.class_name, s.subject_name`,
      [facultyId]
    );
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching faculty assignments:', error);
    res.status(500).json({ error: 'Failed to fetch faculty assignments' });
  }
});

// ==================== STUDENT DATA ====================

// Get students by class
router.get('/students/class/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    const [students] = await db.execute(
      `SELECT s.student_id, s.name, s.email, s.roll_no, s.phone, c.class_name
       FROM student s
       INNER JOIN classes c ON s.class = c.class_name
       WHERE c.class_id = ? AND s.is_active = 1
       ORDER BY s.roll_no`,
      [classId]
    );
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// ==================== ACADEMIC YEARS & SEMESTERS ====================

// Get distinct semesters
router.get('/semesters', authenticateToken, async (req, res) => {
  try {
    const [semesters] = await db.execute(
      `SELECT DISTINCT semester FROM classes WHERE semester IS NOT NULL ORDER BY semester`
    );
    res.json(semesters.map(s => s.semester));
  } catch (error) {
    console.error('Error fetching semesters:', error);
    res.status(500).json({ error: 'Failed to fetch semesters' });
  }
});

// ==================== DROPDOWN DATA ====================

// Get all dropdown data in one call (MSCIT only - no department dropdown needed)
router.get('/dropdowns', authenticateToken, async (req, res) => {
  try {
    const [classes] = await db.execute(
      'SELECT class_id, class_name, semester FROM classes WHERE is_active = 1 ORDER BY class_name'
    );

    const [subjects] = await db.execute(
      'SELECT subject_id, subject_code, subject_name, class_id, credits FROM subjects WHERE is_active = 1 ORDER BY subject_name'
    );

    const [semesters] = await db.execute(
      'SELECT DISTINCT semester FROM classes WHERE semester IS NOT NULL ORDER BY semester'
    );

    res.json({
      department: 'Msc.IT', // single fixed department
      classes,
      subjects,
      semesters: semesters.map(s => s.semester)
    });
  } catch (error) {
    console.error('Error fetching dropdown data:', error);
    res.status(500).json({ error: 'Failed to fetch dropdown data' });
  }
});

module.exports = router;
