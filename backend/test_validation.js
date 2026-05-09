require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://172.19.53.229:5001/api';

async function testValidation() {
  try {
    console.log('=== Testing QR Attendance Validation ===\n');
    
    // Step 1: Login as faculty
    console.log('1. Faculty Login...');
    const facultyLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'shreya@gmail.com',
      password: 'Shreya@1'
    });
    
    const facultyToken = facultyLogin.data.token;
    console.log('✓ Faculty logged in');
    
    // Step 2: Create QR session for UI/UX (Division D)
    console.log('\n2. Creating QR Session for UI/UX...');
    const sessionResponse = await axios.post(`${BASE_URL}/qr-attendance/create-session`, {
      subject: 'UI / UX',
      className: 'Msc.IT 1st Year',
      duration: 30
    }, {
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    
    const session = sessionResponse.data;
    console.log(`✓ QR Session created for UI/UX`);
    
    // Step 3: Login as Karan (Division A)
    console.log('\n3. Karan Login...');
    const karanLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'karan.desai@vidhyarth.com',
      password: 'Karan_123'
    });
    
    const karanToken = karanLogin.data.token;
    console.log('✓ Karan logged in (Division A)');
    
    // Step 4: Try to mark attendance for UI/UX (should fail)
    console.log('\n4. Karan trying to scan UI/UX QR (should fail)...');
    try {
      await axios.post(`${BASE_URL}/qr-attendance/mark-attendance`, {
        qrData: session.qrCode
      }, {
        headers: { 'Authorization': `Bearer ${karanToken}` }
      });
      console.log('❌ Validation failed - Karan was allowed to mark UI/UX attendance');
    } catch (error) {
      console.log('✓ Validation working:', error.response.data.error);
    }
    
    // Step 5: Create QR session for DSA (Division A)
    console.log('\n5. Creating QR Session for DSA...');
    const dsaSessionResponse = await axios.post(`${BASE_URL}/qr-attendance/create-session`, {
      subject: 'DSA',
      className: 'Msc.IT 1st Year',
      duration: 30
    }, {
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    
    const dsaSession = dsaSessionResponse.data;
    console.log('✓ QR Session created for DSA');
    
    // Step 6: Karan marks attendance for DSA (should succeed)
    console.log('\n6. Karan scanning DSA QR (should succeed)...');
    try {
      const attendanceResponse = await axios.post(`${BASE_URL}/qr-attendance/mark-attendance`, {
        qrData: dsaSession.qrCode
      }, {
        headers: { 'Authorization': `Bearer ${karanToken}` }
      });
      console.log('✓ DSA attendance marked successfully');
      console.log(`  Student: ${attendanceResponse.data.student}`);
      console.log(`  Subject: ${attendanceResponse.data.subject}`);
      console.log(`  Division: ${attendanceResponse.data.division}`);
    } catch (error) {
      console.log('❌ DSA attendance failed:', error.response.data.error);
    }
    
    console.log('\n🎉 Validation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testValidation();