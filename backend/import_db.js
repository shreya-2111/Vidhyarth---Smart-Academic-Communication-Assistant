const fs = require('fs');
const mysql = require('mysql2/promise');

async function importDb() {
  const connection = await mysql.createConnection({
    host: 'metro.proxy.rlwy.net',
    port: 44117,
    user: 'root',
    password: 'kNkVTBeFceikvGbnZMsZUkDAcodtYcbm',
    database: 'railway',
    multipleStatements: true
  });

  console.log('Connected to Railway database.');

  const sql = fs.readFileSync('../dump2.sql', 'utf8');
  console.log('Read SQL file. Executing...');
  
  await connection.query(sql);
  
  console.log('Import successful!');
  await connection.end();
}

importDb().catch(console.error);
