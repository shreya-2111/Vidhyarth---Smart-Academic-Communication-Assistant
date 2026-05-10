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
    const [rows] = await connection.execute('DESCRIBE faculty');
    console.log(rows);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
  await connection.end();
}
run();
