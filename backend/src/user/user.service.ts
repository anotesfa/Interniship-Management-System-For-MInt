import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import ROLES from '../common/roles';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // ─── helpers ────────────────────────────────────────────────────────────

  private sanitize(user: any) {
    const { password_hash, ...safe } = user;
    return safe;
  }

  // ─── read ────────────────────────────────────────────────────────────────

  async findById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return this.sanitize(user);
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user; // keep hash for auth use-cases
  }

  async findByRole(roleName: string) {
    const role = await this.prisma.role.findUnique({
      where: { role_name: roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    const users = await this.prisma.user.findMany({
      where: { role_id: role.role_id },
      include: { role: true },
    });

    return users.map(this.sanitize);
  }

  async getAll(limit = 50, offset = 0) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: offset,
        take: limit,
        include: { role: true },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map(this.sanitize),
      pagination: { total, limit, offset },
    };
  }

  async getStudents(limit = 50, offset = 0) {
    const role = await this.prisma.role.findUnique({
      where: { role_name: ROLES.STUDENT },
    });

    if (!role) {
      return { data: [], pagination: { total: 0, limit, offset } };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role_id: role.role_id },
        skip: offset,
        take: limit,
        include: { role: true, student: true },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where: { role_id: role.role_id } }),
    ]);

    return {
      data: users.map(this.sanitize),
      pagination: { total, limit, offset },
    };
  }

  async getSupervisors(limit = 50, offset = 0) {
    const role = await this.prisma.role.findUnique({
      where: { role_name: 'Supervisor' },
    });

    if (!role) {
      return { data: [], pagination: { total: 0, limit, offset } };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { role_id: role.role_id },
        skip: offset,
        take: limit,
        include: { role: true, supervisor: true },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where: { role_id: role.role_id } }),
    ]);

    return {
      data: users.map(this.sanitize),
      pagination: { total, limit, offset },
    };
  }

  // ─── write ───────────────────────────────────────────────────────────────

  async create(body: {
    full_name: string;
    email: string;
    password: string;
    role_name: string;
    university_id?: number;
    registration_number?: string;
    department?: string;
    position?: string;
    max_students?: number;
    role_title?: string;
    gpa?: number;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      throw new ConflictException(`Email ${body.email} is already in use`);
    }

    const role = await this.prisma.role.findUnique({
      where: { role_name: body.role_name },
    });
    if (!role) {
      throw new BadRequestException(`Role "${body.role_name}" does not exist`);
    }

    const password_hash = await bcrypt.hash(body.password, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          full_name: body.full_name,
          email: body.email,
          password_hash,
          role_id: role.role_id,
          account_status: 'active',
        },
        include: { role: true },
      });

      if (role.role_name === ROLES.STUDENT) {
        const universityId = Number(body.university_id);
        const registrationNumber = body.registration_number?.trim();
        const department = body.department?.trim();

        if (!universityId || !registrationNumber || !department) {
          throw new BadRequestException(
            'Student users require university ID, registration number, and department',
          );
        }

        await tx.student.create({
          data: {
            user_id: createdUser.user_id,
            university_id: universityId,
            full_name: body.full_name,
            registration_number: registrationNumber,
            email: body.email,
            department,
            gpa: body.gpa ?? null,
            status: 'pending',
          },
        });
      }

      if (role.role_name === ROLES.SUPERVISOR) {
        const department = body.department?.trim();

        if (!department) {
          throw new BadRequestException('Supervisor users require a department');
        }

        await tx.supervisor.create({
          data: {
            user_id: createdUser.user_id,
            department,
            position: body.position?.trim() || 'Supervisor',
            max_students: body.max_students ?? 10,
          },
        });
      }

      if (role.role_name === ROLES.UNIVERSITY_COORDINATOR) {
        const universityId = Number(body.university_id);

        if (!universityId) {
          throw new BadRequestException('University coordinators require a university ID');
        }

        await tx.universityUser.create({
          data: {
            user_id: createdUser.user_id,
            university_id: universityId,
            role_title: body.role_title?.trim() || ROLES.UNIVERSITY_COORDINATOR,
          },
        });
      }

      return createdUser;
    });

    await this.emailService.sendCredentialsEmail({
      to: body.email,
      studentName: body.full_name,
      username: body.email,
      temporaryPassword: body.password,
      roleLabel: body.role_name,
    });

    return this.sanitize(created);
  }

  async resetPassword(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const temporaryPassword = `IMS-${randomBytes(4).toString('hex').toUpperCase()}`;
    const password_hash = await bcrypt.hash(temporaryPassword, 10);

    const updated = await this.prisma.user.update({
      where: { user_id: userId },
      data: {
        password_hash,
        account_status: 'active',
      },
      include: { role: true },
    });

    await this.emailService.sendCredentialsEmail({
      to: updated.email,
      studentName: updated.full_name,
      username: updated.email,
      temporaryPassword,
      roleLabel: updated.role.role_name,
    });

    return this.sanitize(updated);
  }

  async update(
    userId: number,
    body: Partial<{ full_name: string; email: string; role_name: string; account_status: string }>,
  ) {
    const user = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    const updateData: any = {};
    if (body.full_name) updateData.full_name = body.full_name;
    if (body.email) updateData.email = body.email;
    if (body.account_status) updateData.account_status = body.account_status;

    if (body.role_name) {
      const role = await this.prisma.role.findUnique({
        where: { role_name: body.role_name },
      });
      if (!role) throw new BadRequestException(`Role "${body.role_name}" does not exist`);
      updateData.role_id = role.role_id;
    }

    const updated = await this.prisma.user.update({
      where: { user_id: userId },
      data: updateData,
      include: { role: true },
    });

    if (body.full_name || body.email) {
      const studentUpdate: any = {};
      if (body.full_name) studentUpdate.full_name = body.full_name;
      if (body.email) studentUpdate.email = body.email;
      if (Object.keys(studentUpdate).length > 0) {
        await this.prisma.student.updateMany({
          where: { user_id: userId },
          data: studentUpdate,
        });
      }
    }

    return this.sanitize(updated);
  }

  async delete(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        role: true,
        student: true,
        supervisor: true,
        university_users: true,
      },
    });

    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    await this.prisma.$transaction(async (tx) => {
      await tx.loginLog.deleteMany({ where: { user_id: userId } });
      await tx.notification.deleteMany({ where: { user_id: userId } });
      await tx.message.deleteMany({ where: { OR: [{ sender_id: userId }, { receiver_id: userId }] } });
      await tx.document.deleteMany({ where: { uploaded_by: userId } });
      await tx.activityLog.deleteMany({ where: { user_id: userId } });
      await tx.statusHistory.deleteMany({ where: { changed_by: userId } });
      await tx.monthlyReport.updateMany({ where: { reviewed_by: userId }, data: { reviewed_by: null } });
      await tx.evaluation.updateMany({ where: { published_by: userId }, data: { published_by: null } });
      await tx.application.updateMany({ where: { reviewed_by: userId }, data: { reviewed_by: null } });
      await tx.universityUser.deleteMany({ where: { user_id: userId } });

      if (user.role.role_name === 'Supervisor' && user.supervisor) {
        const assignments = await tx.assignment.findMany({
          where: { supervisor_id: user.supervisor.supervisor_id },
          select: { assignment_id: true, internship_id: true },
        });

        if (assignments.length > 0) {
          await tx.internship.updateMany({
            where: { assignment_id: { in: assignments.map((assignment) => assignment.assignment_id) } },
            data: { assignment_id: null },
          });
          await tx.assignment.deleteMany({
            where: { supervisor_id: user.supervisor.supervisor_id },
          });
          await tx.evaluation.deleteMany({ where: { supervisor_id: user.supervisor.supervisor_id } });
        }

        await tx.supervisor.delete({ where: { supervisor_id: user.supervisor.supervisor_id } });
      }

      if (user.role.role_name === 'Student' && user.student) {
        const internships = await tx.internship.findMany({
          where: { student_id: user.student.student_id },
          select: { internship_id: true },
        });
        const internshipIds = internships.map((internship) => internship.internship_id);

        if (internshipIds.length > 0) {
          const milestones = await tx.milestone.findMany({
            where: { internship_id: { in: internshipIds } },
            select: { milestone_id: true },
          });
          const milestoneIds = milestones.map((milestone) => milestone.milestone_id);

          if (milestoneIds.length > 0) {
            const submissions = await tx.submission.findMany({
              where: { milestone_id: { in: milestoneIds } },
              select: { submission_id: true },
            });
            const submissionIds = submissions.map((submission) => submission.submission_id);

            if (submissionIds.length > 0) {
              await tx.submissionReview.deleteMany({ where: { submission_id: { in: submissionIds } } });
            }

            await tx.submission.deleteMany({ where: { milestone_id: { in: milestoneIds } } });
          }

          await tx.attendance.deleteMany({ where: { internship_id: { in: internshipIds } } });
          await tx.monthlyReport.deleteMany({ where: { internship_id: { in: internshipIds } } });
          await tx.evaluation.deleteMany({ where: { internship_id: { in: internshipIds } } });
          await tx.milestone.deleteMany({ where: { internship_id: { in: internshipIds } } });
          await tx.assignment.deleteMany({ where: { internship_id: { in: internshipIds } } });
          await tx.internship.deleteMany({ where: { student_id: user.student.student_id } });
        }

        await tx.applicationStudent.deleteMany({ where: { student_id: user.student.student_id } });
        await tx.student.delete({ where: { student_id: user.student.student_id } });
        await tx.application.deleteMany({ where: { submitted_by: userId } });
      }

      if (user.role.role_name === 'Admin') {
        const replacementAdmin = await tx.user.findFirst({
          where: { role: { role_name: 'Admin' }, user_id: { not: userId } },
          orderBy: { created_at: 'asc' },
        });

        if (replacementAdmin) {
          await tx.university.updateMany({
            where: { created_by: userId },
            data: { created_by: replacementAdmin.user_id },
          });
        }
      }

      await tx.user.delete({ where: { user_id: userId } });
    });

    return { success: true };
  }

  async lockAccount(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    await this.prisma.user.update({
      where: { user_id: userId },
      data: { account_status: 'locked' },
    });

    return { success: true };
  }

  async unlockAccount(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);

    await this.prisma.user.update({
      where: { user_id: userId },
      data: { account_status: 'active', failed_login_count: 0, lockout_until: null },
    });

    return { success: true };
  }

  // ─── stats ───────────────────────────────────────────────────────────────

  async getStats() {
    const totalUsers = await this.prisma.user.count();

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role_id'],
      _count: { user_id: true },
    });

    const roleNames = await this.prisma.role.findMany();
    const roleMap = new Map(roleNames.map(r => [r.role_id, r.role_name]));

    const by_role: Record<string, number> = {};
    usersByRole.forEach(item => {
      const roleName = roleMap.get(item.role_id) || 'Unknown';
      by_role[roleName] = item._count.user_id;
    });

    return { total: totalUsers, by_role };
  }
}
