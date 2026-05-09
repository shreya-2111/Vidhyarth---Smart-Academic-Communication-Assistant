require('dotenv').config();
const db = require('./config/database');

async function checkQRTable() {
  try {
    console.log('=== Checking QR Attendance Sessions Table ===\n');
    
    const [tables] = await db.execute('SHOW TABLES LIKE "qr_attendance_sessions"');
    console.log('QR sessions table exists:', tables.length > 0);
    
    if (tables.length === 0) {
      console.log('Creating QR attendance sessions table...');
      await db.execute(`
        CREATE TABLE qr_attendance_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id VARCHAR(32) NOT NULL UNIQUE,
          faculty_id INT UNSIGNED NOT NULL,
          subject VARCHAR(50) NOT NULL,
          class_name VARCHAR(30) NOT NULL,
          date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          qr_code TEXT NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id)
        )
      `);
      console.log('QR sessions table created successfully');
    } else {
      console.log('Table already exists');
      
      // Show table structure
      const [structure] = await db.execute('DESCRIBE qr_attendance_sessions');
      console.log('\nTable structure:');
      structure.forEach(col => {
        console.log(`${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkQRTable();