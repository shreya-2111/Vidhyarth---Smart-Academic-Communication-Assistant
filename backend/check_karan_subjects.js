require('dotenv').config();
const db = require('./config/database');

async function checkKaranSubjects() {
  try {
    console.log('=== Checking Karan\'s Subject Access ===\n');
    
    // Get Karan's details
    const [karan] = await db.execute('SELECT * FROM student WHERE student_id = 8');
    console.log('Karan\'s details:', karan[0]);
    
    // Get class ID for Karan's class
    const [classes] = await db.execute('SELECT * FROM classes WHERE class_name = ?', [karan[0].class]);
    console.log('\nKaran\'s class info:', classes[0]);
    
    if (classes.length > 0) {
      const classId = classes[0].class_id;
      const division = karan[0].division;
      
      // Get subjects available for Karan's class and division
      const [availableSubjects] = await db.execute(`
        SELECT DISTINCT s.subject_name, s.subject_code, fs.division, c.class_name
        FROM faculty_subjects fs
        JOIN subjects s ON fs.subject_id = s.subject_id
        JOIN classes c ON fs.class_id = c.class_id
        WHERE fs.class_id = ? AND fs.division = ? AND fs.is_active = 1
      `, [classId, division]);
      
      console.log(`\nSubjects available for ${karan[0].name} (Class: ${karan[0].class}, Division: ${division}):`);
      availableSubjects.forEach(subject => {
        console.log(`- ${subject.subject_name} (${subject.subject_code})`);
      });
      
      // Check what subjects faculty teaches to other divisions
      const [otherSubjects] = await db.execute(`
        SELECT DISTINCT s.subject_name, s.subject_code, fs.division, c.class_name
        FROM faculty_subjects fs
        JOIN subjects s ON fs.subject_id = s.subject_id
        JOIN classes c ON fs.class_id = c.class_id
        WHERE fs.faculty_id = 1 AND fs.is_active = 1
        ORDER BY fs.division, s.subject_name
      `);
      
      console.log('\nAll subjects taught by Shreya Raval:');
      otherSubjects.forEach(subject => {
        console.log(`- ${subject.subject_name} for ${subject.class_name} Div-${subject.division}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkKaranSubjects();