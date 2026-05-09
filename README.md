# Vidhyarth - Smart Academic & Communication Assistant

A concise guide for setup and key project information.

## Important Topics

- Tech stack: React, Node.js, Express, MySQL, JWT, bcrypt, Multer
- AI chatbot: Google Gemini API
- Core features: authentication, attendance, assignments, timetables, messaging, documents

## Setup

1. Install prerequisites:
   - Node.js
   - npm
   - XAMPP (MySQL)

2. Import database schema:
   ```bash
   mysql -u root vidhyarth_db < database/vidhyarth_schema.sql
   ```

3. Configure backend in `backend/.env`:
   ```text
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=vidhyarth_db
   DB_PORT=3306
   JWT_SECRET=your_jwt_secret_key
   PORT=5001
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Run the app:
   ```bash
   cd backend
   npm install
   npm start
   cd ../frontend
   npm install
   npm start
   ```

## Default Credentials

- Admin: harsh1@gmail.com / Harsh@1
- Faculty: shreya@gmail.com / Shreya@1
- Student: aditi1@gmail.com / Student@1

## Project Layout

- `frontend/` - React UI
- `backend/` - Express API and routes
- `database/` - SQL schema and seed data

## Core APIs

- `/api/auth` - login
- `/api/attendance` - attendance operations
- `/api/assignments` - assignments and submissions
- `/api/messages` - messaging and announcements
- `/api/documents` - document upload/download
- `/api/chatbot` - AI chatbot integration

## Notes

- Uses JWT tokens and bcrypt password hashing
- Backend protects routes with auth middleware
- Database is MySQL with parameterized queries
