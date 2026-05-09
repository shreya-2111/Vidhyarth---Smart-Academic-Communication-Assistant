const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function checkUser() {
  const email = 'priya.patel@vidhyarth.com';
  const password = 'Priya@123';
  
  const [users] = await db.execute('SELECT * FROM student WHERE email = ?', [email]);
  if (users.length === 0) {
    console.log('User not found');
    process.exit(1);
  }
  
  const user = users[0];
  console.log('User found in DB:', user.email);
  console.log('Hashed password in DB:', user.password);
  
  const isValid = await bcrypt.compare(password, user.password);
  console.log('Is password valid? (Priya@123):', isValid);
  
  process.exit(0);
}

checkUser();
