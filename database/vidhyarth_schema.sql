-- ================================================================
--  VIDHYARTH — Smart Academic & Communication Assistant
--  Clean Production Schema
--  Database  : vidhyarth_db
--  Engine    : InnoDB | Charset: utf8mb4
--  Compatible: MySQL 5.7+ / MariaDB 10.3+
-- ================================================================
--
--  TABLE OVERVIEW (18 tables, dependency order)
--  ─────────────────────────────────────────────
--  Core master data  : admin, classes, subjects
--  Users             : faculty, student
--  Assignments       : faculty_subjects, timetable
--  Academic activity : attendance, assignments, assignment_submissions
--  Performance       : grades, performance_summary
--  Communication     : messages, announcements, notifications
--  Resources         : documents, document_access
--  System            : chatbot_logs
--
--  REMOVED (unused / redundant)
--  ─────────────────────────────
--  grades_performance  — empty table, fully replaced by `grades`
--  classes.class_code  — always NULL, no business use
--  faculty.subject     — always NULL, replaced by faculty_subjects
--  grades.subject_name — exact duplicate of grades.subject
--  documents.file_url  — always NULL, system uses file_path
-- ================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE             = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET NAMES                utf8mb4;
SET CHARACTER SET        utf8mb4;

-- ----------------------------------------------------------------
-- Create database (skip if already exists)
-- ----------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS vidhyarth_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vidhyarth_db;

-- NOTE: When importing into a different database name,
-- replace 'vidhyarth_db' above or run: USE your_db_name;

-- ================================================================
-- 1. admin
--    Single system administrator account.
-- ================================================================
CREATE TABLE IF NOT EXISTS admin (
  admin_id   INT          UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(50)           NOT NULL,
  email      VARCHAR(50)           NOT NULL,
  password   VARCHAR(255)          NOT NULL,          -- bcrypt hash
  created_at TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (admin_id),
  UNIQUE  KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 2. classes
--    Msc.IT semesters — 4 rows (Sem 1–4).
--    No class_code (removed — always NULL).
-- ================================================================
CREATE TABLE IF NOT EXISTS classes (
  class_id   INT          UNSIGNED NOT NULL AUTO_INCREMENT,
  class_name VARCHAR(30)           NOT NULL,           -- e.g. 'Msc.IT 1st Year'
  semester   VARCHAR(20)           NOT NULL,           -- e.g. 'Semester 1'
  department VARCHAR(20)           NOT NULL DEFAULT 'Msc.IT',
  is_active  TINYINT(1)            NOT NULL DEFAULT 1,
  created_at TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP
                                             ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 3. subjects
--    Each subject belongs to one class/semester.
-- ================================================================
CREATE TABLE IF NOT EXISTS subjects (
  subject_id   INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_name VARCHAR(50)          NOT NULL,
  subject_code VARCHAR(15)          NOT NULL,          -- e.g. 'DSA101'
  class_id     INT         UNSIGNED NOT NULL,
  credits      TINYINT              NOT NULL DEFAULT 3,
  department   VARCHAR(20)          NOT NULL DEFAULT 'Msc.IT',
  is_active    TINYINT(1)           NOT NULL DEFAULT 1,
  created_at   TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP
                                              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (subject_id),
  UNIQUE  KEY uq_subject_code (subject_code),
  KEY         idx_subjects_class (class_id),

  CONSTRAINT fk_subjects_class
    FOREIGN KEY (class_id) REFERENCES classes (class_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 4. faculty
--    Teaching staff. subject column removed (use faculty_subjects).
-- ================================================================
CREATE TABLE IF NOT EXISTS faculty (
  faculty_id INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(50)          NOT NULL,
  email      VARCHAR(50)          NOT NULL,
  password   VARCHAR(255)         NOT NULL,            -- bcrypt hash
  department VARCHAR(20)          NOT NULL DEFAULT 'Msc.IT',
  class      VARCHAR(30)                   DEFAULT NULL, -- primary class label
  phone      VARCHAR(15)                   DEFAULT NULL,
  is_active  TINYINT(1)           NOT NULL DEFAULT 1,
  created_at TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (faculty_id),
  UNIQUE  KEY uq_faculty_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 5. student
-- ================================================================
CREATE TABLE IF NOT EXISTS student (
  student_id INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(50)          NOT NULL,
  email      VARCHAR(50)          NOT NULL,
  password   VARCHAR(255)         NOT NULL,            -- bcrypt hash
  department VARCHAR(20)          NOT NULL DEFAULT 'Msc.IT',
  class      VARCHAR(30)                   DEFAULT NULL,
  roll_no    VARCHAR(20)                   DEFAULT NULL,
  phone      VARCHAR(15)                   DEFAULT NULL,
  is_active  TINYINT(1)           NOT NULL DEFAULT 1,
  created_at TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (student_id),
  UNIQUE  KEY uq_student_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 6. faculty_subjects
--    Maps faculty → class → subject (many-to-many).
--    Unique constraint prevents duplicate assignments.
-- ================================================================
CREATE TABLE IF NOT EXISTS faculty_subjects (
  id         INT       UNSIGNED NOT NULL AUTO_INCREMENT,
  faculty_id INT       UNSIGNED NOT NULL,
  class_id   INT       UNSIGNED NOT NULL,
  subject_id INT       UNSIGNED NOT NULL,
  is_active  TINYINT(1)         NOT NULL DEFAULT 1,
  assigned_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  KEY uq_faculty_class_subject (faculty_id, class_id, subject_id),
  KEY         idx_fs_class   (class_id),
  KEY         idx_fs_subject (subject_id),

  CONSTRAINT fk_fs_faculty
    FOREIGN KEY (faculty_id)  REFERENCES faculty  (faculty_id)
    ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_fs_class
    FOREIGN KEY (class_id)    REFERENCES classes  (class_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_fs_subject
    FOREIGN KEY (subject_id)  REFERENCES subjects (subject_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 7. timetable
--    Weekly schedule entries per faculty.
-- ================================================================
CREATE TABLE IF NOT EXISTS timetable (
  timetable_id INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  faculty_id   INT         UNSIGNED NOT NULL,
  subject      VARCHAR(50)          NOT NULL,
  class_name   VARCHAR(30)                   DEFAULT NULL,
  day          ENUM('Monday','Tuesday','Wednesday',
                    'Thursday','Friday','Saturday') NOT NULL,
  start_time   TIME                 NOT NULL,
  end_time     TIME                 NOT NULL,
  room_no      VARCHAR(10)                   DEFAULT NULL,
  created_at   TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (timetable_id),
  KEY idx_tt_faculty (faculty_id),
  KEY idx_tt_day     (day),

  CONSTRAINT fk_tt_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 8. attendance
--    One row per student per class session.
--    Only Present / Absent (no Late — system design decision).
--    Unique key prevents duplicate records for same session.
-- ================================================================
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id    INT         UNSIGNED NOT NULL,
  faculty_id    INT         UNSIGNED NOT NULL,
  date          DATE                 NOT NULL,
  status        ENUM('Present','Absent') NOT NULL,
  subject       VARCHAR(50)                   DEFAULT NULL,
  remarks       VARCHAR(200)                  DEFAULT NULL,
  created_at    TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (attendance_id),
  UNIQUE  KEY uq_attendance (student_id, faculty_id, date, subject),
  KEY         idx_att_faculty (faculty_id),
  KEY         idx_att_date    (date),

  CONSTRAINT fk_att_student
    FOREIGN KEY (student_id) REFERENCES student (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_att_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 9. assignments
--    Assignments created by faculty.
-- ================================================================
CREATE TABLE IF NOT EXISTS assignments (
  assignment_id INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  faculty_id    INT         UNSIGNED NOT NULL,
  title         VARCHAR(100)         NOT NULL,
  description   TEXT                          DEFAULT NULL,
  course        VARCHAR(50)                   DEFAULT NULL,
  file_url      VARCHAR(300)                  DEFAULT NULL, -- uploaded file path
  deadline      DATETIME                      DEFAULT NULL,
  created_at    TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (assignment_id),
  KEY idx_assign_faculty   (faculty_id),
  KEY idx_assign_deadline  (deadline),

  CONSTRAINT fk_assign_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 10. assignment_submissions
--     One submission per student per assignment (enforced by UNIQUE).
-- ================================================================
CREATE TABLE IF NOT EXISTS assignment_submissions (
  submission_id  INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  assignment_id  INT         UNSIGNED NOT NULL,
  student_id     INT         UNSIGNED NOT NULL,
  submission_url VARCHAR(300)                  DEFAULT NULL,
  status         ENUM('submitted','late')      NOT NULL DEFAULT 'submitted',
  marks_obtained DECIMAL(5,2)                  DEFAULT NULL,
  feedback       TEXT                          DEFAULT NULL,
  submitted_at   TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (submission_id),
  UNIQUE  KEY uq_submission (assignment_id, student_id),

  CONSTRAINT fk_sub_assignment
    FOREIGN KEY (assignment_id) REFERENCES assignments (assignment_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_sub_student
    FOREIGN KEY (student_id)    REFERENCES student     (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 11. grades
--     Individual exam/quiz grade entries per student.
--     subject_name removed (duplicate of subject).
--     percentage is stored (computed by backend on insert).
-- ================================================================
CREATE TABLE IF NOT EXISTS grades (
  grade_id       INT          UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id     INT          UNSIGNED NOT NULL,
  faculty_id     INT          UNSIGNED          DEFAULT NULL,
  subject        VARCHAR(50)           NOT NULL,
  exam_type      VARCHAR(20)                    DEFAULT NULL, -- quiz/midterm/final
  marks_obtained DECIMAL(5,2)                   DEFAULT NULL,
  total_marks    DECIMAL(5,2)          NOT NULL DEFAULT 100.00,
  percentage     DECIMAL(5,2)                   DEFAULT NULL, -- auto-computed
  grade_letter   VARCHAR(3)                     DEFAULT NULL, -- A+, B-, F …
  semester       VARCHAR(20)                    DEFAULT NULL,
  exam_date      DATE                           DEFAULT NULL,
  created_at     TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (grade_id),
  KEY idx_grades_student (student_id),
  KEY idx_grades_subject (subject),

  CONSTRAINT fk_grade_student
    FOREIGN KEY (student_id) REFERENCES student (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_grade_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 12. performance_summary
--     Aggregated per student per subject (upserted by backend
--     after every grade insert). One row per student+subject.
-- ================================================================
CREATE TABLE IF NOT EXISTS performance_summary (
  id                    INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id            INT         UNSIGNED NOT NULL,
  subject               VARCHAR(50)          NOT NULL,
  semester              VARCHAR(20)                   DEFAULT NULL,
  total_marks           DECIMAL(7,2)                  DEFAULT NULL,
  obtained_marks        DECIMAL(7,2)                  DEFAULT NULL,
  percentage            DECIMAL(5,2)                  DEFAULT NULL,
  grade_letter          VARCHAR(3)                    DEFAULT NULL,
  attendance_percentage DECIMAL(5,2)                  DEFAULT NULL,
  status                VARCHAR(15)                   DEFAULT NULL, -- excellent/good/poor/fail
  updated_at            TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                      ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  KEY uq_perf_student_subject (student_id, subject),

  CONSTRAINT fk_perf_student
    FOREIGN KEY (student_id) REFERENCES student (student_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 13. messages
--     Direct messages between faculty ↔ student ↔ admin.
--     No FK on sender/receiver (polymorphic — type stored in enum).
-- ================================================================
CREATE TABLE IF NOT EXISTS messages (
  message_id    INT       UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id     INT       UNSIGNED NOT NULL,
  sender_type   ENUM('faculty','student','admin') NOT NULL,
  receiver_id   INT       UNSIGNED NOT NULL,
  receiver_type ENUM('faculty','student','admin') NOT NULL,
  message       TEXT               NOT NULL,
  is_read       TINYINT(1)         NOT NULL DEFAULT 0,
  created_at    TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (message_id),
  KEY idx_msg_receiver (receiver_id, receiver_type),
  KEY idx_msg_sender   (sender_id,   sender_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 14. announcements
--     Faculty broadcasts to all students or a specific class.
-- ================================================================
CREATE TABLE IF NOT EXISTS announcements (
  announcement_id INT         UNSIGNED NOT NULL AUTO_INCREMENT,
  faculty_id      INT         UNSIGNED NOT NULL,
  title           VARCHAR(100)         NOT NULL,
  message         TEXT                 NOT NULL,
  target_type     VARCHAR(20)                   DEFAULT 'all',  -- all / students / class
  target_value    VARCHAR(50)                   DEFAULT NULL,   -- class name if targeted
  created_at      TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (announcement_id),
  KEY idx_ann_faculty (faculty_id),

  CONSTRAINT fk_ann_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 15. notifications
--     In-app notifications for faculty / student / admin.
--     Polymorphic user reference (no FK — user_type enum used).
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT       UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT       UNSIGNED NOT NULL,
  user_type       ENUM('faculty','student','admin') NOT NULL,
  type            VARCHAR(30)                 DEFAULT NULL,  -- submission/deadline/grade
  title           VARCHAR(100)                DEFAULT NULL,
  message         TEXT                        DEFAULT NULL,
  priority        ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  is_read         TINYINT(1)         NOT NULL DEFAULT 0,
  created_at      TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (notification_id),
  KEY idx_notif_user (user_id, user_type),
  KEY idx_notif_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 16. documents
--     Study materials uploaded by faculty.
--     file_url removed (always NULL — system uses file_path).
-- ================================================================
CREATE TABLE IF NOT EXISTS documents (
  document_id    INT          UNSIGNED NOT NULL AUTO_INCREMENT,
  faculty_id     INT          UNSIGNED NOT NULL,
  title          VARCHAR(100)          NOT NULL,
  description    TEXT                           DEFAULT NULL,
  file_name      VARCHAR(150)                   DEFAULT NULL,
  file_path      VARCHAR(300)                   DEFAULT NULL,  -- server-side path
  file_size      INT          UNSIGNED          DEFAULT NULL,  -- bytes
  file_type      VARCHAR(50)                    DEFAULT NULL,  -- MIME type
  subject        VARCHAR(50)                    DEFAULT NULL,
  semester       VARCHAR(20)                    DEFAULT NULL,
  category       VARCHAR(30)                    DEFAULT NULL,  -- lecture_notes/reference/…
  is_public      TINYINT(1)            NOT NULL DEFAULT 1,
  download_count INT          UNSIGNED NOT NULL DEFAULT 0,
  created_at     TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (document_id),
  KEY idx_doc_faculty  (faculty_id),
  KEY idx_doc_subject  (subject),
  KEY idx_doc_public   (is_public),

  CONSTRAINT fk_doc_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 17. document_access
--     Audit log — who downloaded / viewed a document.
-- ================================================================
CREATE TABLE IF NOT EXISTS document_access (
  id          INT       UNSIGNED NOT NULL AUTO_INCREMENT,
  document_id INT       UNSIGNED NOT NULL,
  user_id     INT       UNSIGNED NOT NULL,
  user_type   VARCHAR(10)                 DEFAULT NULL,  -- faculty/student/admin
  access_type VARCHAR(10)                 DEFAULT NULL,  -- download/view
  accessed_at TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_da_document (document_id),

  CONSTRAINT fk_da_document
    FOREIGN KEY (document_id) REFERENCES documents (document_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 18. chatbot_logs
--     Stores AI chatbot conversation history.
--     No FK — user may be any role (polymorphic).
-- ================================================================
CREATE TABLE IF NOT EXISTS chatbot_logs (
  id           INT       UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      INT       UNSIGNED          DEFAULT NULL,
  user_type    VARCHAR(10)                 DEFAULT NULL,
  user_message TEXT                        DEFAULT NULL,
  ai_response  TEXT                        DEFAULT NULL,
  intent       VARCHAR(50)                 DEFAULT NULL,
  created_at   TIMESTAMP          NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_chat_user (user_id, user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- MINIMAL SEED DATA
-- Only master / reference data needed for the system to function.
-- Passwords are bcrypt hashes — do NOT change format.
-- ================================================================

-- Admin account  (password: Harsh@1)
INSERT IGNORE INTO admin (name, email, password) VALUES
('Admin', 'harsh1@gmail.com', '$2a$10$Ff29L6YyKUH/30PsOnJiEurF1XUOZfRlfyooVpYTRDmdfxmZVGuAu');

-- Classes — 4 semesters of Msc.IT
INSERT IGNORE INTO classes (class_id, class_name, semester, department) VALUES
(1, 'Msc.IT 1st Year', 'Semester 1', 'Msc.IT'),
(2, 'Msc.IT 2nd Year', 'Semester 3', 'Msc.IT'),
(4, 'Msc.IT 1st Year', 'Semester 2', 'Msc.IT'),
(6, 'Msc.IT 2nd Year', 'Semester 4', 'Msc.IT');

-- Subjects — Semester 1 (class_id 1)
INSERT IGNORE INTO subjects (subject_id, subject_name, subject_code, class_id, credits) VALUES
( 4, 'PoDAD',        'PODAD101',  1, 4),
( 5, 'Python',       'PY101',     1, 4),
( 6, 'DAD',          'DAD101',    1, 4),
( 7, 'CSCL',         'CSCL101',   1, 3),
( 8, 'OOAD',         'OOAD101',   1, 4),
( 9, 'DSA',          'DSA101',    1, 4),
(10, 'CAPSTONE - 1', 'CAPSTON101',1, 2),
-- Semester 2 (class_id 4)
(11, 'PoAIML',       'POAIML201', 4, 4),
(12, 'CN',           'CN201',     4, 4),
(13, 'AIML',         'AIML201',   4, 4),
(14, 'CWS',          'CWS201',    4, 3),
(15, 'PoDAD',        'PODAD201',  4, 4),
(16, 'CAPSTONE - 2', 'CAPSTON201',4, 2);

-- Faculty  (Shreya: Shreya@1 | Vaidehi: Vaidehi@1)
INSERT IGNORE INTO faculty (faculty_id, name, email, password, class) VALUES
(1, 'Shreya Raval',  'shreya@gmail.com',
   '$2a$10$QutFC7mC7L/O88AnHJEOcujBVJSa.ZZjD0Z4Vrm44ORLHZ3O7kjiG', 'Msc.IT 1st Year'),
(2, 'Vaidehi Patel', 'vaidehi@gmail.com',
   '$2a$10$yAzpKA7WrEIXJxKlpUaHI.opK2rn6pqzeKSgaJbbSqcNRmruHSis2', 'Msc.IT 2nd Year');

-- Students  (password: Student@1)
INSERT IGNORE INTO student (student_id, name, email, password, class) VALUES
(6, 'Aditi',    'aditi1@gmail.com',
   '$2a$10$Zzj3X4cYPySqM1SLX/qL8ezo/lq5lUvM4FzZAPkRIyIGR2VnXw.xC', 'Msc.IT 1st Year'),
(7, 'Mitanshu', 'mitanshu1@gmail.com',
   '$2a$10$Zzj3X4cYPySqM1SLX/qL8ezo/lq5lUvM4FzZAPkRIyIGR2VnXw.xC', 'Msc.IT 1st Year');

-- Faculty subject assignments
INSERT IGNORE INTO faculty_subjects (faculty_id, class_id, subject_id) VALUES
(1, 1,  7),   -- Shreya → Sem1 → CSCL
(1, 1,  9),   -- Shreya → Sem1 → DSA
(1, 1, 10),   -- Shreya → Sem1 → CAPSTONE-1
(1, 4, 16);   -- Shreya → Sem2 → CAPSTONE-2

-- ================================================================
-- AUTO_INCREMENT reset (keeps IDs consistent on fresh import)
-- ================================================================
ALTER TABLE admin                  AUTO_INCREMENT = 2;
ALTER TABLE classes                AUTO_INCREMENT = 7;
ALTER TABLE subjects               AUTO_INCREMENT = 17;
ALTER TABLE faculty                AUTO_INCREMENT = 3;
ALTER TABLE student                AUTO_INCREMENT = 8;
ALTER TABLE faculty_subjects       AUTO_INCREMENT = 8;
ALTER TABLE timetable              AUTO_INCREMENT = 1;
ALTER TABLE attendance             AUTO_INCREMENT = 1;
ALTER TABLE assignments            AUTO_INCREMENT = 1;
ALTER TABLE assignment_submissions AUTO_INCREMENT = 1;
ALTER TABLE grades                 AUTO_INCREMENT = 1;
ALTER TABLE performance_summary    AUTO_INCREMENT = 1;
ALTER TABLE messages               AUTO_INCREMENT = 1;
ALTER TABLE announcements          AUTO_INCREMENT = 1;
ALTER TABLE notifications          AUTO_INCREMENT = 1;
ALTER TABLE documents              AUTO_INCREMENT = 1;
ALTER TABLE document_access        AUTO_INCREMENT = 1;
ALTER TABLE chatbot_logs           AUTO_INCREMENT = 1;

-- ================================================================
-- END — vidhyarth_schema.sql
-- ================================================================
