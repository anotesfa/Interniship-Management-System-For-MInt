import {
  Controller, Get, Post, Put, Body, Param,
  UseGuards, HttpStatus, Query, Request, BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MonthlyReportService } from './monthly-report.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudentGroupService } from '../student-group/student-group.service';

@Controller('monthly-reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MonthlyReportController {
  constructor(
    private readonly monthlyReportService: MonthlyReportService,
    private readonly prisma: PrismaService,
    private readonly studentGroupService: StudentGroupService,
  ) {}

  private async ensureTeamLeader(userId: number) {
    const group = await this.studentGroupService.getMyGroupSummary(userId);
    if (group.has_group && !group.is_team_leader) {
      throw new BadRequestException('Only the team leader can submit monthly reports');
    }
  }

  // Student: submit a report (resolves internship from JWT)
  @Post()
  @Roles('Student')
  async submit(@Body() body: any, @Request() req: any) {
    await this.ensureTeamLeader(req.user.userId);
    const report = await this.monthlyReportService.submitForUser(
      req.user.userId,
      Number(body.month),
      Number(body.year),
      body.summary,
    );
    return { success: true, statusCode: HttpStatus.CREATED, message: 'Report submitted', data: report, error: null };
  }

  // Student: get own reports
  @Get('my')
  @Roles('Student')
  async getMyReports(@Request() req: any) {
    await this.ensureTeamLeader(req.user.userId);
    const data = await this.monthlyReportService.getForStudent(req.user.userId);
    return { success: true, statusCode: HttpStatus.OK, message: 'Reports retrieved', data, error: null };
  }

  // Supervisor: get reports for all assigned students
  @Get('supervisor/my')
  @Roles('Supervisor')
  async getMySupervisorReports(@Request() req: any) {
    const data = await this.monthlyReportService.getForSupervisor(req.user.userId);
    return { success: true, statusCode: HttpStatus.OK, message: 'Reports retrieved', data, error: null };
  }

  // Admin/Coordinator: get all reports
  @Get()
  @Roles('Admin', 'University Coordinator')
  async getAll(@Query('limit') limit: string, @Query('offset') offset: string) {
    const result = await this.monthlyReportService.getAll(
      parseInt(limit) || 50,
      parseInt(offset) || 0,
    );
    return { success: true, statusCode: HttpStatus.OK, message: 'Reports retrieved', data: result.data, pagination: result.pagination, error: null };
  }

  // Get reports by student ID
  @Get('student/:studentId')
  @Roles('Student', 'Supervisor', 'Admin', 'University Coordinator')
  async getByStudent(
    @Param('studentId') studentId: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Request() req: any,
  ) {
    if (req.user.role === 'Student' && req.user.userId !== parseInt(studentId)) {
      return { success: false, statusCode: HttpStatus.FORBIDDEN, message: 'Access denied', data: null, error: 'You can only view your own reports' };
    }
    const result = await this.monthlyReportService.getByStudent(
      parseInt(studentId),
      parseInt(limit) || 50,
      parseInt(offset) || 0,
    );
    return { success: true, statusCode: HttpStatus.OK, message: 'Reports retrieved', data: result.data, pagination: result.pagination, error: null };
  }

  // Get reports by internship ID
  @Get('internship/:internshipId')
  @Roles('Student', 'Supervisor', 'Admin', 'University Coordinator')
  async getByInternship(
    @Param('internshipId') internshipId: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
  ) {
    const result = await this.monthlyReportService.getByInternship(
      parseInt(internshipId),
      parseInt(limit) || 50,
      parseInt(offset) || 0,
    );
    return { success: true, statusCode: HttpStatus.OK, message: 'Reports retrieved', data: result.data, pagination: result.pagination, error: null };
  }

  // Get single report
  @Get(':id')
  @Roles('Student', 'Supervisor', 'Admin', 'University Coordinator')
  async getById(@Param('id') id: string) {
    const report = await this.monthlyReportService.getById(parseInt(id));
    return { success: true, statusCode: HttpStatus.OK, message: 'Report retrieved', data: report, error: null };
  }

  // Student: update a submitted report
  @Put(':id')
  @Roles('Student')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    await this.ensureTeamLeader(req.user.userId);
    const report = await this.monthlyReportService.update(parseInt(id), body.summary);
    return { success: true, statusCode: HttpStatus.OK, message: 'Report updated', data: report, error: null };
  }

  // Supervisor: review a report (approve/return)
  @Put(':id/review')
  @Roles('Supervisor', 'Admin', 'University Coordinator')
  async reviewReport(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    // Update the report with status and feedback
    const updated = await this.prisma.monthlyReport.update({
      where: { report_id: parseInt(id) },
      data: {
        status: body.status,
        feedback: body.feedback || null,
        reviewed_by: req.user.userId,
      },
      include: {
        student: true,
        reviewer: true,
      },
    });
    
    const report = {
      report_id: updated.report_id,
      internship_id: updated.internship_id,
      student_id: String(updated.student_id),
      student_name: updated.student?.full_name ?? '',
      month: updated.month,
      year: updated.year,
      summary: updated.summary,
      submitted_at: updated.submitted_at?.toISOString?.() ?? updated.submitted_at,
      reviewed_by: updated.reviewed_by ? String(updated.reviewed_by) : null,
      reviewer_name: updated.reviewer?.full_name ?? null,
      status: updated.status,
      feedback: updated.feedback ?? null,
    };
    
    return { success: true, statusCode: HttpStatus.OK, message: 'Report reviewed', data: report, error: null };
  }

  // Supervisor: approve
  @Put(':id/approve')
  @Roles('Supervisor', 'Admin', 'University Coordinator')
  async approveReport(@Param('id') id: string, @Request() req: any) {
    const report = await this.monthlyReportService.approveReport(parseInt(id), req.user.userId);
    return { success: true, statusCode: HttpStatus.OK, message: 'Report approved', data: report, error: null };
  }

  // Supervisor: return for revision
  @Put(':id/reject')
  @Roles('Supervisor', 'Admin', 'University Coordinator')
  async rejectReport(@Param('id') id: string, @Request() req: any) {
    const report = await this.monthlyReportService.rejectReport(parseInt(id), req.user.userId);
    return { success: true, statusCode: HttpStatus.OK, message: 'Report returned', data: report, error: null };
  }
}
