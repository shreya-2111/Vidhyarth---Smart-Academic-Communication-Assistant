const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all active classes (public endpoint for registration)
router.get('/classes', async (req, res) => {
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

module.exports = router;
