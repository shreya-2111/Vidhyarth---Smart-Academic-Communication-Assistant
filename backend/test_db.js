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
    const userId = 8;
    const userType = 'student';
    let query = `
      SELECT 
        n.*,
        CASE 
          WHEN n.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'today'
          WHEN n.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'this_week'
          ELSE 'older'
        END as time_group
      FROM notifications n
      WHERE n.user_id = ? AND n.user_type = ?
      ORDER BY n.created_at DESC LIMIT ? OFFSET ?
    `;
    const [notifications] = await connection.execute(query, [userId, userType, NaN, 0]);
    console.log(notifications);
  } catch (err) {
    console.error("ERROR", err.message);
  }
  await connection.end();
}
run();
