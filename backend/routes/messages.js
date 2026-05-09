const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all messages for a user (inbox)
router.get('/inbox/:userId/:userType', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.params;

    const query = `
      SELECT 
        m.*,
        CASE 
          WHEN m.sender_type = 'faculty' THEN f.name
          WHEN m.sender_type = 'student' THEN s.name
        END as sender_name,
        CASE 
          WHEN m.sender_type = 'faculty' THEN f.email
          WHEN m.sender_type = 'student' THEN s.email
        END as sender_email
      FROM messages m
      LEFT JOIN faculty f ON m.sender_id = f.faculty_id AND m.sender_type = 'faculty'
      LEFT JOIN student s ON m.sender_id = s.student_id AND m.sender_type = 'student'
      WHERE m.receiver_id = ? AND m.receiver_type = ?
      ORDER BY m.created_at DESC
    `;

    const [messages] = await db.execute(query, [userId, userType]);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get sent messages
router.get('/sent/:userId/:userType', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.params;

    const query = `
      SELECT 
        m.*,
        CASE 
          WHEN m.receiver_type = 'faculty' THEN f.name
          WHEN m.receiver_type = 'student' THEN s.name
        END as receiver_name,
        CASE 
          WHEN m.receiver_type = 'faculty' THEN f.email
          WHEN m.receiver_type = 'student' THEN s.email
        END as receiver_email
      FROM messages m
      LEFT JOIN faculty f ON m.receiver_id = f.faculty_id AND m.receiver_type = 'faculty'
      LEFT JOIN student s ON m.receiver_id = s.student_id AND m.receiver_type = 'student'
      WHERE m.sender_id = ? AND m.sender_type = ?
      ORDER BY m.created_at DESC
    `;

    const [messages] = await db.execute(query, [userId, userType]);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching sent messages:', error);
    res.status(500).json({ error: 'Failed to fetch sent messages' });
  }
});

// Send a message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { senderId, senderType, receiverId, receiverType, message } = req.body;

    const query = `
      INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, message)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [senderId, senderType, receiverId, receiverType, message]);

    res.status(201).json({
      message: 'Message sent successfully',
      messageId: result.insertId
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark message as read
router.put('/read/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    await db.execute('UPDATE messages SET is_read = 1 WHERE message_id = ?', [messageId]);

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Get unread message count
router.get('/unread/:userId/:userType', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.params;

    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND receiver_type = ? AND is_read = 0',
      [userId, userType]
    );

    res.json({ unreadCount: result[0].count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Get all students (for sending messages) — always Msc.IT
router.get('/students', authenticateToken, async (req, res) => {
  try {
    const [students] = await db.execute(
      "SELECT student_id, name, email, department FROM student WHERE department = 'Msc.IT' ORDER BY name"
    );
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get all faculty (for sending messages) — always Msc.IT
router.get('/faculty', authenticateToken, async (req, res) => {
  try {
    const [faculty] = await db.execute(
      "SELECT faculty_id, name, email, department FROM faculty WHERE department = 'Msc.IT' ORDER BY name"
    );
    res.json(faculty);
  } catch (error) {
    console.error('Error fetching faculty:', error);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// Departments endpoint — returns single Msc.IT entry (kept for compatibility)
router.get('/departments', authenticateToken, async (req, res) => {
  res.json([{ department: 'Msc.IT' }]);
});

// Send announcement
router.post('/announcement', authenticateToken, async (req, res) => {
  try {
    const { facultyId, title, message, targetType, targetValue } = req.body;

    const query = `
      INSERT INTO announcements (faculty_id, title, message, target_type, target_value)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      facultyId,
      title,
      message,
      targetType,
      targetValue || null
    ]);

    res.status(201).json({
      message: 'Announcement sent successfully',
      announcementId: result.insertId
    });
  } catch (error) {
    console.error('Error sending announcement:', error);
    res.status(500).json({ error: 'Failed to send announcement' });
  }
});

// Get announcements for faculty
router.get('/announcements/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;

    const query = `
      SELECT 
        a.*,
        f.name as faculty_name
      FROM announcements a
      JOIN faculty f ON a.faculty_id = f.faculty_id
      WHERE a.faculty_id = ?
      ORDER BY a.created_at DESC
    `;

    const [announcements] = await db.execute(query, [facultyId]);
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get announcements for students
router.get('/student-announcements/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student's division to filter relevant announcements
    const [studentInfo] = await db.execute(
      'SELECT division FROM student WHERE student_id = ?',
      [studentId]
    );

    if (studentInfo.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentDivision = studentInfo[0].division;

    const query = `
      SELECT 
        a.*,
        f.name as faculty_name,
        f.email as faculty_email
      FROM announcements a
      JOIN faculty f ON a.faculty_id = f.faculty_id
      WHERE (
        a.target_type = 'all' OR 
        (a.target_type = 'division' AND a.target_value = ?) OR
        (a.target_type = 'department' AND a.target_value = 'Msc.IT')
      )
      ORDER BY a.created_at DESC
    `;

    const [announcements] = await db.execute(query, [studentDivision]);
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching student announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

module.exports = router;
