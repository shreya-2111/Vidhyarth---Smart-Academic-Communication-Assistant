const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  // CleverCloud injects MYSQL_ADDON_* variables when addon is linked
  // Fallback to DB_* for local development
  host:     process.env.MYSQL_ADDON_HOST     || process.env.DB_HOST,
  user:     process.env.MYSQL_ADDON_USER     || process.env.DB_USER,
  password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQL_ADDON_DB       || process.env.DB_NAME,
  port:     parseInt(process.env.MYSQL_ADDON_PORT || process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false }
});

const promisePool = pool.promise();

module.exports = promisePool;
