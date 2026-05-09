require('dotenv').config();
const db = require('./config/database');

async function addSampleDocuments() {
  try {
    console.log('=== Adding Sample Documents ===\n');
    
    // Check if documents already exist
    const [existing] = await db.execute('SELECT COUNT(*) as count FROM documents');
    console.log('Existing documents:', existing[0].count);
    
    if (existing[0].count > 5) {
      console.log('Sample documents already exist');
      return;
    }
    
    const sampleDocs = [
      {
        faculty_id: 1, // Shreya
        title: 'Data Structures - Arrays and Linked Lists',
        description: 'Comprehensive guide to arrays and linked lists with examples',
        file_name: 'dsa_arrays_linkedlists.pdf',
        file_path: '/uploads/documents/dsa_arrays_linkedlists.pdf',
        file_size: 2048576, // 2MB
        file_type: 'application/pdf',
        subject: 'DSA',
        semester: 'Semester - 1',
        category: 'lecture_notes',
        is_public: 1
      },
      {
        faculty_id: 1, // Shreya
        title: 'Python Programming Assignment - Week 3',
        description: 'Assignment on functions, loops and conditional statements',
        file_name: 'python_assignment_week3.pdf',
        file_path: '/uploads/documents/python_assignment_week3.pdf',
        file_size: 1024000, // 1MB
        file_type: 'application/pdf',
        subject: 'Python',
        semester: 'Semester - 1',
        category: 'assignments',
        is_public: 1
      },
      {
        faculty_id: 1, // Shreya
        title: 'Object Oriented Analysis and Design - UML Diagrams',
        description: 'Introduction to UML diagrams and their applications',
        file_name: 'ooad_uml_diagrams.pptx',
        file_path: '/uploads/documents/ooad_uml_diagrams.pptx',
        file_size: 3145728, // 3MB
        file_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        subject: 'OOAD',
        semester: 'Semester - 1',
        category: 'slides',
        is_public: 1
      },
      {
        faculty_id: 3, // Vaidehi
        title: 'Computer Networks - OSI Model Reference',
        description: 'Detailed reference material for OSI model layers',
        file_name: 'cn_osi_model_reference.pdf',
        file_path: '/uploads/documents/cn_osi_model_reference.pdf',
        file_size: 1536000, // 1.5MB
        file_type: 'application/pdf',
        subject: 'CN',
        semester: 'Semester - 2',
        category: 'reference',
        is_public: 1
      },
      {
        faculty_id: 3, // Vaidehi
        title: 'AIML Syllabus - Complete Course Outline',
        description: 'Complete syllabus for Artificial Intelligence and Machine Learning course',
        file_name: 'aiml_syllabus.pdf',
        file_path: '/uploads/documents/aiml_syllabus.pdf',
        file_size: 512000, // 512KB
        file_type: 'application/pdf',
        subject: 'AIML',
        semester: 'Semester - 2',
        category: 'syllabus',
        is_public: 1
      }
    ];
    
    for (const doc of sampleDocs) {
      await db.execute(`
        INSERT INTO documents (
          faculty_id, title, description, file_name, file_path, 
          file_size, file_type, subject, semester, category, is_public
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        doc.faculty_id, doc.title, doc.description, doc.file_name, doc.file_path,
        doc.file_size, doc.file_type, doc.subject, doc.semester, doc.category, doc.is_public
      ]);
      
      console.log(`✅ Added: ${doc.title}`);
    }
    
    console.log('\n✅ Sample documents added successfully!');
    
    // Show final count
    const [final] = await db.execute('SELECT COUNT(*) as count FROM documents');
    console.log('Total documents now:', final[0].count);
    
  } catch (error) {
    console.error('Error adding sample documents:', error);
  } finally {
    process.exit(0);
  }
}

addSampleDocuments();