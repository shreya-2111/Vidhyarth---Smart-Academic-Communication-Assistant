require('dotenv').config();
const db = require('./config/database');

async function removeFinalTestMessage() {
  try {
    const [result] = await db.execute('DELETE FROM messages WHERE message = "yes ma\'am...."');
    if (result.affectedRows > 0) {
      console.log('✅ Removed final test message');
    } else {
      console.log('⚠️  Message not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

removeFinalTestMessage();