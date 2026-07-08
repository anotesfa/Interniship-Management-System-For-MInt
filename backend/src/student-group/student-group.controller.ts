import { Body, Controller, Get, Post, Request, UseGuards, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StudentGroupService } from './student-group.service';
import { Param, Patch, Delete } from '@nestjs/common';

@Controller('student-groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class StudentGroupController {
  constructor(private readonly studentGroupService: StudentGroupService) {}

  @Get('my')
  @Roles('Student')
  async getMyGroup(@Request() req: any) {
    const data = await this.studentGroupService.getMyGroupSummary(req.user.userId);
    return { success: true, statusCode: HttpStatus.OK, message: 'Student group retrieved successfully', data, error: null };
  }

  @Get('supervisor/my')
  @Roles('Supervisor')
  async getMyGroups(@Request() req: any) {
    const data = await this.studentGroupService.getSupervisorGroups(req.user.userId);
    return { success: true, statusCode: HttpStatus.OK, message: 'Student groups retrieved successfully', data, error: null };
  }

  @Post()
  @Roles('Supervisor', 'Admin', 'University Coordinator')
  async create(@Request() req: any, @Body() body: any) {
    const data = await this.studentGroupService.createGroup({
      supervisorUserId: req.user.userId,
      supervisorId: body.supervisorId ? Number(body.supervisorId) : undefined,
      studentIds: Array.isArray(body.studentIds) ? body.studentIds.map((id: any) => Number(id)) : [],
      leaderStudentId: Number(body.leaderStudentId),
      teamName: body.teamName,
      startDate: body.startDate,
      endDate: body.endDate,
      attendanceDays: body.attendanceDays,
    });
    return { success: true, statusCode: HttpStatus.CREATED, message: 'Student group created successfully', data, error: null };
  }

  @Patch(':id')
  @Roles('Supervisor', 'Admin')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    const data = await this.studentGroupService.updateGroup({
      supervisorUserId: req.user.userId,
      groupId: Number(id),
      studentIds: Array.isArray(body.studentIds) ? body.studentIds.map((id: any) => Number(id)) : [],
      leaderStudentId: Number(body.leaderStudentId),
      teamName: body.teamName,
      startDate: body.startDate,
      endDate: body.endDate,
      attendanceDays: body.attendanceDays,
    });

    return { success: true, statusCode: HttpStatus.OK, message: 'Student group updated successfully', data, error: null };
  }

  @Delete(':id')
  @Roles('Supervisor', 'Admin')
  async remove(@Request() req: any, @Param('id') id: string) {
    const data = await this.studentGroupService.deleteGroup(req.user.userId, Number(id));
    return { success: true, statusCode: HttpStatus.OK, message: 'Student group deleted successfully', data, error: null };
  }
}
