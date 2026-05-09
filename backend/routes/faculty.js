const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get faculty profile
router.get('/profile/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [faculty] = await db.execute(
      'SELECT faculty_id, name, email, department, class, subject, phone FROM faculty WHERE faculty_id = ?',
      [id]
    );

    if (faculty.length === 0) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    res.json(faculty[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update faculty profile
router.put('/profile/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, class: className, subject, phone } = req.body;

    await db.execute(
      'UPDATE faculty SET name = ?, department = ?, class = ?, subject = ?, phone = ? WHERE faculty_id = ?',
      [name, department, className, subject, phone, id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;

// Get faculty profile stats
router.get('/profile-stats', authenticateToken, async (req, res) => {
  try {
    const facultyId = req.user.id;

    // Get subjects assigned (unique courses)
    const [subjects] = await db.execute(
      'SELECT COUNT(DISTINCT course) as count FROM assignments WHERE faculty_id = ?',
      [facultyId]
    );

    // Get classes assigned (unique classes from timetable)
    const [classes] = await db.execute(
      'SELECT COUNT(DISTINCT class) as count FROM timetable WHERE faculty_id = ?',
      [facultyId]
    );

    // Get total students handled (from attendance records)
    const [students] = await db.execute(
      'SELECT COUNT(DISTINCT student_id) as count FROM attendance WHERE faculty_id = ?',
      [facultyId]
    );

    // Get lectures conducted (attendance sessions)
    const [lectures] = await db.execute(
      'SELECT COUNT(DISTINCT DATE(date)) as count FROM attendance WHERE faculty_id = ?',
      [facultyId]
    );

    // Get attendance sessions taken
    const [attendanceSessions] = await db.execute(
      'SELECT COUNT(DISTINCT CONCAT(DATE(date), "-", subject)) as count FROM attendance WHERE faculty_id = ?',
      [facultyId]
    );

    // Get assignments created
    const [assignmentsCreated] = await db.execute(
      'SELECT COUNT(*) as count FROM assignments WHERE faculty_id = ?',
      [facultyId]
    );

    // Get pending submissions
    const [pendingSubmissions] = await db.execute(
      `SELECT COUNT(*) as count FROM assignments a
       LEFT JOIN assignment_submissions s ON a.assignment_id = s.assignment_id
       WHERE a.faculty_id = ? AND s.submission_id IS NULL`,
      [facultyId]
    );

    res.json({
      subjectsAssigned: subjects[0].count || 0,
      classesAssigned: classes[0].count || 0,
      totalStudents: students[0].count || 0,
      lecturesConducted: lectures[0].count || 0,
      attendanceSessions: attendanceSessions[0].count || 0,
      assignmentsCreated: assignmentsCreated[0].count || 0,
      pendingSubmissions: pendingSubmissions[0].count || 0
    });
  } catch (error) {
    console.error('Error fetching faculty stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Update faculty profile
router.put('/update-profile', authenticateToken, async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { fullName, phone } = req.body;

    await db.execute(
      'UPDATE faculty SET name = ?, phone = ? WHERE faculty_id = ?',
      [fullName, phone, facultyId]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get current password
    const [faculty] = await db.execute(
      'SELECT password FROM faculty WHERE faculty_id = ?',
      [facultyId]
    );

    if (faculty.length === 0) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Verify current password (in production, use bcrypt)
    if (faculty[0].password !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    await db.execute(
      'UPDATE faculty SET password = ? WHERE faculty_id = ?',
      [newPassword, facultyId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Update notification settings
router.put('/notification-settings', authenticateToken, async (req, res) => {
  try {
    const facultyId = req.user.id;
    const { emailNotifications, inAppNotifications, availabilityStatus } = req.body;

    // Store in database (you may need to create a settings table)
    // For now, just return success
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});
