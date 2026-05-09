require('dotenv').config();
const axios = require('axios');

async function testFacultyMessages() {
  try {
    console.log('=== Testing Faculty Messages System ===\n');
    
    // Login as Shreya
    console.log('1. Logging in as Shreya...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'shreya@gmail.com',
      password: 'Shreya@1'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    // Test fetching faculty list
    console.log('\n2. Fetching faculty list...');
    const facultyResponse = await axios.get('http://localhost:5001/api/messages/faculty', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Faculty list:', facultyResponse.data);
    
    // Test sending message to faculty (if there are other faculty members)
    if (facultyResponse.data.length > 1) {
      const otherFaculty = facultyResponse.data.find(f => f.faculty_id !== 1); // Not Shreya
      if (otherFaculty) {
        console.log('\n3. Testing send message to faculty...');
        const messageResponse = await axios.post('http://localhost:5001/api/messages/send', {
          senderId: 1, // Shreya's ID
          senderType: 'faculty',
          receiverId: otherFaculty.faculty_id,
          receiverType: 'faculty',
          message: 'Test message from Shreya to another faculty member'
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Message sent successfully:', messageResponse.data);
      } else {
        console.log('\n3. No other faculty members found to test messaging');
      }
    } else {
      console.log('\n3. Only one faculty member in system, cannot test faculty-to-faculty messaging');
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

testFacultyMessages();