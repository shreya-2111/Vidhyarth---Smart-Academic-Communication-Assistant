const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
};

// Get system status
router.get('/system-status', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Check database status
    let databaseStatus = 'Offline';
    let databaseMessage = '';
    try {
      await db.execute('SELECT 1');
      databaseStatus = 'Online';
      databaseMessage = 'Connected';
    } catch (error) {
      databaseMessage = 'Connection failed';
    }

    // API Server is running if this endpoint is responding
    const apiServerStatus = 'Running';
    const apiServerMessage = `Port ${process.env.PORT || 5001}`;

    // Check storage usage - Calculate actual disk usage for uploads
    const uploadsPath = path.join(__dirname, '../uploads');
    let storageStatus = 'Unknown';
    let storageMessage = 'N/A';
    let storagePercentage = 0;
    
    try {
      // Calculate uploads folder size recursively
      const getDirectorySize = (dirPath) => {
        let size = 0;
        try {
          if (!fs.existsSync(dirPath)) {
            return 0;
          }
          const files = fs.readdirSync(dirPath);
          files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              size += getDirectorySize(filePath);
            } else {
              size += stat.size;
            }
          });
        } catch (err) {
          console.error('Error reading directory:', err);
        }
        return size;
      };

      const uploadSize = getDirectorySize(uploadsPath);
      const uploadSizeMB = (uploadSize / (1024 * 1024)).toFixed(2);
      const uploadSizeGB = (uploadSize / (1024 * 1024 * 1024)).toFixed(2);
      
      // Define storage limits (you can adjust these)
      const maxStorageGB = 10; // 10 GB limit for uploads
      const maxStorageBytes = maxStorageGB * 1024 * 1024 * 1024;
      
      storagePercentage = ((uploadSize / maxStorageBytes) * 100).toFixed(1);
      
      // Format message based on size
      if (uploadSize < 1024 * 1024) {
        // Less than 1 MB
        const sizeKB = (uploadSize / 1024).toFixed(2);
        storageMessage = `${sizeKB} KB / ${maxStorageGB} GB (${storagePercentage}%)`;
      } else if (uploadSize < 1024 * 1024 * 1024) {
        // Less than 1 GB
        storageMessage = `${uploadSizeMB} MB / ${maxStorageGB} GB (${storagePercentage}%)`;
      } else {
        // 1 GB or more
        storageMessage = `${uploadSizeGB} GB / ${maxStorageGB} GB (${storagePercentage}%)`;
      }
      
      // Set status based on percentage
      if (storagePercentage < 70) {
        storageStatus = 'Good';
      } else if (storagePercentage < 85) {
        storageStatus = 'Warning';
      } else {
        storageStatus = 'Critical';
      }
    } catch (error) {
      console.error('Error checking storage:', error);
      storageMessage = 'Unable to check';
    }

    // Check last backup (check if backup files exist)
    let backupStatus = 'Unknown';
    let backupMessage = 'No backup found';
    
    try {
      const backupPath = path.join(__dirname, '../backups');
      if (fs.existsSync(backupPath)) {
        const backupFiles = fs.readdirSync(backupPath);
        if (backupFiles.length > 0) {
          // Get the most recent backup file
          const backupStats = backupFiles.map(file => ({
            file,
            time: fs.statSync(path.join(backupPath, file)).mtime.getTime()
          }));
          backupStats.sort((a, b) => b.time - a.time);
          
          const lastBackupTime = new Date(backupStats[0].time);
          const hoursSinceBackup = (Date.now() - lastBackupTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceBackup < 24) {
            backupStatus = 'Up to date';
            backupMessage = `Last backup: ${Math.floor(hoursSinceBackup)}h ago`;
          } else if (hoursSinceBackup < 168) { // 7 days
            backupStatus = 'Warning';
            backupMessage = `Last backup: ${Math.floor(hoursSinceBackup / 24)}d ago`;
          } else {
            backupStatus = 'Outdated';
            backupMessage = `Last backup: ${Math.floor(hoursSinceBackup / 24)}d ago`;
          }
        } else {
          backupStatus = 'No backup';
          backupMessage = 'No backup files found';
        }
      } else {
        backupStatus = 'Not configured';
        backupMessage = 'Backup folder not found';
      }
    } catch (error) {
      console.error('Error checking backup:', error);
      backupMessage = 'Unable to check';
    }

    res.json({
      database: {
        status: databaseStatus,
        message: databaseMessage
      },
      apiServer: {
        status: apiServerStatus,
        message: apiServerMessage
      },
      storage: {
        status: storageStatus,
        message: storageMessage,
        percentage: storagePercentage
      },
      backup: {
        status: backupStatus,
        message: backupMessage
      },
      systemInfo: {
        platform: os.platform(),
        uptime: Math.floor(os.uptime() / 3600), // hours
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Error fetching system status:', error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
});

// Get dashboard stats
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [facultyCount] = await db.execute('SELECT COUNT(*) as count FROM faculty');
    const [studentCount] = await db.execute('SELECT COUNT(*) as count FROM student');
    const [assignmentCount] = await db.execute('SELECT COUNT(*) as count FROM assignments');
    const [classCount] = await db.execute('SELECT COUNT(DISTINCT department) as count FROM student');

    res.json({
      totalFaculty: facultyCount[0].count,
      totalStudents: studentCount[0].count,
      totalAssignments: assignmentCount[0].count,
      totalClasses: classCount[0].count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all users (faculty or students)
router.get('/users/:type', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const table = type === 'faculty' ? 'faculty' : 'student';
    
    const [users] = await db.execute(`SELECT * FROM ${table} ORDER BY created_at DESC`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add new user (faculty or student)
router.post('/users/:type', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { name, email, password, department, class: className, subject } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const table = type === 'faculty' ? 'faculty' : 'student';
    
    let query, params;
    if (type === 'faculty') {
      query = `INSERT INTO \`${table}\` (\`name\`, \`email\`, \`password\`, \`department\`, \`class\`, \`subject\`) VALUES (?, ?, ?, ?, ?, ?)`;
      params = [name, email, hashedPassword, department, className || null, subject || null];
    } else {
      query = `INSERT INTO \`${table}\` (\`name\`, \`email\`, \`password\`, \`department\`) VALUES (?, ?, ?, ?)`;
      params = [name, email, hashedPassword, department];
    }

    const [result] = await db.execute(query, params);

    res.status(201).json({
      message: `${type} added successfully`,
      id: result.insertId
    });
  } catch (error) {
    console.error('Error adding user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Delete user
router.delete('/users/:type/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const table = type === 'faculty' ? 'faculty' : 'student';
    const idField = type === 'faculty' ? 'faculty_id' : 'student_id';

    await db.execute(`DELETE FROM ${table} WHERE ${idField} = ?`, [id]);

    res.json({ message: `${type} deleted successfully` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all assignments
router.get('/assignments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        a.*,
        f.name as faculty_name,
        COUNT(asub.submission_id) as total_submissions
      FROM assignments a
      LEFT JOIN faculty f ON a.faculty_id = f.faculty_id
      LEFT JOIN assignment_submissions asub ON a.assignment_id = asub.assignment_id
      GROUP BY a.assignment_id
      ORDER BY a.created_at DESC
    `;

    const [assignments] = await db.execute(query);
    res.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get attendance statistics
router.get('/attendance/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late_count
      FROM attendance
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Failed to fetch attendance stats' });
  }
});

// ==================== SETTINGS ENDPOINTS ====================

// Get system settings
router.get('/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    // In a real app, these would be stored in a settings table
    // For now, return default values
    res.json({
      systemName: 'Vidhyarth University',
      systemEmail: 'admin@vidhyarth.edu',
      academicYear: '2025-2026',
      semester: 'Spring 2026',
      enableNotifications: true,
      enableEmailAlerts: true,
      autoBackup: true,
      maintenanceMode: false
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update system settings
router.put('/settings', authenticateToken, isAdmin, async (req, res) => {
  try {
    // In a real app, save to settings table
    // For now, just return success
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get system statistics
router.get('/system-stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Get database size
    const [dbSize] = await db.execute(`
      SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
      FROM information_schema.tables
      WHERE table_schema = 'vidhyarth_db'
    `);

    // Get total records
    const [facultyCount] = await db.execute('SELECT COUNT(*) as count FROM faculty');
    const [studentCount] = await db.execute('SELECT COUNT(*) as count FROM student');
    const [assignmentCount] = await db.execute('SELECT COUNT(*) as count FROM assignments');
    const [attendanceCount] = await db.execute('SELECT COUNT(*) as count FROM attendance');

    const totalRecords = 
      facultyCount[0].count + 
      studentCount[0].count + 
      assignmentCount[0].count + 
      attendanceCount[0].count;

    res.json({
      databaseSize: `${dbSize[0].size_mb || 0} MB`,
      totalRecords,
      lastBackup: 'Never', // Would track in settings table
      uptime: '0 days' // Would calculate from server start time
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
});

// Change admin password
router.post('/change-password', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    // Get current password hash
    const [admin] = await db.execute(
      'SELECT password FROM admin WHERE admin_id = ?',
      [adminId]
    );

    if (admin.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, admin[0].password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.execute(
      'UPDATE admin SET password = ? WHERE admin_id = ?',
      [hashedPassword, adminId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Backup database (placeholder)
router.post('/backup', authenticateToken, isAdmin, async (req, res) => {
  try {
    // In a real app, this would trigger a database backup
    // For now, just return success
    res.json({ message: 'Backup created successfully' });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Clear cache - Actually clear temporary files and cache
router.post('/clear-cache', authenticateToken, isAdmin, async (req, res) => {
  try {
    let clearedItems = [];
    
    // 1. Clear temporary upload files (if any temp folder exists)
    const tempPath = path.join(__dirname, '../temp');
    if (fs.existsSync(tempPath)) {
      const tempFiles = fs.readdirSync(tempPath);
      tempFiles.forEach(file => {
        try {
          fs.unlinkSync(path.join(tempPath, file));
          clearedItems.push(`Temp file: ${file}`);
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }
      });
    }
    
    // 2. Clear old session data (if you have session storage)
    // This is a placeholder - implement based on your session management
    
    // 3. Clear expired notifications (older than 30 days)
    try {
      const [result] = await db.execute(
        'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );
      if (result.affectedRows > 0) {
        clearedItems.push(`${result.affectedRows} old notifications`);
      }
    } catch (err) {
      console.error('Error clearing old notifications:', err);
    }
    
    // 4. Log the cache clear action
    console.log('Cache cleared by admin:', req.user.userId);
    console.log('Items cleared:', clearedItems);
    
    res.json({ 
      message: 'Cache cleared successfully',
      itemsCleared: clearedItems.length,
      details: clearedItems
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// User growth analytics
router.get('/analytics/user-growth', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    let dateFormat, interval;

    switch (range) {
      case 'week':
        dateFormat = '%Y-%m-%d';
        interval = '7 DAY';
        break;
      case 'year':
        dateFormat = '%Y-%m';
        interval = '12 MONTH';
        break;
      default: // month
        dateFormat = '%Y-%m-%d';
        interval = '30 DAY';
    }

    const [facultyGrowth] = await db.execute(`
      SELECT DATE_FORMAT(created_at, ?) as period, COUNT(*) as count
      FROM faculty
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${interval})
      GROUP BY period
      ORDER BY period
    `, [dateFormat]);

    const [studentGrowth] = await db.execute(`
      SELECT DATE_FORMAT(created_at, ?) as period, COUNT(*) as count
      FROM student
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${interval})
      GROUP BY period
      ORDER BY period
    `, [dateFormat]);

    // Combine and aggregate
    const combined = {};
    [...facultyGrowth, ...studentGrowth].forEach(item => {
      if (!combined[item.period]) {
        combined[item.period] = 0;
      }
      combined[item.period] += item.count;
    });

    const result = Object.entries(combined).map(([period, count]) => ({
      period,
      count
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching user growth:', error);
    res.status(500).json({ error: 'Failed to fetch user growth' });
  }
});

// Assignment statistics
router.get('/analytics/assignments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [total] = await db.execute('SELECT COUNT(*) as count FROM assignments');
    
    const [submissions] = await db.execute(`
      SELECT 
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM assignment_submissions
    `);

    res.json({
      total: total[0].count,
      completed: submissions[0].completed || 0,
      pending: submissions[0].pending || 0
    });
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    res.status(500).json({ error: 'Failed to fetch assignment stats' });
  }
});

// Attendance statistics
router.get('/analytics/attendance', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) as late
      FROM attendance
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ error: 'Failed to fetch attendance stats' });
  }
});

// Active users
router.get('/analytics/active-users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [facultyCount] = await db.execute('SELECT COUNT(*) as count FROM faculty');
    const [studentCount] = await db.execute('SELECT COUNT(*) as count FROM student');

    res.json({
      faculty: facultyCount[0].count,
      students: studentCount[0].count,
      totalUsers: facultyCount[0].count + studentCount[0].count
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({ error: 'Failed to fetch active users' });
  }
});

// Department statistics - MSCIT only, returns single entry
router.get('/analytics/departments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [faculty] = await db.execute('SELECT COUNT(*) as count FROM faculty WHERE department = ?', ['Msc.IT']);
    const [students] = await db.execute('SELECT COUNT(*) as count FROM student WHERE department = ?', ['Msc.IT']);

    res.json([{
      department: 'Msc.IT',
      faculty_count: faculty[0].count,
      student_count: students[0].count,
      total: faculty[0].count + students[0].count
    }]);
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({ error: 'Failed to fetch department stats' });
  }
});

// Recent activity
router.get('/analytics/recent-activity', authenticateToken, isAdmin, async (req, res) => {
  try {
    const activities = [];

    // Recent faculty additions
    const [recentFaculty] = await db.execute(`
      SELECT name, created_at, 'user' as type
      FROM faculty
      ORDER BY created_at DESC
      LIMIT 5
    `);
    recentFaculty.forEach(f => {
      activities.push({
        title: `New faculty member: ${f.name}`,
        created_at: f.created_at,
        type: 'user'
      });
    });

    // Recent assignments
    const [recentAssignments] = await db.execute(`
      SELECT title, created_at, 'assignment' as type
      FROM assignments
      ORDER BY created_at DESC
      LIMIT 5
    `);
    recentAssignments.forEach(a => {
      activities.push({
        title: `New assignment: ${a.title}`,
        created_at: a.created_at,
        type: 'assignment'
      });
    });

    // Recent attendance
    const [recentAttendance] = await db.execute(`
      SELECT a.date, s.name, a.created_at, 'attendance' as type
      FROM attendance a
      JOIN student s ON a.student_id = s.student_id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);
    recentAttendance.forEach(a => {
      activities.push({
        title: `Attendance marked for ${a.name}`,
        created_at: a.created_at,
        type: 'attendance'
      });
    });

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(activities.slice(0, 10));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Performance metrics
router.get('/analytics/performance', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [attendance] = await db.execute(`
      SELECT 
        ROUND(AVG(CASE WHEN status = 'Present' THEN 100 ELSE 0 END), 2) as avgAttendance
      FROM attendance
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    const [grades] = await db.execute(`
      SELECT 
        ROUND(AVG(marks_obtained), 2) as avgGrades
      FROM assignment_submissions
      WHERE marks_obtained IS NOT NULL
    `);

    const [completion] = await db.execute(`
      SELECT 
        ROUND(AVG(CASE WHEN status = 'submitted' THEN 100 ELSE 0 END), 2) as completionRate
      FROM assignment_submissions
    `);

    res.json({
      avgAttendance: attendance[0].avgAttendance || 0,
      avgGrades: grades[0].avgGrades || 0,
      completionRate: completion[0].completionRate || 0
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// ==================== MASTER DATA CRUD OPERATIONS ====================

// GET all records from a master table
router.get('/master/:table', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { table } = req.params;
    const allowedTables = [
      'faculty', 'student', 'classes', 'subjects', 'faculty_subjects',
      'timetable', 'assignments', 'assignment_submissions', 'attendance', 
      'messages', 'notifications', 'announcements', 'documents', 'grades', 'admin'
    ];
    
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    let query = '';
    
    // Build queries with JOINs for better data display
    switch (table) {
      case 'faculty_subjects':
        query = `
          SELECT fs.*, f.name as faculty_name, c.class_name, s.subject_name 
          FROM faculty_subjects fs 
          LEFT JOIN faculty f ON fs.faculty_id = f.faculty_id 
          LEFT JOIN classes c ON fs.class_id = c.class_id 
          LEFT JOIN subjects s ON fs.subject_id = s.subject_id 
          ORDER BY fs.assigned_at DESC
        `;
        break;
      case 'subjects':
        query = `
          SELECT s.*, c.class_name 
          FROM subjects s 
          LEFT JOIN classes c ON s.class_id = c.class_id 
          ORDER BY c.class_name, s.subject_name
        `;
        break;
      case 'timetable':
        query = `
          SELECT t.*, f.name as faculty_name 
          FROM timetable t 
          LEFT JOIN faculty f ON t.faculty_id = f.faculty_id 
          ORDER BY t.day, t.start_time
        `;
        break;
      case 'assignments':
        query = `
          SELECT a.*, f.name as faculty_name 
          FROM assignments a 
          LEFT JOIN faculty f ON a.faculty_id = f.faculty_id 
          ORDER BY a.created_at DESC
        `;
        break;
      case 'assignment_submissions':
        query = `
          SELECT asub.*, s.name as student_name, a.title as assignment_title 
          FROM assignment_submissions asub 
          LEFT JOIN student s ON asub.student_id = s.student_id 
          LEFT JOIN assignments a ON asub.assignment_id = a.assignment_id 
          ORDER BY asub.submitted_at DESC
        `;
        break;
      case 'attendance':
        query = `
          SELECT a.*, s.name as student_name, f.name as faculty_name 
          FROM attendance a 
          LEFT JOIN student s ON a.student_id = s.student_id 
          LEFT JOIN faculty f ON a.faculty_id = f.faculty_id 
          ORDER BY a.date DESC
        `;
        break;
      case 'documents':
        query = `
          SELECT d.*, f.name as faculty_name 
          FROM documents d 
          LEFT JOIN faculty f ON d.faculty_id = f.faculty_id 
          ORDER BY d.created_at DESC
        `;
        break;
      case 'grades':
        query = `
          SELECT g.*, s.name as student_name 
          FROM grades g 
          LEFT JOIN student s ON g.student_id = s.student_id 
          ORDER BY g.created_at DESC
        `;
        break;
      default:
        query = `SELECT * FROM ${table} ORDER BY created_at DESC`;
    }

    const [records] = await db.execute(query);
    res.json(records);
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// CREATE a new record in a master table
router.post('/master/:table', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { table } = req.params;
    const allowedTables = [
      'faculty', 'student', 'classes', 'subjects', 'faculty_subjects',
      'timetable', 'assignments', 'assignment_submissions', 'attendance', 
      'messages', 'notifications', 'announcements', 'documents', 'grades', 'admin'
    ];
    
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    const data = req.body;
    
    // Hash password for faculty, student, and admin
    if ((table === 'faculty' || table === 'student' || table === 'admin') && data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // Build INSERT query dynamically
    const columns = Object.keys(data).map(key => `\`${key}\``).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`;
    const [result] = await db.execute(query, values);

    res.status(201).json({
      message: 'Record created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating record:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Duplicate entry. Email or unique field already exists.' });
    }
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// UPDATE a record in a master table
router.put('/master/:table/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { table, id } = req.params;
    const allowedTables = [
      'faculty', 'student', 'classes', 'subjects', 'faculty_subjects',
      'timetable', 'assignments', 'assignment_submissions', 'attendance', 
      'messages', 'notifications', 'announcements', 'documents', 'grades', 'admin'
    ];
    
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    const data = req.body;
    
    // Hash password if provided for faculty, student, and admin
    if ((table === 'faculty' || table === 'student' || table === 'admin') && data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    // Remove primary key from update data
    const primaryKeys = {
      faculty: 'faculty_id',
      student: 'student_id',
      classes: 'class_id',
      subjects: 'subject_id',
      faculty_subjects: 'id',
      timetable: 'timetable_id',
      assignments: 'assignment_id',
      assignment_submissions: 'submission_id',
      attendance: 'attendance_id',
      messages: 'message_id',
      notifications: 'notification_id',
      announcements: 'announcement_id',
      documents: 'document_id',
      grades: 'grade_id',
      admin: 'admin_id'
    };
    
    const primaryKey = primaryKeys[table];
    delete data[primaryKey];
    
    // Remove timestamp fields - they're auto-managed by database
    delete data.created_at;
    delete data.updated_at;
    delete data.assigned_at;
    delete data.submitted_at;

    // Remove joined/computed columns that don't belong to the table
    const joinedColumns = {
      subjects:         ['class_name', 'semester', 'faculty_name', 'student_name'],
      faculty_subjects: ['class_name', 'semester', 'faculty_name', 'subject_name', 'faculty_email', 'faculty_department', 'subject_code', 'credits'],
      attendance:       ['name', 'roll_no', 'email'],
      assignments:      ['faculty_name'],
      assignment_submissions: ['student_name', 'assignment_title', 'faculty_name'],
      messages:         ['sender_name', 'sender_email', 'receiver_name', 'receiver_email'],
      timetable:        ['faculty_name'],
      notifications:    [],
      announcements:    ['faculty_name'],
      documents:        ['faculty_name'],
      grades:           ['student_name', 'subject_name']
    };
    (joinedColumns[table] || []).forEach(col => delete data[col]);

    // Build UPDATE query dynamically
    const setClause = Object.keys(data).map(key => `\`${key}\` = ?`).join(', ');
    const values = [...Object.values(data), id];

    const query = `UPDATE \`${table}\` SET ${setClause} WHERE \`${primaryKey}\` = ?`;
    const [result] = await db.execute(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ message: 'Record updated successfully' });
  } catch (error) {
    console.error('Error updating record:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Duplicate entry. Email or unique field already exists.' });
    }
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE a record from a master table
router.delete('/master/:table/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { table, id } = req.params;
    const allowedTables = [
      'faculty', 'student', 'classes', 'subjects', 'faculty_subjects',
      'timetable', 'assignments', 'assignment_submissions', 'attendance', 
      'messages', 'notifications', 'announcements', 'documents', 'grades', 'admin'
    ];
    
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    const primaryKeys = {
      faculty: 'faculty_id',
      student: 'student_id',
      classes: 'class_id',
      subjects: 'subject_id',
      faculty_subjects: 'id',
      timetable: 'timetable_id',
      assignments: 'assignment_id',
      assignment_submissions: 'submission_id',
      attendance: 'attendance_id',
      messages: 'message_id',
      notifications: 'notification_id',
      announcements: 'announcement_id',
      documents: 'document_id',
      grades: 'grade_id',
      admin: 'admin_id'
    };
    
    const primaryKey = primaryKeys[table];
    const query = `DELETE FROM \`${table}\` WHERE \`${primaryKey}\` = ?`;
    const [result] = await db.execute(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

module.exports = router;
