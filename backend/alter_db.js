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
    const [result] = await connection.execute('ALTER TABLE faculty ADD COLUMN subject VARCHAR(100) NULL');
    console.log("Success:", result);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
  await connection.end();
}
run();
