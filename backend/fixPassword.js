const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function fixPassword() {
  const email = 'priya.patel@vidhyarth.com';
  const password = 'Priya@123';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await db.execute('UPDATE student SET password = ? WHERE email = ?', [hashedPassword, email]);
  
  console.log(`Password for ${email} reset to ${password}`);
  process.exit(0);
}

fixPassword();
