const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isVercel = process.env.VERCEL === '1';
    const uploadDir = isVercel 
      ? path.join('/tmp', 'uploads', 'assignments')
      : path.join(__dirname, '../uploads/assignments');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp_originalname
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// File upload endpoint
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate file URL (relative path that can be served)
    const fileUrl = `/uploads/assignments/${req.file.filename}`;
    
    console.log('File uploaded:', req.file.filename);

    res.json({
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

// Get all assignments for a faculty with submission stats
router.get('/faculty/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;

    console.log('Fetching assignments for faculty:', facultyId);

    const query = `
      SELECT 
        a.assignment_id,
        a.faculty_id,
        a.course,
        a.title,
        a.description,
        a.file_url,
        a.deadline,
        a.created_at,
        COUNT(DISTINCT asub.submission_id) as total_submissions,
        COUNT(DISTINCT CASE WHEN asub.status = 'submitted' THEN asub.submission_id END) as submitted_count,
        COUNT(DISTINCT CASE WHEN asub.status = 'pending' THEN asub.submission_id END) as pending_count,
        COUNT(DISTINCT CASE WHEN asub.status = 'late' THEN asub.submission_id END) as late_count
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON a.assignment_id = asub.assignment_id
      WHERE a.faculty_id = ?
      GROUP BY a.assignment_id
      ORDER BY a.created_at DESC
    `;

    const [assignments] = await db.execute(query, [facultyId]);

    console.log('Found assignments:', assignments.length);

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments', details: error.message });
  }
});

// Get assignment statistics for dashboard
router.get('/stats/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;

    // Get total assignments count
    const [totalResult] = await db.execute(
      'SELECT COUNT(*) as total FROM assignments WHERE faculty_id = ?',
      [facultyId]
    );

    // Get assignments with submission counts
    const [assignmentsWithStats] = await db.execute(`
      SELECT 
        a.assignment_id,
        a.title,
        a.deadline,
        COUNT(asub.submission_id) as submitted_count,
        (SELECT COUNT(*) FROM student) as total_students
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON a.assignment_id = asub.assignment_id
      WHERE a.faculty_id = ?
      GROUP BY a.assignment_id
    `, [facultyId]);

    let totalSubmitted = 0;
    let totalPending = 0;
    let totalStudents = 0;

    if (assignmentsWithStats.length > 0) {
      totalStudents = assignmentsWithStats[0].total_students || 0;
      
      assignmentsWithStats.forEach(assignment => {
        totalSubmitted += assignment.submitted_count;
        totalPending += (totalStudents - assignment.submitted_count);
      });
    }

    res.json({
      total: totalResult[0].total,
      submitted: totalSubmitted,
      pending: totalPending,
      totalStudents: totalStudents
    });
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({ error: 'Failed to fetch assignment statistics' });
  }
});

// Get single assignment with detailed submission info
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        a.*,
        COUNT(DISTINCT asub.submission_id) as total_submissions,
        COUNT(DISTINCT CASE WHEN asub.status = 'submitted' THEN asub.submission_id END) as submitted_count,
        COUNT(DISTINCT CASE WHEN asub.status = 'pending' THEN asub.submission_id END) as pending_count,
        COUNT(DISTINCT CASE WHEN asub.status = 'late' THEN asub.submission_id END) as late_count
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON a.assignment_id = asub.assignment_id
      WHERE a.assignment_id = ?
      GROUP BY a.assignment_id
    `;

    const [assignments] = await db.execute(query, [id]);

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignments[0]);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Get submissions for a specific assignment
router.get('/:id/submissions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        asub.*,
        s.name as student_name,
        s.roll_no,
        s.email as student_email
      FROM assignment_submissions asub
      INNER JOIN student s ON asub.student_id = s.student_id
      WHERE asub.assignment_id = ?
      ORDER BY asub.status, s.name
    `;

    const [submissions] = await db.execute(query, [id]);

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Create new assignment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { course, title, description, deadline, fileUrl } = req.body;
    const facultyId = req.user.userId;

    console.log('Creating assignment:', { facultyId, course, title, deadline, fileUrl });
    console.log('Request body:', req.body);

    // Validate required fields
    if (!course || !title || !deadline) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          course: !course ? 'Course is required' : null,
          title: !title ? 'Title is required' : null,
          deadline: !deadline ? 'Deadline is required' : null
        }
      });
    }

    const query = `
      INSERT INTO assignments (faculty_id, course, title, description, file_url, deadline)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      facultyId,
      course,
      title,
      description || null,
      fileUrl || null,
      deadline
    ]);

    console.log('Assignment created with ID:', result.insertId);

    res.status(201).json({
      message: 'Assignment created successfully',
      assignmentId: result.insertId
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create assignment', 
      details: error.message,
      sqlMessage: error.sqlMessage || null
    });
  }
});

// Update assignment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { course, title, description, deadline, fileUrl } = req.body;

    const query = `
      UPDATE assignments 
      SET course = ?, title = ?, description = ?, file_url = ?, deadline = ?
      WHERE assignment_id = ?
    `;

    await db.execute(query, [
      course,
      title,
      description || null,
      fileUrl || null,
      deadline,
      id
    ]);

    res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete assignment (submissions will be deleted automatically due to CASCADE)
    await db.execute('DELETE FROM assignments WHERE assignment_id = ?', [id]);

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Update submission status (for students)
router.put('/submissions/:submissionId', authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, submissionUrl, marksObtained, feedback } = req.body;

    const query = `
      UPDATE assignment_submissions 
      SET status = ?, 
          submission_url = ?,
          marks_obtained = ?,
          feedback = ?,
          submitted_at = CASE WHEN status = 'submitted' THEN NOW() ELSE submitted_at END
      WHERE submission_id = ?
    `;

    await db.execute(query, [
      status,
      submissionUrl || null,
      marksObtained || null,
      feedback || null,
      submissionId
    ]);

    res.json({ message: 'Submission updated successfully' });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

module.exports = router;