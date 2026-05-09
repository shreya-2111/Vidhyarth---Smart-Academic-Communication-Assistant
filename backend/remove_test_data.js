require('dotenv').config();
const db = require('./config/database');

async function removeTestData() {
  try {
    console.log('=== Removing Test Data I Added ===\n');
    
    // 1. Remove Vaidehi Patel (faculty ID 3) - I added this for testing
    console.log('1. Removing test faculty member (Vaidehi Patel)...');
    const [facultyResult] = await db.execute('DELETE FROM faculty WHERE faculty_id = 3 AND name = "Vaidehi Patel"');
    if (facultyResult.affectedRows > 0) {
      console.log('✅ Removed Vaidehi Patel (test faculty)');
    } else {
      console.log('⚠️  Vaidehi Patel not found or already removed');
    }
    
    // 2. Remove test messages I created
    console.log('\n2. Removing test messages...');
    const testMessages = [
      'Test message from Shreya to another faculty member',
      'Hello faculty, this is a test message from student Karan'
    ];
    
    for (const msg of testMessages) {
      const [msgResult] = await db.execute('DELETE FROM messages WHERE message LIKE ?', [`%${msg}%`]);
      if (msgResult.affectedRows > 0) {
        console.log(`✅ Removed test message: "${msg.substring(0, 50)}..."`);
      }
    }
    
    // 3. Remove test attendance records I created (keep only real ones)
    console.log('\n3. Removing test attendance records...');
    // Remove attendance records with remarks indicating they were test data
    const [attResult1] = await db.execute('DELETE FROM attendance WHERE remarks LIKE "%QR Code Attendance%" OR remarks LIKE "%Manually marked absent by faculty%"');
    if (attResult1.affectedRows > 0) {
      console.log(`✅ Removed ${attResult1.affectedRows} QR/manual test attendance records`);
    }
    
    // 4. Remove any QR attendance sessions I created for testing
    console.log('\n4. Removing QR attendance sessions...');
    const [qrResult] = await db.execute('DELETE FROM qr_attendance_sessions');
    if (qrResult.affectedRows > 0) {
      console.log(`✅ Removed ${qrResult.affectedRows} QR attendance sessions`);
    } else {
      console.log('⚠️  No QR attendance sessions found');
    }
    
    // 5. Show remaining data
    console.log('\n=== Remaining Real Data ===');
    
    const [faculty] = await db.execute('SELECT faculty_id, name, email FROM faculty ORDER BY faculty_id');
    console.log('Faculty members:');
    faculty.forEach(f => console.log(`   ${f.faculty_id}. ${f.name} (${f.email})`));
    
    const [documents] = await db.execute('SELECT document_id, title FROM documents ORDER BY document_id');
    console.log('\nDocuments:');
    if (documents.length > 0) {
      documents.forEach(d => console.log(`   ${d.document_id}. ${d.title}`));
    } else {
      console.log('   No documents');
    }
    
    const [messages] = await db.execute('SELECT COUNT(*) as count FROM messages');
    console.log(`\nMessages: ${messages[0].count} total`);
    
    const [attendance] = await db.execute('SELECT COUNT(*) as count FROM attendance');
    console.log(`Attendance records: ${attendance[0].count} total`);
    
    const [assignments] = await db.execute('SELECT COUNT(*) as count FROM assignments');
    console.log(`Assignments: ${assignments[0].count} total`);
    
    console.log('\n✅ Test data cleanup completed!');
    
  } catch (error) {
    console.error('Error removing test data:', error);
  } finally {
    process.exit(0);
  }
}

removeTestData();