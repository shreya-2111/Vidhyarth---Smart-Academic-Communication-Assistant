const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.error('[Chatbot] GEMINI_API_KEY is not set in .env');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Primary model — gemini-2.5-flash-lite (free tier, fast)
// Fallback model — gemini-2.0-flash-lite
const PRIMARY_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_MODEL = 'gemini-2.0-flash-lite';

// In-memory conversation history per user session (keyed by userId)
const conversationHistory = new Map();
const MAX_HISTORY = 20; // keep last 20 turns

function getHistory(userId) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  return conversationHistory.get(userId);
}

function addToHistory(userId, role, text) {
  const history = getHistory(userId);
  history.push({ role, parts: [{ text }] });
  // Trim to last MAX_HISTORY entries
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
}

// Built-in fallback for when all AI models are unavailable
function getBuiltinFallback(message) {
  const msg = message.toLowerCase().trim();

  if (/^(hi|hello|hey|howdy|greetings)/.test(msg)) {
    return "Hello! I'm Vidhya. I'm having a bit of trouble connecting to my AI brain right now, but I'm here. Try asking me again in a moment!";
  }
  if (/random number|generate.*number|pick.*number/.test(msg)) {
    return `Here's a random number for you: ${Math.floor(Math.random() * 1000)}`;
  }
  if (/random.*name|suggest.*name/.test(msg)) {
    const names = ['Aryan', 'Priya', 'Rohan', 'Ananya', 'Karan', 'Meera', 'Dev', 'Isha'];
    return `How about: ${names[Math.floor(Math.random() * names.length)]}?`;
  }
  if (/study tip|how to study|improve.*study/.test(msg)) {
    return "Here are some quick study tips:\n• Use the Pomodoro technique (25 min focus, 5 min break)\n• Teach what you learn to someone else\n• Review notes within 24 hours\n• Avoid multitasking while studying\n• Get enough sleep — memory consolidates during sleep";
  }
  if (/joke|funny/.test(msg)) {
    return "Why do programmers prefer dark mode? Because light attracts bugs! 😄";
  }
  if (/time|date|today/.test(msg)) {
    return `Right now it's ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}.`;
  }
  if (/what.*you do|help.*with|capabilities|features/.test(msg)) {
    return "I can help with general questions, coding, study tips, academic data (timetable, attendance, assignments), casual conversation, and more. What do you need?";
  }

  return "I'm having trouble reaching my AI service right now. Please try again in a moment — I'll be back shortly!";
}

