import {
  Controller, Get, Post, Put, Body, Param,
  UseGuards, HttpStatus, Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Supervisor: get attendance for all assigned students (resolves from JWT)
  @Get('my-students')
  @Roles('Supervisor')
  async getMyStudentsAttendance(@Request() req: any) {
    const data = await this.attendanceService.getForSupervisor(req.user.userId);
    return { success: true, statusCode: HttpStatus.OK, message: 'Attendance retrieved', data, error: null };
  }

  // Student: get own attendance
  @Get('my')
  @Roles('Student')
  async getMyAttendance(@Request() req: any) {
    const data = await this.attendanceService.getForStudent(req.user.userId);
    return { success: true, statusCode: HttpStatus.OK, message: 'Attendance retrieved', data, error: null };
  }

  // Admin: get all attendance records
  @Get()
  @Roles('Admin', 'University Coordinator')
  async getAll() {
    const data = await this.attendanceService.getAll();
    return { success: true, statusCode: HttpStatus.OK, message: 'Attendance retrieved', data, error: null };
  }

  // Get attendance by internship ID
  @Get('internship/:internshipId')
  @Roles('Supervisor', 'Admin', 'University Coordinator', 'Student')
  async getByInternship(@Param('internshipId') internshipId: string) {
    const data = await this.attendanceService.getByInternship(parseInt(internshipId));
    return { success: true, statusCode: HttpStatus.OK, message: 'Attendance retrieved', data, error: null };
  }

  // Supervisor: record attendance for a student's internship
  @Post()
  @Roles('Supervisor', 'Admin')
  async record(@Body() body: any, @Request() req: any) {
    const data = await this.attendanceService.record(
      Number(body.internshipId),
      Number(body.studentId),
      {
        month: body.month ? Number(body.month) : undefined,
        year: body.year ? Number(body.year) : undefined,
        weeks: body.weeks,
        totalAbsentDays: body.totalAbsentDays !== undefined ? Number(body.totalAbsentDays) : undefined,
        percentage: body.percentage !== undefined ? Number(body.percentage) : undefined,
      },
      req.user.userId,
    );
    return { success: true, statusCode: HttpStatus.CREATED, message: 'Attendance recorded', data, error: null };
  }

  // Supervisor: update attendance percentage
  @Put(':id')
  @Roles('Supervisor', 'Admin')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.attendanceService.update(parseInt(id), {
      weeks: body.weeks,
      totalAbsentDays: body.totalAbsentDays !== undefined ? Number(body.totalAbsentDays) : undefined,
      percentage: body.percentage !== undefined ? Number(body.percentage) : undefined,
    });
    return { success: true, statusCode: HttpStatus.OK, message: 'Attendance updated', data, error: null };
  }
}
