require('dotenv').config();
const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function addTestFaculty() {
  try {
    console.log('=== Adding Test Faculty Member ===\n');
    
    // Check if Vaidehi already exists
    const [existing] = await db.execute(
      'SELECT * FROM faculty WHERE email = ?',
      ['vaidehi@gmail.com']
    );
    
    if (existing.length > 0) {
      console.log('Vaidehi Patel already exists in the system');
      console.log('Faculty ID:', existing[0].faculty_id);
      console.log('Name:', existing[0].name);
      return;
    }
    
    // Hash password for Vaidehi
    const hashedPassword = await bcrypt.hash('Vaidehi@1', 10);
    
    // Insert Vaidehi as second faculty member
    const [result] = await db.execute(`
      INSERT INTO faculty (name, email, password, department, class, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['Vaidehi Patel', 'vaidehi@gmail.com', hashedPassword, 'Msc.IT', 'Msc.IT 2nd Year', 1]);
    
    console.log('✅ Added Vaidehi Patel as faculty member');
    console.log('Faculty ID:', result.insertId);
    console.log('Email: vaidehi@gmail.com');
    console.log('Password: Vaidehi@1');
    
  } catch (error) {
    console.error('Error adding faculty:', error);
  } finally {
    process.exit(0);
  }
}

addTestFaculty();