// Optionally fetch project context when query seems academic/project-related
// Always fetch context — don't rely on keyword matching which fails on typos
async function getProjectContext(userId, userType, message) {

  try {
    const context = {};
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[new Date().getDay()];

    if (userType === 'faculty') {

      // Subjects taught by this faculty
      const [subjects] = await db.execute(
        `SELECT s.subject_name, c.class_name, c.semester
         FROM faculty_subjects fs
         JOIN subjects s ON fs.subject_id = s.subject_id
         JOIN classes c ON fs.class_id = c.class_id
         WHERE fs.faculty_id = ?`,
        [userId]
      );

      // Today's classes
      const [todayClasses] = await db.execute(
        `SELECT subject, start_time, end_time, room_no, class_name
         FROM timetable
         WHERE faculty_id = ? AND day = ?
         ORDER BY start_time`,
        [userId, today]
      );

      // Full week timetable
      const [allTimetable] = await db.execute(
        `SELECT day, subject, start_time, end_time, room_no, class_name
         FROM timetable
         WHERE faculty_id = ?
         ORDER BY FIELD(day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), start_time`,
        [userId]
      );

      // Attendance today
      const [attendanceToday] = await db.execute(
        `SELECT COUNT(DISTINCT student_id) as total,
                SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as absent
         FROM attendance WHERE faculty_id = ? AND DATE(date) = CURDATE()`,
        [userId]
      );

      // Assignments (course + deadline are the correct columns)
      const [allAssignments] = await db.execute(
        `SELECT title, course, deadline,
                (SELECT COUNT(*) FROM assignment_submissions
                 WHERE assignment_id = a.assignment_id) as submitted_count
         FROM assignments a
         WHERE faculty_id = ?
         ORDER BY deadline DESC LIMIT 10`,
        [userId]
      );

      context.today = today;
      context.subjects = subjects;
      context.todayClasses = todayClasses;
      context.fullWeekTimetable = allTimetable;
      context.attendanceToday = attendanceToday[0] || {};
      context.assignments = allAssignments;

      console.log(`[Chatbot] Faculty ${userId} | today=${today} | todayClasses=${todayClasses.length} | allTimetable=${allTimetable.length}`);

    } else if (userType === 'student') {

      // Student info (class is VARCHAR, no class_id FK)
      const [studentInfo] = await db.execute(
        `SELECT name, email, class, department FROM student WHERE student_id = ?`,
        [userId]
      );

      const studentClass = studentInfo[0]?.class || null;

      // Today's timetable — join via faculty_subjects+classes since timetable.class_name is NULL
      const [todayTimetable] = await db.execute(
        `SELECT DISTINCT t.subject, t.start_time, t.end_time, t.room_no, f.name as faculty_name
         FROM timetable t
         JOIN faculty f ON t.faculty_id = f.faculty_id
         JOIN faculty_subjects fs ON fs.faculty_id = t.faculty_id
         JOIN classes c ON fs.class_id = c.class_id
         WHERE c.class_name = ? AND t.day = ?
         ORDER BY t.start_time`,
        [studentClass, today]
      );

      // Full week timetable
      const [fullTimetable] = await db.execute(
        `SELECT DISTINCT t.day, t.subject, t.start_time, t.end_time, t.room_no, f.name as faculty_name
         FROM timetable t
         JOIN faculty f ON t.faculty_id = f.faculty_id
         JOIN faculty_subjects fs ON fs.faculty_id = t.faculty_id
         JOIN classes c ON fs.class_id = c.class_id
         WHERE c.class_name = ?
         ORDER BY FIELD(t.day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), t.start_time`,
        [studentClass]
      );

      // Overall attendance
      const [attendance] = await db.execute(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present,
                ROUND(SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END)/COUNT(*)*100,1) as percentage
         FROM attendance WHERE student_id = ?`,
        [userId]
      );

      // Subject-wise attendance
      const [subjectAttendance] = await db.execute(
        `SELECT subject,
                COUNT(*) as total,
                SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present,
                ROUND(SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END)/COUNT(*)*100,1) as percentage
         FROM attendance WHERE student_id = ?
         GROUP BY subject`,
        [userId]
      );

      // Upcoming assignments (course + deadline are correct columns)
      const [assignments] = await db.execute(
        `SELECT a.title, a.course, a.deadline,
                CASE WHEN sub.submission_id IS NOT NULL THEN 'Submitted' ELSE 'Pending' END as status
         FROM assignments a
         LEFT JOIN assignment_submissions sub
           ON a.assignment_id = sub.assignment_id AND sub.student_id = ?
         WHERE a.deadline >= CURDATE()
         ORDER BY a.deadline ASC LIMIT 10`,
        [userId]
      );

      // Grades (subject is VARCHAR directly in grades table — no subject_id FK)
      const [grades] = await db.execute(
        `SELECT subject, exam_type, marks_obtained, total_marks, percentage, grade_letter, exam_date
         FROM grades
         WHERE student_id = ?
         ORDER BY exam_date DESC LIMIT 10`,
        [userId]
      );

      context.today = today;
      context.studentInfo = studentInfo[0] || {};
      context.todayTimetable = todayTimetable;
      context.fullWeekTimetable = fullTimetable;
      context.overallAttendance = attendance[0] || {};
      context.subjectWiseAttendance = subjectAttendance;
      context.upcomingAssignments = assignments;
      context.grades = grades;

      console.log(`[Chatbot] Student ${userId} | class=${studentClass} | today=${today} | todayTimetable=${todayTimetable.length} | fullTimetable=${fullTimetable.length} | attendance=${attendance[0]?.percentage}% | grades=${grades.length}`);
    }

    return context;
  } catch (err) {
    console.error('Error fetching project context:', err);
    return null;
  }
}

// POST /api/chatbot
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message, clearHistory } = req.body;
    const userId = req.user.userId;
    const userType = req.user.userType;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Allow client to reset conversation
    if (clearHistory) {
      conversationHistory.delete(userId);
    }

    // Optionally enrich with project data
    console.log(`[Chatbot] MSG from ${userType} ${userId}: "${message}"`);
    const projectContext = await getProjectContext(userId, userType, message);
    const _days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const _months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const _now = new Date();
    const _todayName = _days[_now.getDay()];
    const _todayFull = `${_todayName}, ${_months[_now.getMonth()]} ${_now.getDate()}, ${_now.getFullYear()}`;

    const systemInstruction = `You are Vidhya, the official AI assistant for Vidhyarth — a college management platform.

CORE RULES:
- When the user asks about their own data (timetable, attendance, assignments, grades, messages, subjects), ALWAYS use the real data provided in the Academic Context below. Never say "I don't have access" if the data is present.
- Give specific, accurate answers using the actual values from the context (e.g., real subject names, real percentages, real times, real room numbers).
- If todayClasses or todayTimetable in the context has entries, the user HAS classes today — list them. Never say "no classes" if the array is non-empty.
- If todayClasses or todayTimetable is empty or missing, only then say there are no classes today.
- For general questions (coding, science, math, etc.) answer naturally and helpfully.
- Keep responses concise and clear. Use bullet points only when listing multiple items.
- Be warm, friendly, and human-like in tone.
- Never fabricate data. Never say random numbers for attendance or grades — use only what's in the context.
- Today is ${_todayFull}.

User role: ${userType}
${projectContext ? `\n--- REAL ACADEMIC DATA (use this to answer questions) ---\n${JSON.stringify(projectContext, null, 2)}\n---` : ''}`;
    // Call Gemini — try primary model, fall back if quota/model error
    let aiResponse = null;
    // Build the actual message — inject real data inline so Gemini can't ignore it
    let enrichedMessage = message;
    if (projectContext) {
      const todayData = userType === 'faculty'
        ? projectContext.todayClasses
        : projectContext.todayTimetable;

      if (todayData && todayData.length > 0 &&
          /today|timetable|schedule|class|lecture|lec/i.test(message)) {
        const classList = todayData.map(c =>
          `  - ${c.subject} | ${c.start_time} - ${c.end_time}${c.room_no ? ' | Room ' + c.room_no : ''}${c.faculty_name ? ' | ' + c.faculty_name : ''}`
        ).join('\n');
        enrichedMessage = `${message}\n\n[SYSTEM DATA - today is ${projectContext.today}, classes found:\n${classList}\nPlease list these classes in your answer.]`;
      }
    }

    const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Chatbot] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
        const history = getHistory(userId);
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(enrichedMessage);
        aiResponse = result.response.text();

        if (!aiResponse || !aiResponse.trim()) {
          console.warn(`[Chatbot] Empty response from ${modelName}`);
          aiResponse = null;
          continue;
        }

        console.log(`[Chatbot] Success with model: ${modelName}`);
        break;
      } catch (modelErr) {
        console.error(`[Chatbot] Model ${modelName} failed:`, modelErr.message);
        // Don't retry on auth errors — API key is wrong
        if (modelErr.message && modelErr.message.includes('API_KEY_INVALID')) {
          throw new Error('Invalid Gemini API key. Please check GEMINI_API_KEY in .env');
        }
        // Continue to next model on quota/404 errors
      }
    }

    // If all models failed, use built-in fallback for simple queries
    if (!aiResponse) {
      aiResponse = getBuiltinFallback(message);
    }

    // Save to in-memory history (only if AI responded, not fallback)
    addToHistory(userId, 'user', message);
    addToHistory(userId, 'model', aiResponse);

    // Log to DB (best-effort, don't fail the request if this errors)
    try {
      await db.execute(
        `INSERT INTO chatbot_logs (user_id, user_type, user_message, ai_response, intent, created_at)
         VALUES (?, ?, ?, ?, 'general', NOW())`,
        [userId, userType, message, aiResponse]
      );
    } catch (_) {}

    res.json({ success: true, response: aiResponse });

  } catch (error) {
    console.error('[Chatbot] Unhandled error:', error.message);
    console.error(error.stack);
    const fallback = getBuiltinFallback(req.body?.message || '');
    res.status(200).json({ success: true, response: fallback });
  }
});

// GET /api/chatbot/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 20;

    const [history] = await db.execute(
      `SELECT id, user_message, ai_response, created_at
       FROM chatbot_logs
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    res.json(history);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// DELETE /api/chatbot/history — clear in-memory session
router.delete('/history', authenticateToken, (req, res) => {
  conversationHistory.delete(req.user.userId);
  res.json({ success: true });
});

module.exports = router;
