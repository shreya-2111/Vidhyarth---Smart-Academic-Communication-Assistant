const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// ==================== GET ALL FACULTY ====================
router.get('/faculty', authenticateToken, isAdmin, async (req, res) => {
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

// ==================== GET ALL CLASSES ====================
router.get('/classes', authenticateToken, isAdmin, async (req, res) => {
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
router.get('/subjects/:class_id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { class_id } = req.params;
    
    const [subjects] = await db.execute(
      `SELECT subject_id, subject_name, subject_code, credits
       FROM subjects
       WHERE class_id = ? AND is_active = 1
       ORDER BY subject_name`,
      [class_id]
    );
    
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// ==================== ASSIGN SUBJECTS TO FACULTY ====================
router.post('/assign', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { faculty_id, class_id, subject_ids, division } = req.body;
    
    if (!faculty_id || !class_id || !subject_ids || !Array.isArray(subject_ids) || subject_ids.length === 0) {
      return res.status(400).json({ 
        error: 'Faculty, Class, and at least one Subject are required' 
      });
    }
    
    let assignedCount = 0;
    for (const subject_id of subject_ids) {
      const [existing] = await db.execute(
        `SELECT id FROM faculty_subjects 
         WHERE faculty_id = ? AND class_id = ? AND subject_id = ? AND (division = ? OR (division IS NULL AND ? IS NULL)) AND is_active = 1`,
        [faculty_id, class_id, subject_id, division || null, division || null]
      );

      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO faculty_subjects (faculty_id, class_id, subject_id, division) VALUES (?, ?, ?, ?)`,
          [faculty_id, class_id, subject_id, division || null]
        );
        assignedCount++;
      }
    }
    
    res.status(201).json({
      message: `Successfully assigned ${assignedCount} subject(s) to faculty`,
      count: assignedCount
    });
    
  } catch (error) {
    console.error('Error assigning subjects:', error);
    res.status(500).json({ error: 'Failed to assign subjects' });
  }
});

// ==================== GET ALL ASSIGNMENTS ====================
router.get('/assignments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [assignments] = await db.execute(
      `SELECT 
         fs.id,
         fs.faculty_id,
         fs.class_id,
         fs.subject_id,
         fs.assigned_at,
         f.name AS faculty_name,
         f.email AS faculty_email,
         f.department AS faculty_department,
         c.class_name,
         c.semester,
         s.subject_name,
         s.subject_code,
         s.credits
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

// ==================== DELETE ASSIGNMENT ====================
router.delete('/assignments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if assignment exists
    const [existing] = await db.execute(
      `SELECT id FROM faculty_subjects WHERE id = ? AND is_active = 1`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Soft delete
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
router.get('/faculty/:faculty_id/assignments', authenticateToken, async (req, res) => {
  try {
    const { faculty_id } = req.params;
    
    const [assignments] = await db.execute(
      `SELECT 
         fs.id,
         fs.class_id,
         fs.subject_id,
         fs.division,
         c.class_name,
         c.semester,
         s.subject_name,
         s.subject_code,
         s.credits
       FROM faculty_subjects fs
       INNER JOIN classes c ON fs.class_id = c.class_id
       INNER JOIN subjects s ON fs.subject_id = s.subject_id
       WHERE fs.faculty_id = ? AND fs.is_active = 1
       ORDER BY c.class_name, s.subject_name`,
      [faculty_id]
    );
    
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching faculty assignments:', error);
    res.status(500).json({ error: 'Failed to fetch faculty assignments' });
  }
});

// ==================== ADD NEW CLASS (MSCIT only) ====================
router.post('/classes', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { class_name, semester } = req.body;
    // department is always 'Msc.IT' - no need to accept it from client
    
    if (!class_name) {
      return res.status(400).json({ error: 'Class name is required' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO classes (class_name, semester, department) 
       VALUES (?, ?, 'Msc.IT')`,
      [class_name, semester || null]
    );
    
    res.status(201).json({
      message: 'Class created successfully',
      class_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// ==================== ADD NEW SUBJECT (MSCIT only) ====================
router.post('/subjects', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { subject_name, subject_code, class_id, credits } = req.body;
    // department is always 'Msc.IT' - no need to accept it from client
    
    if (!subject_name || !class_id) {
      return res.status(400).json({ error: 'Subject name and class are required' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO subjects (subject_name, subject_code, class_id, credits) 
       VALUES (?, ?, ?, ?)`,
      [subject_name, subject_code || null, class_id, credits || 3]
    );
    
    res.status(201).json({
      message: 'Subject created successfully',
      subject_id: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Subject code already exists' });
    }
    console.error('Error creating subject:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// ==================== DELETE CLASS ====================
router.delete('/classes/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    await db.execute(
      `UPDATE classes SET is_active = 0 WHERE class_id = ?`,
      [id]
    );
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// ==================== DELETE SUBJECT ====================
router.delete('/subjects/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    await db.execute(
      `UPDATE subjects SET is_active = 0 WHERE subject_id = ?`,
      [id]
    );
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

module.exports = router;
