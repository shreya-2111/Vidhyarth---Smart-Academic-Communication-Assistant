const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const timetableRoutes = require('./routes/timetable');
const facultyRoutes = require('./routes/faculty');
const attendanceRoutes = require('./routes/attendance');
const assignmentsRoutes = require('./routes/assignments');
const adminRoutes = require('./routes/admin');
const messagesRoutes = require('./routes/messages');
const reportsRoutes = require('./routes/reports');
const documentsRoutes = require('./routes/documents');
const notificationsRoutes = require('./routes/notifications');
const studentRoutes = require('./routes/student');
const masterRoutes = require('./routes/master');
const facultyAssignmentsRoutes = require('./routes/facultyAssignments');
const facultySubjectAssignmentRoutes = require('./routes/facultySubjectAssignment');
const publicRoutes = require('./routes/public');
const chatbotRoutes = require('./routes/chatbot');
const excelImportRoutes = require('./routes/excelImport');
const qrAttendanceRoutes = require('./routes/qr-attendance');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
// CORS configuration - allow all origins for mobile app access
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files
const isVercel = process.env.VERCEL === '1';
const uploadDir = isVercel ? '/tmp/uploads' : 'uploads';
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/excel', excelImportRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/faculty-assignments', facultyAssignmentsRoutes);
app.use('/api/faculty-subject-assignment', facultySubjectAssignmentRoutes);
app.use('/api/qr-attendance', qrAttendanceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`💻 Local access: http://localhost:${PORT}`);
});
