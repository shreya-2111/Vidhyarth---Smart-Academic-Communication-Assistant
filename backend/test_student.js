const mysql = require('mysql2/promise');
async function run() {
  const connection = await mysql.createConnection({
    host: 'metro.proxy.rlwy.net',
    port: 44117,
    user: 'root',
    password: 'kNkVTBeFceikvGbnZMsZUkDAcodtYcbm',
    database: 'railway'
  });
  try {
    const [students] = await connection.execute('SELECT student_id, name, class, division FROM student WHERE name LIKE "%Karan%"');
    console.log("Karan:", students);
    
    const [fs] = await connection.execute('SELECT * FROM faculty_subjects WHERE faculty_id = 1 AND subject_id = (SELECT subject_id FROM subjects WHERE subject_name = "DSA")');
    console.log("Faculty Subjects:", fs);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
  await connection.end();
}
run();
