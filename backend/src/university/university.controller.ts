import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { UniversityService } from './university.service';
import { AuthGuard } from '@nestjs/passport';
import { UniversitySignupDto } from './dto/university-signup.dto';
import { ApproveUniversityDto, RejectUniversityDto } from './dto/university-approval.dto';
import { Response } from 'express';

@Controller('universities')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  /**
   * Public endpoint: Register a new university
   * POST /universities/signup
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() data: UniversitySignupDto, @Request() req: any) {
    // For initial registration, assume admin is creating on behalf of system
    const createdBy = req.user?.user_id ?? 1;
    return this.universityService.signup(data, createdBy);
  }

  /**
   * Get all universities (admin only)
   * GET /universities?status=pending|approved|rejected|all
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAll(@Query('status') status?: string) {
    return this.universityService.getAll(status);
  }

  /**
   * Get universities awaiting approval (admin only)
   * GET /universities/pending
   */
  @Get('pending')
  @UseGuards(AuthGuard('jwt'))
  async getPending() {
    return this.universityService.getPending();
  }

  /**
   * Get a specific university
   * GET /universities/:id
   */
  @Get(':id')
  async getById(@Param('id') universityId: string) {
    return this.universityService.getById(parseInt(universityId, 10));
  }

  /**
   * Approve a university (admin only)
   * POST /universities/approve
   */
  @Post('approve')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async approve(@Body() data: ApproveUniversityDto, @Request() req: any) {
    const approvedBy = req.user.user_id;
    return this.universityService.approve(data, approvedBy);
  }

  /**
   * Reject a university (admin only)
   * POST /universities/reject
   */
  @Post('reject')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async reject(@Body() data: RejectUniversityDto, @Request() req: any) {
    const rejectedBy = req.user.user_id;
    return this.universityService.reject(data, rejectedBy);
  }

  /**
   * Check if university is approved
   * GET /universities/:id/status
   */
  @Get(':id/status')
  async checkApprovalStatus(@Param('id') universityId: string) {
    const isApproved = await this.universityService.isApproved(
      parseInt(universityId, 10),
    );
    return { university_id: universityId, is_approved: isApproved };
  }
}
