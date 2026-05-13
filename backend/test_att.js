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
    const [rows] = await connection.execute('DESCRIBE attendance');
    console.log(rows);
    
    // Also check what is currently saved for today for karan
    const [att] = await connection.execute('SELECT * FROM attendance WHERE date = CURDATE()');
    console.log("Today attendance:", att);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
  await connection.end();
}
run();
