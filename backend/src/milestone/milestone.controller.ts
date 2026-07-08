import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MilestoneService } from './milestone.service';
import { StudentGroupService } from '../student-group/student-group.service';

@Controller('milestones')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MilestoneController {
  constructor(
    private readonly milestoneService: MilestoneService,
    private readonly studentGroupService: StudentGroupService,
  ) {}

  private async ensureTeamLeader(userId: number) {
    const group = await this.studentGroupService.getMyGroupSummary(userId);
    if (group.has_group && !group.is_team_leader) {
      throw new BadRequestException('Only the team leader can submit milestones');
    }
  }

  // Student: submit a new milestone (resolves internship from JWT)
  @Post()
  @Roles('Student')
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async submit(
    @Body() body: any,
    @Request() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    await this.ensureTeamLeader(req.user.userId);
    const milestone = await this.milestoneService.submitForUser(
      req.user.userId,
      {
        title: body.title,
        description: body.description,
        dueDate: body.dueDate,
      },
      file,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Milestone submitted successfully',
      data: milestone,
      error: null,
    };
  }

  // Student: get own milestones
  @Get('my')
  @Roles('Student')
  async getMyMilestones(@Request() req: any) {
    await this.ensureTeamLeader(req.user.userId);
    const milestones = await this.milestoneService.getForUser(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Milestones retrieved successfully',
      data: milestones,
      error: null,
    };
  }

  // Supervisor: get milestones for all assigned students
  @Get('students')
  @Roles('Supervisor', 'Admin', 'University Coordinator')
  async getMilestonesForMyStudents(@Request() req: any) {
    const milestones = await this.milestoneService.getForSupervisorUser(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Milestones retrieved successfully',
      data: milestones,
      error: null,
    };
  }

  // Get milestones by student ID
  @Get('student/:studentId')
  @Roles('Supervisor', 'Admin', 'University Coordinator')
  async getByStudent(@Param('studentId') studentId: string) {
    const milestones = await this.milestoneService.getBySpecificStudent(parseInt(studentId));
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Milestones retrieved successfully',
      data: milestones,
      error: null,
    };
  }

  // Get progress summary for a student
  @Get('student/:studentId/summary')
  @Roles('Supervisor', 'Admin', 'University Coordinator', 'Student')
  async getProgressSummary(@Param('studentId') studentId: string) {
    const summary = await this.milestoneService.getProgressSummary(parseInt(studentId));
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Progress summary retrieved successfully',
      data: summary,
      error: null,
    };
  }

  // Get single milestone
  @Get(':id')
  @Roles('Student', 'Supervisor', 'Admin', 'University Coordinator')
  async getById(@Param('id') id: string) {
    const milestone = await this.milestoneService.getById(parseInt(id));
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Milestone retrieved successfully',
      data: milestone,
      error: null,
    };
  }

  // Supervisor: review a milestone
  @Post(':id/review')
  @Roles('Supervisor', 'Admin')
  async review(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const milestone = await this.milestoneService.review(
      parseInt(id),
      body.feedback || '',
      body.status,
      req.user.userId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Milestone reviewed successfully',
      data: milestone,
      error: null,
    };
  }

  // Student: update/resubmit a milestone
  @Put(':id')
  @Roles('Student')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    await this.ensureTeamLeader(req.user.userId);
    const milestone = await this.milestoneService.update(parseInt(id), body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Milestone updated successfully',
      data: milestone,
      error: null,
    };
  }
}
