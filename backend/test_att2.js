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
    const [att] = await connection.execute('SELECT * FROM attendance WHERE subject = "DSA" ORDER BY created_at DESC LIMIT 5');
    console.log("Recent DSA attendance:", att);
    
    const [qr] = await connection.execute('SELECT * FROM qr_attendance_sessions ORDER BY created_at DESC LIMIT 2');
    console.log("Recent QR sessions:", qr);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
  await connection.end();
}
run();
