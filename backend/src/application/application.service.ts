import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentService } from '../document/document.service';
import { EmailService } from '../common/email.service';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { mapApplicationToResponse } from './application.mapper';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import ROLES from '../common/roles';

const APPLICATION_INCLUDE = {
  application_students: { include: { student: true } },
  university: true,
} as const;

@Injectable()
export class ApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentService: DocumentService,
    private readonly emailService: EmailService,
  ) {}

  private async getCoordinatorUniversity(coordinatorUserId: number) {
    const link = await this.prisma.universityUser.findFirst({
      where: { user_id: coordinatorUserId },
    });

    if (!link) {
      throw new BadRequestException(
        'Your account is not linked to a university. Contact an administrator.',
      );
    }

    return link.university_id;
  }

  private async ensureDocumentType(typeName: string) {
    return this.prisma.documentType.upsert({
      where: { type_name: typeName },
      update: {},
      create: { type_name: typeName },
    });
  }

  private buildRegistrationNumber(fullName: string, email: string, universityId: number) {
    const namePart = fullName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 6);
    const emailPart = email
      .split('@')[0]
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 6);

    return `STU-${namePart || emailPart || 'USER'}-${String(universityId).padStart(2, '0')}`;
  }

  private generateTemporaryPassword() {
    return `IMS-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private async mapApplicationWithDocuments(application: any) {
    const documents = await this.documentService.getByEntity('application', application.application_id);
    const coordinator = await this.prisma.user.findUnique({
      where: { user_id: application.submitted_by },
      select: { full_name: true, email: true },
    });

    return {
      ...mapApplicationToResponse(application),
      coordinator_name: coordinator?.full_name ?? '',
      coordinator_email: coordinator?.email ?? '',
      documents: documents.map((document) => ({
        document_id: String(document.document_id),
        application_id: String(application.application_id),
        document_type: document.document_type?.type_name ?? 'unknown',
        file_name: document.file_name,
        file_path: document.file_path,
        file_size_kb: document.file_size_kb ?? 0,
        uploaded_at: document.uploaded_at?.toISOString?.() ?? document.uploaded_at,
        uploaded_by_name: document.uploader?.full_name ?? '',
        uploaded_by_email: document.uploader?.email ?? '',
      })),
    };
  }

  private async saveUploadedFile(
    file: Express.Multer.File,
    applicationId: number,
    documentTypeName: string,
    uploadedBy: number,
  ) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'applications', String(applicationId));
    fs.mkdirSync(uploadDir, { recursive: true });

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedPath = path.join(uploadDir, `${Date.now()}-${safeName}`);
    fs.writeFileSync(storedPath, file.buffer);

    const docType = await this.ensureDocumentType(documentTypeName);
    const ext = path.extname(safeName).slice(1).toLowerCase() || 'pdf';

    await this.documentService.upload(
      safeName,
      storedPath,
      ext,
      docType.type_id,
      uploadedBy,
      'application',
      applicationId,
    );
  }

  async submitByCoordinator(
    coordinatorUserId: number,
    dto: SubmitApplicationDto,
    files: {
      transcript?: Express.Multer.File[];
      request_letter?: Express.Multer.File[];
      recommendation_letter?: Express.Multer.File[];
    },
  ) {
    const universityId = await this.getCoordinatorUniversity(coordinatorUserId);

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear + 1, 0, 1);

    const yearlyApplicationCount = await this.prisma.application.count({
      where: {
        university_id: universityId,
        submission_date: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
    });

    if (yearlyApplicationCount >= 50) {
      throw new BadRequestException('Your university has reached the yearly application limit of 50');
    }

    if (!files.request_letter?.[0]) {
      throw new BadRequestException('University request letter is required');
    }

    const studentEmail = dto.institutional_email.trim();
    const registrationNumber = this.buildRegistrationNumber(dto.student_name, studentEmail, universityId);

    let student = await this.prisma.student.findFirst({
      where: {
        university_id: universityId,
        email: studentEmail,
      },
    });

    if (student) {
      student = await this.prisma.student.update({
        where: { student_id: student.student_id },
        data: {
          full_name: dto.student_name,
          email: studentEmail,
          department: dto.department,
          gpa: dto.gpa ?? null,
        },
      });
    } else {
      student = await this.prisma.student.create({
        data: {
          university_id: universityId,
          full_name: dto.student_name,
          registration_number: registrationNumber,
          email: studentEmail,
          department: dto.department,
          gpa: dto.gpa ?? null,
          status: 'active',
        },
      });
    }

    const requestLetterPath = files.request_letter[0].originalname;

    const application = await this.prisma.application.create({
      data: {
        university_id: universityId,
        submitted_by: coordinatorUserId,
        application_letter_path: requestLetterPath,
        status: 'pending',
        application_students: {
          create: {
            student_id: student.student_id,
            status: 'pending',
          },
        },
      },
      include: APPLICATION_INCLUDE,
    });

    // Create internship with the specified dates
    const internshipData: any = {
      student_id: student.student_id,
      application_id: application.application_id,
      status: 'pending_assignment',
    };

    if (dto.internship_start_date) {
      internshipData.start_date = new Date(dto.internship_start_date);
    }
    if (dto.internship_end_date) {
      internshipData.end_date = new Date(dto.internship_end_date);
    }

    await this.prisma.internship.create({
      data: internshipData,
    });

    if (files.transcript?.[0]) {
      await this.saveUploadedFile(
        files.transcript[0],
        application.application_id,
        'transcript',
        coordinatorUserId,
      );
    }
    await this.saveUploadedFile(
      files.request_letter[0],
      application.application_id,
      'request_letter',
      coordinatorUserId,
    );
    if (files.recommendation_letter?.[0]) {
      await this.saveUploadedFile(
        files.recommendation_letter[0],
        application.application_id,
        'recommendation_letter',
        coordinatorUserId,
      );
    }

    return this.mapApplicationWithDocuments(application);
  }

  async getByCoordinator(coordinatorUserId: number) {
    const universityId = await this.getCoordinatorUniversity(coordinatorUserId);

    const applications = await this.prisma.application.findMany({
      where: { university_id: universityId },
      include: APPLICATION_INCLUDE,
      orderBy: { submission_date: 'desc' },
    });

    const result: any[] = [];
    for (const app of applications) {
      // For each student in the application, create a separate roster entry
      for (const appStudent of app.application_students || []) {
        const student = appStudent.student;
        if (!student) continue;

        result.push({
          application_id: String(app.application_id),
          university_id: String(app.university_id),
          university_name: app.university?.name ?? '',
          coordinator_name: '',
          coordinator_email: '',
          student_id: String(student.student_id),
          student_name: student.full_name,
          student_institutional_id: student.registration_number ?? '',
          department: student.department ?? '',
          gpa: student.gpa ?? 0,
          institutional_email: student.email ?? '',
          student_email: student.email ?? '',
          academic_year: app.reviewed_at ? new Date(app.reviewed_at).getFullYear() : app.submission_date.getFullYear(),
          status: app.status,
          reviewed_by: app.reviewed_by ? String(app.reviewed_by) : undefined,
          reviewed_at: app.reviewed_at?.toISOString(),
          documents: [],
          students: [
            {
              student_id: String(student.student_id),
              full_name: student.full_name,
              registration_number: student.registration_number ?? '',
              email: student.email ?? '',
              department: student.department ?? '',
              gpa: student.gpa ?? null,
              status: appStudent.status,
            },
          ],
          student_count: 1,
          created_at: app.submission_date.toISOString(),
          updated_at: app.submission_date.toISOString(),
        });
      }
    }

    // Also include students who have been evaluated (submitted or published) but may not appear in an application
    const evaluations = await this.prisma.evaluation.findMany({
      where: {
        status: { in: ['submitted', 'published'] },
        student: { university_id: universityId },
      },
      include: {
        student: true,
        internship: {
          include: {
            assignment: { include: { supervisor: { include: { user: true } } } },
          },
        },
      },
      orderBy: { submitted_at: 'desc' },
    });

    const existingStudentIds = new Set(result.map((r) => Number(r.student_id)));
    for (const ev of evaluations) {
      const student = ev.student;
      if (!student) continue;
      if (existingStudentIds.has(student.student_id)) continue;

      result.push({
        application_id: null,
        student_id: String(student.student_id),
        university_id: String(universityId),
        coordinator_name: '',
        coordinator_email: '',
        student_name: student.full_name,
        student_institutional_id: student.registration_number ?? '',
        department: student.department ?? '',
        gpa: student.gpa ?? 0,
        institutional_email: student.email ?? '',
        student_email: student.email ?? '',
        academic_year: ev.published_at ? new Date(ev.published_at).getFullYear() : (ev.submitted_at ? new Date(ev.submitted_at).getFullYear() : new Date().getFullYear()),
        status: 'evaluated',
        reviewed_by: null,
        reviewed_at: ev.published_at ?? ev.submitted_at ?? null,
        documents: [],
        students: [
          {
            student_id: String(student.student_id),
            full_name: student.full_name,
            registration_number: student.registration_number ?? '',
            email: student.email ?? '',
            department: student.department ?? '',
            gpa: student.gpa ?? null,
            status: 'evaluated',
          },
        ],
        student_count: 1,
        created_at: (ev.submitted_at ?? ev.published_at ?? new Date()).toISOString(),
        updated_at: (ev.published_at ?? ev.submitted_at ?? new Date()).toISOString(),
      });
    }

    return result;
  }

  async submitApplication(studentId: number, data: any) {
    // Get student's university_id
    const student = await this.prisma.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }

    if (!student.user_id) {
      throw new BadRequestException('Student account is not linked to a user');
    }

    const application = await this.prisma.application.create({
      data: {
        university_id: student.university_id,
        submitted_by: student.user_id,
        application_letter_path: data.applicationLetterPath || null,
        status: 'submitted',
        application_students: {
          create: {
            student_id: studentId,
            status: 'submitted',
          },
        },
      },
      include: {
        application_students: {
          include: { student: true },
        },
      },
    });

    return application;
  }

  async saveDraft(studentId: number, data: any) {
    const student = await this.prisma.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }

    // Check if application already exists for this student
    const existingApplication = await this.prisma.application.findFirst({
      where: {
        application_students: {
          some: { student_id: studentId },
        },
      },
    });

    if (existingApplication && existingApplication.status !== 'draft') {
      throw new BadRequestException('Only draft applications can be updated');
    }

    if (!student.user_id) {
      throw new BadRequestException('Student account is not linked to a user');
    }

    if (existingApplication) {
      const updated = await this.prisma.application.update({
        where: { application_id: existingApplication.application_id },
        data: {
          application_letter_path: data.applicationLetterPath || existingApplication.application_letter_path,
        },
        include: {
          application_students: {
            include: { student: true },
          },
        },
      });
      return this.mapApplicationWithDocuments(updated);
    }

    const application = await this.prisma.application.create({
      data: {
        university_id: student.university_id,
        submitted_by: student.user_id,
        application_letter_path: data.applicationLetterPath || null,
        status: 'draft',
        application_students: {
          create: {
            student_id: studentId,
            status: 'draft',
          },
        },
      },
      include: {
        application_students: {
          include: { student: true },
        },
      },
    });

    return this.mapApplicationWithDocuments(application);
  }

  async getByStudent(studentId: number) {
    const applications = await this.prisma.application.findMany({
      where: {
        application_students: {
          some: { student_id: studentId },
        },
      },
      include: {
        application_students: {
          include: { student: true },
        },
      },
    });

    return Promise.all(applications.map((application) => this.mapApplicationWithDocuments(application)));
  }

  async getPending() {
    const applications = await this.prisma.application.findMany({
      where: { status: 'pending' },
      include: APPLICATION_INCLUDE,
      orderBy: { submission_date: 'desc' },
    });

    return Promise.all(applications.map((application) => this.mapApplicationWithDocuments(application)));
  }

  async getAll(status?: string) {
    const where = status ? { status } : {};
    const applications = await this.prisma.application.findMany({
      where,
      include: APPLICATION_INCLUDE,
      orderBy: { submission_date: 'desc' },
    });

    return Promise.all(applications.map((application) => this.mapApplicationWithDocuments(application)));
  }

  async getApprovedStudentsWithInternships() {
    // Get all approved applications and their students with internship info
    const applications = await this.prisma.application.findMany({
      where: { status: 'approved' },
      include: {
        application_students: {
          include: {
            student: {
              include: {
                internships: {
                  include: {
                    assignment: {
                      include: {
                        supervisor: { include: { user: true } },
                      },
                    },
                  },
                  orderBy: { created_at: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { submission_date: 'desc' },
    });

    const result: any[] = [];
    for (const app of applications) {
      for (const appStudent of app.application_students) {
        const student = appStudent.student;

        // Backfill: create internship if it doesn't exist yet (for pre-fix approvals)
        let latestInternship = student.internships[0] ?? null;
        if (!latestInternship) {
          latestInternship = await this.prisma.internship.create({
            data: {
              student_id: student.student_id,
              application_id: app.application_id,
              status: 'pending_assignment',
            },
            include: {
              assignment: {
                include: {
                  supervisor: { include: { user: true } },
                },
              },
            },
          });
        }

        result.push({
          application_id: app.application_id,
          student_id: student.student_id,
          student_name: student.full_name,
          department: student.department,
          registration_number: student.registration_number,
          internship_id: latestInternship?.internship_id ?? null,
          internship_status: latestInternship?.status ?? null,
          assignment: latestInternship?.assignment
            ? {
                assignment_id: latestInternship.assignment.assignment_id,
                supervisor_name: latestInternship.assignment.supervisor.user.full_name,
                supervisor_id: latestInternship.assignment.supervisor_id,
                status: latestInternship.assignment.status,
              }
            : null,
        });
      }
    }

    return result;
  }

  async getById(applicationId: number) {
    const application = await this.prisma.application.findUnique({
      where: { application_id: applicationId },
      include: APPLICATION_INCLUDE,
    });

    if (!application) {
      throw new NotFoundException(`Application with id ${applicationId} not found`);
    }

    return this.mapApplicationWithDocuments(application);
  }

  async approve(applicationId: number, reviewedBy: number) {
    const studentRole = await this.prisma.role.findUnique({
      where: { role_name: ROLES.STUDENT },
    });

    if (!studentRole) {
      throw new BadRequestException('Student role is not configured');
    }

    const approval = await this.prisma.$transaction(async (tx) => {
      const application = await tx.application.update({
        where: { application_id: applicationId },
        data: {
          status: 'approved',
          reviewed_by: reviewedBy,
          reviewed_at: new Date(),
        },
        include: APPLICATION_INCLUDE,
      });

      const emailsToSend: Array<{ to: string; studentName: string; username: string; temporaryPassword: string }> = [];

      for (const appStudent of application.application_students) {
        const student = await tx.student.findUnique({
          where: { student_id: appStudent.student_id },
        });

        if (!student) {
          continue;
        }

        const existingInternship = await tx.internship.findFirst({
          where: {
            student_id: appStudent.student_id,
            application_id: applicationId,
          },
        });

        if (!existingInternship) {
          await tx.internship.create({
            data: {
              student_id: appStudent.student_id,
              application_id: applicationId,
              status: 'pending_assignment',
            },
          });
        }

        await tx.applicationStudent.update({
          where: {
            application_id_student_id: {
              application_id: applicationId,
              student_id: appStudent.student_id,
            },
          },
          data: { status: 'approved', remarks: null },
        });

        const temporaryPassword = this.generateTemporaryPassword();
        const passwordHash = await bcrypt.hash(temporaryPassword, 10);

        let linkedUserId = student.user_id;
        const existingUser = linkedUserId
          ? await tx.user.findUnique({ where: { user_id: linkedUserId } })
          : await tx.user.findUnique({ where: { email: student.email } });

        if (existingUser) {
          linkedUserId = existingUser.user_id;

          await tx.user.update({
            where: { user_id: existingUser.user_id },
            data: {
              password_hash: passwordHash,
              account_status: 'active',
            },
          });
        } else {
          const createdUser = await tx.user.create({
            data: {
              full_name: student.full_name,
              email: student.email,
              password_hash: passwordHash,
              role_id: studentRole.role_id,
              account_status: 'active',
            },
          });
          linkedUserId = createdUser.user_id;
        }

        await tx.student.update({
          where: { student_id: student.student_id },
          data: { user_id: linkedUserId, status: 'active' },
        });

        emailsToSend.push({
          to: student.email,
          studentName: student.full_name,
          username: student.email,
          temporaryPassword,
        });
      }

      return { application, emailsToSend };
    });

    for (const email of approval.emailsToSend) {
      try {
        await this.emailService.sendStudentCredentialsEmail(email);
      } catch (error) {
        console.warn(`Failed to send credentials email to ${email.to}:`, error);
      }
    }

    return this.mapApplicationWithDocuments(approval.application);
  }

  async reject(applicationId: number, reviewedBy: number, reason: string) {
    const application = await this.prisma.application.update({
      where: { application_id: applicationId },
      data: {
        status: 'rejected',
        reviewed_by: reviewedBy,
        reviewed_at: new Date(),
        remarks: reason,
      },
      include: APPLICATION_INCLUDE,
    });

    await this.prisma.applicationStudent.updateMany({
      where: { application_id: applicationId },
      data: { status: 'rejected', remarks: reason },
    });

    await this.prisma.student.updateMany({
      where: {
        application_students: {
          some: { application_id: applicationId },
        },
      },
      data: { status: 'rejected' },
    });

    return this.mapApplicationWithDocuments(application);
  }

  async hold(applicationId: number, comment: string) {
    const application = await this.prisma.application.update({
      where: { application_id: applicationId },
      data: {
        status: 'on_hold',
        remarks: comment,
      },
      include: APPLICATION_INCLUDE,
    });

    return this.mapApplicationWithDocuments(application);
  }

  async getStats() {
    const total = await this.prisma.application.count();
    const pending = await this.prisma.application.count({
      where: { status: 'pending' },
    });
    const approved = await this.prisma.application.count({
      where: { status: 'approved' },
    });
    const rejected = await this.prisma.application.count({
      where: { status: 'rejected' },
    });
    const on_hold = await this.prisma.application.count({
      where: { status: 'on_hold' },
    });

    return {
      total,
      pending,
      approved,
      rejected,
      on_hold,
    };
  }
}
