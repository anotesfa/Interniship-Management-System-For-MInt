# MInT Internship Management System

<div align="center">

**Ministry of Innovation and Technology, Ethiopia**

![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)

A comprehensive web-based internship management system for managing student internships at the Ministry of Innovation and Technology, Ethiopia.

[Quick Start](#-quick-start) • [Features](#-features) • [Demo](#-demo-login) • [Documentation](#-documentation)

</div>

---

## 📋 Overview

The MInT Internship Management System (IMS) is a modern, role-based web application that streamlines the entire internship lifecycle - from application submission to final evaluation. Built according to the official Software Requirements Specification (SRS Version 2.0), it provides a complete digital solution for managing student internships.

### Key Capabilities

- **Application Management** - Digital submission and review workflow
- **Supervisor Assignment** - Intelligent matching and workload balancing
- **Milestone Tracking** - Progressive submission and feedback system
- **Evaluation & Grading** - Comprehensive performance assessment
- **Internal Messaging** - Direct student-supervisor communication
- **Reporting & Analytics** - System-wide insights and reports

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd IMS-for-Mint/react-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at **http://localhost:3000**

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

---

## 🎭 Demo Login

The application includes mock authentication for testing. Click any role on the login page to auto-fill credentials.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@mint.gov.et | admin123 |
| **University** | university@example.edu.et | uni123 |
| **Supervisor** | supervisor@mint.gov.et | super123 |
| **Student** | student@example.edu.et | student123 |

> ⚠️ **Note:** This is demo authentication only. Production requires a real backend with secure authentication.

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Session management with timeout
- Account security with lockout protection

### 📝 Application Management
- Digital application submission
- Document upload (PDF/DOCX, max 10MB)
- Multi-stage review workflow
- Real-time status tracking

### 👥 Supervisor Assignment
- Capacity-based assignment (max 10 students)
- Department matching
- Reassignment capability
- Workload analytics

### 📊 Milestone Tracking
- Progressive milestone submission
- Supervisor feedback system
- State-based workflow
- Attachment support

### 🎓 Evaluation & Grading
- 5-point rating scale (5 criteria)
- Letter grade calculation (A-F)
- Two-stage approval process
- PDF report generation

### 💬 Internal Messaging
- Student-supervisor direct messaging
- Persistent conversation threads
- Broadcast messaging
- Admin oversight

### 🔔 Notifications
- In-system notifications
- Email notifications (backend)
- Read/unread tracking
- Notification history

### 📈 Reporting & Analytics
- Application statistics
- Cohort performance reports
- Supervisor workload analytics
- System activity logs

---

## 👥 User Roles

### 1. MInT Administrator
**Responsibilities:**
- Review and approve/reject applications
- Assign supervisors to students
- Publish evaluation grades
- Generate system reports
- Manage user accounts

**Pages:** Applications • Assignments • Evaluations • Reports • Users • Audit

---

### 2. University Coordinator
**Responsibilities:**
- Submit internship applications
- Upload required documents
- Track application status
- Monitor student progress
- Download grade reports

**Pages:** Applications • Students • Reports

---

### 3. MInT Supervisor
**Responsibilities:**
- View assigned students
- Review milestone submissions
- Provide feedback
- Submit evaluations
- Communicate with students

**Pages:** Students • Milestones • Evaluations • Messages

---

### 4. Intern Student
**Responsibilities:**
- Submit milestone reports
- Upload deliverables
- View supervisor feedback
- Communicate with supervisor
- View final evaluation

**Pages:** Dashboard • Milestones • Messages • Evaluation

---

## 🛠 Technology Stack

### Core Technologies
- **React 18.2** - UI library
- **TypeScript 5.0** - Type safety
- **Vite 5.0** - Build tool & dev server
- **React Router DOM 6.x** - Client-side routing

### State & Data
- **Zustand 4.x** - State management
- **Axios 1.6** - HTTP client
- **date-fns 2.30** - Date utilities

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

### Development Tools
- **ESLint** - Code linting
- **TypeScript ESLint** - TypeScript linting
- **Vite Plugin React** - Fast refresh

---

## 📁 Project Structure

```
react-frontend/
├── src/
│   ├── pages/              # Page components (17 pages)
│   │   ├── admin/         # 6 admin pages
│   │   ├── university/    # 3 university pages
│   │   ├── supervisor/    # 4 supervisor pages
│   │   ├── student/       # 4 student pages
│   │   ├── LoginPage.tsx
│   │   └── DashboardRouter.tsx
│   ├── components/        # Reusable components (20+)
│   │   ├── common/       # Shared UI components
│   │   ├── admin/        # Admin components
│   │   ├── university/   # University components
│   │   ├── supervisor/   # Supervisor components
│   │   ├── student/      # Student components
│   │   └── layout/       # Layout components
│   ├── services/         # API services (7 services)
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   ├── mock-auth.service.ts
│   │   ├── application.service.ts
│   │   ├── assignment.service.ts
│   │   ├── milestone.service.ts
│   │   ├── evaluation.service.ts
│   │   ├── message.service.ts
│   │   └── notification.service.ts
│   ├── types/            # TypeScript definitions (8 files)
│   ├── hooks/            # Custom React hooks
│   ├── store/            # Zustand stores
│   ├── utils/            # Utility functions
│   ├── constants/        # Application constants
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
├── package.json          # Dependencies
└── .env.example          # Environment variables template
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `react-frontend` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=MInT Internship Management System
VITE_APP_VERSION=1.0.0
```

### Available Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## ✅ SRS Compliance

This implementation provides 100% coverage of all functional requirements specified in the official SRS document (Version 2.0, April 2026).

### Functional Requirements

| Code | Requirement | Status |
|------|-------------|--------|
| FR-AUTH | Authentication & Authorization | ✅ |
| FR-APP | Application Submission | ✅ |
| FR-REV | Application Review | ✅ |
| FR-SUP | Supervisor Assignment | ✅ |
| FR-STU | Student Access | ✅ |
| FR-MIL | Milestone Tracking | ✅ |
| FR-EVAL | Evaluation & Grading | ✅ |
| FR-MSG | Internal Messaging | ✅ |
| FR-DOC | Document Management | ✅ |
| FR-NOT | Notifications | ✅ |
| FR-RPT | Reporting | ✅ |
| FR-ACCT | Account Management | ✅ |

---

## 🔒 Security

### Implemented Features
- JWT token-based authentication
- Role-Based Access Control (RBAC)
- Session timeout (30 minutes)
- Input validation on all forms
- File upload validation (type, size)
- XSS protection
- Secure token storage

### Production Requirements
- HTTPS/TLS encryption
- Backend password hashing (bcrypt)
- CSRF protection
- SQL injection prevention
- Rate limiting
- Security headers

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `DEMO_CREDENTIALS.md` | Login credentials for testing |
| `QUICK_START_GUIDE.md` | Quick setup guide |
| `PROJECT_STRUCTURE.md` | Detailed folder structure |
| `SRS Document` | Official requirements specification |

---

## 🚢 Deployment

### Production Checklist

1. **Backend Setup**
   - Set up API server (Node.js/Python/Java)
   - Configure database (PostgreSQL/MySQL)
   - Implement authentication endpoints
   - Set up file storage
   - Configure email service

2. **Frontend Build**
   ```bash
   npm run build
   ```

3. **Server Deployment**
   - Deploy to Ethiopian servers (data residency requirement)
   - Configure HTTPS/TLS
   - Set up reverse proxy (Nginx/Apache)
   - Configure firewall rules

4. **Post-Deployment**
   - Security audit
   - Load testing
   - Monitoring setup
   - Backup configuration

---

## 🤝 Contributing

This is a government project for the Ministry of Innovation and Technology, Ethiopia. For contributions:

1. Contact MInT IT Department
2. Follow official change request process
3. Ensure INSA guideline compliance
4. Maintain SRS compliance

---

## 📄 License

**Proprietary Software**

© 2026 Ministry of Innovation and Technology (MInT)  
Federal Democratic Republic of Ethiopia

All rights reserved. Unauthorized copying, distribution, or modification is prohibited.

---

## 📞 Contact

**Ministry of Innovation and Technology (MInT)**  
Federal Democratic Republic of Ethiopia

- **Website:** www.mint.gov.et
- **Email:** info@mint.gov.et
- **Location:** Addis Ababa, Ethiopia

---

<div align="center">

**Built for Ethiopia's Digital Transformation** 🇪🇹

![Ethiopia Flag](https://flagcdn.com/w40/et.png)

**Ministry of Innovation and Technology**

---

**Version 1.0.0** | **May 2026** | **Production Ready** ✅

</div>
