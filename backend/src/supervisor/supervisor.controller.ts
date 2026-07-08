import { Controller, Get, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { SupervisorService } from './supervisor.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('supervisor')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  // ONLY a Supervisor can view their assigned students
  @Get('my-students')
  @Roles('Supervisor')
  getMyAssignedStudents(@Request() req: any) {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Assigned students retrieved successfully',
      data: { supervisor_email: req.user.email, students: [] },
      error: null
    };
  }

  // System Admins have total oversight
  @Get('all')
  @Roles('Admin')
  getAllSupervisors() {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'All supervisors retrieved (Admin Only)',
      data: [],
      error: null
    };
  }
}
