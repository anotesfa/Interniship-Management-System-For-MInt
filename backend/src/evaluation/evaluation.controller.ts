import {
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  Body,
  Param,
  BadRequestException,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EvaluationService } from './evaluation.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('evaluations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  /**
   * Supervisor: Save evaluation as draft
   * POST /evaluations/draft
   */
  @Post('draft')
  @Roles('Supervisor')
  async saveDraft(@Req() req: any, @Body() body: any) {
    const studentId = Number(body.student_id);

    if (!Number.isInteger(studentId)) {
      throw new BadRequestException('student_id is required');
    }

    const evaluation = await this.evaluationService.saveDraft(
      studentId,
      {
        score: body.score,
        grade: body.grade,
        remarks: body.remarks,
        punctuality_score: body.punctuality_score,
        reliability_score: body.reliability_score,
        independence_score: body.independence_score,
        communication_score: body.communication_score,
        professionalism_score: body.professionalism_score,
        speed_of_work_score: body.speed_of_work_score,
        accuracy_score: body.accuracy_score,
        engagement_score: body.engagement_score,
        need_for_work_score: body.need_for_work_score,
        cooperation_score: body.cooperation_score,
        technical_skills_score: body.technical_skills_score,
        organizational_skills_score: body.organizational_skills_score,
        project_support_score: body.project_support_score,
        responsibility_score: body.responsibility_score,
        team_quality_score: body.team_quality_score,
        attendance_percentage: body.attendance_percentage,
        total_absent_days: body.total_absent_days,
        attendance_rating: body.attendance_rating,
        technical_rating: body.technical_rating,
        teamwork_rating: body.teamwork_rating,
        communication_rating: body.communication_rating,
        initiative_rating: body.initiative_rating,
        weeks: body.weeks,
      },
    );

    return { status: 'success', data: evaluation };
  }

  /**
   * Admin: Get evaluations by status
   * GET /evaluations?status=submitted|published|returned|draft
   */
  @Get()
  @Roles('Admin')
  async getAll(@Query('status') status?: string) {
    const evaluations = await this.evaluationService.getAll(status);
    return { status: 'success', data: evaluations };
  }

  /**
   * Supervisor: Submit evaluation
   * POST /evaluations
   */
  @Post()
  @Roles('Supervisor')
  async submit(@Req() req: any, @Body() body: any) {
    const studentId = Number(body.student_id);

    if (!Number.isInteger(studentId)) {
      throw new BadRequestException('student_id is required');
    }

    const requiredFields = [
      'punctuality_score',
      'reliability_score',
      'independence_score',
      'communication_score',
      'professionalism_score',
      'speed_of_work_score',
      'accuracy_score',
      'engagement_score',
      'need_for_work_score',
      'cooperation_score',
      'technical_skills_score',
      'organizational_skills_score',
      'project_support_score',
      'responsibility_score',
      'team_quality_score',
    ];

    const effectiveRequired = Array.from(requiredFields);
    const missingFields = effectiveRequired.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missingFields.length > 0) {
      throw new BadRequestException('Please complete both evaluation and attendance before submitting');
    }

    const evaluation = await this.evaluationService.submit(studentId, {
      score: body.score,
      grade: body.grade,
      remarks: body.remarks || '',
      punctuality_score: body.punctuality_score,
      reliability_score: body.reliability_score,
      independence_score: body.independence_score,
      communication_score: body.communication_score,
      professionalism_score: body.professionalism_score,
      speed_of_work_score: body.speed_of_work_score,
      accuracy_score: body.accuracy_score,
      engagement_score: body.engagement_score,
      need_for_work_score: body.need_for_work_score,
      cooperation_score: body.cooperation_score,
      technical_skills_score: body.technical_skills_score,
      organizational_skills_score: body.organizational_skills_score,
      project_support_score: body.project_support_score,
      responsibility_score: body.responsibility_score,
      team_quality_score: body.team_quality_score,
      attendance_percentage: body.attendance_percentage,
      total_absent_days: body.total_absent_days,
      weeks: body.weeks,
      attendance_rating: body.attendance_rating,
      technical_rating: body.technical_rating,
      teamwork_rating: body.teamwork_rating,
      communication_rating: body.communication_rating,
      initiative_rating: body.initiative_rating,
    });


    return { status: 'success', data: evaluation };
  }

  /**
   * Supervisor: Get my evaluations
   * GET /evaluations/my
   */
  @Get('my')
  @Roles('Supervisor')
  async getMyEvaluations(@Req() req: any) {
    const evaluations = await this.evaluationService.getForSupervisor(
      req.user.userId,
    );
    return { status: 'success', data: evaluations };
  }

  /**
   * Supervisor: Get evaluation for specific student
   * GET /evaluations/student/:studentId
   */
  @Get('student/:studentId')
  @Roles('Supervisor', 'University Coordinator', 'Student')
  async getByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    const evaluation = await this.evaluationService.getByStudent(studentId);
    return { status: 'success', data: evaluation };
  }

  /**
   * Admin: Get pending evaluations (not yet published)
   * GET /evaluations/pending
   */
  @Get('pending')
  @Roles('Admin')
  async getPending() {
    const evaluations = await this.evaluationService.getPending();
    return { status: 'success', data: evaluations };
  }

  /**
   * Student/University: Get published evaluation
   * GET /evaluations/published/my
   */
  @Get('published/my')
  @Roles('Student', 'University Coordinator')
  async getMyPublished(@Req() req: any) {
    const evaluation = await this.evaluationService.getPublishedForUser(req.user.userId);
    return { status: 'success', data: evaluation };
  }

  /**
   * Student: Check if evaluation is published
   * GET /evaluations/published/status
   */
  @Get('published/status')
  @Roles('Student')
  async getPublishedStatus(@Req() req: any) {
    const isPublished = await this.evaluationService.hasPublishedEvaluationByUserId(req.user.userId);
    return { status: 'success', data: { isPublished } };
  }

  /**
   * Admin: Publish evaluation
   * POST /evaluations/:evaluationId/publish
   */
  @Post(':evaluationId/publish')
  @Roles('Admin')
  async publish(
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Req() req: any,
  ) {
    const evaluation = await this.evaluationService.publish(evaluationId, req.user.userId);
    return { status: 'success', data: evaluation };
  }

  /**
   * Admin: Return evaluation for correction
   * POST /evaluations/:evaluationId/return
   */
  @Post(':evaluationId/return')
  @Roles('Admin')
  async returnForCorrection(
    @Param('evaluationId', ParseIntPipe) evaluationId: number,
    @Body() body: any,
  ) {
    if (!body.reason) {
      throw new BadRequestException('reason is required');
    }

    const evaluation = await this.evaluationService.returnForCorrection(
      evaluationId,
      body.reason,
    );
    return { status: 'success', data: evaluation };
  }

  /**
   * University: Download grade report
   * GET /evaluations/student/:studentId/report
   */
  @Get('student/:studentId/report')
  @Roles('University Coordinator', 'Admin')
  async downloadGradeReport(
    @Param('studentId', ParseIntPipe) studentId: number,
  ) {
    const report = await this.evaluationService.downloadGradeReport(studentId);
    return { status: 'success', data: report };
  }

  /**
   * Admin: Get consolidated grade report
   * GET /evaluations/cohort/:cohort/report
   */
  @Get('cohort/:cohort/report')
  @Roles('Admin')
  async downloadConsolidatedReport(@Param('cohort') cohort: string) {
    const report = await this.evaluationService.downloadConsolidatedReport(cohort);
    return { status: 'success', data: report };
  }
}
