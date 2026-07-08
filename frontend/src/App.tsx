import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import LoginPage from './pages/LoginPage';
import UniversitySignup from './pages/UniversitySignup';
import DashboardRouter from './pages/DashboardRouter';

// Admin Pages
import AdminApplicationsPage from './pages/admin/ApplicationsPage';
import AdminAssignmentsPage from './pages/admin/AssignmentsPage';
import AdminEvaluationsPage from './pages/admin/EvaluationsPage';
import AdminReportsPage from './pages/admin/ReportsPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminAuditPage from './pages/admin/AuditPage';
import AdminUniversityManagementPage from './pages/admin/UniversityManagement';
import AdminUniversityApprovalPage from './pages/admin/UniversityApprovalPage';
import AdminCoordinatorMessagesPage from './pages/shared/AdminCoordinatorMessagesPage';
import AdminTemplateManagementPage from './pages/admin/TemplateManagementPage';

// University Pages
import UniversityApplicationsPage from './pages/university/ApplicationsPage';
import UniversityStudentsPage from './pages/university/StudentsPage';
import UniversityReportsPage from './pages/university/ReportsPage';
import UniversityBulkApplicationsPage from './pages/university/BulkApplications';
import UniversityBulkApplicationsNewPage from './pages/university/BulkApplicationsNew';

// Supervisor Pages
import SupervisorStudentsPage from './pages/supervisor/StudentsPage';
import SupervisorAttendancePage from './pages/supervisor/AttendancePage';
import SupervisorMilestonesPage from './pages/supervisor/MilestonesPage';
import SupervisorEvaluationsPage from './pages/supervisor/EvaluationsPage';
import SupervisorEvaluationFormPage from './pages/supervisor/EvaluationFormPage';
import SupervisorMessagesPage from './pages/supervisor/MessagesPage';
import SupervisorMonthlyReportsPage from './pages/supervisor/MonthlyReportsPage';

// Student Pages
import StudentDashboardPage from './pages/student/DashboardPage';
import StudentMemberDashboardPage from './pages/student/MemberDashboardPage';
import StudentMilestonesPage from './pages/student/MilestonesPage';
import StudentMessagesPage from './pages/student/MessagesPage';
import StudentEvaluationPage from './pages/student/EvaluationPage';
import StudentMonthlyReportsPage from './pages/student/MonthlyReportsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/university/signup" element={<UniversitySignup />} />
        <Route path="/dashboard" element={<DashboardRouter />} />
        
        {/* Admin Routes */}
        <Route path="/admin/applications" element={<AdminApplicationsPage />} />
        <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
        <Route path="/admin/evaluations" element={<AdminEvaluationsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        <Route path="/admin/universities" element={<AdminUniversityManagementPage />} />
        <Route path="/admin/university-approvals" element={<AdminUniversityApprovalPage />} />
        <Route path="/admin/templates" element={<AdminTemplateManagementPage />} />
        <Route path="/admin/messages" element={<AdminCoordinatorMessagesPage />} />
        <Route path="/admin/supervisor-messages" element={<Navigate to="/admin/messages" replace />} />
        
        {/* University Routes */}
        <Route path="/university/applications" element={<UniversityApplicationsPage />} />
        <Route path="/university/bulk-applications" element={<UniversityBulkApplicationsNewPage />} />
        <Route path="/university/bulk-applications-old" element={<UniversityBulkApplicationsPage />} />
        <Route path="/university/students" element={<UniversityStudentsPage />} />
        <Route path="/university/reports" element={<UniversityReportsPage />} />
        <Route path="/university/messages" element={<AdminCoordinatorMessagesPage />} />
        
        {/* Supervisor Routes */}
        <Route path="/supervisor/students" element={<SupervisorStudentsPage />} />
        <Route path="/supervisor/attendance" element={<SupervisorAttendancePage />} />
        <Route path="/supervisor/milestones" element={<SupervisorMilestonesPage />} />
        <Route path="/supervisor/evaluations" element={<SupervisorEvaluationsPage />} />
        <Route path="/supervisor/evaluations/form" element={<SupervisorEvaluationFormPage />} />
        <Route path="/supervisor/messages" element={<SupervisorMessagesPage />} />
        <Route path="/supervisor/admin-messages" element={<Navigate to="/supervisor/messages" replace />} />
        <Route path="/supervisor/monthly-reports" element={<SupervisorMonthlyReportsPage />} />
        
        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboardPage />} />
        <Route path="/student/member-dashboard" element={<StudentMemberDashboardPage />} />
        <Route path="/student/milestones" element={<StudentMilestonesPage />} />
        <Route path="/student/messages" element={<StudentMessagesPage />} />
        <Route path="/student/evaluation" element={<StudentEvaluationPage />} />
        <Route path="/student/monthly-reports" element={<StudentMonthlyReportsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
