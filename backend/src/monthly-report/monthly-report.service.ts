import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluationService } from '../evaluation/evaluation.service';

@Injectable()
export class MonthlyReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: EvaluationService,
  ) {}

  // ─── private helpers ──────────────────────────────────────────────────────

  private mapReport(r: any) {
    return {
      report_id: r.report_id,
      internship_id: r.internship_id,
      student_id: String(r.student_id),
      student_name: r.student?.full_name ?? r.internship?.student?.full_name ?? '',
      month: r.month,
      year: r.year,
      summary: r.summary,
      submitted_at: r.submitted_at?.toISOString?.() ?? r.submitted_at,
      reviewed_by: r.reviewed_by ? String(r.reviewed_by) : null,
      reviewer_name: r.reviewer?.full_name ?? null,
      status: r.status,
      feedback: r.feedback ?? null,
    };
  }

  // ─── user-resolving methods ───────────────────────────────────────────────

  /** Student submits a report — resolves internship from user_id */
  async submitForUser(userId: number, month: number, year: number, summary: string) {
    const student = await this.prisma.student.findUnique({ where: { user_id: userId } });
    if (!student) throw new BadRequestException('No student profile linked to your account');

    // Check if student has published evaluation
    const hasPublishedEval = await this.evaluationService.hasPublishedEvaluation(student.student_id);
    if (hasPublishedEval) {
      throw new BadRequestException('Your internship has been completed. You cannot submit monthly reports after evaluation is published. Contact your admin if you believe this is an error.');
    }

    const internship = await this.prisma.internship.findFirst({
      where: { student_id: student.student_id, status: 'active' },
      orderBy: { created_at: 'desc' },
    });
    if (!internship) throw new BadRequestException('No active internship found');

    return this.submit(student.student_id, internship.internship_id, month, year, summary);
  }

  /** Get reports for the logged-in student */
  async getForStudent(userId: number) {
    const student = await this.prisma.student.findUnique({ where: { user_id: userId } });
    if (!student) return [];
    const reports = await this.prisma.monthlyReport.findMany({
      where: { student_id: student.student_id },
      include: { 
        student: true,
        reviewer: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return reports.map(r => this.mapReport(r));
  }

  /** Get reports for all students assigned to the logged-in supervisor */
  async getForSupervisor(userId: number) {
    const supervisor = await this.prisma.supervisor.findUnique({ where: { user_id: userId } });
    if (!supervisor) return [];
    const reports = await this.prisma.monthlyReport.findMany({
      where: { internship: { assignment: { supervisor_id: supervisor.supervisor_id } } },
      include: { 
        student: true, 
        internship: { include: { student: true } },
        reviewer: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return reports.map(r => this.mapReport(r));
  }

  // ─── core methods ─────────────────────────────────────────────────────────

  async submit(studentId: number, internshipId: number, month: number, year: number, summary: string) {
    if (month < 1 || month > 12) throw new BadRequestException('Month must be between 1 and 12');

    const internship = await this.prisma.internship.findUnique({ where: { internship_id: internshipId } });
    if (!internship) throw new NotFoundException(`Internship ${internshipId} not found`);
    if (internship.student_id !== studentId) throw new BadRequestException('Not your internship');

    // Prevent duplicate for same month/year
    const existing = await this.prisma.monthlyReport.findUnique({
      where: { internship_id_month_year: { internship_id: internshipId, month, year } },
    });
    if (existing) throw new BadRequestException(`Report for ${month}/${year} already submitted`);

    const report = await this.prisma.monthlyReport.create({
      data: { internship_id: internshipId, student_id: studentId, month, year, summary, status: 'submitted' },
      include: { student: true },
    });
    return this.mapReport(report);
  }

  async getAll(limit = 50, offset = 0) {
    const [reports, total] = await Promise.all([
      this.prisma.monthlyReport.findMany({
        skip: offset,
        take: limit,
        include: { student: true, internship: { include: { student: true } } },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      this.prisma.monthlyReport.count(),
    ]);
    return { data: reports.map(r => this.mapReport(r)), pagination: { total, limit, offset } };
  }

  async getByStudent(studentId: number, limit = 50, offset = 0) {
    const [reports, total] = await Promise.all([
      this.prisma.monthlyReport.findMany({
        where: { student_id: studentId },
        skip: offset,
        take: limit,
        include: { student: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      this.prisma.monthlyReport.count({ where: { student_id: studentId } }),
    ]);
    return { data: reports.map(r => this.mapReport(r)), pagination: { total, limit, offset } };
  }

  async getByInternship(internshipId: number, limit = 50, offset = 0) {
    const [reports, total] = await Promise.all([
      this.prisma.monthlyReport.findMany({
        where: { internship_id: internshipId },
        skip: offset,
        take: limit,
        include: { student: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      this.prisma.monthlyReport.count({ where: { internship_id: internshipId } }),
    ]);
    return { data: reports.map(r => this.mapReport(r)), pagination: { total, limit, offset } };
  }

  async getById(reportId: number) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { report_id: reportId },
      include: { student: true },
    });
    if (!report) throw new NotFoundException(`Report ${reportId} not found`);
    return this.mapReport(report);
  }

  async update(reportId: number, summary: string) {
    const report = await this.prisma.monthlyReport.findUnique({ where: { report_id: reportId } });
    if (!report) throw new NotFoundException(`Report ${reportId} not found`);
    if (report.status !== 'submitted') throw new BadRequestException('Only submitted reports can be edited');

    const updated = await this.prisma.monthlyReport.update({
      where: { report_id: reportId },
      data: { summary },
      include: { student: true },
    });
    return this.mapReport(updated);
  }

  async review(reportId: number, status: string, reviewedBy: number) {
    const report = await this.prisma.monthlyReport.findUnique({ where: { report_id: reportId } });
    if (!report) throw new NotFoundException(`Report ${reportId} not found`);

    const updated = await this.prisma.monthlyReport.update({
      where: { report_id: reportId },
      data: { status, reviewed_by: reviewedBy },
      include: { student: true },
    });
    return this.mapReport(updated);
  }

  async approveReport(reportId: number, reviewedBy: number) {
    return this.review(reportId, 'approved', reviewedBy);
  }

  async rejectReport(reportId: number, reviewedBy: number) {
    return this.review(reportId, 'returned', reviewedBy);
  }

  async getBySupervisor(supervisorId: number) {
    const reports = await this.prisma.monthlyReport.findMany({
      where: { internship: { assignment: { supervisor_id: supervisorId } } },
      include: { student: true, internship: { include: { student: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return reports.map(r => this.mapReport(r));
  }
}
