const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Admin-only middleware
const isAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Multer - store Excel in uploads/excel
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/excel');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `import_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

// POST /api/excel/import - Upload and process Excel
router.post('/import', authenticateToken, isAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty or has no data rows' });
    }

    const results = { imported: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      // Normalize column names (trim whitespace)
      const data = {};
      for (const key of Object.keys(row)) {
        data[key.trim().toLowerCase().replace(/\s+/g, '_')] = 
          typeof row[key] === 'string' ? row[key].trim() : row[key];
      }

      // Required field validation
      const name = data.name || data.full_name || data.student_name;
      const email = data.email;
      const password = data.password || data.default_password;
      const enrollmentNo = data.enrollment_no || data.enrollment || data.student_id;

      if (!name || !email || !password) {
        results.errors.push(`Row skipped - missing name/email/password: ${JSON.stringify(data)}`);
        results.skipped++;
        continue;
      }

      // Email format validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.errors.push(`Invalid email: ${email}`);
        results.skipped++;
        continue;
      }

      // Check for duplicate email
      const [existing] = await db.execute(
        'SELECT student_id FROM student WHERE email = ?', [email]
      );
      if (existing.length > 0) {
        results.errors.push(`Duplicate email skipped: ${email}`);
        results.skipped++;
        continue;
      }

      // Check for duplicate enrollment_no
      if (enrollmentNo) {
        const [existingEnroll] = await db.execute(
          'SELECT student_id FROM student WHERE enrollment_no = ?', [enrollmentNo]
        );
        if (existingEnroll.length > 0) {
          results.errors.push(`Duplicate enrollment_no skipped: ${enrollmentNo}`);
          results.skipped++;
          continue;
        }
      }

      // Hash the default password
      const hashedPassword = await bcrypt.hash(String(password), 10);

      // Insert student - is_password_reset = 0 (must reset on first login)
      await db.execute(
        `INSERT INTO student 
          (enrollment_no, name, email, password, department, class, division, roll_no, phone, is_active, is_password_reset)
         VALUES (?, ?, ?, ?, 'Msc.IT', ?, ?, ?, ?, 1, 0)`,
        [
          enrollmentNo || null,
          name,
          email,
          hashedPassword,
          data.class || data.class_name || '',
          data.division || null,
          data.roll_no ? String(data.roll_no) : null,
          data.phone ? String(data.phone) : null
        ]
      );

      results.imported++;
    }

    res.json({
      success: true,
      message: `Import complete: ${results.imported} imported, ${results.skipped} skipped`,
      ...results
    });

  } catch (error) {
    console.error('Excel import error:', error);
    res.status(500).json({ error: 'Failed to process Excel file', details: error.message });
  }
});

// GET /api/excel/template - Download template info
router.get('/template-info', authenticateToken, isAdmin, (req, res) => {
  res.json({
    columns: [
      { field: 'enrollment_no', required: false, example: 'MSC001' },
      { field: 'name', required: true, example: 'Aarav Shah' },
      { field: 'email', required: true, example: 'aarav@vidhyarth.com' },
      { field: 'password', required: true, example: 'Aarav@123' },
      { field: 'class', required: false, example: 'Msc.IT 1st Year' },
      { field: 'division', required: false, example: 'A' },
      { field: 'roll_no', required: false, example: '01' },
      { field: 'phone', required: false, example: '9876543201' }
    ],
    note: 'Password will be hashed. Students must reset on first login.'
  });
});

module.exports = router;
