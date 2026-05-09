const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ==================== GET ALL FACULTY ====================
// Endpoint: GET /api/faculty-assignments/faculty
router.get('/faculty', authenticateToken, async (req, res) => {
  try {
    const [faculty] = await db.execute(
      `SELECT faculty_id, name, email, department 
       FROM faculty 
       WHERE is_active = 1 
       ORDER BY name`
    );
    res.json(faculty);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// ==================== GET ALL CLASSES (MSCIT only) ====================
// Endpoint: GET /api/faculty-assignments/classes
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

// ==================== GET SUBJECTS BY CLASS ====================
// Endpoint: GET /api/faculty-assignments/subjects/:classId
router.get('/subjects/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;
    
    const [subjects] = await db.execute(
      `SELECT subject_id, subject_code, subject_name, credits
       FROM subjects
       WHERE class_id = ? AND is_active = 1
       ORDER BY subject_name`,
      [classId]
    );
    
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// ==================== GET ALL ASSIGNMENTS ====================
// Endpoint: GET /api/faculty-assignments/assignments
router.get('/assignments', authenticateToken, async (req, res) => {
  try {
    const [assignments] = await db.execute(
      `SELECT 
         fs.id as assignment_id,
         fs.faculty_id,
         fs.class_id,
         fs.subject_id,
         fs.assigned_at,
         f.name AS faculty_name,
         f.email AS faculty_email,
         c.class_name,
         s.subject_name,
         s.subject_code
       FROM faculty_subjects fs
       INNER JOIN faculty f ON fs.faculty_id = f.faculty_id
       INNER JOIN classes c ON fs.class_id = c.class_id
       INNER JOIN subjects s ON fs.subject_id = s.subject_id
       WHERE fs.is_active = 1
       ORDER BY f.name, c.class_name, s.subject_name`
    );
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// ==================== CREATE NEW ASSIGNMENT ====================
// Endpoint: POST /api/faculty-assignments/assign
router.post('/assign', authenticateToken, async (req, res) => {
  try {
    const { faculty_id, class_id, subject_id } = req.body;
    
    if (!faculty_id || !class_id || !subject_id) {
      return res.status(400).json({ 
        error: 'Faculty, Class, and Subject are required' 
      });
    }
    
    // Check if assignment already exists
    const [existing] = await db.execute(
      `SELECT id FROM faculty_subjects 
       WHERE faculty_id = ? AND class_id = ? AND subject_id = ? AND is_active = 1`,
      [faculty_id, class_id, subject_id]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ error: 'This assignment already exists' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO faculty_subjects (faculty_id, class_id, subject_id) VALUES (?, ?, ?)`,
      [faculty_id, class_id, subject_id]
    );
    
    const [newAssignment] = await db.execute(
      `SELECT fs.id as assignment_id, fs.faculty_id, fs.class_id, fs.subject_id,
              f.name AS faculty_name, c.class_name, s.subject_name
       FROM faculty_subjects fs
       INNER JOIN faculty f ON fs.faculty_id = f.faculty_id
       INNER JOIN classes c ON fs.class_id = c.class_id
       INNER JOIN subjects s ON fs.subject_id = s.subject_id
       WHERE fs.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Assignment created successfully',
      assignment: newAssignment[0]
    });
    
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// ==================== DELETE ASSIGNMENT ====================
// Endpoint: DELETE /api/faculty-assignments/assignments/:id
router.delete('/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.execute(
      `SELECT id FROM faculty_subjects WHERE id = ? AND is_active = 1`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    await db.execute(
      `UPDATE faculty_subjects SET is_active = 0 WHERE id = ?`,
      [id]
    );
    
    res.json({ message: 'Assignment deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// ==================== GET ASSIGNMENTS BY FACULTY ====================
// Endpoint: GET /api/faculty-assignments/faculty/:facultyId/assignments
router.get('/faculty/:facultyId/assignments', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    const [assignments] = await db.execute(
      `SELECT fs.id as assignment_id, fs.class_id, fs.subject_id,
              c.class_name, s.subject_name, s.subject_code, fs.assigned_at
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

module.exports = router;
