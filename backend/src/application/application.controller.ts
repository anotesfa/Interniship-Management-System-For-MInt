import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage, diskStorage } from 'multer';
import { ApplicationService } from './application.service';
import { BulkApplicationService } from './bulk-application.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import * as path from 'path';
import * as fs from 'fs';

@Controller('applications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly bulkApplicationService: BulkApplicationService,
  ) {}

  @Post()
  @Roles('University Coordinator')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'transcript', maxCount: 1 },
        { name: 'request_letter', maxCount: 1 },
        { name: 'recommendation_letter', maxCount: 1 },
      ],
      {
        storage: memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 },
      },
    ),
  )
  async submitApplication(
    @Request() req: { user: { userId: number } },
    @Body() body: SubmitApplicationDto,
    @UploadedFiles()
    files: {
      transcript?: Express.Multer.File[];
      request_letter?: Express.Multer.File[];
      recommendation_letter?: Express.Multer.File[];
    },
  ) {
    const data = await this.applicationService.submitByCoordinator(req.user.userId, body, files);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Application submitted successfully',
      data,
      error: null,
    };
  }

  @Get('my')
  @Roles('University Coordinator')
  async getMyApplications(@Request() req: { user: { userId: number } }) {
    const data = await this.applicationService.getByCoordinator(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Applications retrieved successfully',
      data,
      error: null,
    };
  }

  @Get('pending')
  @Roles('Admin')
  async getPendingApplications() {
    const applications = await this.applicationService.getPending();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Pending applications retrieved successfully',
      data: applications,
      error: null,
    };
  }

  @Get()
  @Roles('Admin', 'University Coordinator')
  async getAllApplications(@Query('status') status?: string) {
    const applications = await this.applicationService.getAll(status);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Applications retrieved successfully',
      data: applications,
      error: null,
    };
  }

  @Get('approved-students')
  @Roles('Admin', 'University Coordinator')
  async getApprovedStudents() {
    const data = await this.applicationService.getApprovedStudentsWithInternships();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Approved students retrieved successfully',
      data,
      error: null,
    };
  }

  @Get('stats')
  @Roles('Admin', 'University Coordinator')
  async getStats() {
    const data = await this.applicationService.getStats();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Application statistics retrieved successfully',
      data,
      error: null,
    };
  }

  @Get(':id')
  @Roles('University Coordinator', 'Admin')
  async getApplicationById(@Param('id', ParseIntPipe) id: number) {
    const application = await this.applicationService.getById(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Application retrieved successfully',
      data: application,
      error: null,
    };
  }

  @Post(':id/approve')
  @Roles('Admin')
  async approveApplication(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { userId: number } },
  ) {
    const application = await this.applicationService.approve(id, req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Application approved',
      data: application,
      error: null,
    };
  }

  @Post(':id/reject')
  @Roles('Admin')
  async rejectApplication(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { userId: number } },
    @Body('rejection_reason') rejectionReason: string,
  ) {
    const application = await this.applicationService.reject(
      id,
      req.user.userId,
      rejectionReason || 'Rejected by administrator',
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Application rejected',
      data: application,
      error: null,
    };
  }

  @Post(':id/hold')
  @Roles('Admin')
  async holdApplication(
    @Param('id', ParseIntPipe) id: number,
    @Body('hold_comment') holdComment: string,
  ) {
    const application = await this.applicationService.hold(id, holdComment || 'On hold');
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Application placed on hold',
      data: application,
      error: null,
    };
  }

  // ─── BULK APPLICATION ENDPOINTS ────────────────────────────────────────

  /**
   * Submit a bulk application with CSV file
   * POST /applications/bulk/submit
   */
  @Post('bulk/submit')
  @Roles('University Coordinator')
  @UseInterceptors(
    FileInterceptor('request_letter', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = path.join(process.cwd(), 'uploads', 'bulk-applications');
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `${timestamp}_${originalName}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
      fileFilter: (req, file, cb) => {
        const isAllowedType =
          file.mimetype === 'application/pdf' ||
          file.mimetype === 'application/msword' ||
          file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.originalname.match(/\.(pdf|doc|docx)$/i) !== null;

        if (!isAllowedType) {
          cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async submitBulkApplication(
    @Request() req: { user: { userId: number } },
    @UploadedFile() file: Express.Multer.File,
    @Body('students') studentsJson: string,
  ) {
    if (!file) {
      throw new BadRequestException('University request letter is required');
    }

    let students: Array<{
      full_name: string;
      email: string;
      registration_number: string;
      department: string;
      gpa?: number | string | null;
    }> = [];

    try {
      const parsedStudents = JSON.parse(studentsJson || '[]');
      if (!Array.isArray(parsedStudents)) {
        throw new Error('students must be an array');
      }
      students = parsedStudents;
    } catch (error) {
      throw new BadRequestException('Invalid students payload');
    }

    const result = await this.bulkApplicationService.submitBulkApplication(
      req.user.userId,
      file,
      students,
    );

    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Bulk application submitted successfully',
      data: result,
      error: null,
    };
  }

  /**
   * Get bulk application status
   * GET /applications/bulk/:id/status
   */
  @Get('bulk/:id/status')
  @Roles('University Coordinator', 'Admin')
  async getBulkApplicationStatus(@Param('id', ParseIntPipe) bulkApplicationId: number) {
    const data = await this.bulkApplicationService.getBulkApplicationStatus(bulkApplicationId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Bulk application status retrieved',
      data,
      error: null,
    };
  }

  /**
   * Get all bulk applications for university
   * GET /applications/bulk/university/:universityId
   */
  @Get('bulk/university/:universityId')
  @Roles('University Coordinator', 'Admin')
  async getUniversityBulkApplications(@Param('universityId', ParseIntPipe) universityId: number) {
    const data = await this.bulkApplicationService.getUniversityBulkApplications(universityId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'University bulk applications retrieved',
      data,
      error: null,
    };
  }

  /**
   * Get bulk applications for the logged-in coordinator's university
   * GET /applications/bulk/my
   */
  @Get('bulk/my')
  @Roles('University Coordinator')
  async getMyUniversityBulkApplications(@Request() req: { user: { userId: number } }) {
    const data = await this.bulkApplicationService.getMyUniversityBulkApplications(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'University bulk applications retrieved',
      data,
      error: null,
    };
  }
}
