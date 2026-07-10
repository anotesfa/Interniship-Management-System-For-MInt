# Internship Management System - MInT

MInT Internship Management System is a role-based internship workflow platform for administrators, university coordinators, supervisors, and students. It covers the full lifecycle from university signup and application review to supervision, attendance, milestones, monthly reports, evaluations, messaging, and audit tracking.

## Core Functionalities

### Authentication and roles
- JWT-based login with role-aware routing for admin, university, supervisor, and student users.
- Password management, logout, and protected API access.

### University and application flow
- University signup and approval.
- Single and bulk internship application handling.
- Student roster management and application review.

### Internship supervision
- Student assignment and supervision management.
- Attendance tracking.
- Milestone tracking.
- Monthly report submission and review.
- Supervisor evaluations and student evaluation views.

### Communication and records
- Internal messaging between related roles.
- Notification delivery.
- Document upload and template management.
- Audit and activity log reporting.
- Summary reports for admins and universities.

### Role-specific access
- Admins manage users, universities, applications, assignments, templates, reports, and audit logs.
- University users manage applications, bulk submissions, student records, and university reports.
- Supervisors manage students, attendance, milestones, evaluations, and monthly reports.
- Students access dashboards, milestones, messages, evaluations, and monthly reports.

## Tech Stack

- Backend: NestJS, Prisma, PostgreSQL
- Frontend: React, Vite, TypeScript, Tailwind CSS
- Security: RSA JWT keys, bcrypt password hashing

## Local Setup

### Prerequisites
- Node.js 18 or newer
- PostgreSQL 13 or newer

### Backend

1. Install dependencies.
   ```bash
   cd backend
   npm install
   ```

2. Create or update `backend/.env` with the required values.
   ```bash
   DATABASE_URL="postgresql://mint_user:mint_password_123@localhost:5432/mint_ims"
   DB_HOST="localhost"
   DB_PORT=5432
   DB_USER="mint_user"
   DB_PASSWORD="mint_password_123"
   DB_NAME="mint_ims"
   JWT_PRIVATE_KEY_PATH="./keys/private.pem"
   JWT_PUBLIC_KEY_PATH="./keys/public.pem"
   JWT_EXPIRY_MINUTES=60
   FRONTEND_URL="http://localhost:5173"
   SMTP_HOST="smtp.example.com"
   SMTP_PORT=587
   SMTP_USER="your-smtp-username"
   SMTP_PASS="your-smtp-password"
   SMTP_FROM="no-reply@example.com"
   PORT=3000
   ```

   The messaging and email features use these SMTP values to send credential and evaluation emails. If your provider uses a different sender key, `SMTP_PASSWORD` and `EMAIL_FROM` are also supported.

3. Generate the RSA key pair if the `keys/` folder is empty.
   ```bash
   node generate-keys.js
   ```

4. Reset and reseed the database when you want a clean local copy.
   ```bash
   npm run db:reset
   npm run seed:demo
   ```

   Use `npm run setup` instead if you only need to push the schema and seed without forcing a full reset.

   After seeding, use these accounts to log in:

   | Email | Password | Role |
   | --- | --- | --- |
   | ebisaberhanu199@gmail.com | admin123 | Admin |
   | anamtesfa@gmail.com | uni123 | University Coordinator |
   | ebisaberhanu2004@gmail.com | super123 | Supervisor |
   | anamtesfa45@gmail.com | student123 | Student |

5. Start the API.
   ```bash
   npm run start:dev
   ```

   The API is available at `http://localhost:3000/api/v1` by default, and Swagger is exposed at `http://localhost:3000/api/docs`.

### Frontend

1. Install dependencies.
   ```bash
   cd frontend
   npm install
   ```

2. Create `frontend/.env` if you want to override the default API URL.
   ```bash
   VITE_API_BASE_URL="http://localhost:3000/api/v1"
   VITE_APP_NAME="MInT Internship Management System"
   VITE_APP_VERSION="local"
   ```

3. Start the development server.
   ```bash
   npm run dev
   ```

   The frontend runs on `http://localhost:5173`.

## Useful Scripts

### Backend
- `npm run setup` - generate keys, push the Prisma schema, and seed the database.
- `npm run db:reset` - force-reset the database and reseed it.
- `npm run seed:demo` - add the demo login accounts used for quick testing.

### Frontend
- `npm run dev` - start the Vite development server.
- `npm run build` - build the frontend for production.
- `npm run lint` - run the frontend linter.

## Project Structure

- `backend/` - NestJS API, Prisma schema, seed scripts, and uploads
- `frontend/` - React client application

## Notes

- Detailed usage guide: [Documentation/Usage-Guide.md](Documentation/Usage-Guide.md)
- After a reset, the seeded accounts listed in `passwords.md` are the quickest way to verify the latest changes.
- The backend seed clears existing seeded data before repopulating it, so the reset command is safe to rerun when you need a fresh local database.
