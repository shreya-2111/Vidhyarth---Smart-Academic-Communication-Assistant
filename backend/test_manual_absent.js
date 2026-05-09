require('dotenv').config();
const axios = require('axios');

async function testManualAbsent() {
  try {
    console.log('=== Testing Manual Absent Functionality ===\n');
    
    // Login as Shreya
    console.log('1. Logging in as Shreya...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'shreya@gmail.com',
      password: 'Shreya@1'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    // Test manual absent marking
    console.log('\n2. Testing manual absent marking for Karan...');
    const manualAbsentData = {
      studentId: 8, // Karan's ID
      subject: 'DSA',
      className: 'Msc.IT 1st Year',
      date: '2026-04-11'
    };
    
    const response = await axios.post('http://localhost:5001/api/qr-attendance/mark-absent', 
      manualAbsentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Manual absent successful:', response.data);
    
    // Verify the status
    console.log('\n3. Verifying attendance status...');
    const verifyResponse = await axios.get(
      `http://localhost:5001/api/attendance/date/2026-04-11/Msc.IT 1st Year?division=A`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const karanRecord = verifyResponse.data.find(record => record.student_id === 8);
    console.log('Karan\'s status after manual absent:', karanRecord ? karanRecord.status : 'No record found');
    console.log('Remarks:', karanRecord ? karanRecord.remarks : 'N/A');
    
  } catch (error) {
    console.error('Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testManualAbsent();