require('dotenv').config();
const axios = require('axios');

async function testQROverride() {
  try {
    console.log('=== Testing QR Override System ===\n');
    
    // Login as Shreya (faculty)
    console.log('1. Logging in as Shreya (faculty)...');
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
    
    // First, manually mark Karan as absent
    console.log('\n3. Manually marking Karan as absent...');
    await axios.post('http://localhost:5001/api/qr-attendance/mark-absent', {
      studentId: 8,
      subject: 'DSA',
      className: 'Msc.IT 1st Year',
      date: '2026-04-11'
    }, {
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    console.log('Karan marked as absent by faculty');
    
    // Create QR session for DSA
    console.log('\n4. Creating QR session for DSA...');
    const qrSession = await axios.post('http://localhost:5001/api/qr-attendance/create-session', {
      subject: 'DSA',
      className: 'Msc.IT 1st Year',
      duration: 30
    }, {
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    console.log('QR session created');
    
    // Test QR scan to override absent status
    console.log('\n5. Testing QR scan to override absent status...');
    try {
      const qrScan = await axios.post('http://localhost:5001/api/qr-attendance/mark-attendance', {
        qrData: qrSession.data.qrCode
      }, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      console.log('QR scan successful - Status changed to Present:', qrScan.data.message);
    } catch (error) {
      console.log('QR scan failed:', error.response?.data?.error || error.message);
    }
    
    // Verify final status
    console.log('\n6. Verifying final status...');
    const verifyResponse = await axios.get(
      `http://localhost:5001/api/attendance/date/2026-04-11/Msc.IT 1st Year?division=A`,
      {
        headers: { 'Authorization': `Bearer ${facultyToken}` }
      }
    );
    
    const karanRecord = verifyResponse.data.find(record => record.student_id === 8);
    console.log('Karan\'s final status:', karanRecord ? karanRecord.status : 'No record found');
    console.log('Final remarks:', karanRecord ? karanRecord.remarks : 'N/A');
    
  } catch (error) {
    console.error('Test error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testQROverride();