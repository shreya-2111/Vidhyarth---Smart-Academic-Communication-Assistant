require('dotenv').config();
const axios = require('axios');

async function testQRAttendance() {
  try {
    console.log('=== Testing QR Attendance System ===\n');
    
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
    
    // Create QR session for DSA (valid for Karan)
    console.log('\n3. Creating QR session for DSA...');
    const qrSession = await axios.post('http://localhost:5001/api/qr-attendance/create-session', {
      subject: 'DSA',
      className: 'Msc.IT 1st Year',
      duration: 30
    }, {
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    
    console.log('QR session created:', {
      sessionId: qrSession.data.sessionId,
      subject: qrSession.data.subject,
      className: qrSession.data.className
    });
    
    // Test valid QR scan (Karan scanning DSA QR)
    console.log('\n4. Testing valid QR scan (Karan -> DSA)...');
    try {
      const validScan = await axios.post('http://localhost:5001/api/qr-attendance/mark-attendance', {
        qrData: qrSession.data.qrCode
      }, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      console.log('Valid scan successful:', validScan.data.message);
    } catch (error) {
      console.log('Valid scan failed:', error.response?.data?.error || error.message);
    }
    
    // Create QR session for UI/UX (invalid for Karan - he's in Division A, UI/UX is for Division D)
    console.log('\n5. Creating QR session for UI/UX...');
    const invalidQrSession = await axios.post('http://localhost:5001/api/qr-attendance/create-session', {
      subject: 'UI / UX',
      className: 'Msc.IT 1st Year',
      duration: 30
    }, {
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    
    console.log('UI/UX QR session created');
    
    // Test invalid QR scan (Karan scanning UI/UX QR - should fail)
    console.log('\n6. Testing invalid QR scan (Karan -> UI/UX - should fail)...');
    try {
      const invalidScan = await axios.post('http://localhost:5001/api/qr-attendance/mark-attendance', {
        qrData: invalidQrSession.data.qrCode
      }, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      console.log('Invalid scan unexpectedly succeeded:', invalidScan.data);
    } catch (error) {
      console.log('Invalid scan correctly failed:', error.response?.data?.error || error.message);
    }
    
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

testQRAttendance();