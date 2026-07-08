import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument = require('pdfkit');
import { Parser } from 'json2csv';
import { existsSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentEvaluationSubmissionStatus(
    studentIds: number[],
    requester: { userId: number; role: string },
  ) {
    const uniqueIds = [...new Set(
      studentIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    )];

    if (uniqueIds.length === 0) {
      return [];
    }

    let scopedStudentIds = uniqueIds;

    if (requester.role === 'University Coordinator') {
      const universityLink = await this.prisma.universityUser.findFirst({
        where: { user_id: requester.userId },
        select: { university_id: true },
      });

      if (!universityLink) {
        throw new BadRequestException('Coordinator account is not linked to a university');
      }

      const ownedStudents = await this.prisma.student.findMany({
        where: {
          university_id: universityLink.university_id,
          student_id: { in: uniqueIds },
        },
        select: { student_id: true },
      });

      scopedStudentIds = ownedStudents.map((student) => student.student_id);
    }

    if (scopedStudentIds.length === 0) {
      return [];
    }

    const publishedEvaluations = await this.prisma.evaluation.findMany({
      where: {
        student_id: { in: scopedStudentIds },
        status: 'published',
      },
      select: {
        student_id: true,
        submitted_at: true,
      },
      orderBy: { submitted_at: 'desc' },
    });

    const submittedByAdmin = new Map<number, Date | null>();
    for (const evaluation of publishedEvaluations) {
      if (!submittedByAdmin.has(evaluation.student_id)) {
        submittedByAdmin.set(evaluation.student_id, evaluation.submitted_at);
      }
    }

    return scopedStudentIds.map((studentId) => {
      const submittedAt = submittedByAdmin.get(studentId) ?? null;
      return {
        student_id: studentId,
        submitted_by_admin: Boolean(submittedAt),
        submitted_at: submittedAt ? submittedAt.toISOString() : null,
      };
    });
  }

  private getMintLogoPath() {
    const logoCandidates = [
      resolve(process.cwd(), 'frontend', 'public', 'assets', 'images', 'mint_logo.png'),
      resolve(process.cwd(), '..', 'frontend', 'public', 'assets', 'images', 'mint_logo.png'),
    ];

    return logoCandidates.find((candidate) => existsSync(candidate)) || null;
  }

  private drawReportHeader(doc: any, title: string, subtitle?: string) {
    const logoPath = this.getMintLogoPath();
    const hasLogo = Boolean(logoPath);

    if (logoPath) {
      doc.image(logoPath, 50, 34, { width: 56 });
    }

    const textX = hasLogo ? 120 : 50;
    doc.fillColor('#0B1F42');
    doc.fontSize(20).text(title, textX, 42);
    if (subtitle) {
      doc.fillColor('#6B7280');
      doc.fontSize(9).text(subtitle, textX, 68);
    }

    doc.fillColor('#111827');
    doc.moveTo(50, 108).lineTo(545, 108).strokeColor('#D1D5DB').stroke();
    doc.y = 126;
  }

  private drawFullReportHeader(doc: any, title: string, subtitle?: string, generatedDate?: string) {
    const PAGE_W = 595.28;
    const MARGIN = 48;
    const NAVY = '#0B1F42';
    const BLUE = '#1A3D6B';
    const GREEN = '#078930';
    const YELLOW = '#FCDD09';
    const RED = '#DA121A';
    const GRAY1 = '#F3F4F6';
    const TEXT = '#111827';

    // Header band
    doc.rect(0, 0, PAGE_W, 110).fill(NAVY);

    // Ethiopian flag stripe
    const stripeH = 4;
    const stripeY = 110;
    doc.rect(0, stripeY, PAGE_W * 0.333, stripeH).fill(GREEN);
    doc.rect(PAGE_W * 0.333, stripeY, PAGE_W * 0.334, stripeH).fill(YELLOW);
    doc.rect(PAGE_W * 0.667, stripeY, PAGE_W * 0.333, stripeH).fill(RED);

    // Logo
    const logoPath = this.getMintLogoPath();
    if (logoPath) {
      doc.image(logoPath, MARGIN, 22, { width: 56, height: 56 });
    } else {
      doc.roundedRect(MARGIN, 22, 56, 56, 8).fill(BLUE);
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF').text('M', MARGIN + 18, 40, { lineBreak: false });
    }

    // Ministry name
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
      .text('Ministry of Innovation & Technology', MARGIN + 70, 26, { lineBreak: false });
    doc.font('Helvetica').fontSize(8.5).fillColor('rgba(255,255,255,0.65)')
      .text('Federal Democratic Republic of Ethiopia', MARGIN + 70, 42, { lineBreak: false });

    // Report title
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#FFFFFF')
      .text(title.toUpperCase(), MARGIN + 70, 62, { lineBreak: false });
    if (generatedDate) {
      doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.55)')
        .text(`Generated ${generatedDate}`, MARGIN + 70, 82, { lineBreak: false });
    }

    // thin separator
    doc.moveTo(MARGIN, 126).lineTo(PAGE_W - MARGIN, 126).strokeColor('#D1D5DB').lineWidth(0.5).stroke();
    doc.y = 138;
  }

  private drawFullReportFooter(doc: any, generatedDate?: string, pageNumber = 1) {
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 48;
    const NAVY = '#0B1F42';
    const currentY = doc.y;

    doc.rect(0, PAGE_H - 32, PAGE_W, 32).fill(NAVY);
    doc.font('Helvetica').fontSize(7.5).fillColor('#A8B7CD')
      .text('Ministry of Innovation & Technology · Internship Management System · Confidential', MARGIN, PAGE_H - 20, { lineBreak: false });
    if (generatedDate) {
      doc.font('Helvetica').fontSize(7.5).fillColor('#8FA3C2')
        .text(`Page ${pageNumber} · ${generatedDate}`, PAGE_W - MARGIN - 110, PAGE_H - 20, { lineBreak: false });
    }

    // Keep footer rendering from moving content flow and creating blank first pages.
    doc.y = currentY;
  }

  private drawAdminSectionTitle(doc: any, title: string) {
    const MARGIN = 48;
    const PAGE_W = 595.28;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#0B1F42').text(title.toUpperCase(), MARGIN, doc.y, {
      lineBreak: false,
      characterSpacing: 0.6,
    });
    doc.moveTo(MARGIN, doc.y + 13).lineTo(PAGE_W - MARGIN, doc.y + 13).strokeColor('#D1D5DB').lineWidth(0.6).stroke();
    doc.y += 16;
  }

  private drawAdminSummaryCards(
    doc: any,
    cards: Array<{ label: string; value: string; tone?: 'blue' | 'green' | 'amber' | 'red' }> ,
    options?: { columns?: number },
  ) {
    const MARGIN = 48;
    const PAGE_W = 595.28;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const gap = 8;
    const columns = Math.min(4, Math.max(1, options?.columns || cards.length));
    const cardW = (CONTENT_W - gap * (columns - 1)) / columns;
    const cardH = 52;

    const toneColor: Record<string, string> = {
      blue: '#1A3D6B',
      green: '#078930',
      amber: '#B7791F',
      red: '#DA121A',
    };

    let y = doc.y;
    for (let rowStart = 0; rowStart < cards.length; rowStart += columns) {
      const rowCards = cards.slice(rowStart, rowStart + columns);
      const rowWidth = rowCards.length * cardW + (rowCards.length - 1) * gap;
      const rowStartX = MARGIN + (CONTENT_W - rowWidth) / 2;

      rowCards.forEach((card, index) => {
        const x = rowStartX + index * (cardW + gap);
        const color = toneColor[card.tone || 'blue'];

        doc.roundedRect(x, y, cardW, cardH, 6).fill('#F8FAFC');
        doc.roundedRect(x, y, cardW, 3, 2).fill(color);
        doc.font('Helvetica').fontSize(7.5).fillColor('#64748B').text(card.label, x + 8, y + 8, {
          width: cardW - 16,
          align: 'center',
          lineBreak: false,
        });
        doc.font('Helvetica-Bold').fontSize(18).fillColor(color).text(card.value, x + 8, y + 22, {
          width: cardW - 16,
          align: 'center',
          lineBreak: false,
        });
      });

      y += cardH + 8;
    }

    doc.y = y + 2;
  }

  private truncateTableText(value: string, maxChars: number) {
    if (value.length <= maxChars) {
      return value;
    }

    if (maxChars <= 3) {
      return value.slice(0, maxChars);
    }

    return `${value.slice(0, maxChars - 3)}...`;
  }

  private drawAdminTable(
    doc: any,
    options: {
      columns: Array<{ key: string; label: string; width: number; align?: 'left' | 'right' | 'center' }>;
      rows: Array<Record<string, string | number>>;
      rowHeight?: number;
      pageBottom: number;
      onPageBreak: () => void;
    },
  ) {
    const MARGIN = 48;
    const drawTableHeader = () => {
      const headerY = doc.y;
      doc.roundedRect(MARGIN, headerY, options.columns.reduce((sum, col) => sum + col.width, 0), 16, 3).fill('#0B1F42');
      let x = MARGIN;
      options.columns.forEach((column) => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF').text(column.label, x + 6, headerY + 5, {
          width: column.width - 12,
          align: column.align || 'left',
          lineBreak: false,
        });
        x += column.width;
      });
      doc.y = headerY + 16;
    };

    const rowHeight = options.rowHeight || 20;
    drawTableHeader();

    options.rows.forEach((row, rowIndex) => {
      if (doc.y + rowHeight > options.pageBottom) {
        options.onPageBreak();
        drawTableHeader();
      }

      const y = doc.y;
      const rowWidth = options.columns.reduce((sum, col) => sum + col.width, 0);
      if (rowIndex % 2 === 1) {
        doc.rect(MARGIN, y, rowWidth, rowHeight).fill('#F8FAFC');
      }

      let x = MARGIN;
      options.columns.forEach((column) => {
        const cellValue = row[column.key] ?? '—';
        const textValue = String(cellValue);
        const maxChars = Math.max(4, Math.floor((column.width - 12) / 5));
        const rendered = this.truncateTableText(textValue, maxChars);

        doc.font('Helvetica').fontSize(8.4).fillColor('#1F2937').text(rendered, x + 6, y + 6, {
          width: column.width - 12,
          align: column.align || 'left',
          lineBreak: false,
        });
        x += column.width;
      });

      doc.y = y + rowHeight;
    });

    doc.y += 8;
  }

  // ─── Public System Statistics ─────────────────────────────────────────────

  async getSystemStatistics() {
    const [universities, students, users, supervisors, activeInternships, completedInternships, totalApplications] =
      await Promise.all([
        this.prisma.university.count({ where: { approval_status: 'approved' } }),
        this.prisma.student.count({ where: { status: 'active' } }),
        this.prisma.user.count(),
        this.prisma.supervisor.count(),
        this.prisma.internship.count({ where: { status: 'active' } }),
        this.prisma.internship.count({ where: { status: 'completed' } }),
        this.prisma.application.count(),
      ]);

    return {
      universities,
      students,
      users,
      supervisors,
      activeInternships,
      completedInternships,
      totalApplications,
    };
  }

  // ─── Application Status Report ────────────────────────────────────────────

  async getApplicationStatusData() {
    const applications = await this.prisma.application.findMany({
      include: {
        university: true,
        application_students: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { submission_date: 'desc' },
    });

    return applications.map((app) => ({
      application_id: app.application_id,
      university: app.university.name,
      submission_date: app.submission_date.toISOString().split('T')[0],
      status: app.status,
      students_count: app.application_students.length,
      reviewed_by: app.reviewed_by || 'N/A',
      reviewed_at: app.reviewed_at ? app.reviewed_at.toISOString().split('T')[0] : 'N/A',
      remarks: app.remarks || 'N/A',
    }));
  }

  async generateApplicationStatusPDF(): Promise<Buffer> {
    const data = await this.getApplicationStatusData();
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const reportTitle = 'Application Status Report';
    const reportSubtitle = 'Detailed breakdown of application status by university';
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    let pageNumber = 1;
    const pageBottom = 792;
    this.drawFullReportHeader(doc, reportTitle, reportSubtitle, generatedDate);
    this.drawFullReportFooter(doc, generatedDate, pageNumber);

    // Summary Statistics
    const stats = {
      total: data.length,
      pending: data.filter((d) => d.status === 'pending').length,
      approved: data.filter((d) => d.status === 'approved').length,
      rejected: data.filter((d) => d.status === 'rejected').length,
      on_hold: data.filter((d) => d.status === 'on_hold').length,
    };

    this.drawAdminSectionTitle(doc, 'Summary');
    this.drawAdminSummaryCards(doc, [
      { label: 'Total Applications', value: String(stats.total), tone: 'blue' },
      { label: 'Pending', value: String(stats.pending), tone: 'amber' },
      { label: 'Approved', value: String(stats.approved), tone: 'green' },
      { label: 'Rejected', value: String(stats.rejected), tone: 'red' },
      { label: 'On Hold', value: String(stats.on_hold), tone: 'amber' },
    ], { columns: 4 });

    // Applications Table
    this.drawAdminSectionTitle(doc, 'Application Details');

    const statusLabel = (status: string) => status.replace('_', ' ').toUpperCase();
    const rows = data.map((app) => ({
      id: app.application_id,
      university: app.university,
      submitted: app.submission_date,
      status: statusLabel(app.status),
      students: app.students_count,
      reviewed: app.reviewed_at,
    }));

    this.drawAdminTable(doc, {
      columns: [
        { key: 'id', label: 'ID', width: 42, align: 'right' },
        { key: 'university', label: 'University', width: 180 },
        { key: 'submitted', label: 'Submitted', width: 80 },
        { key: 'status', label: 'Status', width: 88, align: 'center' },
        { key: 'students', label: 'Students', width: 58, align: 'right' },
        { key: 'reviewed', label: 'Reviewed', width: 99 },
      ],
      rows,
      rowHeight: 20,
      pageBottom,
      onPageBreak: () => {
        doc.addPage({ margin: 0, size: 'A4' });
        pageNumber += 1;
        this.drawFullReportHeader(doc, `${reportTitle} (Continued)`, reportSubtitle, generatedDate);
        this.drawFullReportFooter(doc, generatedDate, pageNumber);
        this.drawAdminSectionTitle(doc, 'Application Details');
      },
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  // ─── Cohort Grade Report ──────────────────────────────────────────────────

  async getCohortGradeData() {
    const evaluations = await this.prisma.evaluation.findMany({
      where: { status: 'published' },
      include: {
        student: {
          include: {
            university: true,
          },
        },
        supervisor: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { submitted_at: 'desc' },
    });

    return evaluations.map((evaluation) => ({
      student_name: evaluation.student.full_name,
      registration_number: evaluation.student.registration_number,
      university: evaluation.student.university.name,
      department: evaluation.student.department,
      supervisor: evaluation.supervisor.user.full_name,
      total_score: evaluation.total_score,
      grade: evaluation.grade,
      general_performance_total: evaluation.general_performance_total || 0,
      personal_skills_total: evaluation.personal_skills_total || 0,
      professional_skills_total: evaluation.professional_skills_total || 0,
      attendance_percentage: evaluation.attendance_percentage || 0,
      total_absent_days: evaluation.total_absent_days || 0,
      submitted_at: evaluation.submitted_at?.toISOString().split('T')[0] || 'N/A',
    }));
  }

  async generateCohortGradePDF(): Promise<Buffer> {
    const data = await this.getCohortGradeData();
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const reportTitle = 'Cohort Grade Report';
    const reportSubtitle = 'Consolidated grades with student and supervisor names';
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    let pageNumber = 1;
    const pageBottom = 792;
    this.drawFullReportHeader(doc, reportTitle, reportSubtitle, generatedDate);
    this.drawFullReportFooter(doc, generatedDate, pageNumber);

    // Summary
    const avgScore = data.reduce((sum, d) => sum + d.total_score, 0) / data.length || 0;
    const gradeBuckets = data.reduce((acc, row) => {
      const key = row.grade || 'N/A';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topGradeLabel = Object.entries(gradeBuckets).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    this.drawAdminSectionTitle(doc, 'Summary');
    this.drawAdminSummaryCards(doc, [
      { label: 'Students Evaluated', value: String(data.length), tone: 'blue' },
      { label: 'Average Score', value: avgScore.toFixed(1), tone: 'green' },
      { label: 'Most Common Grade', value: topGradeLabel, tone: 'amber' },
    ], { columns: 4 });

    // Grades Table
    this.drawAdminSectionTitle(doc, 'Student Grades');

    const rows = data.map((student) => ({
      student: student.student_name,
      regNo: student.registration_number,
      score: Number(student.total_score).toFixed(1),
      grade: student.grade,
      attendance: `${Number(student.attendance_percentage).toFixed(1)}%`,
      supervisor: student.supervisor,
    }));

    this.drawAdminTable(doc, {
      columns: [
        { key: 'student', label: 'Student', width: 132 },
        { key: 'regNo', label: 'Reg. No.', width: 92 },
        { key: 'score', label: 'Score', width: 56, align: 'right' },
        { key: 'grade', label: 'Grade', width: 56, align: 'center' },
        { key: 'attendance', label: 'Attendance', width: 74, align: 'right' },
        { key: 'supervisor', label: 'Supervisor', width: 135 },
      ],
      rows,
      rowHeight: 20,
      pageBottom,
      onPageBreak: () => {
        doc.addPage({ margin: 0, size: 'A4' });
        pageNumber += 1;
        this.drawFullReportHeader(doc, `${reportTitle} (Continued)`, reportSubtitle, generatedDate);
        this.drawFullReportFooter(doc, generatedDate, pageNumber);
        this.drawAdminSectionTitle(doc, 'Student Grades');
      },
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async generateCohortGradeCSV(): Promise<string> {
    const data = await this.getCohortGradeData();
    const parser = new Parser({
      fields: [
        'student_name',
        'registration_number',
        'university',
        'department',
        'supervisor',
        'score',
        'grade',
        'attendance_rating',
        'technical_rating',
        'teamwork_rating',
        'communication_rating',
        'initiative_rating',
        'submitted_at',
      ],
    });
    return parser.parse(data);
  }

  // ─── Supervisor Assignment Report ─────────────────────────────────────────

  async getSupervisorAssignmentData() {
    const supervisors = await this.prisma.supervisor.findMany({
      include: {
        user: true,
        assignments: {
          include: {
            internship: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    return supervisors.map((sup) => ({
      supervisor_name: sup.user.full_name,
      department: sup.department,
      position: sup.position,
      max_students: sup.max_students,
      current_students: sup.assignments.filter((a) => a.status === 'active').length,
      total_assignments: sup.assignments.length,
      workload_percentage: ((sup.assignments.filter((a) => a.status === 'active').length / sup.max_students) * 100).toFixed(1),
      students: sup.assignments
        .filter((a) => a.status === 'active')
        .map((a) => a.internship.student.full_name)
        .join(', '),
    }));
  }

  async generateSupervisorAssignmentPDF(): Promise<Buffer> {
    const data = await this.getSupervisorAssignmentData();
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const reportTitle = 'Supervisor Assignment Report';
    const reportSubtitle = 'Supervisor workload and assigned student names';
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    let pageNumber = 1;
    const pageBottom = 792;
    this.drawFullReportHeader(doc, reportTitle, reportSubtitle, generatedDate);
    this.drawFullReportFooter(doc, generatedDate, pageNumber);

    // Summary
    const totalSupervisors = data.length;
    const totalAssignments = data.reduce((sum, d) => sum + d.current_students, 0);
    const avgWorkload = data.reduce((sum, d) => sum + parseFloat(d.workload_percentage), 0) / totalSupervisors || 0;

    this.drawAdminSectionTitle(doc, 'Summary');
    this.drawAdminSummaryCards(doc, [
      { label: 'Supervisors', value: String(totalSupervisors), tone: 'blue' },
      { label: 'Active Assignments', value: String(totalAssignments), tone: 'green' },
      { label: 'Average Workload', value: `${avgWorkload.toFixed(1)}%`, tone: 'amber' },
    ], { columns: 4 });

    // Supervisor Details
    this.drawAdminSectionTitle(doc, 'Supervisor Details');

    const rows = data.map((sup) => ({
      supervisor: sup.supervisor_name,
      position: sup.position || 'N/A',
      department: sup.department || 'N/A',
      workload: `${sup.current_students}/${sup.max_students}`,
      utilization: `${sup.workload_percentage}%`,
      assigned: sup.students || 'None',
    }));

    this.drawAdminTable(doc, {
      columns: [
        { key: 'supervisor', label: 'Supervisor', width: 104 },
        { key: 'position', label: 'Position', width: 76 },
        { key: 'department', label: 'Department', width: 108 },
        { key: 'workload', label: 'Load', width: 54, align: 'center' },
        { key: 'utilization', label: 'Utilization', width: 64, align: 'right' },
        { key: 'assigned', label: 'Assigned Students', width: 141 },
      ],
      rows,
      rowHeight: 20,
      pageBottom,
      onPageBreak: () => {
        doc.addPage({ margin: 0, size: 'A4' });
        pageNumber += 1;
        this.drawFullReportHeader(doc, `${reportTitle} (Continued)`, reportSubtitle, generatedDate);
        this.drawFullReportFooter(doc, generatedDate, pageNumber);
        this.drawAdminSectionTitle(doc, 'Supervisor Details');
      },
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  // ─── Student Evaluation Report ───────────────────────────────────────────

  async getStudentEvaluationData(studentId: number, publishedOnly = false) {
    const student = await this.prisma.student.findUnique({
      where: { student_id: studentId },
      include: {
        university: true,
        internships: {
          orderBy: { created_at: 'desc' },
          include: {
            assignment: {
              include: {
                supervisor: {
                  include: {
                    user: true,
                  },
                },
              },
            },
            attendance: true,
            milestones: {
              orderBy: { due_date: 'asc' },
              include: {
                submissions: {
                  orderBy: { submitted_at: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return null;
    }

    const evaluation = await this.prisma.evaluation.findFirst({
      where: {
        student_id: studentId,
        ...(publishedOnly ? { status: 'published' } : {}),
      },
      orderBy: { submitted_at: 'desc' },
      include: {
        supervisor: {
          include: {
            user: true,
          },
        },
      },
    });

    const internship = evaluation
      ? student.internships.find((item) => item.internship_id === evaluation.internship_id) || student.internships[0] || null
      : student.internships[0] || null;
    const attendance = internship?.attendance || null;
    const milestones = internship?.milestones || [];
    const markerUser = attendance?.marked_by
      ? await this.prisma.user.findUnique({
          where: { user_id: attendance.marked_by },
          select: { full_name: true },
        })
      : null;

    return {
      student,
      internship,
      attendance,
      milestones,
      evaluation,
      attendanceMarkedByName: markerUser?.full_name || null,
    };
  }

  async generateStudentEvaluationPDF(studentId: number, publishedOnly = false): Promise<Buffer> {
    const data = await this.getStudentEvaluationData(studentId, publishedOnly);

    if (!data || !data.evaluation) {
      throw new Error(publishedOnly
        ? 'Report not submitted by evaluator yet.'
        : `No evaluation found for student ${studentId}`);
    }

    const { student, internship, attendance, milestones, evaluation } = data;
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const MARGIN = 48;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    // ── Colour palette ──────────────────────────────────────────────────────
    const NAVY   = '#0B1F42';
    const BLUE   = '#1A3D6B';
    const GREEN  = '#078930';
    const YELLOW = '#FCDD09';
    const RED    = '#DA121A';
    const GRAY1  = '#F3F4F6';
    const GRAY2  = '#E5E7EB';
    const GRAY3  = '#9CA3AF';
    const TEXT   = '#111827';
    const MUTED  = '#6B7280';

    // ── Helpers ─────────────────────────────────────────────────────────────
    const scoreColor = (score: number) => {
      if (score >= 85) return GREEN;
      if (score >= 70) return BLUE;
      if (score >= 50) return '#D97706';
      return RED;
    };

    const gradeColor = (grade: string) => {
      if (['A+', 'A'].includes(grade)) return GREEN;
      if (['B+', 'B'].includes(grade)) return BLUE;
      if (['C+', 'C'].includes(grade)) return '#D97706';
      return RED;
    };

    const drawRect = (x: number, y: number, w: number, h: number, fill: string, radius = 0) => {
      doc.roundedRect(x, y, w, h, radius).fill(fill);
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number, color = GRAY2, width = 0.5) => {
      doc.moveTo(x1, y1).lineTo(x2, y2).strokeColor(color).lineWidth(width).stroke();
    };

    const label = (text: string, x: number, y: number, color = MUTED, size = 7.5) => {
      doc.font('Helvetica').fontSize(size).fillColor(color).text(text, x, y, { lineBreak: false });
    };

    const value = (text: string, x: number, y: number, color = TEXT, size = 9.5, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor(color).text(text, x, y, { lineBreak: false });
    };

    const sectionTitle = (text: string, y: number) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY).text(text.toUpperCase(), MARGIN, y, { lineBreak: false, characterSpacing: 0.8 });
      drawLine(MARGIN, y + 14, PAGE_W - MARGIN, y + 14, NAVY, 0.8);
      return y + 22;
    };

    // ── Computed values ──────────────────────────────────────────────────────
    const sumFields = (fields: Array<number | null | undefined>) =>
      fields.reduce<number>((s, v) => s + (typeof v === 'number' ? v : 0), 0);

    const generalTotal = evaluation.general_performance_total ??
      sumFields([evaluation.punctuality_score, evaluation.reliability_score, evaluation.independence_score, evaluation.communication_score, evaluation.professionalism_score]);
    const personalTotal = evaluation.personal_skills_total ??
      sumFields([evaluation.speed_of_work_score, evaluation.accuracy_score, evaluation.engagement_score, evaluation.need_for_work_score, evaluation.cooperation_score]);
    const professionalTotal = evaluation.professional_skills_total ??
      sumFields([evaluation.technical_skills_score, evaluation.organizational_skills_score, evaluation.project_support_score, evaluation.responsibility_score, evaluation.team_quality_score]);

    const totalScore = evaluation.total_score ?? 0;
    const grade = evaluation.grade ?? 'N/A';
    const supervisorName = evaluation.supervisor?.user?.full_name ?? 'N/A';
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    // ════════════════════════════════════════════════════════════════════════
    // PAGE 1
    // ════════════════════════════════════════════════════════════════════════

    // ── Header band ─────────────────────────────────────────────────────────
    drawRect(0, 0, PAGE_W, 110, NAVY);

    // Ethiopian flag stripe
    const stripeH = 4;
    const stripeY = 110;
    drawRect(0, stripeY, PAGE_W * 0.333, stripeH, GREEN);
    drawRect(PAGE_W * 0.333, stripeY, PAGE_W * 0.334, stripeH, YELLOW);
    drawRect(PAGE_W * 0.667, stripeY, PAGE_W * 0.333, stripeH, RED);

    // Logo
    const logoPath = this.getMintLogoPath();
    if (logoPath) {
      doc.image(logoPath, MARGIN, 22, { width: 56, height: 56 });
    } else {
      // Fallback: text logo box
      drawRect(MARGIN, 22, 56, 56, BLUE, 8);
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#FFFFFF').text('M', MARGIN + 18, 40, { lineBreak: false });
    }

    // Ministry name
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
      .text('Ministry of Innovation & Technology', MARGIN + 70, 26, { lineBreak: false });
    doc.font('Helvetica').fontSize(8.5).fillColor('rgba(255,255,255,0.65)')
      .text('Federal Democratic Republic of Ethiopia', MARGIN + 70, 42, { lineBreak: false });

    // Report title
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#FFFFFF')
      .text('INTERNSHIP EVALUATION REPORT', MARGIN + 70, 62, { lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.55)')
      .text(`Generated ${generatedDate}`, MARGIN + 70, 82, { lineBreak: false });

    // Grade badge (top-right)
    const badgeX = PAGE_W - MARGIN - 72;
    drawRect(badgeX, 18, 72, 72, BLUE, 10);
    doc.font('Helvetica-Bold').fontSize(28).fillColor(YELLOW)
      .text(grade, badgeX, 30, { width: 72, align: 'center', lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.7)')
      .text('GRADE', badgeX, 62, { width: 72, align: 'center', lineBreak: false });

    let y = 130;

    // ── Student info card ────────────────────────────────────────────────────
    drawRect(MARGIN, y, CONTENT_W, 80, GRAY1, 6);
    drawRect(MARGIN, y, 4, 80, NAVY, 0);

    const col1 = MARGIN + 16;
    const col2 = MARGIN + CONTENT_W * 0.38;
    const col3 = MARGIN + CONTENT_W * 0.68;

    label('STUDENT NAME', col1, y + 10);
    value(student.full_name, col1, y + 22, TEXT, 11, true);

    label('REGISTRATION NO.', col2, y + 10);
    value(student.registration_number ?? '—', col2, y + 22, TEXT, 10);

    label('UNIVERSITY', col1, y + 46);
    value(student.university.name, col1, y + 58, TEXT, 9);

    label('DEPARTMENT', col2, y + 46);
    value(student.department ?? '—', col2, y + 58, TEXT, 9);

    label('SUPERVISOR', col3, y + 10);
    value(supervisorName, col3, y + 22, TEXT, 9);

    label('INTERNSHIP STATUS', col3, y + 46);
    value((internship?.status ?? 'N/A').replace(/_/g, ' ').toUpperCase(), col3, y + 58, BLUE, 9, true);

    y += 96;

    // ── Score summary row ────────────────────────────────────────────────────
    const scoreBoxW = (CONTENT_W - 12) / 4;
    const scoreBoxes = [
      { label: 'TOTAL SCORE', value: `${totalScore}`, sub: '/ 100', color: scoreColor(totalScore) },
      { label: 'GENERAL PERFORMANCE', value: `${Number(generalTotal).toFixed(1)}`, sub: '/ 25', color: scoreColor((generalTotal / 25) * 100) },
      { label: 'PERSONAL SKILLS', value: `${Number(personalTotal).toFixed(1)}`, sub: '/ 25', color: scoreColor((personalTotal / 25) * 100) },
      { label: 'PROFESSIONAL SKILLS', value: `${Number(professionalTotal).toFixed(1)}`, sub: '/ 50', color: scoreColor((professionalTotal / 50) * 100) },
    ];

    scoreBoxes.forEach((box, i) => {
      const bx = MARGIN + i * (scoreBoxW + 4);
      drawRect(bx, y, scoreBoxW, 64, GRAY1, 6);
      // Coloured top bar
      drawRect(bx, y, scoreBoxW, 3, box.color, 0);
      label(box.label, bx + 8, y + 10, MUTED, 6.5);
      doc.font('Helvetica-Bold').fontSize(22).fillColor(box.color)
        .text(box.value, bx, y + 22, { width: scoreBoxW, align: 'center', lineBreak: false });
      doc.font('Helvetica').fontSize(8).fillColor(GRAY3)
        .text(box.sub, bx, y + 48, { width: scoreBoxW, align: 'center', lineBreak: false });
    });

    y += 80;

    // ── Detailed scores section ──────────────────────────────────────────────
    y = sectionTitle('Performance Breakdown', y);

    const scoreRow = (rowLabel: string, score: number | null | undefined, maxScore: number, rowY: number, isAlt: boolean) => {
      if (isAlt) drawRect(MARGIN, rowY, CONTENT_W, 18, GRAY1, 0);
      const s = score ?? 0;
      const pct = Math.min(100, (s / maxScore) * 100);
      label(rowLabel, MARGIN + 8, rowY + 5, TEXT, 8.5);
      // Bar background
      const barX = MARGIN + CONTENT_W * 0.52;
      const barW = CONTENT_W * 0.32;
      drawRect(barX, rowY + 6, barW, 6, GRAY2, 3);
      drawRect(barX, rowY + 6, barW * (pct / 100), 6, scoreColor((s / maxScore) * 100), 3);
      // Score text
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(scoreColor((s / maxScore) * 100))
        .text(`${s.toFixed(1)} / ${maxScore}`, MARGIN + CONTENT_W * 0.86, rowY + 5, { lineBreak: false });
    };

    const scoreGroups = [
      {
        title: 'General Performance (25%)',
        rows: [
          { label: 'Punctuality & Time Management', score: evaluation.punctuality_score, max: 5 },
          { label: 'Reliability & Dependability', score: evaluation.reliability_score, max: 5 },
          { label: 'Independence & Initiative', score: evaluation.independence_score, max: 5 },
          { label: 'Communication Skills', score: evaluation.communication_score, max: 5 },
          { label: 'Professionalism & Conduct', score: evaluation.professionalism_score, max: 5 },
        ],
        total: generalTotal, maxTotal: 25,
      },
      {
        title: 'Personal Skills (25%)',
        rows: [
          { label: 'Speed & Efficiency of Work', score: evaluation.speed_of_work_score, max: 5 },
          { label: 'Accuracy & Quality of Work', score: evaluation.accuracy_score, max: 5 },
          { label: 'Engagement & Motivation', score: evaluation.engagement_score, max: 5 },
          { label: 'Work Ethic & Dedication', score: evaluation.need_for_work_score, max: 5 },
          { label: 'Cooperation & Teamwork', score: evaluation.cooperation_score, max: 5 },
        ],
        total: personalTotal, maxTotal: 25,
      },
      {
        title: 'Professional Skills (50%)',
        rows: [
          { label: 'Technical Skills & Knowledge', score: evaluation.technical_skills_score, max: 10 },
          { label: 'Organisational Skills', score: evaluation.organizational_skills_score, max: 10 },
          { label: 'Project Support & Contribution', score: evaluation.project_support_score, max: 10 },
          { label: 'Responsibility & Accountability', score: evaluation.responsibility_score, max: 10 },
          { label: 'Team Quality & Collaboration', score: evaluation.team_quality_score, max: 10 },
        ],
        total: professionalTotal, maxTotal: 50,
      },
    ];

    for (const group of scoreGroups) {
      // Group header
      drawRect(MARGIN, y, CONTENT_W, 16, NAVY, 0);
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#FFFFFF')
        .text(group.title, MARGIN + 8, y + 4, { lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(8).fillColor(YELLOW)
        .text(`Total: ${Number(group.total).toFixed(1)} / ${group.maxTotal}`, MARGIN + CONTENT_W - 90, y + 4, { lineBreak: false });
      y += 16;

      group.rows.forEach((row, i) => {
        scoreRow(row.label, row.score, row.max, y, i % 2 === 1);
        y += 18;
      });
      y += 6;
    }

    // ── Attendance ───────────────────────────────────────────────────────────
    y = sectionTitle('Attendance Record', y + 4);

    const attPct = evaluation.attendance_percentage ?? attendance?.percentage ?? 0;
    const absentDays = evaluation.total_absent_days ?? attendance?.total_absent_days ?? 0;

    drawRect(MARGIN, y, CONTENT_W, 44, GRAY1, 6);
    // Attendance bar
    const attBarX = MARGIN + 16;
    const attBarW = CONTENT_W * 0.55;
    label('ATTENDANCE RATE', attBarX, y + 8, MUTED, 7);
    drawRect(attBarX, y + 20, attBarW, 10, GRAY2, 5);
    drawRect(attBarX, y + 20, attBarW * (attPct / 100), 10, attPct >= 80 ? GREEN : attPct >= 60 ? '#D97706' : RED, 5);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(attPct >= 80 ? GREEN : RED)
      .text(`${attPct.toFixed(1)}%`, attBarX + attBarW + 10, y + 18, { lineBreak: false });

    label('DAYS ABSENT', MARGIN + CONTENT_W * 0.75, y + 8, MUTED, 7);
    doc.font('Helvetica-Bold').fontSize(18).fillColor(absentDays === 0 ? GREEN : RED)
      .text(String(absentDays), MARGIN + CONTENT_W * 0.75, y + 18, { lineBreak: false });
    doc.font('Helvetica').fontSize(8).fillColor(MUTED)
      .text('days absent', MARGIN + CONTENT_W * 0.75 + 28, y + 24, { lineBreak: false });

    y += 58;

    // ── Milestones ───────────────────────────────────────────────────────────
    if (milestones.length > 0) {
      // Check if we need a new page
      if (y + milestones.length * 20 + 60 > PAGE_H - 60) {
        doc.addPage({ margin: 0, size: 'A4' });
        // Repeat thin header on continuation pages
        drawRect(0, 0, PAGE_W, 28, NAVY);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
          .text('INTERNSHIP EVALUATION REPORT — continued', MARGIN, 9, { lineBreak: false });
        doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.5)')
          .text(student.full_name, PAGE_W - MARGIN - 150, 9, { lineBreak: false });
        y = 44;
      }

      y = sectionTitle('Milestone Progress', y);

      const msColW = [24, CONTENT_W * 0.42, CONTENT_W * 0.18, CONTENT_W * 0.18, CONTENT_W * 0.14];
      // Header row
      drawRect(MARGIN, y, CONTENT_W, 16, NAVY, 0);
      const msHeaders = ['#', 'Title', 'Due Date', 'Status', 'Submission'];
      let cx = MARGIN + 6;
      msHeaders.forEach((h, i) => {
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF').text(h, cx, y + 4, { lineBreak: false });
        cx += msColW[i];
      });
      y += 16;

      milestones.forEach((ms, i) => {
        if (y + 20 > PAGE_H - 60) {
          doc.addPage({ margin: 0, size: 'A4' });
          drawRect(0, 0, PAGE_W, 28, NAVY);
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
            .text('INTERNSHIP EVALUATION REPORT — continued', MARGIN, 9, { lineBreak: false });
          y = 44;
        }
        if (i % 2 === 1) drawRect(MARGIN, y, CONTENT_W, 18, GRAY1, 0);
        const lastSub = ms.submissions[0];
        const statusColor = ms.status === 'completed' ? GREEN : ms.status === 'open' ? BLUE : MUTED;
        cx = MARGIN + 6;
        doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(String(i + 1), cx, y + 5, { lineBreak: false }); cx += msColW[0];
        doc.font('Helvetica').fontSize(8).fillColor(TEXT).text(ms.title, cx, y + 5, { width: msColW[1] - 6, lineBreak: false }); cx += msColW[1];
        doc.font('Helvetica').fontSize(8).fillColor(MUTED).text(ms.due_date ? ms.due_date.toISOString().split('T')[0] : '—', cx, y + 5, { lineBreak: false }); cx += msColW[2];
        doc.font('Helvetica-Bold').fontSize(8).fillColor(statusColor).text(ms.status.toUpperCase(), cx, y + 5, { lineBreak: false }); cx += msColW[3];
        doc.font('Helvetica').fontSize(8).fillColor(lastSub ? GREEN : MUTED).text(lastSub ? lastSub.status : 'None', cx, y + 5, { lineBreak: false });
        y += 18;
      });
      y += 8;
    }

    // ── Evaluator Remarks ────────────────────────────────────────────────────
    if (y + 80 > PAGE_H - 60) {
      doc.addPage({ margin: 0, size: 'A4' });
      drawRect(0, 0, PAGE_W, 28, NAVY);
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF')
        .text('INTERNSHIP EVALUATION REPORT — continued', MARGIN, 9, { lineBreak: false });
      y = 44;
    }

    y = sectionTitle('Evaluator Remarks', y + 4);
    drawRect(MARGIN, y, CONTENT_W, 4, NAVY, 0);
    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT)
      .text(evaluation.remarks || 'No remarks provided.', MARGIN + 12, y + 12, { width: CONTENT_W - 24, lineBreak: true });
    y = doc.y + 16;

    // ── Signature block ──────────────────────────────────────────────────────
    if (y + 80 > PAGE_H - 40) {
      doc.addPage({ margin: 0, size: 'A4' });
      y = 48;
    }

    const sigY = Math.max(y + 20, PAGE_H - 130);
    drawLine(MARGIN, sigY, MARGIN + 160, sigY, NAVY, 0.8);
    drawLine(PAGE_W - MARGIN - 160, sigY, PAGE_W - MARGIN, sigY, NAVY, 0.8);
    label('Supervisor Signature', MARGIN, sigY + 6, MUTED, 8);
    value(supervisorName, MARGIN, sigY + 18, TEXT, 8.5);
    label('Authorised Signature', PAGE_W - MARGIN - 160, sigY + 6, MUTED, 8);
    value('Ministry of Innovation & Technology', PAGE_W - MARGIN - 160, sigY + 18, TEXT, 8.5);

    // ── Footer band ──────────────────────────────────────────────────────────
    drawRect(0, PAGE_H - 32, PAGE_W, 32, NAVY);
    doc.font('Helvetica').fontSize(7.5).fillColor('rgba(255,255,255,0.5)')
      .text('Ministry of Innovation & Technology · Internship Management System · Confidential', MARGIN, PAGE_H - 20, { lineBreak: false });
    doc.font('Helvetica').fontSize(7.5).fillColor('rgba(255,255,255,0.4)')
      .text(`Page 1 · ${generatedDate}`, PAGE_W - MARGIN - 100, PAGE_H - 20, { lineBreak: false });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  // ─── System Activity Report ───────────────────────────────────────────────

  async getSystemActivityData() {
    const [users, loginLogs, activityLogs] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          role: true,
        },
      }),
      this.prisma.loginLog.findMany({
        where: {
          login_time: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { login_time: 'desc' },
        take: 100,
      }),
      this.prisma.activityLog.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      }),
    ]);

    return {
      total_users: users.length,
      active_users: users.filter((u) => u.account_status === 'active').length,
      users_by_role: users.reduce((acc, u) => {
        acc[u.role.role_name] = (acc[u.role.role_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      total_logins_30d: loginLogs.length,
      successful_logins: loginLogs.filter((l) => l.status === 'success').length,
      failed_logins: loginLogs.filter((l) => l.status === 'failed').length,
      total_activities_30d: activityLogs.length,
      recent_activities: activityLogs.slice(0, 20).map((log) => ({
        user_id: log.user_id,
        action: log.action,
        entity_type: log.entity_type || 'N/A',
        timestamp: log.timestamp.toISOString(),
      })),
    };
  }

  async generateSystemActivityPDF(): Promise<Buffer> {
    const data = await this.getSystemActivityData();
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const reportTitle = 'System Activity Report';
    const reportSubtitle = 'Last 30 days of user, login, and audit activity';
    const generatedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    let pageNumber = 1;
    const pageBottom = 792;
    this.drawFullReportHeader(doc, reportTitle, reportSubtitle, generatedDate);
    this.drawFullReportFooter(doc, generatedDate, pageNumber);

    this.drawAdminSectionTitle(doc, 'Summary');
    this.drawAdminSummaryCards(doc, [
      { label: 'Total Users', value: String(data.total_users), tone: 'blue' },
      { label: 'Active Users', value: String(data.active_users), tone: 'green' },
      { label: 'Login Attempts (30d)', value: String(data.total_logins_30d), tone: 'amber' },
      { label: 'Audit Activities (30d)', value: String(data.total_activities_30d), tone: 'blue' },
    ], { columns: 4 });

    this.drawAdminSectionTitle(doc, 'Login Statistics');
    this.drawAdminSummaryCards(doc, [
      { label: 'Successful', value: String(data.successful_logins), tone: 'green' },
      { label: 'Failed', value: String(data.failed_logins), tone: 'red' },
    ], { columns: 4 });

    this.drawAdminSectionTitle(doc, 'Users by Role');
    this.drawAdminTable(doc, {
      columns: [
        { key: 'role', label: 'Role', width: 320 },
        { key: 'count', label: 'Users', width: 179, align: 'right' },
      ],
      rows: Object.entries(data.users_by_role).map(([role, count]) => ({ role, count })),
      rowHeight: 20,
      pageBottom,
      onPageBreak: () => {
        doc.addPage({ margin: 0, size: 'A4' });
        pageNumber += 1;
        this.drawFullReportHeader(doc, `${reportTitle} (Continued)`, reportSubtitle, generatedDate);
        this.drawFullReportFooter(doc, generatedDate, pageNumber);
        this.drawAdminSectionTitle(doc, 'Users by Role');
      },
    });

    this.drawAdminSectionTitle(doc, 'Recent Activities');
    this.drawAdminTable(doc, {
      columns: [
        { key: 'timestamp', label: 'Timestamp', width: 120 },
        { key: 'user', label: 'User', width: 58, align: 'right' },
        { key: 'action', label: 'Action', width: 190 },
        { key: 'entity', label: 'Entity', width: 131 },
      ],
      rows: data.recent_activities.map((activity) => ({
        timestamp: new Date(activity.timestamp).toISOString().replace('T', ' ').slice(0, 16),
        user: activity.user_id,
        action: activity.action,
        entity: activity.entity_type,
      })),
      rowHeight: 20,
      pageBottom,
      onPageBreak: () => {
        doc.addPage({ margin: 0, size: 'A4' });
        pageNumber += 1;
        this.drawFullReportHeader(doc, `${reportTitle} (Continued)`, reportSubtitle, generatedDate);
        this.drawFullReportFooter(doc, generatedDate, pageNumber);
        this.drawAdminSectionTitle(doc, 'Recent Activities');
      },
    });

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
