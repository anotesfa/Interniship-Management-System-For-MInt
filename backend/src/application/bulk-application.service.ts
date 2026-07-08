import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UniversityService } from '../university/university.service';
import { DocumentService } from '../document/document.service';
import { EmailService } from '../common/email.service';
import ROLES from '../common/roles';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface BulkStudentRecord {
  full_name: string;
  email: string;
  registration_number: string;
  department: string;
  gpa?: number | string | null;
}

@Injectable()
export class BulkApplicationService {
  private readonly logger = new Logger(BulkApplicationService.name);
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'bulk-applications');

  constructor(
    private readonly prisma: PrismaService,
    private readonly universityService: UniversityService,
    private readonly documentService: DocumentService,
    private readonly emailService: EmailService,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  private async getCoordinatorUniversity(coordinatorUserId: number) {
    const coordinatorLink = await this.prisma.universityUser.findFirst({
      where: { user_id: coordinatorUserId },
    });

    if (!coordinatorLink) {
      throw new BadRequestException(
        'Your account is not linked to a university. Contact an administrator.',
      );
    }

    return coordinatorLink.university_id;
  }

  private normalizeText(value: string | undefined | null) {
    return value?.trim() || '';
  }

  private generateTemporaryPassword() {
    return `IMS-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private async ensureDocumentType(typeName: string) {
    return this.prisma.documentType.upsert({
      where: { type_name: typeName },
      update: {},
      create: { type_name: typeName },
    });
  }

  private validateRecord(record: BulkStudentRecord): { valid: boolean; error?: string } {
    if (!this.normalizeText(record.full_name)) {
      return { valid: false, error: 'full_name is required' };
    }
    if (!this.normalizeText(record.email)) {
      return { valid: false, error: 'email is required' };
    }
    if (!this.normalizeText(record.registration_number)) {
      return { valid: false, error: 'registration_number is required' };
    }
    if (!this.normalizeText(record.department)) {
      return { valid: false, error: 'department is required' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(record.email.trim())) {
      return { valid: false, error: 'Invalid email format' };
    }

    if (record.gpa !== undefined && record.gpa !== null && record.gpa !== '') {
      const gpaValue = typeof record.gpa === 'string' ? Number(record.gpa) : record.gpa;
      if (Number.isNaN(gpaValue)) {
        return { valid: false, error: 'gpa must be a number when provided' };
      }
    }

    return { valid: true };
  }

  async submitBulkApplication(
    submittedBy: number,
    requestLetterFile: Express.Multer.File,
    students: BulkStudentRecord[],
  ) {
    const universityId = await this.getCoordinatorUniversity(submittedBy);

    // Verify university is approved
    const isApproved = await this.universityService.isApproved(universityId);
    if (!isApproved) {
      throw new BadRequestException('University is not approved to submit applications');
    }

    if (!requestLetterFile) {
      throw new BadRequestException('University request letter is required');
    }

    if (!Array.isArray(students) || students.length === 0) {
      throw new BadRequestException('At least one student must be provided');
    }

    // Validate all records
    const validationResults: Array<{ index: number; error?: string }> = [];
    for (let i = 0; i < students.length; i++) {
      const validation = this.validateRecord(students[i]);
      if (!validation.valid) {
        validationResults.push({ index: i + 2, error: validation.error }); // +2 for header and 1-based indexing
      }
    }

    if (validationResults.length > 0) {
      throw new BadRequestException({
        message: 'Student list validation failed',
        errors: validationResults,
      });
    }

    if (students.length > 1000) {
      throw new BadRequestException('Student list exceeds maximum of 1000 records');
    }

    // Create application record
    const application = await this.prisma.application.create({
      data: {
        university_id: universityId,
        submitted_by: submittedBy,
        application_type: 'bulk',
        application_letter_path: requestLetterFile.path,
        status: 'pending',
      },
    });

    // Create bulk application record
    const bulkApplication = await this.prisma.bulkApplication.create({
      data: {
        application_id: application.application_id,
        university_id: universityId,
        file_name: requestLetterFile.originalname,
        file_path: requestLetterFile.path,
        total_records: students.length,
        status: 'processing',
      },
    });

    const requestLetterType = await this.ensureDocumentType('request_letter');
    await this.documentService.upload(
      requestLetterFile.originalname,
      requestLetterFile.path,
      requestLetterFile.mimetype,
      requestLetterType.type_id,
      submittedBy,
      'application',
      application.application_id,
    );

    // Process records asynchronously
    this.processRecordsAsync(
      bulkApplication.bulk_application_id,
      application.application_id,
      universityId,
      students,
    );

    return {
      application_id: application.application_id,
      bulk_application_id: bulkApplication.bulk_application_id,
      status: bulkApplication.status,
      total_records: students.length,
      message: 'Bulk application submitted. Processing in progress.',
    };
  }

  /**
   * Process bulk application records asynchronously
   */
  private async processRecordsAsync(
    bulkApplicationId: number,
    applicationId: number,
    universityId: number,
    records: BulkStudentRecord[],
  ) {
    const processedRecords: number[] = [];
    const failedRecords: Array<{ index: number; email: string; error: string }> = [];
    const studentRole = await this.prisma.role.findUnique({
      where: { role_name: ROLES.STUDENT },
    });

    if (!studentRole) {
      throw new BadRequestException('Student role is not configured');
    }

    try {
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        try {
          // Check if student already exists with same email and university
          let student = await this.prisma.student.findFirst({
            where: {
              email: record.email,
              university_id: universityId,
            },
          });

          if (!student) {
            // Create new student
            const createdStudent = await this.prisma.student.create({
              data: {
                full_name: record.full_name,
                email: record.email.trim(),
                registration_number: record.registration_number.trim(),
                department: record.department.trim(),
                university_id: universityId,
                gpa:
                  record.gpa !== undefined && record.gpa !== null && record.gpa !== ''
                    ? Number(record.gpa)
                    : null,
                status: 'pending',
              },
            });

            student = createdStudent;
          }

          const email = record.email.trim();
          let linkedUserId = student.user_id ?? null;

          if (!linkedUserId) {
            const existingUser = await this.prisma.user.findUnique({
              where: { email },
            });

            linkedUserId = existingUser?.user_id ?? null;

            if (!linkedUserId) {
              const temporaryPassword = this.generateTemporaryPassword();
              const passwordHash = await bcrypt.hash(temporaryPassword, 10);

              const createdUser = await this.prisma.user.create({
                data: {
                  full_name: record.full_name,
                  email,
                  password_hash: passwordHash,
                  role_id: studentRole.role_id,
                  account_status: 'active',
                },
              });

              linkedUserId = createdUser.user_id;
            }

            await this.prisma.student.update({
              where: { student_id: student.student_id },
              data: { user_id: linkedUserId },
            });
          }

          // Create application student record
          await this.prisma.applicationStudent.upsert({
            where: {
              application_id_student_id: {
                application_id: applicationId,
                student_id: student.student_id,
              },
            },
            create: {
              application_id: applicationId,
              student_id: student.student_id,
              status: 'pending',
            },
            update: {
              status: 'pending',
            },
          });

          processedRecords.push(student.student_id);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          failedRecords.push({
            index: i + 2, // +2 for header and 1-based indexing
            email: record.email,
            error: errorMsg,
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error processing bulk application: ${errorMsg}`);
    }

    // Update bulk application record with results
    const errorLog = failedRecords.length > 0 ? JSON.stringify(failedRecords) : null;

    await this.prisma.bulkApplication.update({
      where: { bulk_application_id: bulkApplicationId },
      data: {
        status: 'completed',
        processed_records: processedRecords.length,
        failed_records: failedRecords.length,
        error_log: errorLog,
      },
    });

    // Keep the application pending for admin review. Credentials are now sent only
    // when the application is approved so each student receives one email with the
    // final credentials that remain valid after approval.

    this.logger.log(
      `Bulk application ${bulkApplicationId} completed: ${processedRecords.length} processed, ${failedRecords.length} failed`,
    );
  }

  /**
   * Get bulk application status
   */
  async getBulkApplicationStatus(bulkApplicationId: number) {
    const bulkApp = await this.prisma.bulkApplication.findUnique({
      where: { bulk_application_id: bulkApplicationId },
      include: {
        application: {
          include: {
            application_students: {
              include: { student: true },
            },
          },
        },
      },
    });

    if (!bulkApp) {
      throw new NotFoundException(`Bulk application ${bulkApplicationId} not found`);
    }

    const errorLog = bulkApp.error_log ? JSON.parse(bulkApp.error_log) : [];
    const documents = await this.documentService.getByEntity('application', bulkApp.application_id);

    return {
      bulk_application_id: bulkApp.bulk_application_id,
      application_id: bulkApp.application_id,
      status: bulkApp.status,
      total_records: bulkApp.total_records,
      processed_records: bulkApp.processed_records,
      failed_records: bulkApp.failed_records,
      file_name: bulkApp.file_name,
      submission_date: bulkApp.submission_date,
      errors: errorLog,
      documents: documents.map((document) => ({
        document_id: String(document.document_id),
        document_type: document.document_type?.type_name ?? 'unknown',
        file_name: document.file_name,
        file_path: document.file_path,
        uploaded_at: document.uploaded_at?.toISOString?.() ?? document.uploaded_at,
        uploaded_by_name: document.uploader?.full_name ?? '',
        uploaded_by_email: document.uploader?.email ?? '',
      })),
      students: bulkApp.application.application_students.map(as => ({
        student_id: as.student.student_id,
        full_name: as.student.full_name,
        email: as.student.email,
        registration_number: as.student.registration_number,
        department: as.student.department,
        status: as.status,
      })),
    };
  }

  /**
   * Get all bulk applications for a university
   */
  async getUniversityBulkApplications(universityId: number) {
    const bulkApps = await this.prisma.bulkApplication.findMany({
      where: { university_id: universityId },
      include: {
        application: {
          include: {
            application_students: true,
          },
        },
      },
      orderBy: { submission_date: 'desc' },
    });

    return bulkApps.map(ba => ({
      bulk_application_id: ba.bulk_application_id,
      application_id: ba.application_id,
      status: ba.status,
      total_records: ba.total_records,
      processed_records: ba.processed_records,
      failed_records: ba.failed_records,
      file_name: ba.file_name,
      submission_date: ba.submission_date,
      student_count: ba.application.application_students.length,
    }));
  }

  async getMyUniversityBulkApplications(coordinatorUserId: number) {
    const universityId = await this.getCoordinatorUniversity(coordinatorUserId);
    return this.getUniversityBulkApplications(universityId);
  }
}
