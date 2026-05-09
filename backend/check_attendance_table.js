require('dotenv').config();
const db = require('./config/database');

async function checkAttendanceTable() {
  try {
    console.log('=== Checking Attendance Table Structure ===\n');
    
    // Check attendance table structure
    const [structure] = await db.execute('DESCRIBE attendance');
    console.log('Attendance table structure:');
    structure.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default}`);
    });
    
    // Check if there are any attendance records
    const [records] = await db.execute('SELECT * FROM attendance LIMIT 3');
    console.log('\nSample attendance records:');
    console.log(records);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAttendanceTable();