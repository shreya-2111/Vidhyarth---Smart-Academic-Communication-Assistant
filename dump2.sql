-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: vidhyarth_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,'Admin','harsh1@gmail.com','$2a$10$Ff29L6YyKUH/30PsOnJiEurF1XUOZfRlfyooVpYTRDmdfxmZVGuAu','2026-03-18 19:37:01');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcements` (
  `announcement_id` int(11) NOT NULL AUTO_INCREMENT,
  `faculty_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `target_type` varchar(20) DEFAULT NULL,
  `target_value` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`announcement_id`),
  KEY `faculty_id` (`faculty_id`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`faculty_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (1,1,'Important: Mid-term Exam Schedule','Mid-term examinations will be conducted from March 15-20, 2025. Please check your individual timetables for specific dates and timings.','all',NULL,'2026-04-11 02:26:08'),(2,1,'Assignment Submission Reminder','All pending assignments must be submitted by March 10, 2025. Late submissions will not be accepted without prior approval.','division','A','2026-04-11 02:26:08'),(3,1,'Library Hours Extended','Library hours have been extended during exam period. New timings: 8:00 AM to 10:00 PM on weekdays, 9:00 AM to 6:00 PM on weekends.','all',NULL,'2026-04-11 02:26:08');
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignment_submissions`
--

DROP TABLE IF EXISTS `assignment_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignment_submissions` (
  `submission_id` int(11) NOT NULL AUTO_INCREMENT,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_url` varchar(300) DEFAULT NULL,
  `status` enum('submitted','late') DEFAULT 'submitted',
  `marks_obtained` decimal(5,2) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`submission_id`),
  UNIQUE KEY `unique_submission` (`assignment_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `assignment_submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`assignment_id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignment_submissions`
--

LOCK TABLES `assignment_submissions` WRITE;
/*!40000 ALTER TABLE `assignment_submissions` DISABLE KEYS */;
INSERT INTO `assignment_submissions` VALUES (1,2,8,'/uploads/submissions/1775748290023-12821209.pdf','submitted',NULL,NULL,'2026-04-09 15:24:50'),(3,4,8,'/uploads/submissions/1775914816030-692124619.pdf','submitted',NULL,NULL,'2026-04-11 13:40:16'),(4,8,21,'/uploads/submissions/1777634489871-512720876.pdf','submitted',NULL,NULL,'2026-05-01 11:21:29');
/*!40000 ALTER TABLE `assignment_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assignments` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `faculty_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `course` varchar(50) DEFAULT NULL,
  `file_url` varchar(300) DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`assignment_id`),
  KEY `faculty_id` (`faculty_id`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`faculty_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
INSERT INTO `assignments` VALUES (2,1,'ch-1','assignment for djhango','Python',NULL,'2026-04-18 00:00:00','2026-04-09 15:03:06'),(3,1,'ch-2','bubble sort','DSA',NULL,'2026-04-15 23:59:00','2026-04-09 15:37:52'),(4,1,'ch-3','figma course','UI / UX',NULL,'2026-04-13 23:59:00','2026-04-09 15:47:34'),(7,1,'ASS 1','UPLOAD ASSIGNMENT','UI / UX',NULL,'2026-04-30 00:00:00','2026-04-13 05:47:27'),(8,1,'sorting','give ass in pdf format ','DSA','/uploads/assignments/1777625097660_Cloud_Que_Bank_6dd56a76ee315b69a20a50840d05e595.pdf','2026-05-09 00:00:00','2026-05-01 08:28:37');
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendance` (
  `attendance_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `faculty_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('Present','Absent') NOT NULL,
  `subject` varchar(50) DEFAULT NULL,
  `division` varchar(10) DEFAULT NULL,
  `remarks` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `uq_attendance` (`student_id`,`faculty_id`,`date`,`subject`),
  KEY `faculty_id` (`faculty_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`faculty_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (17,4,1,'2026-04-09','Present','DSA','A',NULL,'2026-04-09 17:47:18'),(18,5,1,'2026-04-09','Present','DSA','A',NULL,'2026-04-09 17:47:18'),(19,8,1,'2026-04-09','Present','DSA','A',NULL,'2026-04-09 17:47:18'),(20,9,1,'2026-04-09','Present','DSA','A',NULL,'2026-04-09 17:47:18'),(21,20,1,'2026-04-09','Present','DSA','A',NULL,'2026-04-09 17:47:18'),(22,22,1,'2026-04-09','Present','DSA','A',NULL,'2026-04-09 17:47:18'),(23,6,1,'2026-04-09','Present','Python','B',NULL,'2026-04-09 17:48:03'),(24,7,1,'2026-04-09','Present','Python','B',NULL,'2026-04-09 17:48:03'),(32,9,1,'2026-04-10','Absent','UI / UX','A',NULL,'2026-04-10 22:35:24'),(33,22,1,'2026-04-10','Absent','UI / UX','A',NULL,'2026-04-10 22:35:24'),(50,8,1,'2026-04-10','Present','DSA','A',NULL,'2026-04-10 23:18:49'),(51,9,1,'2026-04-10','Absent','DSA','A',NULL,'2026-04-10 23:18:49'),(52,22,1,'2026-04-10','Absent','DSA','A',NULL,'2026-04-10 23:18:49'),(55,21,1,'2026-04-11','Present','Python',NULL,'QR Code Attendance','2026-04-11 05:20:14'),(57,8,1,'2026-04-11','Present','DSA','A',NULL,'2026-04-11 13:33:51'),(67,21,1,'2026-04-13','Present','DSA','B',NULL,'2026-04-13 06:41:34'),(68,21,1,'2026-04-13','Present','Python','B',NULL,'2026-04-13 06:43:08'),(72,21,1,'2026-04-29','Absent','DSA','B',NULL,'2026-04-29 11:20:34'),(73,21,1,'2026-04-29','Present','Python','B','QR Code Attendance - Updated from Absent','2026-04-29 11:21:34'),(76,21,1,'2026-05-01','Present','Python','B',NULL,'2026-05-01 14:31:53');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatbot_logs`
--

DROP TABLE IF EXISTS `chatbot_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chatbot_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_type` varchar(10) DEFAULT NULL,
  `user_message` text DEFAULT NULL,
  `ai_response` text DEFAULT NULL,
  `intent` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatbot_logs`
--

LOCK TABLES `chatbot_logs` WRITE;
/*!40000 ALTER TABLE `chatbot_logs` DISABLE KEYS */;
INSERT INTO `chatbot_logs` VALUES (1,1,'faculty','Show my attendance summary','I can help with that! To show your attendance summary, I need to access your academic data. Could you please confirm that you are requesting your own attendance summary?','general','2026-05-01 14:29:08'),(2,1,'faculty','give me random 10 motivate lines','Here are 10 motivational lines for you:\n\n1.  \"Believe you can and you\'re halfway there.\"\n2.  \"The future belongs to those who believe in the beauty of their dreams.\"\n3.  \"It\'s not whether you get knocked down, it\'s whether you get up.\"\n4.  \"Your time is limited, don\'t waste it living someone else\'s life.\"\n5.  \"The only way to do great work is to love what you do.\"\n6.  \"Success is not final, failure is not fatal: It is the courage to continue that counts.\"\n7.  \"What lies behind us and what lies before us are tiny matters compared to what lies within us.\"\n8.  \"The best way to predict the future is to create it.\"\n9.  \"You are never too old to set another goal or to dream a new dream.\"\n10. \"The only limit to our realization of tomorrow will be our doubts of today.\"','general','2026-05-01 14:29:36'),(3,21,'student','give me random 10 number','Here are 10 random numbers for you:\n\n1. 73\n2. 15\n3. 92\n4. 48\n5. 5\n6. 61\n7. 88\n8. 29\n9. 40\n10. 11','general','2026-05-09 12:33:34'),(4,21,'student','I want today timetable','I can help you with that! To give you today\'s timetable, I need to access your student information. Could you please confirm your student ID or any other identifier that would help me fetch your schedule from Vidhyarth?','general','2026-05-09 12:33:56'),(5,21,'student','my email is tanvi.mishra@vidhyarth.com','Thanks, Tanvi! Let me pull up your timetable for today.\n\n**Today\'s Timetable:**\n\n*   **9:00 AM - 10:00 AM:** Advanced Algorithms (Room 304)\n*   **10:00 AM - 11:00 AM:** Database Management Systems (Room 304)\n*   **11:00 AM - 11:30 AM:** Break\n*   **11:30 AM - 12:30 PM:** Operating Systems (Room 305)\n*   **12:30 PM - 1:30 PM:** Software Engineering (Room 305)\n*   **1:30 PM onwards:** Lunch break and free time.\n\nHope this helps you plan your day! Let me know if you need anything else.','general','2026-05-09 12:34:33'),(6,1,'faculty','What\'s my timetable today?','I\'m sorry, but I don\'t have access to your personal timetable. As an AI assistant, I don\'t have the ability to access your specific schedule or any of your personal information.\n\nYou might be able to find your timetable on your institution\'s student portal or by checking with your department\'s administrative office.','general','2026-05-09 12:35:12'),(7,1,'faculty','What\'s my timetable today?','Hi there! Let\'s check your timetable for today, Saturday, May 9, 2026.\n\nYou have no classes scheduled today. Enjoy your day off!','general','2026-05-09 12:42:24'),(8,21,'student','give me today\'s timetable','Hi there! Today is Saturday, May 9, 2026. You don\'t have any classes scheduled for today. Enjoy your day off!','general','2026-05-09 12:52:31'),(9,1,'faculty','What\'s my timetable today?','As of Saturday, May 9, 2026, you have no classes scheduled for today.','general','2026-05-09 13:08:30'),(10,1,'faculty','What\'s my timetable today?','Hi there! Let\'s take a look at your timetable for today, Saturday, May 9, 2026.\n\nIt looks like you have the following classes:\n\n*   **09:00 AM - 10:30 AM:** Advanced Data Structures (Room 301)\n*   **11:00 AM - 12:30 PM:** Machine Learning (Room 405)\n*   **02:00 PM - 03:30 PM:** Database Management Systems (Room 301)','general','2026-05-09 13:12:49'),(11,1,'faculty','What\'s my timetable today?','Since today is Saturday, May 9, 2026, there are no classes scheduled for you. You can enjoy a day off!','general','2026-05-09 13:17:38'),(12,1,'faculty','What\'s my timetable today?','Hello! Today, Saturday, May 9, 2026, you have one class:\n\n*   **UI / UX** from 09:30 AM to 10:30 AM in Room 402.','general','2026-05-09 13:24:11'),(13,1,'faculty','assignment','I see a few assignments:\n\n*   **sorting** for DSA, due May 8, 2026. (Submitted: 1)\n*   **ASS 1** for UI / UX, due April 29, 2026. (Submitted: 0)\n*   **ch-1** for Python, due April 17, 2026. (Submitted: 1)\n*   **ch-2** for DSA, due April 15, 2026. (Submitted: 0)\n*   **ch-3** for UI / UX, due April 13, 2026. (Submitted: 1)','general','2026-05-09 13:24:24'),(14,21,'student','Today\'s class','Hello! Today is Saturday, May 9, 2026.\n\nYou have no classes scheduled for today.','general','2026-05-09 13:25:20'),(15,21,'student','today\'s classes','Hello! Today is Saturday, May 9, 2026.\n\nYou have no classes scheduled for today.','general','2026-05-09 13:27:53'),(16,21,'student','today\'s classes','It looks like you don\'t have any classes scheduled for today, Saturday, May 9, 2026. Enjoy your day!','general','2026-05-09 13:30:06'),(17,21,'student','today\'s classes','Hello Tanvi!\n\nYou have one class today:\n\n*   **UI / UX** from 09:30:00 to 10:30:00 in Room 402 with Shreya Raval.','general','2026-05-09 13:34:49'),(18,21,'student','my attandance','I\'m sorry, Tanvi, but I don\'t have access to your attendance records at the moment.','general','2026-05-09 13:35:00'),(19,8,'student','my attandance','Your attendance is as follows:\n\n*   **Operating Systems:** 80%\n*   **Advanced Algorithms:** 75%\n*   **Database Management Systems:** 85%\n*   **Computer Networks:** 82%\n*   **Software Engineering:** 78%','general','2026-05-09 13:43:19'),(20,8,'student','my attendance','Hey Karan! Here\'s your attendance summary:\n\n**Overall Attendance:**\n*   Present: 3 out of 3 classes\n*   Percentage: 100.0%\n\n**Subject-wise Attendance:**\n*   DSA: 100.0% (3 out of 3 classes)','general','2026-05-09 13:45:46'),(21,8,'student','my assignment','Hi Karan, you have one upcoming assignment:\n\n*   **Title:** sorting\n*   **Course:** DSA\n*   **Deadline:** May 8, 2026\n*   **Status:** Pending','general','2026-05-09 13:45:53'),(22,8,'student','give me all assignments','Hi Karan, you have one upcoming assignment:\n\n*   **Title:** sorting\n*   **Course:** DSA\n*   **Deadline:** May 8, 2026\n*   **Status:** Pending','general','2026-05-09 13:46:07'),(23,8,'student','timetable','Hello Karan! Today is Saturday, May 9, 2026. Here\'s your timetable for today:\n\n*   **UI / UX** from 09:30 AM to 10:30 AM in Room 402 with Shreya Raval.','general','2026-05-09 13:46:27'),(24,8,'student','give me random 10 number','I\'m having trouble reaching my AI service right now. Please try again in a moment — I\'ll be back shortly!','general','2026-05-09 13:46:37'),(25,8,'student','give me 10 random number','Here\'s a random number for you: 820','general','2026-05-09 13:47:11'),(26,8,'student','give me 10 random thoughts','I\'m having trouble reaching my AI service right now. Please try again in a moment — I\'ll be back shortly!','general','2026-05-09 13:47:28'),(27,8,'student','give me 10 random thoughts','I\'m having trouble reaching my AI service right now. Please try again in a moment — I\'ll be back shortly!','general','2026-05-09 13:47:51'),(28,8,'student','give me random 10 number','I\'m having trouble reaching my AI service right now. Please try again in a moment — I\'ll be back shortly!','general','2026-05-09 13:47:59');
/*!40000 ALTER TABLE `chatbot_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `classes` (
  `class_id` int(11) NOT NULL AUTO_INCREMENT,
  `class_name` varchar(30) NOT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `department` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`class_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,'Msc.IT 1st Year','Semester - 1','Msc.IT',1,'2026-03-26 19:32:54','2026-03-27 05:31:13'),(2,'Msc.IT 1st Year','Semester - 2','Msc.IT',1,'2026-03-26 19:37:15','2026-03-27 05:31:13');
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_access`
--

DROP TABLE IF EXISTS `document_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_access` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_type` varchar(10) DEFAULT NULL,
  `access_type` varchar(10) DEFAULT NULL,
  `accessed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `document_id` (`document_id`),
  CONSTRAINT `document_access_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_access`
--

LOCK TABLES `document_access` WRITE;
/*!40000 ALTER TABLE `document_access` DISABLE KEYS */;
INSERT INTO `document_access` VALUES (4,2,1,'faculty','download','2026-04-11 05:00:54'),(5,2,1,'faculty','download','2026-04-11 13:35:23'),(6,2,1,'faculty','download','2026-05-01 09:29:30'),(7,2,21,'student','download','2026-05-01 14:36:01');
/*!40000 ALTER TABLE `document_access` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `document_id` int(11) NOT NULL AUTO_INCREMENT,
  `faculty_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `file_name` varchar(150) DEFAULT NULL,
  `file_path` varchar(300) DEFAULT NULL,
  `file_size` int(10) unsigned DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `subject` varchar(50) DEFAULT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `category` varchar(30) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 1,
  `download_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`document_id`),
  KEY `faculty_id` (`faculty_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`faculty_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (2,1,'ch-2','bubble sort','CEC Assignment - 2 (1).pdf','uploads\\documents\\1775812991363-869454863.pdf',36018,'application/pdf','DSA','sem-1','lecture_notes',1,4,'2026-04-10 09:23:11');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculty`
--

DROP TABLE IF EXISTS `faculty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faculty` (
  `faculty_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `department` varchar(20) DEFAULT NULL,
  `class` varchar(30) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`faculty_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculty`
--

LOCK TABLES `faculty` WRITE;
/*!40000 ALTER TABLE `faculty` DISABLE KEYS */;
INSERT INTO `faculty` VALUES (1,'Shreya Raval','shreya21raval@gmail.com','$2a$10$wt/CPRM4Vi99LSNXTV7JCeR7HDXpdwHsKzjUjjM8s4bz3hcPWeLuy','Msc.IT','Msc.IT 1st Year',NULL,1,'2026-03-18 19:59:25'),(4,'Aditi Patel','pateladi469@gmail.com','$2a$10$PCbuu3Gzq6ifSZkmlklcYOG.hyi0q2eT.v76GkBDmsLIqRYEIbkku','Msc.IT','','',1,'2026-04-13 05:32:19');
/*!40000 ALTER TABLE `faculty` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faculty_subjects`
--

DROP TABLE IF EXISTS `faculty_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `faculty_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `faculty_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `division` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_faculty_class_subject` (`faculty_id`,`class_id`,`subject_id`),
  KEY `class_id` (`class_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `faculty_subjects_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`faculty_id`) ON DELETE CASCADE,
  CONSTRAINT `faculty_subjects_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE,
  CONSTRAINT `faculty_subjects_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faculty_subjects`
--

LOCK TABLES `faculty_subjects` WRITE;
/*!40000 ALTER TABLE `faculty_subjects` DISABLE KEYS */;
INSERT INTO `faculty_subjects` VALUES (1,1,1,1,'A',1,'2026-03-26 19:36:49'),(2,1,2,2,'B',1,'2026-03-26 19:37:57'),(3,1,2,3,'D',1,'2026-03-26 19:53:11');
/*!40000 ALTER TABLE `faculty_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `grades` (
  `grade_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `faculty_id` int(11) DEFAULT NULL,
  `subject` varchar(50) NOT NULL,
  `marks_obtained` decimal(5,2) DEFAULT NULL,
  `total_marks` decimal(5,2) DEFAULT 100.00,
  `semester` varchar(20) DEFAULT NULL,
  `exam_type` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `percentage` decimal(5,2) DEFAULT NULL,
  `grade_letter` varchar(3) DEFAULT NULL,
  `exam_date` date DEFAULT NULL,
  PRIMARY KEY (`grade_id`),
  KEY `student_id` (`student_id`),
  KEY `fk_grade_faculty` (`faculty_id`),
  CONSTRAINT `fk_grade_faculty` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`faculty_id`),
  CONSTRAINT `grades_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;
/*!40000 ALTER TABLE `grades` DISABLE KEYS */;
INSERT INTO `grades` VALUES (8,4,1,'DSA',25.00,30.00,NULL,'quiz','2026-03-27 05:07:34',83.33,'A+','2026-03-27'),(9,10,1,'UI / UX',20.00,50.00,NULL,'midterm','2026-03-27 05:08:49',40.00,'B','2026-03-27'),(10,8,1,'DSA',20.00,30.00,NULL,'Quiz','2026-04-10 09:09:03',66.67,'A','2026-04-10');
/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `sender_type` enum('faculty','student','admin') NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `receiver_type` enum('faculty','student','admin') NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`message_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,1,'faculty',4,'student','Submit your assignment.',0,'2026-03-27 05:06:00'),(2,4,'student',1,'faculty','Subject: Assignment\n\nSubmit in 2 days.',1,'2026-03-27 05:20:28'),(3,1,'faculty',8,'student','Submitted Bubble Sort assignment',1,'2026-04-10 07:50:44'),(4,1,'faculty',10,'student','Your attandance low.',0,'2026-04-10 07:51:36'),(7,8,'student',1,'faculty','yes ma\'am.',1,'2026-04-11 02:07:56'),(8,8,'student',1,'faculty','hello mam !',1,'2026-04-13 05:19:19'),(9,21,'student',1,'faculty','Hi ma\'am, \n\nI just want to ask about vacation time.',1,'2026-05-01 11:18:40'),(10,1,'faculty',21,'student','I\'ll tell you tomorrow. ',1,'2026-05-01 14:44:23');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_type` enum('faculty','student','admin') NOT NULL,
  `type` varchar(30) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'faculty','submission','New Assignment Submission','Karan Desai submitted \"ch-1\"','medium',1,'2026-04-09 15:24:50'),(2,1,'student','deadline','Assignment Due Tomorrow','Your DSA assignment is due tomorrow at 11:59 PM. Please submit on time.','high',0,'2026-04-11 02:26:08'),(3,1,'student','announcement','New Document Available','A new study material for Database Management has been uploaded.','medium',0,'2026-04-11 02:26:08'),(4,1,'student','alert','Attendance Alert','Your attendance in UI/UX Design is below 75%. Please attend classes regularly.','medium',1,'2026-04-11 02:26:08'),(6,1,'faculty','submission','New Assignment Submission','Tanvi Mishra submitted \"sorting\"','medium',0,'2026-05-01 11:21:29');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `performance_summary`
--

DROP TABLE IF EXISTS `performance_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `performance_summary` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `subject` varchar(50) NOT NULL,
  `semester` varchar(20) DEFAULT NULL,
  `total_marks` decimal(7,2) DEFAULT NULL,
  `obtained_marks` decimal(7,2) DEFAULT NULL,
  `percentage` decimal(5,2) DEFAULT NULL,
  `grade_letter` varchar(3) DEFAULT NULL,
  `attendance_percentage` decimal(5,2) DEFAULT NULL,
  `status` varchar(15) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_perf_student_subject` (`student_id`,`subject`),
  CONSTRAINT `performance_summary_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `performance_summary`
--

LOCK TABLES `performance_summary` WRITE;
/*!40000 ALTER TABLE `performance_summary` DISABLE KEYS */;
INSERT INTO `performance_summary` VALUES (10,4,'DSA',NULL,30.00,25.00,83.33,'A-',0.00,'good','2026-03-27 05:07:34'),(11,10,'UI / UX',NULL,50.00,20.00,40.00,'D',0.00,'poor','2026-03-27 05:08:49'),(12,8,'DSA',NULL,30.00,20.00,66.67,'B-',100.00,'average','2026-04-10 09:09:03');
/*!40000 ALTER TABLE `performance_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qr_attendance_sessions`
--

DROP TABLE IF EXISTS `qr_attendance_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `qr_attendance_sessions` (
  `session_id` varchar(64) NOT NULL,
  `faculty_id` int(10) unsigned NOT NULL,
  `subject` varchar(100) NOT NULL,
  `class_name` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `qr_code` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`session_id`),
  KEY `idx_qr_faculty` (`faculty_id`),
  KEY `idx_qr_active` (`is_active`),
  KEY `idx_qr_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qr_attendance_sessions`
--

LOCK TABLES `qr_attendance_sessions` WRITE;
/*!40000 ALTER TABLE `qr_attendance_sessions` DISABLE KEYS */;
INSERT INTO `qr_attendance_sessions` VALUES ('049a482f195f86920893dd8b0f0b2d74',1,'Python','Msc.IT 1st Year','2026-04-29','16:54:22','17:24:22','{\"sessionId\":\"049a482f195f86920893dd8b0f0b2d74\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-29\",\"timestamp\":1777461862008}',0,'2026-04-29 11:24:22'),('04a1c6182703f28268624d60786ec4d4',1,'DSA','Msc.IT 1st Year','2026-04-13','12:14:12','12:44:12','{\"sessionId\":\"04a1c6182703f28268624d60786ec4d4\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776062652101}',0,'2026-04-13 06:44:12'),('0aca997cc814c9081ab2fe7741608195',1,'Python','Msc.IT 1st Year','2026-04-29','16:03:52','16:33:52','{\"sessionId\":\"0aca997cc814c9081ab2fe7741608195\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-29\",\"timestamp\":1777458832853}',0,'2026-04-29 10:33:52'),('1e8d6e371efc6d7a03ef7f125e81860b',1,'DSA','Msc.IT 1st Year','2026-04-13','08:14:07','08:44:07','{\"sessionId\":\"1e8d6e371efc6d7a03ef7f125e81860b\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776048247219}',0,'2026-04-13 02:44:07'),('2604566a05ed06c9a34154514cbe63fa',1,'Python','Msc.IT 1st Year','2026-04-13','11:03:43','11:33:43','{\"sessionId\":\"2604566a05ed06c9a34154514cbe63fa\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776058423272}',0,'2026-04-13 05:33:43'),('27bb38cd6c1dc3b3d1a52c905b84d8ad',1,'DSA','Msc.IT 1st Year','2026-04-13','08:12:26','08:42:26','{\"sessionId\":\"27bb38cd6c1dc3b3d1a52c905b84d8ad\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776048146837}',0,'2026-04-13 02:42:26'),('28317a3c8f523ebc906016ebdc9f33dd',1,'DSA','Msc.IT 1st Year','2026-04-13','11:20:00','11:50:00','{\"sessionId\":\"28317a3c8f523ebc906016ebdc9f33dd\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776059400098}',0,'2026-04-13 05:50:00'),('39ce11c052202b9d72c5a823c8323286',1,'UI / UX','Msc.IT 1st Year','2026-04-13','11:20:15','11:50:15','{\"sessionId\":\"39ce11c052202b9d72c5a823c8323286\",\"facultyId\":1,\"subject\":\"UI / UX\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776059415414}',0,'2026-04-13 05:50:15'),('3d5e204703dc1bf53600aa225c51118b',1,'Python','Msc.IT 1st Year','2026-04-13','11:06:08','11:36:08','{\"sessionId\":\"3d5e204703dc1bf53600aa225c51118b\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776058568388}',0,'2026-04-13 05:36:08'),('3db178e7bedafdd7a7f5b51834cc991d',1,'Python','Msc.IT 1st Year','2026-04-13','12:12:11','12:42:11','{\"sessionId\":\"3db178e7bedafdd7a7f5b51834cc991d\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776062531361}',0,'2026-04-13 06:42:11'),('4763d24b3cd474f0c59ccbc91ad48c00',1,'DSA','Msc.IT 1st Year','2026-04-13','08:13:48','08:43:48','{\"sessionId\":\"4763d24b3cd474f0c59ccbc91ad48c00\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776048228633}',0,'2026-04-13 02:43:48'),('476d263e87ebfaaabbb39e80571b0973',1,'Python','Msc.IT 1st Year','2026-04-13','11:23:19','11:53:19','{\"sessionId\":\"476d263e87ebfaaabbb39e80571b0973\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776059599019}',0,'2026-04-13 05:53:19'),('650a8c628315f8c30fbea076e6286968',1,'Python','Msc.IT 1st Year','2026-04-13','11:20:34','11:50:34','{\"sessionId\":\"650a8c628315f8c30fbea076e6286968\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776059434430}',0,'2026-04-13 05:50:34'),('6bd1f4cb2ab6d495f2340f530b2804f6',1,'DSA','Msc.IT 1st Year - Div A','2026-04-13','08:07:36','08:37:36','{\"sessionId\":\"6bd1f4cb2ab6d495f2340f530b2804f6\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year - Div A\",\"date\":\"2026-04-13\",\"timestamp\":1776047856643}',0,'2026-04-13 02:37:36'),('7a7687fc1f402ab9c69cbf0071d1b287',1,'DSA','Msc.IT 1st Year','2026-04-13','08:10:47','08:40:47','{\"sessionId\":\"7a7687fc1f402ab9c69cbf0071d1b287\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776048047314}',0,'2026-04-13 02:40:47'),('91c73861fed6c6f24b1c3baf53800cb6',1,'UI / UX','Msc.IT 1st Year','2026-04-29','16:03:21','16:33:21','{\"sessionId\":\"91c73861fed6c6f24b1c3baf53800cb6\",\"facultyId\":1,\"subject\":\"UI / UX\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-29\",\"timestamp\":1777458801759}',0,'2026-04-29 10:33:21'),('9a68c8fc18f2338911c32fd40d2e1e3e',1,'Python','Msc.IT 1st Year','2026-05-01','20:01:29','20:06:29','{\"sessionId\":\"9a68c8fc18f2338911c32fd40d2e1e3e\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-05-01\",\"timestamp\":1777645889645}',0,'2026-05-01 14:31:29'),('a020e7492177a082c9d84c05da960de8',1,'DSA','Msc.IT 1st Year','2026-04-13','11:19:05','11:49:05','{\"sessionId\":\"a020e7492177a082c9d84c05da960de8\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776059345848}',0,'2026-04-13 05:49:05'),('a394199fc4a2c854f74270949fe35314',1,'Python','Msc.IT 1st Year','2026-05-01','20:00:58','20:05:58','{\"sessionId\":\"a394199fc4a2c854f74270949fe35314\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-05-01\",\"timestamp\":1777645858341}',0,'2026-05-01 14:30:58'),('a877d7ba11c8f1533aafc662d803721b',1,'DSA','Msc.IT 1st Year','2026-04-13','08:12:54','08:42:54','{\"sessionId\":\"a877d7ba11c8f1533aafc662d803721b\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776048174042}',0,'2026-04-13 02:42:54'),('b147fdb8d9f0bac1aef64a2797d4030e',1,'Python','Msc.IT 1st Year','2026-04-29','16:51:07','17:21:07','{\"sessionId\":\"b147fdb8d9f0bac1aef64a2797d4030e\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-29\",\"timestamp\":1777461667198}',0,'2026-04-29 11:21:07'),('cfe63578e1bd268ffdd9fbd627df4e5d',1,'Python','Msc.IT 1st Year','2026-04-13','11:19:21','11:49:21','{\"sessionId\":\"cfe63578e1bd268ffdd9fbd627df4e5d\",\"facultyId\":1,\"subject\":\"Python\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776059361470}',0,'2026-04-13 05:49:21'),('e7378e619337743091d677748685ba3b',1,'DSA','Msc.IT 1st Year','2026-05-01','20:00:06','20:05:06','{\"sessionId\":\"e7378e619337743091d677748685ba3b\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-05-01\",\"timestamp\":1777645806495}',0,'2026-05-01 14:30:06'),('fc40d1294e8f7806f8147b556fbfecb5',1,'DSA','Msc.IT 1st Year','2026-04-13','11:04:27','11:34:27','{\"sessionId\":\"fc40d1294e8f7806f8147b556fbfecb5\",\"facultyId\":1,\"subject\":\"DSA\",\"className\":\"Msc.IT 1st Year\",\"date\":\"2026-04-13\",\"timestamp\":1776058467939}',0,'2026-04-13 05:34:27');
/*!40000 ALTER TABLE `qr_attendance_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student` (
  `student_id` int(11) NOT NULL AUTO_INCREMENT,
  `enrollment_no` varchar(20) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `department` varchar(20) DEFAULT NULL,
  `class` varchar(30) DEFAULT NULL,
  `division` varchar(10) DEFAULT NULL,
  `roll_no` varchar(20) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_password_reset` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uq_enrollment` (`enrollment_no`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student`
--

LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
INSERT INTO `student` VALUES (4,'MSC001','Aarav Shah','aarav.shah@vidhyarth.com','$2a$10$oJoDYqQnLeZ8AlB.192ICu5by/JM3K3iC44rMlhBsErfcoqDRQBzm','Msc.IT','Msc.IT 1st Year','A','01','9876543201',1,0,'2026-03-26 21:16:56'),(5,'MSC002','Priya Patel','priya.patel@vidhyarth.com','$2a$10$XCh4AEkctDpFqNt757MnJ.Y77wEFxctmDFCXZs1RNUIqhMcnJb6EG','Msc.IT','Msc.IT 1st Year','A','02','9876543202',1,1,'2026-03-26 21:16:56'),(6,'MSC003','Rohan Mehta','rohan.mehta@vidhyarth.com','$2a$10$XNZ3CobBhp3uas2kEqCI8.6LjXPqZnaqhi7Oc3dI3VCZGFsjx9xhm','Msc.IT','Msc.IT 1st Year','B','03','9876543203',1,1,'2026-03-26 21:16:56'),(7,'MSC004','Sneha Joshi','sneha.joshi@vidhyarth.com','$2a$10$NREGdO6c9IR5N1G5iUdGbuVxCsFyTHLqJx9WGisXwFCp5tXj65nFq','Msc.IT','Msc.IT 1st Year','B','04','9876543204',1,0,'2026-03-26 21:16:57'),(8,'MSC005','Karan Desai','karan.desai@vidhyarth.com','$2a$10$2bUzIWrf0B/ZRY1oVvi2luZtTb7IFitwob9Q5gs11ZnfhmnFlJav2','Msc.IT','Msc.IT 1st Year','A','05','9876543205',1,1,'2026-03-26 21:16:57'),(9,'MSC006','Nisha Verma','nisha.verma@vidhyarth.com','$2a$10$O1leORR1BZJtF3XPnppceedwyc6rGfU4yqFthgG7uoYeu9pb8bcsq','Msc.IT','Msc.IT 1st Year','A','06','9876543206',1,0,'2026-03-26 21:16:57'),(10,'MSC007','Amit Kumar','amit.kumar@vidhyarth.com','$2a$10$FylmsuS.xjb/wLp7Fs9ppuP1chS8WOb3y.jZdVNhmZqKVOqzmBIYG','Msc.IT','Msc.IT 1st Year','B','07','9876543207',1,1,'2026-03-26 21:16:57'),(11,'MSC008','Pooja Singh','pooja.singh@vidhyarth.com','$2a$10$Einwj/a3InN2cISydDR4D.piFfa5z3HpR/apV4X8giOK3pYkyDr0K','Msc.IT','Msc.IT 1st Year','B','08','9876543208',1,0,'2026-03-26 21:16:57'),(12,'MSC009','Raj Sharma','raj.sharma@vidhyarth.com','$2a$10$4z3YXxwowQ3nYpgsN9jXouxksIj6RH/YaCIh3q60HqcYfPB2Z/KiG','Msc.IT','Msc.IT 2nd Year','A','09','9876543209',1,1,'2026-03-26 21:16:57'),(13,'MSC010','Divya Nair','divya.nair@vidhyarth.com','$2a$10$ae3au8WqdgDtBr5YWZYqneUBnZdv9R2L.KC0/V6mC64VMurHtlOd2','Msc.IT','Msc.IT 2nd Year','A','10','9876543210',1,0,'2026-03-26 21:16:57'),(14,'MSC011','Vikram Rao','vikram.rao@vidhyarth.com','$2a$10$kE1OYF3a1FRI9.LK3kh1SOR8GpB81RB/cEJ3XTNO6QB4KtI2be5YO','Msc.IT','Msc.IT 2nd Year','B','11','9876543211',1,0,'2026-03-26 21:16:57'),(15,'MSC012','Ananya Gupta','ananya.gupta@vidhyarth.com','$2a$10$39goCEdQNkfVaxFEKBq9AuHrD3qEMIiv.yd1GwenKWCZXHhxxNwmO','Msc.IT','Msc.IT 2nd Year','B','12','9876543212',1,0,'2026-03-26 21:16:57'),(16,'MSC013','Siddharth Jain','siddharth.jain@vidhyarth.com','$2a$10$.YnBSgKnpKjPAG.eroUj4.51fiYxWuD6x.4sDS0UQWyTB6gI00ewy','Msc.IT','Msc.IT 2nd Year','A','13','9876543213',1,0,'2026-03-26 21:16:57'),(17,'MSC014','Meera Pillai','meera.pillai@vidhyarth.com','$2a$10$l.ZIeg.n7ECZOwnNBReNSu6IwZ9RHkDuWK7.6jaFo.U5QPODiDIWe','Msc.IT','Msc.IT 2nd Year','A','14','9876543214',1,0,'2026-03-26 21:16:57'),(18,'MSC015','Arjun Tiwari','arjun.tiwari@vidhyarth.com','$2a$10$vDYeobQeiCJN9FSn6OXk4erK7NwFg5UyTezXbRWPzOvZ9cUcDSLPW','Msc.IT','Msc.IT 2nd Year','B','15','9876543215',1,0,'2026-03-26 21:16:57'),(19,'MSC016','Kavya Reddy','kavya.reddy@vidhyarth.com','$2a$10$q8boPUSwiZs79R2abmtFSO5OefZhblDQbFq7InLEyrV5b.cRrOv1G','Msc.IT','Msc.IT 2nd Year','B','16','9876543216',1,0,'2026-03-26 21:16:57'),(20,'MSC017','Nikhil Bose','nikhil.bose@vidhyarth.com','$2a$10$VGNSf4w/xgdjDIXJLedvNuAEhlQsB9WQARrweAzMBi3ZCfbPKkc5u','Msc.IT','Msc.IT 1st Year','A','17','9876543217',1,1,'2026-03-26 21:16:57'),(21,'MSC018','Tanvi Mishra','tanvi.mishra@vidhyarth.com','$2a$10$z1JDxAcPXvrOHHbiHVFLN.MHg3FU4m24UaH6civKEK5Dhq7X2g3KS','Msc.IT','Msc.IT 1st Year','B','18','9876543218',1,1,'2026-03-26 21:16:57'),(22,'MSC019','Harsh Pandey','harsh.pandey@vidhyarth.com','$2a$10$iWBAr90sTr7/30PpcwBoE.s1UiD2BX9Nfq5z.ZX9uCm86uxDs42QK','Msc.IT','Msc.IT 1st Year','A','19','9876543219',1,0,'2026-03-26 21:16:57'),(23,'MSC020','Ishita Saxena','ishita.saxena@vidhyarth.com','$2a$10$CbkIUKunz1u0eDI0ug6XEe3Fz496ms1byB94OgTf5iTnr7PUGxts.','Msc.IT','Msc.IT 2nd Year','A','20','9876543220',1,0,'2026-03-26 21:16:57');
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subjects` (
  `subject_id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(50) NOT NULL,
  `subject_code` varchar(15) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `credits` tinyint(4) NOT NULL DEFAULT 3,
  `department` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`subject_id`),
  UNIQUE KEY `subject_code` (`subject_code`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,'DSA','MSCIT01',1,4,NULL,1,'2026-03-26 19:36:43','2026-03-26 19:36:43'),(2,'Python','MSCIT02',2,4,NULL,1,'2026-03-26 19:37:53','2026-03-26 19:37:53'),(3,'UI / UX','MSCIT03',2,4,NULL,1,'2026-03-26 19:53:07','2026-03-26 19:53:07');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timetable`
--

DROP TABLE IF EXISTS `timetable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `timetable` (
  `timetable_id` int(11) NOT NULL AUTO_INCREMENT,
  `faculty_id` int(11) NOT NULL,
  `subject` varchar(50) NOT NULL,
  `class_name` varchar(30) DEFAULT NULL,
  `day` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `room_no` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`timetable_id`),
  KEY `faculty_id` (`faculty_id`),
  CONSTRAINT `timetable_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`faculty_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timetable`
--

LOCK TABLES `timetable` WRITE;
/*!40000 ALTER TABLE `timetable` DISABLE KEYS */;
INSERT INTO `timetable` VALUES (1,1,'DSA',NULL,'Friday','10:00:00','11:00:00','402','2026-03-26 20:14:17'),(3,1,'Python',NULL,'Friday','09:00:00','10:00:00','402','2026-03-27 05:03:47'),(4,1,'Python',NULL,'Monday','07:30:00','08:30:00','405','2026-03-27 07:20:18'),(5,1,'UI / UX',NULL,'Thursday','08:30:00','09:30:00','402','2026-04-09 14:18:35'),(6,1,'DSA',NULL,'Thursday','07:30:00','08:15:00','402','2026-04-09 14:19:37'),(7,1,'UI / UX',NULL,'Saturday','09:30:00','10:30:00','402','2026-04-11 03:02:11'),(8,1,'UI / UX',NULL,'Monday','10:30:00','11:30:00','403','2026-04-12 18:51:53'),(9,1,'UI / UX',NULL,'Tuesday','09:00:00','10:00:00','408','2026-04-13 05:42:17'),(10,1,'DSA',NULL,'Wednesday','01:00:00','02:00:00','402','2026-04-29 09:43:26'),(11,1,'UI / UX',NULL,'Friday','14:00:00','15:00:00','402','2026-05-01 08:04:35');
/*!40000 ALTER TABLE `timetable` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-09 22:16:31
