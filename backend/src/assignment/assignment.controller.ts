import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AssignmentService } from './assignment.service';

@Controller('assignments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Get('my-students')
  @Roles('Supervisor')
  async getMyStudents(@Request() req: any) {
    const assignments = await this.assignmentService.getByUserId(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Assigned students retrieved successfully',
      data: assignments,
      error: null,
    };
  }

  @Get('my')
  @Roles('Student')
  async getMyAssignment(@Request() req: any) {
    const assignment = await this.assignmentService.getMyAssignment(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Assignment retrieved successfully',
      data: assignment,
      error: null,
    };
  }

  @Get('available-supervisors')
  @Roles('Admin', 'University Coordinator')
  async getAvailableSupervisors() {
    const supervisors =
      await this.assignmentService.getAvailableSupervisors();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Available supervisors retrieved successfully',
      data: supervisors,
      error: null,
    };
  }

  @Post()
  @Roles('Admin', 'University Coordinator')
  async create(@Body() body: any, @Request() req: any) {
    // Support both internshipId (direct) and studentId (look up internship)
    let internshipId: number = body.internshipId;

    if (!internshipId && body.studentId) {
      internshipId = await this.assignmentService.getOrCreateInternshipForStudent(
        Number(body.studentId),
        Number(body.applicationId),
      );
    }

    const assignment = await this.assignmentService.create(
      internshipId,
      body.supervisorId,
      req.user.userId,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Assignment created successfully',
      data: assignment,
      error: null,
    };
  }

  @Get()
  @Roles('Admin', 'University Coordinator', 'Supervisor')
  async getAll(@Query('limit') limit: string, @Query('offset') offset: string) {
    const result = await this.assignmentService.getAll(
      parseInt(limit) || 50,
      parseInt(offset) || 0,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Assignments retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      error: null,
    };
  }

  @Get('student/:studentId')
  @Roles('Student', 'Supervisor', 'Admin', 'University Coordinator')
  async getByStudent(
    @Param('studentId') studentId: string,
    @Request() req: any,
  ) {
    // Students can only view their own assignments
    if (
      req.user.role === 'Student' &&
      req.user.userId !== parseInt(studentId)
    ) {
      return {
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Access denied',
        data: null,
        error: 'You can only view your own assignment',
      };
    }

    const assignment = await this.assignmentService.getByStudent(
      parseInt(studentId),
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Assignment retrieved successfully',
      data: assignment,
      error: null,
    };
  }

  @Get('supervisor/:supervisorId')
  @Roles('Supervisor', 'Admin', 'University Coordinator')
  async getByStudents(@Param('supervisorId') supervisorId: string) {
    const assignments = await this.assignmentService.getByStudents(
      parseInt(supervisorId),
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Supervisor assignments retrieved successfully',
      data: assignments,
      error: null,
    };
  }

  @Put(':id')
  @Roles('Admin', 'University Coordinator')
  async reassign(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    const assignment = await this.assignmentService.reassign(
      parseInt(id),
      body.newSupervisorId,
      req.user.userId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Assignment reassigned successfully',
      data: assignment,
      error: null,
    };
  }

  @Put(':id/status')
  @Roles('Admin', 'University Coordinator', 'Supervisor')
  async updateStatus(@Param('id') id: string, @Body() body: any) {
    const assignment = await this.assignmentService.updateStatus(
      parseInt(id),
      body.status,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Assignment status updated successfully',
      data: assignment,
      error: null,
    };
  }
}
