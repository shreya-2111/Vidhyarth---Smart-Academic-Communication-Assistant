require('dotenv').config();
const axios = require('axios');

async function testStudentMessages() {
  try {
    console.log('=== Testing Student Messages System ===\n');
    
    // Login as Karan (student)
    console.log('1. Logging in as Karan (student)...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'karan.desai@vidhyarth.com',
      password: 'Karan_123'
    });
    
    const token = loginResponse.data.token;
    console.log('Student login successful');
    
    // Test fetching faculty list for students
    console.log('\n2. Fetching faculty list for student...');
    const facultyResponse = await axios.get('http://localhost:5001/api/messages/faculty', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Faculty list available to students:', facultyResponse.data);
    
    // Test student sending message to faculty
    if (facultyResponse.data.length > 0) {
      const faculty = facultyResponse.data[0]; // First faculty member
      console.log('\n3. Testing student sending message to faculty...');
      const messageResponse = await axios.post('http://localhost:5001/api/messages/send', {
        senderId: 8, // Karan's student ID
        senderType: 'student',
        receiverId: faculty.faculty_id,
        receiverType: 'faculty',
        message: 'Hello faculty, this is a test message from student Karan'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Message sent from student to faculty:', messageResponse.data);
      
      // Test fetching student's sent messages
      console.log('\n4. Fetching student\'s sent messages...');
      const sentResponse = await axios.get('http://localhost:5001/api/messages/sent/8/student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Student sent messages:', sentResponse.data.length, 'messages');
      if (sentResponse.data.length > 0) {
        console.log('Latest sent message:', {
          to: sentResponse.data[0].receiver_name,
          message: sentResponse.data[0].message,
          date: sentResponse.data[0].created_at
        });
      }
      
    } else {
      console.log('\n3. No faculty members found for testing');
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

testStudentMessages();