import { Controller, Get, Res, UseGuards, HttpStatus, Param, ParseIntPipe, Req, Query } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // ─── Public: System Statistics (used on login page) ──────────────────────

  @Get('/statistics/system')
  async getSystemStatistics() {
    const data = await this.reportService.getSystemStatistics();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'System statistics retrieved',
      data,
      error: null,
    };
  }

  // ─── Application Status Report ────────────────────────────────────────────

  @Get('application-status/pdf')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin', 'University Coordinator')
  async getApplicationStatusPDF(@Res() res: Response) {
    try {
      const pdfBuffer = await this.reportService.generateApplicationStatusPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=application-status-report-${Date.now()}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate PDF report',
        error: error.message,
      });
    }
  }

  // ─── Cohort Grade Report ──────────────────────────────────────────────────

  @Get('cohort-grades/pdf')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin', 'University Coordinator')
  async getCohortGradePDF(@Res() res: Response) {
    try {
      const pdfBuffer = await this.reportService.generateCohortGradePDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=cohort-grades-report-${Date.now()}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate PDF report',
        error: error.message,
      });
    }
  }

  @Get('cohort-grades/csv')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin', 'University Coordinator')
  async getCohortGradeCSV(@Res() res: Response) {
    try {
      const csv = await this.reportService.generateCohortGradeCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=cohort-grades-report-${Date.now()}.csv`);
      res.send(csv);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate CSV report',
        error: error.message,
      });
    }
  }

  // ─── Supervisor Assignment Report ─────────────────────────────────────────

  @Get('supervisor-assignments/pdf')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin', 'University Coordinator')
  async getSupervisorAssignmentPDF(@Res() res: Response) {
    try {
      const pdfBuffer = await this.reportService.generateSupervisorAssignmentPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=supervisor-assignments-report-${Date.now()}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate PDF report',
        error: error.message,
      });
    }
  }

  // ─── Student Evaluation Report ───────────────────────────────────────────

  @Get('student-evaluation/submission-status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin', 'University Coordinator')
  async getStudentEvaluationSubmissionStatus(
    @Query('studentIds') studentIds: string,
    @Req() req: any,
  ) {
    const ids = (studentIds || '')
      .split(',')
      .map((value) => parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value > 0);

    const data = await this.reportService.getStudentEvaluationSubmissionStatus(ids, {
      userId: Number(req.user?.userId),
      role: String(req.user?.role || ''),
    });

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Student evaluation submission status retrieved successfully',
      data,
      error: null,
    };
  }

  @Get('student-evaluation/:studentId/pdf')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin', 'University Coordinator')
  async getStudentEvaluationPDF(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const publishedOnly = req.user?.role !== 'Admin';
      const pdfBuffer = await this.reportService.generateStudentEvaluationPDF(studentId, publishedOnly);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=student-evaluation-report-${studentId}-${Date.now()}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate PDF report',
        error: error.message,
      });
    }
  }

  // ─── System Activity Report ───────────────────────────────────────────────

  @Get('system-activity/pdf')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin')
  async getSystemActivityPDF(@Res() res: Response) {
    try {
      const pdfBuffer = await this.reportService.generateSystemActivityPDF();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=system-activity-report-${Date.now()}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate PDF report',
        error: error.message,
      });
    }
  }
}
