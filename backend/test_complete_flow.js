require('dotenv').config();
const axios = require('axios');
const db = require('./config/database');

async function testCompleteFlow() {
  try {
    console.log('=== Testing Complete Manual Absent + QR Override Flow ===\n');
    
    // Clean up any existing records first
    console.log('0. Cleaning up existing records...');
    const testDate = new Date().toISOString().split('T')[0]; // Use today's date
    console.log('Using test date:', testDate);
    
    await db.execute(`
      DELETE FROM attendance 
      WHERE student_id = 8 AND date = ? AND subject = 'DSA'
    `, [testDate]);
    console.log('Existing records cleaned up');
    
    // Login as Shreya (faculty)
    console.log('\n1. Logging in as Shreya (faculty)...');
    const facultyLogin = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'shreya@gmail.com',
      password: 'Shreya@1'
    });
    const facultyToken = facultyLogin.data.token;
    console.log('Faculty login successful');
    
    // Login as Karan (student)
    console.log('\n2. Logging in as Karan (student)...');
    const studentLogin = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'karan.desai@vidhyarth.com',
      password: 'Karan_123'
    });
    const studentToken = studentLogin.data.token;
    console.log('Student login successful');
    
    // Step 1: Manually mark Karan as absent
    console.log('\n3. Step 1: Manually marking Karan as absent...');
    const absentResponse = await axios.post('http://localhost:5001/api/qr-attendance/mark-absent', {
      studentId: 8,
      subject: 'DSA',
      className: 'Msc.IT 1st Year',
      date: testDate // Use the same date as QR session
    }, {
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    console.log('✅ Karan marked as absent:', absentResponse.data.message);
    
    // Verify absent status
    let [records] = await db.execute(`
      SELECT * FROM attendance 
      WHERE student_id = 8 AND date = ? AND subject = 'DSA'
    `, [testDate]);
    console.log('   Database status:', records[0]?.status || 'No record');
    
    // Step 2: Create QR session
    console.log('\n4. Step 2: Creating QR session for DSA...');
    const qrSession = await axios.post('http://localhost:5001/api/qr-attendance/create-session', {
      subject: 'DSA',
      className: 'Msc.IT 1st Year',
      duration: 30
    }, {
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    console.log('✅ QR session created:', qrSession.data.sessionId);
    
    // Step 3: Student scans QR to change from Absent to Present
    console.log('\n5. Step 3: Karan scans QR to change from Absent to Present...');
    try {
      const qrScan = await axios.post('http://localhost:5001/api/qr-attendance/mark-attendance', {
        qrData: qrSession.data.qrCode
      }, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      console.log('✅ QR scan successful:', qrScan.data.message);
    } catch (error) {
      console.log('❌ QR scan failed:', error.response?.data?.error || error.message);
    }
    
    // Verify final status
    console.log('\n6. Final verification...');
    [records] = await db.execute(`
      SELECT * FROM attendance 
      WHERE student_id = 8 AND date = ? AND subject = 'DSA'
    `, [testDate]);
    
    if (records.length > 0) {
      console.log('✅ Final status:', records[0].status);
      console.log('   Remarks:', records[0].remarks);
      console.log('   Created at:', records[0].created_at);
    } else {
      console.log('❌ No attendance record found');
    }
    
  } catch (error) {
    console.error('Test error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

testCompleteFlow();