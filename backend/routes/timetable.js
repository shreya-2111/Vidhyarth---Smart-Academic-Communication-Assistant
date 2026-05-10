const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get timetable for a student (all classes)
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const [classes] = await db.execute(
      `SELECT t.timetable_id, t.subject, t.day, t.start_time, t.end_time, t.room_no,
              f.name as faculty_name
       FROM timetable t
       JOIN faculty f ON t.faculty_id = f.faculty_id
       ORDER BY FIELD(t.day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), t.start_time`
    );
    res.json(classes);
  } catch (error) {
    console.error('Error fetching student timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// Get all timetable entries for a faculty
router.get('/faculty/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const [classes] = await db.execute(
      `SELECT t.*, f.name as faculty_name 
       FROM timetable t 
       LEFT JOIN faculty f ON t.faculty_id = f.faculty_id 
       ORDER BY FIELD(t.day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), t.start_time`
    );
    res.json(classes);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// Add new class
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { facultyId, subject, day, startTime, endTime, roomNo } = req.body;

    // Check for duplicate: same faculty, same day, same start time
    const [existing] = await db.execute(
      `SELECT timetable_id FROM timetable 
       WHERE faculty_id = ? AND day = ? AND start_time = ?`,
      [facultyId, day, startTime]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: `A class is already scheduled on ${day} at ${startTime}. Please choose a different time slot.`
      });
    }

    const [result] = await db.execute(
      `INSERT INTO timetable (faculty_id, subject, day, start_time, end_time, room_no)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [facultyId, subject, day, startTime, endTime, roomNo]
    );

    res.status(201).json({
      message: 'Class added successfully',
      timetableId: result.insertId
    });
  } catch (error) {
    console.error('Error adding class:', error);
    res.status(500).json({ error: 'Failed to add class' });
  }
});

// Update class
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, day, startTime, endTime, roomNo, facultyId } = req.body;

    // Check for duplicate on the new slot (exclude current record)
    const [existing] = await db.execute(
      `SELECT timetable_id FROM timetable 
       WHERE faculty_id = ? AND day = ? AND start_time = ? AND timetable_id != ?`,
      [facultyId, day, startTime, id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: `A class is already scheduled on ${day} at ${startTime}. Please choose a different time slot.`
      });
    }

    await db.execute(
      `UPDATE timetable 
       SET subject = ?, day = ?, start_time = ?, end_time = ?, room_no = ?
       WHERE timetable_id = ?`,
      [subject, day, startTime, endTime, roomNo, id]
    );

    res.json({ message: 'Class updated successfully' });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Delete class
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute('DELETE FROM timetable WHERE timetable_id = ?', [id]);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Failed to delete class' });
  }
});

// Get today's classes for a faculty
router.get('/today/:facultyId', authenticateToken, async (req, res) => {
  try {
    const { facultyId } = req.params;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];

    const [classes] = await db.execute(
      'SELECT * FROM timetable WHERE faculty_id = ? AND day = ? ORDER BY start_time',
      [facultyId, today]
    );

    res.json(classes);
  } catch (error) {
    console.error('Error fetching today\'s classes:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s classes' });
  }
});

module.exports = router;
