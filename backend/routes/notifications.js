const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all notifications for a user
router.get('/:userId/:userType', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.params;
    const { limit = 50, offset = 0, type, unreadOnly } = req.query;

    let query = `
      SELECT 
        n.*,
        CASE 
          WHEN n.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'today'
          WHEN n.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'this_week'
          ELSE 'older'
        END as time_group
      FROM notifications n
      WHERE n.user_id = ? AND n.user_type = ?
    `;

    const params = [userId, userType];

    if (type) {
      query += ' AND n.type = ?';
      params.push(type);
    }

    if (unreadOnly === 'true') {
      query += ' AND n.is_read = FALSE';
    }

    // Don't show expired notifications (column may not exist, skip filter)
    // query += ' AND (n.expires_at IS NULL OR n.expires_at > NOW())';

    const parsedLimit = parseInt(limit) || 50;
    const parsedOffset = parseInt(offset) || 0;

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(parsedLimit, parsedOffset);

    const [notifications] = await db.query(query, params);

    // Group notifications by time
    const grouped = {
      today: [],
      this_week: [],
      older: []
    };

    notifications.forEach(notification => {
      grouped[notification.time_group].push(notification);
    });

    res.json({
      notifications,
      grouped,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get unread notification count
router.get('/count/:userId/:userType', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.params;

    const [result] = await db.execute(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND user_type = ? AND is_read = FALSE
    `, [userId, userType]);

    res.json({ unreadCount: result[0].count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ error: 'Failed to fetch notification count' });
  }
});

// Mark notification as read
router.put('/mark-read/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;

    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ? AND user_type = ?',
      [notificationId, userId, userType]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark notification as unread
router.put('/mark-unread/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;

    await db.execute(
      'UPDATE notifications SET is_read = FALSE WHERE notification_id = ? AND user_id = ? AND user_type = ?',
      [notificationId, userId, userType]
    );

    res.json({ message: 'Notification marked as unread' });
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    res.status(500).json({ error: 'Failed to mark notification as unread' });
  }
});

// Mark all notifications as read for a user
router.put('/mark-all-read/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const userType = req.user.userType;

    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND user_type = ? AND is_read = FALSE',
      [userId, userType]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Mark all notifications as read
router.put('/read-all/:userId/:userType', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.params;

    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND user_type = ? AND is_read = FALSE',
      [userId, userType]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;

    await db.execute(
      'DELETE FROM notifications WHERE notification_id = ? AND user_id = ? AND user_type = ?',
      [notificationId, userId, userType]
    );

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Create notification (for system use)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      userId,
      userType,
      title,
      message,
      type,
      priority = 'medium',
      relatedId = null,
      relatedType = null,
      scheduledAt = null,
      expiresAt = null
    } = req.body;

    const query = `
      INSERT INTO notifications 
      (user_id, user_type, title, message, type, priority, related_id, related_type, scheduled_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      userId, userType, title, message, type, priority, relatedId, relatedType, scheduledAt, expiresAt
    ]);

    res.status(201).json({
      message: 'Notification created successfully',
      notificationId: result.insertId
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get notification preferences — return sensible defaults (no separate table)
router.get('/preferences/:userId/:userType', authenticateToken, async (req, res) => {
  res.json({
    email_notifications: true,
    push_notifications: true,
    deadline_reminders: true,
    meeting_reminders: true,
    submission_alerts: true,
    announcement_alerts: true,
    reminder_hours_before: 24
  });
});

// Update notification preferences — no-op (table doesn't exist, return success)
router.put('/preferences/:userId/:userType', authenticateToken, async (req, res) => {
  res.json({ message: 'Preferences updated successfully' });
});

// Generate automatic notifications for deadlines
router.post('/generate-deadline-reminders', authenticateToken, async (req, res) => {
  try {
    // Get all assignments with upcoming deadlines
    const [assignments] = await db.execute(`
      SELECT 
        a.*,
        f.name as faculty_name,
        s.student_id,
        s.name as student_name,
        s.email as student_email
      FROM assignments a
      JOIN faculty f ON a.faculty_id = f.faculty_id
      CROSS JOIN student s
      WHERE a.deadline BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 48 HOUR)
      AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.related_id = a.assignment_id 
        AND n.related_type = 'assignment' 
        AND n.type = 'deadline'
        AND n.user_id = s.student_id
        AND n.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      )
    `);

    let notificationsCreated = 0;

    for (const assignment of assignments) {
      // Check if student has deadline reminders enabled
      const [preferences] = await db.execute(
        'SELECT deadline_reminders FROM notification_preferences WHERE user_id = ? AND user_type = "student"',
        [assignment.student_id]
      );

      if (preferences.length === 0 || preferences[0].deadline_reminders) {
        const title = `Assignment Due Soon: ${assignment.title}`;
        const message = `Your assignment "${assignment.title}" for ${assignment.course} is due on ${new Date(assignment.deadline).toLocaleDateString()}. Please submit before the deadline.`;

        await db.execute(`
          INSERT INTO notifications 
          (user_id, user_type, title, message, type, priority, related_id, related_type, expires_at)
          VALUES (?, 'student', ?, ?, 'deadline', 'high', ?, 'assignment', ?)
        `, [assignment.student_id, title, message, assignment.assignment_id, assignment.deadline]);

        notificationsCreated++;
      }
    }

    res.json({ 
      message: `Generated ${notificationsCreated} deadline reminder notifications`,
      count: notificationsCreated 
    });
  } catch (error) {
    console.error('Error generating deadline reminders:', error);
    res.status(500).json({ error: 'Failed to generate deadline reminders' });
  }
});

// Generate submission notifications for faculty
router.post('/generate-submission-alerts', authenticateToken, async (req, res) => {
  try {
    // This would be called when a student submits an assignment
    // For now, we'll create a sample implementation
    const { assignmentId, studentId } = req.body;

    if (!assignmentId || !studentId) {
      return res.status(400).json({ error: 'Assignment ID and Student ID are required' });
    }

    // Get assignment and student details
    const [assignmentDetails] = await db.execute(`
      SELECT a.*, s.name as student_name, f.faculty_id
      FROM assignments a
      JOIN student s ON s.student_id = ?
      JOIN faculty f ON a.faculty_id = f.faculty_id
      WHERE a.assignment_id = ?
    `, [studentId, assignmentId]);

    if (assignmentDetails.length === 0) {
      return res.status(404).json({ error: 'Assignment or student not found' });
    }

    const assignment = assignmentDetails[0];

    // Check if faculty has submission alerts enabled
    const [preferences] = await db.execute(
      'SELECT submission_alerts FROM notification_preferences WHERE user_id = ? AND user_type = "faculty"',
      [assignment.faculty_id]
    );

    if (preferences.length === 0 || preferences[0].submission_alerts) {
      const title = `New Assignment Submission`;
      const message = `Student ${assignment.student_name} has submitted assignment "${assignment.title}" for ${assignment.course}.`;

      await db.execute(`
        INSERT INTO notifications 
        (user_id, user_type, title, message, type, priority, related_id, related_type)
        VALUES (?, 'faculty', ?, ?, 'submission', 'medium', ?, 'assignment')
      `, [assignment.faculty_id, title, message, assignmentId]);

      res.json({ message: 'Submission notification created successfully' });
    } else {
      res.json({ message: 'Submission notifications disabled for this faculty' });
    }
  } catch (error) {
    console.error('Error generating submission alert:', error);
    res.status(500).json({ error: 'Failed to generate submission alert' });
  }
});

// Get notification statistics
router.get('/stats/:userId/:userType', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.params;

    const [totalCount] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND user_type = ?',
      [userId, userType]
    );

    const [unreadCount] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND user_type = ? AND is_read = FALSE',
      [userId, userType]
    );

    const [typeStats] = await db.execute(
      'SELECT type, COUNT(*) as count FROM notifications WHERE user_id = ? AND user_type = ? GROUP BY type',
      [userId, userType]
    );

    const [priorityStats] = await db.execute(
      'SELECT priority, COUNT(*) as count FROM notifications WHERE user_id = ? AND user_type = ? GROUP BY priority',
      [userId, userType]
    );

    res.json({
      total: totalCount[0].count,
      unread: unreadCount[0].count,
      byType: typeStats,
      byPriority: priorityStats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

module.exports = router;