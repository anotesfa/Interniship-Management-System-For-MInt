import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EvaluationService } from '../evaluation/evaluation.service';
import { DocumentService } from '../document/document.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MilestoneService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: EvaluationService,
    private readonly documentService: DocumentService,
  ) {}

  // ─── user-resolving methods (use JWT userId) ─────────────────────────────

  /** Submit a milestone — resolves the student's active internship from their user_id */
  async submitForUser(userId: number, data: any, file?: Express.Multer.File) {
    const student = await this.prisma.student.findUnique({ where: { user_id: userId } });
    if (!student) {
      throw new BadRequestException('No student profile linked to your account');
    }

    // Check if student has published evaluation
    const hasPublishedEval = await this.evaluationService.hasPublishedEvaluation(student.student_id);
    if (hasPublishedEval) {
      throw new BadRequestException('Your internship has been completed. You cannot submit milestones after evaluation is published. Contact your admin if you believe this is an error.');
    }

    const internship = await this.prisma.internship.findFirst({
      where: { student_id: student.student_id, status: 'active' },
      orderBy: { created_at: 'desc' },
    });

    if (!internship) {
      throw new BadRequestException(
        'No active internship found. You must have an active internship to submit milestones.',
      );
    }

    return this.submit(student.student_id, userId, internship.internship_id, data, file);
  }

  /** Get milestones for the logged-in student */
  async getForUser(userId: number) {
    const student = await this.prisma.student.findUnique({ where: { user_id: userId } });
    if (!student) return [];
    return this.getByStudent(student.student_id);
  }

  /** Get milestones for all students assigned to the logged-in supervisor */
  async getForSupervisorUser(userId: number) {
    const supervisor = await this.prisma.supervisor.findUnique({ where: { user_id: userId } });
    if (!supervisor) return [];
    return this.getByStudents(supervisor.supervisor_id);
  }

  // ─── core methods ─────────────────────────────────────────────────────────

  private async mapMilestone(m: any, includeAttachments: boolean = true) {
    const latestSubmission = m.submissions?.[m.submissions.length - 1] ?? null;
    const review = latestSubmission?.review ?? null;
    
    // Fetch attachment data if needed
    let attachments: any = null;
    if (includeAttachments) {
      try {
        const docs = await this.documentService.getByEntity('milestone', m.milestone_id);
        attachments = docs.length > 0 ? docs[0] : null;
      } catch (error) {
        // Silently handle if no documents found
        attachments = null;
      }
    }

    const milestone = {
      milestone_id: String(m.milestone_id),
      student_id: String(m.created_by ?? ''),
      assignment_id: String(m.internship_id),
      title: m.title,
      description: m.description ?? '',
      submission_date: m.created_at?.toISOString?.() ?? m.created_at,
      status: m.status,
      feedback: review?.feedback ?? null,
      locked: m.status === 'accepted',
      reviewed_at: review?.reviewed_at?.toISOString?.() ?? null,
      attachment_path: attachments?.file_path ?? null,
      attachment_name: attachments?.file_name ?? null,
      document_id: attachments?.document_id ? String(attachments.document_id) : null,
    };

    return milestone;
  }

  async submit(studentId: number, userId: number, internshipId: number, data: any, file?: Express.Multer.File) {
    const internship = await this.prisma.internship.findUnique({
      where: { internship_id: internshipId },
    });

    if (!internship) {
      throw new NotFoundException(`Internship with id ${internshipId} not found`);
    }

    if (internship.student_id !== studentId) {
      throw new BadRequestException('Student can only submit milestones for their own internship');
    }

    const milestone = await this.prisma.milestone.create({
      data: {
        internship_id: internshipId,
        title: data.title,
        description: data.description || null,
        due_date: data.dueDate ? new Date(data.dueDate) : null,
        status: 'pending_review',
        created_by: studentId,
      },
      include: {
        submissions: {
          include: { student: true, review: true },
        },
      },
    });

    // Handle file upload if provided
    if (file) {
      try {
        const uploadDir = path.join(process.cwd(), 'uploads', 'milestones');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}_${file.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);

        // Get or create document type for milestones
        let docType = await this.prisma.documentType.findUnique({
          where: { type_name: 'milestone_submission' },
        });
        if (!docType) {
          docType = await this.prisma.documentType.create({
            data: { type_name: 'milestone_submission' },
          });
        }

        // Store document reference
        await this.documentService.upload(
          file.originalname,
          filePath,
          file.mimetype,
          docType.type_id,
          userId,
          'milestone',
          milestone.milestone_id,
        );
      } catch (error) {
        console.error('Error saving milestone attachment:', error);
        // Don't throw error - milestone was created successfully
      }
    }

    return await this.mapMilestone(milestone);
  }

  async update(milestoneId: number, data: any) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { milestone_id: milestoneId },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${milestoneId} not found`);
    }

    const updated = await this.prisma.milestone.update({
      where: { milestone_id: milestoneId },
      data: {
        title: data.title || milestone.title,
        description: data.description !== undefined ? data.description : milestone.description,
        due_date: data.dueDate ? new Date(data.dueDate) : milestone.due_date,
        status: 'pending_review',
      },
      include: {
        internship: {
          include: { student: true },
        },
        submissions: {
          include: { student: true, review: true },
        },
      },
    });

    return await this.mapMilestone(updated);
  }

  async getByStudent(studentId: number) {
    const milestones = await this.prisma.milestone.findMany({
      where: {
        internship: { student_id: studentId },
      },
      include: {
        internship: {
          include: { student: true },
        },
        submissions: {
          include: { student: true, review: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const mappedMilestones = await Promise.all(
      milestones.map(async (m) => {
        const mapped = await this.mapMilestone(m);
        return {
          ...mapped,
          student_name: m.internship?.student?.full_name ?? '',
        };
      }),
    );

    return mappedMilestones;
  }

  async getByStudents(supervisorId: number) {
    const milestones = await this.prisma.milestone.findMany({
      where: {
        internship: {
          assignment: { supervisor_id: supervisorId },
        },
      },
      include: {
        internship: {
          include: { student: true },
        },
        submissions: {
          include: { student: true, review: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const mappedMilestones = await Promise.all(
      milestones.map(async (m) => {
        const mapped = await this.mapMilestone(m);
        return {
          ...mapped,
          student_name: m.internship?.student?.full_name ?? '',
        };
      }),
    );

    return mappedMilestones;
  }

  async getBySpecificStudent(studentId: number) {
    const milestones = await this.prisma.milestone.findMany({
      where: {
        internship: { student_id: studentId },
      },
      include: {
        internship: {
          include: { student: true },
        },
        submissions: {
          where: { student_id: studentId },
          include: { review: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const mappedMilestones = await Promise.all(
      milestones.map(async (m) => {
        const mapped = await this.mapMilestone(m);
        return {
          ...mapped,
          student_name: m.internship?.student?.full_name ?? '',
        };
      }),
    );

    return mappedMilestones;
  }

  async review(milestoneId: number, feedback: string, status: string, reviewerId: number) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { milestone_id: milestoneId },
      include: {
        internship: {
          include: { student: true },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${milestoneId} not found`);
    }

    const updated = await this.prisma.milestone.update({
      where: { milestone_id: milestoneId },
      data: {
        status,
      },
      include: {
        internship: {
          include: { student: true },
        },
        submissions: {
          include: { student: true, review: true },
        },
      },
    });

    // Update submission review if exists
    const submission = await this.prisma.submission.findFirst({
      where: { milestone_id: milestoneId },
    });

    if (submission) {
      await this.prisma.submissionReview.upsert({
        where: { submission_id: submission.submission_id },
        create: {
          submission_id: submission.submission_id,
          reviewer_id: reviewerId,
          feedback,
          status,
        },
        update: {
          feedback,
          status,
          reviewed_at: new Date(),
        },
      });
    }

    const mapped = await this.mapMilestone(updated);
    return {
      ...mapped,
      student_name: updated.internship?.student?.full_name ?? '',
    };
  }

  async getById(milestoneId: number) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { milestone_id: milestoneId },
      include: {
        internship: {
          include: { student: true },
        },
        submissions: {
          include: { student: true, review: true },
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${milestoneId} not found`);
    }

    const mapped = await this.mapMilestone(milestone);
    return {
      ...mapped,
      student_name: milestone.internship?.student?.full_name ?? '',
    };
  }

  async getProgressSummary(studentId: number) {
    const milestones = await this.prisma.milestone.findMany({
      where: {
        internship: { student_id: studentId },
      },
    });

    const total = milestones.length;
    const accepted = milestones.filter(m => m.status === 'accepted').length;
    const pending_review = milestones.filter(m => m.status === 'pending_review').length;
    const pending_revision = milestones.filter(m => m.status === 'pending_revision').length;
    const rejected = milestones.filter(m => m.status === 'rejected').length;

    return {
      total,
      accepted,
      pending_review,
      pending_revision,
      rejected,
    };
  }
}
