require('dotenv').config();
const axios = require('axios');

async function testKaranAbsent() {
  try {
    console.log('=== Testing Karan Absent Marking ===\n');
    
    // Login as Shreya
    console.log('1. Logging in as Shreya...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'shreya@gmail.com',
      password: 'Shreya@1'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    // First, mark Karan as Present
    console.log('\n2. First marking Karan as Present...');
    const presentData = {
      date: '2026-04-11',
      subject: 'DSA',
      className: 'Msc.IT 1st Year',
      attendance: {
        '8': 'Present'  // Karan's student_id
      },
      division: 'A'
    };
    
    const presentResponse = await axios.post('http://localhost:5001/api/attendance/save', 
      presentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Present marking successful:', presentResponse.data);
    
    // Now, mark Karan as Absent (this should update the existing record)
    console.log('\n3. Now marking Karan as Absent...');
    const absentData = {
      date: '2026-04-11',
      subject: 'DSA',
      className: 'Msc.IT 1st Year',
      attendance: {
        '8': 'Absent'  // Karan's student_id
      },
      division: 'A'
    };
    
    const absentResponse = await axios.post('http://localhost:5001/api/attendance/save', 
      absentData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Absent marking successful:', absentResponse.data);
    
    // Verify the final status
    console.log('\n4. Verifying final attendance status...');
    const verifyResponse = await axios.get(
      `http://localhost:5001/api/attendance/date/2026-04-11/Msc.IT 1st Year?division=A`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const karanRecord = verifyResponse.data.find(record => record.student_id === 8);
    console.log('Karan\'s final status:', karanRecord ? karanRecord.status : 'No record found');
    
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

testKaranAbsent();