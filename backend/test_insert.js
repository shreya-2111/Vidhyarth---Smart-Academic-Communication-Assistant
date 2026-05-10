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
    const table = 'faculty';
    const data = {
      name: 'Vaidehi Patel',
      email: 'vaidehi2@gmail.com',
      password: 'password',
      department: 'Msc.IT',
      class: 'Msc.IT 1st Year',
      subject: 'MA',
      phone: '7894561230'
    };
    const columns = Object.keys(data).map(key => `\`${key}\``).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`;
    console.log(query);
    const [result] = await connection.execute(query, values);
    console.log('Success:', result);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
  await connection.end();
}
run();
