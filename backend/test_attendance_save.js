require('dotenv').config();
const axios = require('axios');

async function testAttendanceSave() {
  try {
    console.log('=== Testing Attendance Save ===\n');
    
    // First, login as Shreya to get token
    console.log('1. Logging in as Shreya...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'shreya@gmail.com',
      password: 'Shreya@1'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Test attendance save
    console.log('\n2. Testing attendance save...');
    const attendanceData = {
      date: '2026-04-11',
      subject: 'DSA',
      className: 'Msc.IT 1st Year',
      attendance: {
        '8': 'Present'  // Karan's student_id
      },
      division: 'A'
    };
    
    console.log('Sending attendance data:', attendanceData);
    
    const saveResponse = await axios.post('http://localhost:5001/api/attendance/save', 
      attendanceData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Save successful:', saveResponse.data);
    
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

testAttendanceSave();