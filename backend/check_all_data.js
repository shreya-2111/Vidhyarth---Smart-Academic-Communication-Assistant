require('dotenv').config();
const db = require('./config/database');

async function checkAllData() {
  try {
    console.log('=== Checking All Database Data ===\n');
    
    // Check faculty
    console.log('1. FACULTY:');
    const [faculty] = await db.execute('SELECT faculty_id, name, email, created_at FROM faculty ORDER BY faculty_id');
    faculty.forEach(f => {
      console.log(`   ID: ${f.faculty_id}, Name: ${f.name}, Email: ${f.email}, Created: ${f.created_at}`);
    });
    
    // Check students
    console.log('\n2. STUDENTS:');
    const [students] = await db.execute('SELECT student_id, name, email, created_at FROM student ORDER BY student_id');
    students.forEach(s => {
      console.log(`   ID: ${s.student_id}, Name: ${s.name}, Email: ${s.email}, Created: ${s.created_at}`);
    });
    
    // Check documents
    console.log('\n3. DOCUMENTS:');
    const [documents] = await db.execute('SELECT document_id, title, faculty_id, created_at FROM documents ORDER BY document_id');
    if (documents.length > 0) {
      documents.forEach(d => {
        console.log(`   ID: ${d.document_id}, Title: ${d.title}, Faculty: ${d.faculty_id}, Created: ${d.created_at}`);
      });
    } else {
      console.log('   No documents found');
    }
    
    // Check messages
    console.log('\n4. MESSAGES:');
    const [messages] = await db.execute('SELECT message_id, sender_type, receiver_type, message, created_at FROM messages ORDER BY message_id DESC LIMIT 5');
    if (messages.length > 0) {
      messages.forEach(m => {
        console.log(`   ID: ${m.message_id}, From: ${m.sender_type}, To: ${m.receiver_type}, Message: "${m.message.substring(0, 50)}...", Created: ${m.created_at}`);
      });
    } else {
      console.log('   No messages found');
    }
    
    // Check attendance
    console.log('\n5. ATTENDANCE:');
    const [attendance] = await db.execute('SELECT attendance_id, student_id, faculty_id, date, status, subject FROM attendance ORDER BY attendance_id DESC LIMIT 5');
    if (attendance.length > 0) {
      attendance.forEach(a => {
        console.log(`   ID: ${a.attendance_id}, Student: ${a.student_id}, Faculty: ${a.faculty_id}, Date: ${a.date}, Status: ${a.status}, Subject: ${a.subject}`);
      });
    } else {
      console.log('   No attendance records found');
    }
    
    // Check assignments
    console.log('\n6. ASSIGNMENTS:');
    const [assignments] = await db.execute('SELECT assignment_id, faculty_id, title, created_at FROM assignments ORDER BY assignment_id');
    if (assignments.length > 0) {
      assignments.forEach(a => {
        console.log(`   ID: ${a.assignment_id}, Faculty: ${a.faculty_id}, Title: ${a.title}, Created: ${a.created_at}`);
      });
    } else {
      console.log('   No assignments found');
    }
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    process.exit(0);
  }
}

checkAllData();