import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { NotificationService } from '../notification/notification.service';
import ROLES from '../common/roles';
import { UniversitySignupDto } from './dto/university-signup.dto';
import { ApproveUniversityDto, RejectUniversityDto } from './dto/university-approval.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class UniversityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Register a new university
   */
  async signup(data: UniversitySignupDto, createdBy: number) {
    // Check if university already exists
    const existing = await this.prisma.university.findFirst({
      where: {
        OR: [
          { contact_email: data.contact_email },
          { name: data.name },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('University with this name or email already exists');
    }

    // Check if contact email is already in use
    const emailExists = await this.prisma.user.findUnique({
      where: { email: data.contact_person_email },
    });

    if (emailExists) {
      throw new ConflictException('Email address already in use');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Get or create the University Coordinator role (use canonical title)
    const COORDINATOR_ROLE = ROLES.UNIVERSITY_COORDINATOR;
    let coordinatorRole = await this.prisma.role.findUnique({
      where: { role_name: COORDINATOR_ROLE },
    });

    if (!coordinatorRole) {
      coordinatorRole = await this.prisma.role.create({
        data: { role_name: COORDINATOR_ROLE },
      });
    }

    // Create user for university contact
    const contactUser = await this.prisma.user.create({
      data: {
        full_name: data.contact_person_name,
        email: data.contact_person_email,
        password_hash: passwordHash,
        role_id: coordinatorRole.role_id,
      },
    });

    // Create university with pending approval status
    const university = await this.prisma.university.create({
      data: {
        name: data.name,
        contact_email: data.contact_email,
        address: data.address,
        approval_status: 'pending',
        created_by: createdBy,
        university_users: {
          create: {
            user_id: contactUser.user_id,
            role_title: 'Coordinator',
          },
        },
      },
      include: {
        university_users: {
          include: { user: true },
        },
      },
    });

    return {
      university_id: university.university_id,
      name: university.name,
      approval_status: university.approval_status,
      contact: contactUser,
      message: 'University registration submitted. Awaiting admin approval.',
    };
  }

  /**
   * Get all universities (with optional status filter)
   */
  async getAll(status?: string) {
    const normalizedStatus = status?.toLowerCase();
    const universities = await this.prisma.university.findMany({
      where: normalizedStatus && normalizedStatus !== 'all'
        ? { approval_status: normalizedStatus }
        : undefined,
      include: {
        university_users: { include: { user: true } },
        approver: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return universities;
  }

  /**
   * Get a single university by ID
   */
  async getById(universityId: number) {
    const university = await this.prisma.university.findUnique({
      where: { university_id: universityId },
      include: {
        university_users: { include: { user: true } },
        approver: true,
      },
    });

    if (!university) {
      throw new NotFoundException(`University with ID ${universityId} not found`);
    }

    return university;
  }

  /**
   * Get universities awaiting approval
   */
  async getPending() {
    return this.prisma.university.findMany({
      where: { approval_status: 'pending' },
      include: {
        university_users: { include: { user: true } },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Approve a university
   */
  async approve(data: ApproveUniversityDto, approvedBy: number) {
    const university = await this.getById(data.university_id);

    if (university.approval_status !== 'pending') {
      throw new BadRequestException('Only pending universities can be approved');
    }

    const temporaryPassword = `IMS-${randomBytes(4).toString('hex').toUpperCase()}`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const primaryUniversityUser = university.university_users?.[0]?.user;

    if (!primaryUniversityUser?.email) {
      throw new BadRequestException('University contact user is missing');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { user_id: primaryUniversityUser.user_id },
        data: { password_hash: passwordHash },
      });

      return tx.university.update({
        where: { university_id: data.university_id },
        data: {
          approval_status: 'approved',
          approved_at: new Date(),
          approved_by: approvedBy,
        },
        include: {
          university_users: { include: { user: true } },
          approver: true,
        },
      });
    });

    await this.emailService.sendUniversityApprovalEmail({
      to: primaryUniversityUser.email,
      contactName: primaryUniversityUser.full_name,
      universityName: updated.name,
      username: primaryUniversityUser.email,
      temporaryPassword,
    });

    return updated;
  }

  /**
   * Reject a university
   */
  async reject(data: RejectUniversityDto, rejectedBy: number) {
    const university = await this.getById(data.university_id);

    if (university.approval_status !== 'pending') {
      throw new BadRequestException('Only pending universities can be rejected');
    }

    const updated = await this.prisma.university.update({
      where: { university_id: data.university_id },
      data: {
        approval_status: 'rejected',
        rejected_reason: data.rejected_reason,
      },
      include: {
        university_users: { include: { user: true } },
      },
    });

    const primaryUniversityUser = updated.university_users?.[0]?.user;
    if (primaryUniversityUser?.email) {
      await this.emailService.sendUniversityRejectionEmail({
        to: primaryUniversityUser.email,
        contactName: primaryUniversityUser.full_name,
        universityName: updated.name,
        rejectedReason: data.rejected_reason,
      });
    }

    return updated;
  }

  /**
   * Check if a university is approved
   */
  async isApproved(universityId: number): Promise<boolean> {
    const university = await this.prisma.university.findUnique({
      where: { university_id: universityId },
      select: { approval_status: true },
    });

    return university?.approval_status === 'approved' || false;
  }
}
