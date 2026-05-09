require('dotenv').config();
const db = require('./config/database');

async function debugAttendance() {
  try {
    console.log('=== Debugging Attendance Records ===\n');
    
    // Check current attendance records for Karan
    const [records] = await db.execute(`
      SELECT * FROM attendance 
      WHERE student_id = 8 AND date = '2026-04-11' AND subject = 'DSA'
      ORDER BY created_at DESC
    `);
    
    console.log('Current attendance records for Karan (student_id=8):');
    records.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.attendance_id}, Status: ${record.status}, Remarks: ${record.remarks}, Created: ${record.created_at}`);
    });
    
    if (records.length === 0) {
      console.log('No attendance records found for Karan on 2026-04-11 for DSA');
    }
    
    // Check if there are multiple records (which shouldn't happen due to unique constraint)
    if (records.length > 1) {
      console.log('\n⚠️  WARNING: Multiple records found! This violates the unique constraint.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

debugAttendance();