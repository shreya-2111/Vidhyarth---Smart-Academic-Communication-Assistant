require('dotenv').config();
const db = require('./config/database');

async function removeSampleDocuments() {
  try {
    console.log('=== Removing Sample Documents ===\n');
    
    // Show current documents
    const [current] = await db.execute(`
      SELECT document_id, title, faculty_id, created_at 
      FROM documents 
      ORDER BY created_at DESC
    `);
    
    console.log('Current documents in database:');
    current.forEach((doc, index) => {
      console.log(`${index + 1}. ID: ${doc.document_id}, Title: "${doc.title}", Faculty: ${doc.faculty_id}, Created: ${doc.created_at}`);
    });
    
    // Identify and remove the sample documents I added
    const sampleTitles = [
      'Data Structures - Arrays and Linked Lists',
      'Python Programming Assignment - Week 3', 
      'Object Oriented Analysis and Design - UML Diagrams',
      'Computer Networks - OSI Model Reference',
      'AIML Syllabus - Complete Course Outline'
    ];
    
    console.log('\n=== Removing Sample Documents ===');
    
    for (const title of sampleTitles) {
      const [result] = await db.execute(
        'DELETE FROM documents WHERE title = ?',
        [title]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✅ Removed: "${title}"`);
      } else {
        console.log(`⚠️  Not found: "${title}"`);
      }
    }
    
    // Show remaining documents
    const [remaining] = await db.execute(`
      SELECT document_id, title, faculty_id, created_at 
      FROM documents 
      ORDER BY created_at DESC
    `);
    
    console.log('\n=== Remaining Real Documents ===');
    if (remaining.length > 0) {
      remaining.forEach((doc, index) => {
        console.log(`${index + 1}. ID: ${doc.document_id}, Title: "${doc.title}", Faculty: ${doc.faculty_id}, Created: ${doc.created_at}`);
      });
    } else {
      console.log('No documents remaining in database');
    }
    
    console.log(`\nTotal documents now: ${remaining.length}`);
    
  } catch (error) {
    console.error('Error removing sample documents:', error);
  } finally {
    process.exit(0);
  }
}

removeSampleDocuments();