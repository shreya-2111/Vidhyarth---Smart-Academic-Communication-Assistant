require('dotenv').config();
const db = require('./config/database');
async function run() {
  const [faculty] = await db.execute('SELECT faculty_id, name, email FROM faculty LIMIT 5');
  console.log('FACULTY:', JSON.stringify(faculty));
  const [students] = await db.execute('SELECT student_id, name, email FROM student LIMIT 5');
  console.log('STUDENTS:', JSON.stringify(students));
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
