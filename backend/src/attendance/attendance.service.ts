import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AttendanceDay = {
  week: number;
  from: string | null;
  to: string | null;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
};

type AttendanceSheetPayload = {
  weeks?: AttendanceDay[];
  totalAbsentDays?: number;
  month?: number;
  year?: number;
  percentage?: number;
};

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeWeeks(weeks?: AttendanceDay[]) {
    const safeWeeks = Array.isArray(weeks) ? weeks : [];
    return safeWeeks
      .slice(0, 8)
      .map((week, index) => ({
        week: week.week || index + 1,
        from: week.from || null,
        to: week.to || null,
        monday: Boolean(week.monday),
        tuesday: Boolean(week.tuesday),
        wednesday: Boolean(week.wednesday),
        thursday: Boolean(week.thursday),
        friday: Boolean(week.friday),
      }));
  }

  private computePercentage(totalAbsentDays: number) {
    const totalExpectedDays = 40;
    const presentDays = Math.max(0, Math.min(totalExpectedDays, totalExpectedDays - totalAbsentDays));
    return Math.round((presentDays / totalExpectedDays) * 100);
  }

  private mapAttendance(a: any) {
    const sheet = a.attendance_sheet && typeof a.attendance_sheet === 'object' ? a.attendance_sheet : null;
    const weeks = this.normalizeWeeks(sheet?.weeks ?? []);
    const totalAbsentDays = a.total_absent_days ?? sheet?.totalAbsentDays ?? 0;
    const percentage = a.percentage ?? this.computePercentage(totalAbsentDays);

    const studentObj = a.student ?? a.internship?.student;
    const groupMembership = studentObj?.group_memberships?.[0];
    const group = groupMembership?.group;

    return {
      attendance_id: a.attendance_id,
      internship_id: a.internship_id,
      student_id: String(a.student_id),
      student_name: studentObj?.full_name ?? '',
      month: a.month,
      year: a.year,
      weeks,
      total_absent_days: totalAbsentDays,
      percentage,
      marked_by: String(a.marked_by),
      updated_at: a.updated_at?.toISOString?.() ?? a.updated_at,
      supervisor_name: a.reviewer?.full_name ?? undefined,
      group_id: group ? String(group.group_id) : null,
      group_name: group?.team_name ?? null,
      group_start_date: group?.start_date?.toISOString?.() ?? group?.start_date ?? null,
      group_end_date: group?.end_date?.toISOString?.() ?? group?.end_date ?? null,
      group_attendance_days: group?.attendance_days ?? null,
    };
  }

  async getForSupervisor(userId: number) {
    const supervisor = await this.prisma.supervisor.findUnique({ where: { user_id: userId } });
    if (!supervisor) return [];
    const records = await this.prisma.attendance.findMany({
      where: { internship: { assignment: { supervisor_id: supervisor.supervisor_id } } },
      orderBy: [
        { updated_at: 'desc' },
        { attendance_id: 'desc' },
      ],
      include: {
        student: {
          include: {
            group_memberships: {
              include: {
                group: true,
              },
            },
          },
        },
        internship: {
          include: {
            student: {
              include: {
                group_memberships: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return records.map((attendance) => this.mapAttendance(attendance));
  }

  async getForStudent(userId: number) {
    const student = await this.prisma.student.findUnique({ where: { user_id: userId } });
    if (!student) return [];
    const records = await this.prisma.attendance.findMany({
      where: { student_id: student.student_id },
      orderBy: [
        { updated_at: 'desc' },
        { attendance_id: 'desc' },
      ],
      include: {
        student: {
          include: {
            group_memberships: {
              include: {
                group: true,
              },
            },
          },
        },
        internship: {
          include: {
            student: {
              include: {
                group_memberships: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return records.map((attendance) => this.mapAttendance(attendance));
  }

  async getByInternship(internshipId: number) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { internship_id: internshipId },
      include: {
        internship: {
          include: {
            student: {
              include: {
                group_memberships: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
        student: {
          include: {
            group_memberships: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });
    return attendance ? this.mapAttendance(attendance) : null;
  }

  async getAll(supervisorId?: number) {
    const where = supervisorId
      ? { internship: { assignment: { supervisor_id: supervisorId } } }
      : {};
    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: [
        { updated_at: 'desc' },
        { attendance_id: 'desc' },
      ],
      include: {
        internship: {
          include: {
            student: {
              include: {
                group_memberships: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
        student: {
          include: {
            group_memberships: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });
    return records.map((attendance) => this.mapAttendance(attendance));
  }

  async record(internshipId: number, studentId: number, payload: AttendanceSheetPayload, markedBy: number) {
    const internship = await this.prisma.internship.findUnique({ where: { internship_id: internshipId } });
    if (!internship) throw new NotFoundException(`Internship ${internshipId} not found`);

    const weeks = this.normalizeWeeks(payload?.weeks);
    const totalAbsentDays = Number.isFinite(payload?.totalAbsentDays) ? Number(payload.totalAbsentDays) : 0;
    const percentage = Number.isFinite(payload?.percentage)
      ? Number(payload.percentage)
      : this.computePercentage(totalAbsentDays);

    const existing = await this.prisma.attendance.findUnique({ where: { internship_id: internshipId } });
    if (existing) {
      return this.update(existing.attendance_id, {
        weeks,
        totalAbsentDays,
        percentage,
      });
    }

    const now = new Date();
    const attendance = await this.prisma.attendance.create({
      data: {
        internship_id: internshipId,
        student_id: studentId,
        percentage,
        attendance_sheet: { weeks },
        total_absent_days: totalAbsentDays,
        marked_by: markedBy,
        month: payload?.month ?? now.getMonth() + 1,
        year: payload?.year ?? now.getFullYear(),
      },
      include: {
        internship: {
          include: {
            student: {
              include: {
                group_memberships: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
        student: {
          include: {
            group_memberships: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });
    return this.mapAttendance(attendance);
  }

  async update(attendanceId: number, payload: AttendanceSheetPayload | number) {
    const attendance = await this.prisma.attendance.findUnique({ where: { attendance_id: attendanceId } });
    if (!attendance) throw new NotFoundException(`Attendance ${attendanceId} not found`);

    const normalizedPayload = typeof payload === 'number'
      ? { percentage: payload }
      : payload;

    const weeks = this.normalizeWeeks(normalizedPayload?.weeks);
    const totalAbsentDays = Number.isFinite(normalizedPayload?.totalAbsentDays)
      ? Number(normalizedPayload.totalAbsentDays)
      : attendance.total_absent_days ?? 0;
    const percentage = Number.isFinite(normalizedPayload?.percentage)
      ? Number(normalizedPayload.percentage)
      : this.computePercentage(totalAbsentDays);

    const updated = await this.prisma.attendance.update({
      where: { attendance_id: attendanceId },
      data: {
        percentage,
        attendance_sheet: { weeks },
        total_absent_days: totalAbsentDays,
      },
      include: {
        internship: {
          include: {
            student: {
              include: {
                group_memberships: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        },
        student: {
          include: {
            group_memberships: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });
    return this.mapAttendance(updated);
  }
}
