const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVercel = process.env.VERCEL === '1';
    const uploadDir = isVercel
      ? path.join('/tmp', 'uploads', 'documents')
      : path.join(__dirname, '../uploads/documents');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common document types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, TXT, and image files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Get all documents for a faculty
router.get('/faculty/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { subject, category, semester } = req.query;

    let query = `
      SELECT 
        d.*,
        f.name as faculty_name,
        (SELECT COUNT(*) FROM document_access da WHERE da.document_id = d.document_id AND da.access_type = 'download') as download_count
      FROM documents d
      JOIN faculty f ON d.faculty_id = f.faculty_id
      WHERE d.faculty_id = ?
    `;

    const params = [facultyId];

    if (subject) {
      query += ' AND d.subject = ?';
      params.push(subject);
    }

    if (category) {
      query += ' AND d.category = ?';
      params.push(category);
    }

    if (semester) {
      query += ' AND d.semester = ?';
      params.push(semester);
    }

    query += ' ORDER BY d.created_at DESC';

    const [documents] = await db.execute(query, params);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get all public documents (for students and general access)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { subject, category, semester, facultyId } = req.query;

    let query = `
      SELECT 
        d.*,
        f.name as faculty_name,
        (SELECT COUNT(*) FROM document_access da WHERE da.document_id = d.document_id AND da.access_type = 'download') as download_count
      FROM documents d
      JOIN faculty f ON d.faculty_id = f.faculty_id
      WHERE d.is_public = TRUE
    `;

    const params = [];

    if (subject) {
      query += ' AND d.subject = ?';
      params.push(subject);
    }

    if (category) {
      query += ' AND d.category = ?';
      params.push(category);
    }

    if (semester) {
      query += ' AND d.semester = ?';
      params.push(semester);
    }

    if (facultyId) {
      query += ' AND d.faculty_id = ?';
      params.push(facultyId);
    }

    query += ' ORDER BY d.created_at DESC';

    const [documents] = await db.execute(query, params);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching all documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get public documents (for students)
router.get('/public', authenticateToken, async (req, res) => {
  try {
    const { subject, category, semester, facultyId } = req.query;

    let query = `
      SELECT 
        d.*,
        f.name as faculty_name,
        (SELECT COUNT(*) FROM document_access da WHERE da.document_id = d.document_id AND da.access_type = 'download') as download_count
      FROM documents d
      JOIN faculty f ON d.faculty_id = f.faculty_id
      WHERE d.is_public = TRUE
    `;

    const params = [];

    if (subject) {
      query += ' AND d.subject = ?';
      params.push(subject);
    }

    if (category) {
      query += ' AND d.category = ?';
      params.push(category);
    }

    if (semester) {
      query += ' AND d.semester = ?';
      params.push(semester);
    }

    if (facultyId) {
      query += ' AND d.faculty_id = ?';
      params.push(facultyId);
    }

    query += ' ORDER BY d.created_at DESC';

    const [documents] = await db.execute(query, params);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching public documents:', error);
    res.status(500).json({ error: 'Failed to fetch public documents' });
  }
});

// Upload document
router.post('/upload', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const {
      title,
      description,
      subject,
      category,
      semester,
      isPublic
    } = req.body;

    const facultyId = req.user.userId;

    const query = `
      INSERT INTO documents (
        faculty_id, title, description, file_name, file_path, file_size, 
        file_type, subject, category, semester, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      facultyId,
      title,
      description || null,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      subject || null,
      category || 'other',
      semester || null,
      isPublic === 'true'
    ]);

    res.status(201).json({
      message: 'Document uploaded successfully',
      documentId: result.insertId,
      fileName: req.file.originalname
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    // Clean up uploaded file if database insert fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Download document
router.get('/download/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;

    // Get document info
    const [documents] = await db.execute(
      'SELECT * FROM documents WHERE document_id = ?',
      [documentId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = documents[0];

    // Check if user has access (faculty can access their own docs, students can access public docs)
    if (userType === 'student' && !document.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (userType === 'faculty' && document.faculty_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Log the access
    await db.execute(
      'INSERT INTO document_access (document_id, user_id, user_type, access_type) VALUES (?, ?, ?, ?)',
      [documentId, userId, userType, 'download']
    );

    // Update download count
    await db.execute(
      'UPDATE documents SET download_count = download_count + 1 WHERE document_id = ?',
      [documentId]
    );

    // Send file
    res.download(document.file_path, document.file_name);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// Delete document
router.delete('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const facultyId = req.user.userId;

    // Get document info
    const [documents] = await db.execute(
      'SELECT * FROM documents WHERE document_id = ? AND faculty_id = ?',
      [documentId, facultyId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    const document = documents[0];

    // Delete file from filesystem
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Delete from database
    await db.execute('DELETE FROM documents WHERE document_id = ?', [documentId]);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Update document info
router.put('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const facultyId = req.user.userId;
    const { title, description, subject, category, semester, isPublic } = req.body;

    const query = `
      UPDATE documents 
      SET title = ?, description = ?, subject = ?, category = ?, semester = ?, is_public = ?
      WHERE document_id = ? AND faculty_id = ?
    `;

    const [result] = await db.execute(query, [
      title,
      description || null,
      subject || null,
      category || 'other',
      semester || null,
      isPublic,
      documentId,
      facultyId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    res.json({ message: 'Document updated successfully' });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Get document statistics
router.get('/stats/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;

    const [totalDocs] = await db.execute(
      'SELECT COUNT(*) as count FROM documents WHERE faculty_id = ?',
      [facultyId]
    );

    const [totalDownloads] = await db.execute(
      'SELECT SUM(download_count) as total FROM documents WHERE faculty_id = ?',
      [facultyId]
    );

    const [categoryStats] = await db.execute(
      'SELECT category, COUNT(*) as count FROM documents WHERE faculty_id = ? GROUP BY category',
      [facultyId]
    );

    const [subjectStats] = await db.execute(
      'SELECT subject, COUNT(*) as count FROM documents WHERE faculty_id = ? AND subject IS NOT NULL GROUP BY subject',
      [facultyId]
    );

    const [recentActivity] = await db.execute(`
      SELECT 
        da.access_type,
        da.accessed_at,
        d.title,
        CASE 
          WHEN da.user_type = 'student' THEN s.name
          WHEN da.user_type = 'faculty' THEN f.name
        END as user_name
      FROM document_access da
      JOIN documents d ON da.document_id = d.document_id
      LEFT JOIN student s ON da.user_id = s.student_id AND da.user_type = 'student'
      LEFT JOIN faculty f ON da.user_id = f.faculty_id AND da.user_type = 'faculty'
      WHERE d.faculty_id = ?
      ORDER BY da.accessed_at DESC
      LIMIT 10
    `, [facultyId]);

    res.json({
      totalDocuments: totalDocs[0].count,
      totalDownloads: totalDownloads[0].total || 0,
      categoryStats,
      subjectStats,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ error: 'Failed to fetch document statistics' });
  }
});

// Get filter options
router.get('/filters/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;

    const [subjects] = await db.execute(
      'SELECT DISTINCT subject FROM documents WHERE faculty_id = ? AND subject IS NOT NULL ORDER BY subject',
      [facultyId]
    );

    const [semesters] = await db.execute(
      'SELECT DISTINCT semester FROM documents WHERE faculty_id = ? AND semester IS NOT NULL ORDER BY semester',
      [facultyId]
    );

    const categories = [
      'lecture_notes',
      'slides',
      'assignments',
      'reference',
      'syllabus',
      'other'
    ];

    res.json({
      subjects: subjects.map(s => s.subject),
      semesters: semesters.map(s => s.semester),
      categories
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// Get filter options for public documents (for students)
router.get('/filters/public', authenticateToken, async (req, res) => {
  try {
    const [subjects] = await db.execute(
      'SELECT DISTINCT subject FROM documents WHERE is_public = TRUE AND subject IS NOT NULL ORDER BY subject'
    );

    const [semesters] = await db.execute(
      'SELECT DISTINCT semester FROM documents WHERE is_public = TRUE AND semester IS NOT NULL ORDER BY semester'
    );

    const categories = [
      'lecture_notes',
      'slides',
      'assignments',
      'reference',
      'syllabus',
      'other'
    ];

    res.json({
      subjects: subjects.map(s => s.subject),
      semesters: semesters.map(s => s.semester),
      categories
    });
  } catch (error) {
    console.error('Error fetching public filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

module.exports = router;