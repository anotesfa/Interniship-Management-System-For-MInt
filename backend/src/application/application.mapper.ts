import { Application, ApplicationStudent, Student, University } from '@prisma/client';

type ApplicationWithStudents = Application & {
  application_students: (ApplicationStudent & { student: Student })[];
  university?: University;
  coordinator_name?: string;
  coordinator_email?: string;
};

type ApplicationStudentSummary = {
  student_id: string;
  full_name: string;
  registration_number: string;
  email: string;
  department: string;
  gpa: number | null;
  status: string;
};

export function mapApplicationToResponse(application: ApplicationWithStudents) {
  const students: ApplicationStudentSummary[] = application.application_students.map((appStudent) => ({
    student_id: String(appStudent.student.student_id),
    full_name: appStudent.student.full_name,
    registration_number: appStudent.student.registration_number,
    email: appStudent.student.email,
    department: appStudent.student.department,
    gpa: appStudent.student.gpa ?? null,
    status: appStudent.status,
  }));

  const student = application.application_students[0]?.student;

  return {
    application_id: String(application.application_id),
    university_id: String(application.university_id),
    university_name: application.university?.name ?? '',
    coordinator_name: application.coordinator_name ?? '',
    coordinator_email: application.coordinator_email ?? '',
    student_id: student ? String(student.student_id) : undefined,
    student_name: student?.full_name ?? '',
    student_institutional_id: student?.registration_number ?? '',
    department: student?.department ?? '',
    gpa: student?.gpa ?? 0,
    institutional_email: student?.email ?? '',
    status: application.status,
    reviewed_by: application.reviewed_by ? String(application.reviewed_by) : undefined,
    reviewed_at: application.reviewed_at?.toISOString(),
    rejection_reason: application.status === 'rejected' ? application.remarks ?? undefined : undefined,
    hold_comment: application.status === 'on_hold' ? application.remarks ?? undefined : undefined,
    students,
    student_count: students.length,
    created_at: application.submission_date.toISOString(),
    updated_at: application.submission_date.toISOString(),
  };
}
