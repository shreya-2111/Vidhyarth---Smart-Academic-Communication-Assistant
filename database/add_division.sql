-- Add division support to Vidhyarth system
USE vidhyarth_db;

-- 1. Add division to student table
ALTER TABLE student 
  ADD COLUMN division VARCHAR(10) DEFAULT NULL AFTER class;

-- 2. Add division to faculty_subjects table
ALTER TABLE faculty_subjects 
  ADD COLUMN division VARCHAR(10) DEFAULT NULL AFTER subject_id;

-- 3. Update unique constraint on faculty_subjects to include division
ALTER TABLE faculty_subjects 
  DROP INDEX uq_faculty_class_subject;

ALTER TABLE faculty_subjects 
  ADD UNIQUE KEY uq_faculty_class_subject_div (faculty_id, class_id, subject_id, division);

-- 4. Update attendance unique constraint to include division
ALTER TABLE attendance 
  ADD COLUMN division VARCHAR(10) DEFAULT NULL AFTER subject;

ALTER TABLE attendance 
  DROP INDEX uq_attendance;

ALTER TABLE attendance 
  ADD UNIQUE KEY uq_attendance (student_id, faculty_id, date, subject, division);

-- Verify changes
DESCRIBE student;
DESCRIBE faculty_subjects;
DESCRIBE attendance;
