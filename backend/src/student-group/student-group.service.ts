import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentGroupService {
  constructor(private readonly prisma: PrismaService) {}

  private async mapGroup(group: any) {
    const members = group.members.map((member: any) => ({
      student_id: String(member.student.student_id),
      student_user_id: member.student.user_id ? String(member.student.user_id) : null,
      student_name: member.student.full_name,
      student_email: member.student.email,
      department: member.student.department,
      is_leader: member.is_leader,
    }));

    const studentIds = members.map((member: any) => Number(member.student_id)).filter((id: number) => Number.isInteger(id));
    const assignments = studentIds.length > 0
      ? await this.prisma.assignment.findMany({
          where: {
            internship: { student_id: { in: studentIds } },
          },
          select: {
            status: true,
          },
        })
      : [];

    const status = studentIds.length > 0 && assignments.length === studentIds.length && assignments.every((assignment) => assignment.status === 'completed')
      ? 'complete'
      : 'active';

    return {
      group_id: String(group.group_id),
      supervisor_id: String(group.supervisor_id),
      team_name: group.team_name ?? null,
      status,
      leader_student_id: group.leader_student_id ? String(group.leader_student_id) : null,
      leader_student_name: group.leader?.full_name ?? null,
      start_date: group.start_date?.toISOString?.() ?? group.start_date ?? null,
      end_date: group.end_date?.toISOString?.() ?? group.end_date ?? null,
      attendance_days: group.attendance_days ?? null,
      created_at: group.created_at?.toISOString?.() ?? group.created_at,
      updated_at: group.updated_at?.toISOString?.() ?? group.updated_at,
      members,
    };
  }

  async getMyGroup(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { user_id: userId },
    });

    if (!student) {
      return null;
    }

    const membership = await this.prisma.studentGroupMember.findFirst({
      where: { student_id: student.student_id },
      include: {
        group: {
          include: {
            leader: true,
            members: { include: { student: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!membership) {
      return null;
    }

    return {
      ...(await this.mapGroup(membership.group)),
      is_team_leader: membership.is_leader,
      student_id: String(student.student_id),
    };
  }

  async getMyGroupSummary(userId: number) {
    const group = await this.getMyGroup(userId);
    if (!group) {
      return { has_group: false, is_team_leader: false, group: null };
    }

    return {
      has_group: true,
      is_team_leader: group.is_team_leader,
      group,
    };
  }

  async getSupervisorGroups(supervisorUserId: number) {
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { user_id: supervisorUserId },
    });

    if (!supervisor) {
      return [];
    }

    const groups = await this.prisma.studentGroup.findMany({
      where: { supervisor_id: supervisor.supervisor_id },
      include: {
        leader: true,
        members: { include: { student: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return Promise.all(groups.map((group) => this.mapGroup(group)));
  }

  async createGroup(params: {
    supervisorUserId: number;
    supervisorId?: number;
    studentIds: number[];
    leaderStudentId: number;
    teamName?: string;
    startDate?: string;
    endDate?: string;
    attendanceDays?: string;
  }) {
    const supervisor = params.supervisorId
      ? await this.prisma.supervisor.findUnique({ where: { supervisor_id: params.supervisorId } })
      : await this.prisma.supervisor.findUnique({ where: { user_id: params.supervisorUserId } });

    if (!supervisor) {
      throw new NotFoundException('Supervisor not found');
    }

    const uniqueStudentIds = [...new Set(params.studentIds.filter((id) => Number.isInteger(id)))];
    if (uniqueStudentIds.length === 0) {
      throw new BadRequestException('At least one student is required');
    }

    // Require a non-empty team name for new groups
    if (!params.teamName || String(params.teamName).trim() === '') {
      throw new BadRequestException('Team name is required');
    }

    if (!uniqueStudentIds.includes(params.leaderStudentId)) {
      throw new BadRequestException('Leader must be one of the selected students');
    }

    const assignments = await this.prisma.assignment.findMany({
      where: {
        supervisor_id: supervisor.supervisor_id,
        internship: {
          student_id: { in: uniqueStudentIds },
        },
        status: 'active',
      },
      include: {
        internship: { include: { student: true } },
      },
    });

    const assignedStudentIds = assignments.map((assignment) => assignment.internship.student_id);
    const missing = uniqueStudentIds.filter((studentId) => !assignedStudentIds.includes(studentId));

    if (missing.length > 0) {
      throw new BadRequestException('All selected students must already be assigned to this supervisor');
    }

    const group = await this.prisma.$transaction(async (tx) => {
      await tx.studentGroupMember.deleteMany({
        where: { student_id: { in: uniqueStudentIds } },
      });

      const createdGroup = await tx.studentGroup.create({
        data: {
          supervisor_id: supervisor.supervisor_id,
          team_name: params.teamName || null,
          leader_student_id: params.leaderStudentId,
          start_date: params.startDate ? new Date(params.startDate) : null,
          end_date: params.endDate ? new Date(params.endDate) : null,
          attendance_days: params.attendanceDays || null,
        },
        include: {
          leader: true,
          members: { include: { student: true } },
        },
      });

      await tx.studentGroupMember.createMany({
        data: uniqueStudentIds.map((studentId) => ({
          group_id: createdGroup.group_id,
          student_id: studentId,
          is_leader: studentId === params.leaderStudentId,
        })),
      });

      return tx.studentGroup.findUniqueOrThrow({
        where: { group_id: createdGroup.group_id },
        include: {
          leader: true,
          members: { include: { student: true } },
        },
      });
    });

    return this.mapGroup(group);
  }

  async updateGroup(params: {
    supervisorUserId: number;
    groupId: number;
    studentIds: number[];
    leaderStudentId: number;
    teamName?: string;
    startDate?: string;
    endDate?: string;
    attendanceDays?: string;
  }) {
    const supervisor = await this.prisma.supervisor.findUnique({ where: { user_id: params.supervisorUserId } });

    if (!supervisor) {
      throw new NotFoundException('Supervisor not found');
    }

    const group = await this.prisma.studentGroup.findUnique({ where: { group_id: params.groupId } });
    if (!group || group.supervisor_id !== supervisor.supervisor_id) {
      throw new NotFoundException('Group not found or not owned by supervisor');
    }

    const uniqueStudentIds = [...new Set(params.studentIds.filter((id) => Number.isInteger(id)))];
    if (uniqueStudentIds.length === 0) {
      throw new BadRequestException('At least one student is required');
    }

    if (!uniqueStudentIds.includes(params.leaderStudentId)) {
      throw new BadRequestException('Leader must be one of the selected students');
    }

    const assignments = await this.prisma.assignment.findMany({
      where: {
        supervisor_id: supervisor.supervisor_id,
        internship: { student_id: { in: uniqueStudentIds } },
        status: 'active',
      },
      include: { internship: { include: { student: true } } },
    });

    const assignedStudentIds = assignments.map((a) => a.internship.student_id);
    const missing = uniqueStudentIds.filter((studentId) => !assignedStudentIds.includes(studentId));
    if (missing.length > 0) {
      throw new BadRequestException('All selected students must already be assigned to this supervisor');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Remove these students from any other groups
      await tx.studentGroupMember.deleteMany({ where: { student_id: { in: uniqueStudentIds } } });

      // Clear existing members of this group
      await tx.studentGroupMember.deleteMany({ where: { group_id: params.groupId } });

      // Update group meta
      await tx.studentGroup.update({
        where: { group_id: params.groupId },
        data: {
          team_name: params.teamName || null,
          leader_student_id: params.leaderStudentId,
          start_date: params.startDate ? new Date(params.startDate) : null,
          end_date: params.endDate ? new Date(params.endDate) : null,
          attendance_days: params.attendanceDays || null,
        }
      });

      // Add new membership list
      await tx.studentGroupMember.createMany({
        data: uniqueStudentIds.map((studentId) => ({ group_id: params.groupId, student_id: studentId, is_leader: studentId === params.leaderStudentId })),
      });

      return tx.studentGroup.findUniqueOrThrow({ where: { group_id: params.groupId }, include: { leader: true, members: { include: { student: true } } } });
    });

    return this.mapGroup(updated);
  }

  async deleteGroup(supervisorUserId: number, groupId: number) {
    const supervisor = await this.prisma.supervisor.findUnique({ where: { user_id: supervisorUserId } });
    if (!supervisor) throw new NotFoundException('Supervisor not found');

    const group = await this.prisma.studentGroup.findUnique({ where: { group_id: groupId } });
    if (!group || group.supervisor_id !== supervisor.supervisor_id) throw new NotFoundException('Group not found or not owned by supervisor');

    await this.prisma.studentGroup.delete({ where: { group_id: groupId } });

    return { success: true };
  }
}
