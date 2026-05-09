const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./config/database');

async function syncPasswords() {
  try {
    const filePath = path.join(__dirname, '../database/students_import_template.xlsx');
    console.log('Reading file:', filePath);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!rows || rows.length === 0) {
      console.log('No data found in excel file.');
      process.exit(1);
    }

    let updated = 0;

    for (const row of rows) {
      const data = {};
      for (const key of Object.keys(row)) {
        data[key.trim().toLowerCase().replace(/\s+/g, '_')] = 
          typeof row[key] === 'string' ? row[key].trim() : row[key];
      }

      const email = data.email;
      const password = data.password || data.default_password;

      if (!email || !password) continue;

      const hashedPassword = await bcrypt.hash(String(password), 10);
      
      const [result] = await db.execute('UPDATE student SET password = ? WHERE email = ?', [hashedPassword, email]);
      if (result.affectedRows > 0) {
        updated++;
      }
    }

    console.log(`\nPassword Sync Complete! Updated ${updated} student passwords to match the Excel file.`);
    process.exit(0);
  } catch (err) {
    console.error('Error syncing:', err);
    process.exit(1);
  }
}

syncPasswords();
