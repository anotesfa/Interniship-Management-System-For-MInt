import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableSupervisors() {
    const supervisors = await this.prisma.supervisor.findMany({
      include: {
        user: { include: { role: true } },
        assignments: { where: { status: 'active' } },
      },
    });

    // Filter supervisors who haven't reached max_students
    const available = supervisors.filter(
      supervisor => supervisor.assignments.length < supervisor.max_students,
    );

    return available.map(s => ({
      supervisor_id: s.supervisor_id,
      user_id: s.user_id,
      full_name: s.user.full_name,
      email: s.user.email,
      department: s.department,
      position: s.position,
      max_students: s.max_students,
      current_students: s.assignments.length,
    }));
  }

  async getOrCreateInternshipForStudent(studentId: number, applicationId?: number): Promise<number> {
    // Find existing internship for this student
    const existing = await this.prisma.internship.findFirst({
      where: {
        student_id: studentId,
        ...(applicationId ? { application_id: applicationId } : {}),
      },
      orderBy: { created_at: 'desc' },
    });

    if (existing) return existing.internship_id;

    // Need an application_id to create one — find the approved application for this student
    let appId = applicationId;
    if (!appId) {
      const appStudent = await this.prisma.applicationStudent.findFirst({
        where: { student_id: studentId },
        include: { application: true },
        orderBy: { id: 'desc' },
      });
      if (!appStudent) {
        throw new NotFoundException(`No application found for student ${studentId}`);
      }
      appId = appStudent.application_id;
    }

    const internship = await this.prisma.internship.create({
      data: {
        student_id: studentId,
        application_id: appId,
        status: 'pending_assignment',
      },
    });

    return internship.internship_id;
  }

  async create(internshipId: number, supervisorId: number, assignedBy: number) {
    const internship = await this.prisma.internship.findUnique({
      where: { internship_id: internshipId },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with id ${internshipId} not found`);
    }

    const supervisor = await this.prisma.supervisor.findUnique({
      where: { supervisor_id: supervisorId },
      include: { assignments: { where: { status: 'active' } } },
    });

    if (!supervisor) {
      throw new NotFoundException(`Supervisor with id ${supervisorId} not found`);
    }

    if (supervisor.assignments.length >= supervisor.max_students) {
      throw new BadRequestException(
        `Supervisor has reached maximum number of students (${supervisor.max_students})`,
      );
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      const createdAssignment = await tx.assignment.create({
        data: {
          internship_id: internshipId,
          supervisor_id: supervisorId,
          assigned_by: assignedBy,
          status: 'active',
        },
        include: {
          internship: { include: { student: true } },
          supervisor: { include: { user: true } },
        },
      });

      await tx.internship.update({
        where: { internship_id: internshipId },
        data: { status: 'active', assignment_id: createdAssignment.assignment_id },
      });

      await tx.attendance.upsert({
        where: { internship_id: internshipId },
        update: {
          student_id: internship.student_id,
          marked_by: assignedBy,
        },
        create: {
          internship_id: internshipId,
          student_id: internship.student_id,
          percentage: 0,
          marked_by: assignedBy,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        },
      });

      return createdAssignment;
    });

    return assignment;
  }

  async reassign(assignmentId: number, newSupervisorId: number, assignedBy: number) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { assignment_id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with id ${assignmentId} not found`);
    }

    const supervisor = await this.prisma.supervisor.findUnique({
      where: { supervisor_id: newSupervisorId },
      include: { assignments: { where: { status: 'active' } } },
    });

    if (!supervisor) {
      throw new NotFoundException(`Supervisor with id ${newSupervisorId} not found`);
    }

    // Check capacity only if it's a different supervisor
    if (newSupervisorId !== assignment.supervisor_id) {
      if (supervisor.assignments.length >= supervisor.max_students) {
        throw new BadRequestException(
          `Supervisor has reached maximum number of students (${supervisor.max_students})`,
        );
      }
    }

    const updated = await this.prisma.assignment.update({
      where: { assignment_id: assignmentId },
      data: { supervisor_id: newSupervisorId, assigned_by: assignedBy },
      include: {
        internship: { include: { student: true } },
        supervisor: { include: { user: true } },
      },
    });

    return updated;
  }

  async updateStatus(assignmentId: number, status: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { assignment_id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with id ${assignmentId} not found`);
    }

    const updated = await this.prisma.assignment.update({
      where: { assignment_id: assignmentId },
      data: { status },
      include: {
        internship: { include: { student: true } },
        supervisor: { include: { user: true } },
      },
    });

    if (status === 'completed') {
      await this.prisma.internship.update({
        where: { internship_id: assignment.internship_id },
        data: { status: 'completed', end_date: new Date() },
      });
    }

    return updated;
  }

  async markCompleted(assignmentId: number) {
    return this.updateStatus(assignmentId, 'completed');
  }

  async getById(assignmentId: number) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { assignment_id: assignmentId },
      include: {
        internship: { include: { student: true } },
        supervisor: { include: { user: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with id ${assignmentId} not found`);
    }

    return assignment;
  }

  private mapAssignment(a: any) {
    return {
      assignment_id: String(a.assignment_id),
      student_id: String(a.internship?.student?.student_id ?? ''),
      student_user_id: a.internship?.student?.user_id
        ? String(a.internship.student.user_id)
        : null,
      student_name: a.internship?.student?.full_name ?? '',
      supervisor_id: String(a.supervisor?.user_id ?? a.supervisor_id),
      supervisor_name: a.supervisor?.user?.full_name ?? '',
      start_date: a.start_date?.toISOString?.() ?? a.start_date ?? null,
      end_date: a.end_date?.toISOString?.() ?? a.end_date ?? null,
      status: a.status,
      created_at: a.created_at?.toISOString?.() ?? a.created_at,
    };
  }

  async getMyAssignment(userId: number) {
    // Find the student record linked to this user
    const student = await this.prisma.student.findUnique({
      where: { user_id: userId },
    });

    if (!student) return null;

    const assignment = await this.prisma.assignment.findFirst({
      where: { internship: { student_id: student.student_id } },
      include: {
        internship: { include: { student: true } },
        supervisor: { include: { user: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!assignment) return null;
    return this.mapAssignment(assignment);
  }

  async getByUserId(userId: number) {
    // Look up the supervisor record for this user
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { user_id: userId },
    });

    if (!supervisor) {
      return []; // Not yet a supervisor record — return empty
    }

    const assignments = await this.getByStudents(supervisor.supervisor_id);
    return assignments;
  }

  async getByStudent(studentId: number) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { internship: { student_id: studentId } },
      include: {
        internship: { include: { student: true } },
        supervisor: { include: { user: true } },
      },
    });

    return assignment || null;
  }

  async getByStudents(supervisorId: number) {
    const assignments = await this.prisma.assignment.findMany({
      where: { supervisor_id: supervisorId },
      include: {
        internship: { include: { student: true } },
        supervisor: { include: { user: true } },
      },
    });

    return assignments.map(a => this.mapAssignment(a));
  }

  async getAll(limit = 50, offset = 0) {
    const [assignments, total] = await Promise.all([
      this.prisma.assignment.findMany({
        skip: offset,
        take: limit,
        include: {
          internship: { include: { student: true } },
          supervisor: { include: { user: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.assignment.count(),
    ]);

    return {
      data: assignments,
      pagination: { total, limit, offset },
    };
  }
}
