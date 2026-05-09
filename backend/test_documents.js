require('dotenv').config();
const axios = require('axios');

async function testDocuments() {
  try {
    console.log('=== Testing Documents System ===\n');
    
    // Login as Karan (student)
    console.log('1. Logging in as Karan (student)...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'karan.desai@vidhyarth.com',
      password: 'Karan_123'
    });
    
    const token = loginResponse.data.token;
    console.log('Student login successful');
    
    // Test fetching public documents
    console.log('\n2. Fetching public documents...');
    const docsResponse = await axios.get('http://localhost:5001/api/documents/public', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Public documents found:', docsResponse.data.length);
    if (docsResponse.data.length > 0) {
      console.log('Sample document:', {
        title: docsResponse.data[0].title,
        subject: docsResponse.data[0].subject,
        category: docsResponse.data[0].category,
        faculty: docsResponse.data[0].faculty_name
      });
    }
    
    // Test fetching document filters
    console.log('\n3. Fetching document filters...');
    const filtersResponse = await axios.get('http://localhost:5001/api/documents/filters/public', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Available filters:', filtersResponse.data);
    
    // Test fetching master dropdowns
    console.log('\n4. Fetching master dropdowns...');
    const masterResponse = await axios.get('http://localhost:5001/api/master/dropdowns', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Master data subjects:', masterResponse.data.subjects?.length || 0);
    console.log('Master data semesters:', masterResponse.data.semesters?.length || 0);
    
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

testDocuments();