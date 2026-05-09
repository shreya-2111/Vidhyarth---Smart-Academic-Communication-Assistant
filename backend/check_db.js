require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
  const [faculty] = await conn.execute('SELECT faculty_id, name, email FROM faculty LIMIT 5');
  console.log('FACULTY:', JSON.stringify(faculty));
  const [students] = await conn.execute('SELECT student_id, name, email FROM student LIMIT 3');
  console.log('STUDENTS:', JSON.stringify(students));
  await conn.end();
}
run().catch(e => console.error('DB ERROR:', e.message));
