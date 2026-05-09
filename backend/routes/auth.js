const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, department, class: className, division, userType } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    let table, query, result;

    if (userType === 'admin') {
      table = 'admin';
      query = `INSERT INTO ${table} (name, email, password) VALUES (?, ?, ?)`;
      [result] = await db.execute(query, [fullName, email, hashedPassword]);
    } else {
      table = userType === 'faculty' ? 'faculty' : 'student';
      query = `INSERT INTO ${table} (name, email, password, department, class, division) VALUES (?, ?, ?, ?, ?, ?)`;
      [result] = await db.execute(query, [fullName, email, hashedPassword, 'Msc.IT', className || '', division || null]);
    }

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertId,
      userType
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check in admin table first
    let [users] = await db.execute('SELECT * FROM admin WHERE email = ?', [email]);
    let userType = 'admin';

    // If not admin, check in faculty table
    if (users.length === 0) {
      [users] = await db.execute('SELECT * FROM faculty WHERE email = ?', [email]);
      userType = 'faculty';
    }

    // If not found in faculty, check student table
    if (users.length === 0) {
      [users] = await db.execute('SELECT * FROM student WHERE email = ?', [email]);
      userType = 'student';
    }

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const userId = userType === 'admin' ? user.admin_id : 
                   userType === 'faculty' ? user.faculty_id : 
                   user.student_id;

    const token = jwt.sign(
      { 
        userId: userId,
        email: user.email,
        userType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Check if request is from mobile app
    const isMobile = req.headers['x-platform'] === 'mobile';

    res.json({
      token,
      user: {
        id: userId,
        fullName: user.name,
        email: user.email,
        department: user.department || 'Admin',
        userType,
        // Return real isPasswordReset value for both web and mobile
        isPasswordReset: userType === 'student' ? (user.is_password_reset === 1) : true
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Reset password (first login forced reset)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Only students go through forced reset
    const [users] = await db.execute(
      'SELECT * FROM student WHERE email = ?', [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Ensure new password is different
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Hash and update
    const hashedNew = await bcrypt.hash(newPassword, 10);
    await db.execute(
      'UPDATE student SET password = ?, is_password_reset = 1 WHERE student_id = ?',
      [hashedNew, user.student_id]
    );

    res.json({ success: true, message: 'Password updated successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
