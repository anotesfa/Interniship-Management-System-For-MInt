import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService,
  ) {}

  private async getInternshipForEvaluation(studentId: number) {
    const internship = await this.prisma.internship.findFirst({
      where: {
        student_id: studentId,
      },
      include: { assignment: true },
      orderBy: { created_at: 'desc' },
    });

    if (!internship || !internship.assignment) {
      throw new BadRequestException('Student must have an assigned supervisor before evaluation');
    }

    const { assignment, ...rest } = internship;
    return {
      ...rest,
      assignment,
    };
  }

  /**
   * Calculate total score from individual metrics
   * General Performance: 25%
   * Personal Skills: 25%
   * Professional Skills: 50%
   */
  private calculateTotalScore(data: any): number {
    const sumScores = (scores: Array<number | undefined>): number =>
      scores.reduce<number>((sum, score) => sum + (typeof score === 'number' ? score : 0), 0);

    const generalPerf = sumScores([
      data.punctuality_score,
      data.reliability_score,
      data.independence_score,
      data.communication_score,
      data.professionalism_score,
    ]);
    const personalSkills = sumScores([
      data.speed_of_work_score,
      data.accuracy_score,
      data.engagement_score,
      data.need_for_work_score,
      data.cooperation_score,
    ]);
    const professionalSkills = sumScores([
      data.technical_skills_score,
      data.organizational_skills_score,
      data.project_support_score,
      data.responsibility_score,
      data.team_quality_score,
    ]);

    const total = generalPerf + personalSkills + professionalSkills;
    return Math.max(0, Math.min(100, Math.round(total)));
  }

  /**
   * Calculate section totals (general, personal, professional) as stored in DB
   * General: sum of 5 fields (max 25)
   * Personal: sum of 5 fields (max 25)
   * Professional: sum of 5 fields (max 50)
   */
  private calculateSectionTotals(data: any) {
    const sum = (arr: Array<number | undefined>) => arr.reduce<number>((s, v) => s + (typeof v === 'number' ? v : 0), 0);

    const general = sum([
      data.punctuality_score,
      data.reliability_score,
      data.independence_score,
      data.communication_score,
      data.professionalism_score,
    ]);

    const personal = sum([
      data.speed_of_work_score,
      data.accuracy_score,
      data.engagement_score,
      data.need_for_work_score,
      data.cooperation_score,
    ]);

    const professional = sum([
      data.technical_skills_score,
      data.organizational_skills_score,
      data.project_support_score,
      data.responsibility_score,
      data.team_quality_score,
    ]);

    return {
      general_performance_total: Math.round(general * 10) / 10,
      personal_skills_total: Math.round(personal * 10) / 10,
      professional_skills_total: Math.round(professional * 10) / 10,
    };
  }

  /**
   * Determine grade based on total score
   */
  private determineGrade(score: number): string {
    if (score > 90) return 'A+';
    if (score > 80) return 'A';
    if (score > 70) return 'B';
    if (score > 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  async saveDraft(studentId: number, data: any) {
    const student = await this.prisma.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }

    const internship = await this.getInternshipForEvaluation(studentId);
    const totalScore = this.calculateTotalScore(data);
    const grade = this.determineGrade(totalScore);
    const sectionTotals = this.calculateSectionTotals(data);

    const existing = await this.prisma.evaluation.findUnique({
      where: { internship_id: internship.internship_id },
    });

    if (existing && existing.status === 'published') {
      throw new BadRequestException('Published evaluations cannot be edited');
    }

    if (existing && !['draft', 'returned'].includes(existing.status)) {
      throw new BadRequestException('Only draft or returned evaluations can be updated');
    }

    if (existing) {
      const updated = await this.prisma.evaluation.update({
        where: { evaluation_id: existing.evaluation_id },
        data: {
          // General Performance
          punctuality_score: data.punctuality_score ?? existing.punctuality_score,
          reliability_score: data.reliability_score ?? existing.reliability_score,
          independence_score: data.independence_score ?? existing.independence_score,
          communication_score: data.communication_score ?? existing.communication_score,
          professionalism_score: data.professionalism_score ?? existing.professionalism_score,
          general_performance_total: sectionTotals.general_performance_total,
          
          // Personal Skills
          speed_of_work_score: data.speed_of_work_score ?? existing.speed_of_work_score,
          accuracy_score: data.accuracy_score ?? existing.accuracy_score,
          engagement_score: data.engagement_score ?? existing.engagement_score,
          need_for_work_score: data.need_for_work_score ?? existing.need_for_work_score,
          cooperation_score: data.cooperation_score ?? existing.cooperation_score,
          personal_skills_total: sectionTotals.personal_skills_total,
          
          // Professional Skills
          technical_skills_score: data.technical_skills_score ?? existing.technical_skills_score,
          organizational_skills_score: data.organizational_skills_score ?? existing.organizational_skills_score,
          project_support_score: data.project_support_score ?? existing.project_support_score,
          responsibility_score: data.responsibility_score ?? existing.responsibility_score,
          team_quality_score: data.team_quality_score ?? existing.team_quality_score,
          professional_skills_total: sectionTotals.professional_skills_total,
          
          // Attendance
          attendance_percentage: data.attendance_percentage ?? existing.attendance_percentage,
          total_absent_days: data.total_absent_days ?? existing.total_absent_days,
          
          total_score: totalScore,
          grade: grade,
          remarks: data.remarks ?? existing.remarks,
          status: 'draft',
        },
        include: {
          student: { include: { user: true } },
          supervisor: { include: { user: true } },
        },
      });
        // If weeks were provided in the form, persist them to attendance
        try {
          await this._persistAttendanceWeeks(internship.internship_id, studentId, data.weeks, data.total_absent_days, internship.assignment?.supervisor_id);
        } catch (err) {
          this.logger.warn(`Failed to persist attendance weeks on draft update for student ${studentId}: ${err}`);
        }

        return updated;
    }

    const evaluation = await this.prisma.evaluation.create({
      data: {
        internship_id: internship.internship_id,
        student_id: studentId,
        supervisor_id: internship.assignment.supervisor_id,
        
        // General Performance
        punctuality_score: data.punctuality_score,
        reliability_score: data.reliability_score,
        independence_score: data.independence_score,
        communication_score: data.communication_score,
        professionalism_score: data.professionalism_score,
        general_performance_total: sectionTotals.general_performance_total,
        
        // Personal Skills
        speed_of_work_score: data.speed_of_work_score,
        accuracy_score: data.accuracy_score,
        engagement_score: data.engagement_score,
        need_for_work_score: data.need_for_work_score,
        cooperation_score: data.cooperation_score,
        personal_skills_total: sectionTotals.personal_skills_total,
        
        // Professional Skills
        technical_skills_score: data.technical_skills_score,
        organizational_skills_score: data.organizational_skills_score,
        project_support_score: data.project_support_score,
        responsibility_score: data.responsibility_score,
        team_quality_score: data.team_quality_score,
        professional_skills_total: sectionTotals.professional_skills_total,
        
        // Attendance
        attendance_percentage: data.attendance_percentage,
        total_absent_days: data.total_absent_days,
        
        total_score: totalScore,
        grade: grade,
        remarks: data.remarks || '',
        status: 'draft',
      },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
      },
    });

    // Persist weekly attendance if present
    try {
      await this._persistAttendanceWeeks(internship.internship_id, studentId, data.weeks, data.total_absent_days, internship.assignment?.supervisor_id);
    } catch (err) {
      this.logger.warn(`Failed to persist attendance weeks on draft create for student ${studentId}: ${err}`);
    }

    return evaluation;
  }

  async _ensureStudentEvaluated(studentId: number, changedBy?: number, note?: string) {
    try {
      const student = await this.prisma.student.findUnique({ where: { student_id: studentId } });
      if (!student) return;
      if (student.status === 'evaluated') return;

      await this.prisma.student.update({ where: { student_id: studentId }, data: { status: 'evaluated' } });
      await this.prisma.statusHistory.create({
        data: {
          entity_type: 'student',
          entity_id: studentId,
          old_status: student.status,
          new_status: 'evaluated',
          changed_by: changedBy || 0,
          comment: note || 'Marked evaluated by system',
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to ensure student ${studentId} marked evaluated: ${err}`);
    }
  }

  private async _persistAttendanceWeeks(internshipId: number, studentId: number, weeks?: any[], totalAbsentDays?: number, markedBy?: number) {
    if (!weeks || !Array.isArray(weeks) || weeks.length === 0) return;

    // Upsert attendance record for this internship
    const attendance = await this.prisma.attendance.upsert({
      where: { internship_id: internshipId },
      create: {
        internship_id: internshipId,
        student_id: studentId,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        percentage: 0,
        attendance_sheet: { weeks },
        total_absent_days: typeof totalAbsentDays === 'number' ? totalAbsentDays : 0,
        marked_by: markedBy || 0,
      },
      update: {
        attendance_sheet: { weeks },
        total_absent_days: typeof totalAbsentDays === 'number' ? totalAbsentDays : undefined,
        marked_by: markedBy || undefined,
      },
    });

    try {
      // Replace detailed week rows: delete existing then recreate
      await this.prisma.attendanceDetail.deleteMany({ where: { attendance_id: attendance.attendance_id } });

      const details = weeks.map((w: any) => ({
        attendance_id: attendance.attendance_id,
        week: w.week ?? null,
        week_start_date: w.week_start_date ? new Date(w.week_start_date) : null,
        week_end_date: w.week_end_date ? new Date(w.week_end_date) : null,
        monday: typeof w.monday === 'boolean' ? w.monday : null,
        tuesday: typeof w.tuesday === 'boolean' ? w.tuesday : null,
        wednesday: typeof w.wednesday === 'boolean' ? w.wednesday : null,
        thursday: typeof w.thursday === 'boolean' ? w.thursday : null,
        friday: typeof w.friday === 'boolean' ? w.friday : null,
      }));

      // Create details in a transaction
      await this.prisma.$transaction(details.map(d => this.prisma.attendanceDetail.create({ data: d })));
    } catch (err) {
      this.logger.warn(`Failed to persist attendance weeks for internship ${internshipId}: ${err}`);
    }
  }

  async submit(studentId: number, data: any) {
    const student = await this.prisma.student.findUnique({
      where: { student_id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${studentId} not found`);
    }

    const internship = await this.getInternshipForEvaluation(studentId);
    const attendance = await this.prisma.attendance.findUnique({
      where: { internship_id: internship.internship_id },
    });

    const resolvedData = {
      ...data,
      attendance_percentage: data.attendance_percentage ?? attendance?.percentage ?? 100,
      total_absent_days: data.total_absent_days ?? attendance?.total_absent_days ?? 0,
    };

    const totalScore = this.calculateTotalScore(resolvedData);
    const grade = this.determineGrade(totalScore);
    const sectionTotals = this.calculateSectionTotals(resolvedData);

    const existing = await this.prisma.evaluation.findUnique({
      where: { internship_id: internship.internship_id },
      select: { evaluation_id: true, status: true },
    });

    if (existing && existing.status === 'published') {
      throw new BadRequestException('Published evaluations cannot be edited');
    }

    await this.prisma.internship.update({
      where: { internship_id: internship.internship_id },
      data: {
        status: 'completed',
        end_date: internship.end_date ?? new Date(),
      },
    });

    await this.prisma.assignment.update({
      where: { internship_id: internship.internship_id },
      data: {
        status: 'completed',
        end_date: internship.end_date ?? new Date(),
      },
    });

    const evaluation = await this.prisma.evaluation.upsert({
      where: { internship_id: internship.internship_id },
      create: {
        internship_id: internship.internship_id,
        student_id: studentId,
        supervisor_id: internship.assignment.supervisor_id,
        
        // General Performance
        punctuality_score: resolvedData.punctuality_score,
        reliability_score: resolvedData.reliability_score,
        independence_score: resolvedData.independence_score,
        communication_score: resolvedData.communication_score,
        professionalism_score: resolvedData.professionalism_score,
        general_performance_total: sectionTotals.general_performance_total,
        
        // Personal Skills
        speed_of_work_score: resolvedData.speed_of_work_score,
        accuracy_score: resolvedData.accuracy_score,
        engagement_score: resolvedData.engagement_score,
        need_for_work_score: resolvedData.need_for_work_score,
        cooperation_score: resolvedData.cooperation_score,
        personal_skills_total: sectionTotals.personal_skills_total,
        
        // Professional Skills
        technical_skills_score: resolvedData.technical_skills_score,
        organizational_skills_score: resolvedData.organizational_skills_score,
        project_support_score: resolvedData.project_support_score,
        responsibility_score: resolvedData.responsibility_score,
        team_quality_score: resolvedData.team_quality_score,
        professional_skills_total: sectionTotals.professional_skills_total,
        
        // Attendance
        attendance_percentage: resolvedData.attendance_percentage,
        total_absent_days: resolvedData.total_absent_days,
        
        total_score: totalScore,
        grade: grade,
        remarks: resolvedData.remarks || '',
        status: 'submitted',
        submitted_at: new Date(),
      },
      update: {
        // General Performance
        punctuality_score: resolvedData.punctuality_score,
        reliability_score: resolvedData.reliability_score,
        independence_score: resolvedData.independence_score,
        communication_score: resolvedData.communication_score,
        professionalism_score: resolvedData.professionalism_score,
        general_performance_total: sectionTotals.general_performance_total,
        
        // Personal Skills
        speed_of_work_score: resolvedData.speed_of_work_score,
        accuracy_score: resolvedData.accuracy_score,
        engagement_score: resolvedData.engagement_score,
        need_for_work_score: resolvedData.need_for_work_score,
        cooperation_score: resolvedData.cooperation_score,
        personal_skills_total: sectionTotals.personal_skills_total,
        
        // Professional Skills
        technical_skills_score: resolvedData.technical_skills_score,
        organizational_skills_score: resolvedData.organizational_skills_score,
        project_support_score: resolvedData.project_support_score,
        responsibility_score: resolvedData.responsibility_score,
        team_quality_score: resolvedData.team_quality_score,
        professional_skills_total: sectionTotals.professional_skills_total,
        
        // Attendance
        attendance_percentage: resolvedData.attendance_percentage,
        total_absent_days: resolvedData.total_absent_days,
        
        total_score: totalScore,
        grade: grade,
        remarks: resolvedData.remarks || '',
        status: 'submitted',
        submitted_at: new Date(),
      },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        internship: {
          include: {
            assignment: {
              include: { supervisor: { include: { user: true } } },
            },
          },
        },
      },
    });

    // Persist weekly attendance if present
    try {
      await this._persistAttendanceWeeks(internship.internship_id, studentId, resolvedData.weeks, resolvedData.total_absent_days, internship.assignment?.supervisor_id);
    } catch (err) {
      this.logger.warn(`Failed to persist attendance weeks on submit for student ${studentId}: ${err}`);
    }

    // Mark student as evaluated so they are no longer considered 'pending'
    try {
      await this.prisma.student.update({
        where: { student_id: studentId },
        data: { status: 'evaluated' },
      });
      // Record status change in history for audit
      await this.prisma.statusHistory.create({
        data: {
          entity_type: 'student',
          entity_id: studentId,
          old_status: student.status,
          new_status: 'evaluated',
          changed_by: internship.assignment?.supervisor_id || 0,
          comment: 'Marked evaluated after supervisor submission',
        },
      });
    } catch (err) {
      // Do not fail the submission if status/history update fails; log and continue
      this.logger.warn(`Failed to update student status after evaluation submission for student ${studentId}: ${err}`);
    }

    return evaluation;
  }

  async getByStudent(studentId: number) {
    const evaluation = await this.prisma.evaluation.findFirst({
      where: { student_id: studentId },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        internship: {
          include: {
            assignment: {
              include: { supervisor: { include: { user: true } } },
            },
          },
        },
      },
    });

    return evaluation || null;
  }

  async getPending() {
    const evaluations = await this.prisma.evaluation.findMany({
      where: { status: 'submitted' },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        internship: {
          include: {
            assignment: {
              include: { supervisor: { include: { user: true } } },
            },
          },
        },
      },
    });

    return evaluations;
  }

  async getAll(status?: string) {
    const normalizedStatus = status?.toLowerCase();
    const evaluations = await this.prisma.evaluation.findMany({
      where: normalizedStatus && normalizedStatus !== 'all'
        ? { status: normalizedStatus }
        : undefined,
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        internship: {
          include: {
            assignment: {
              include: { supervisor: { include: { user: true } } },
            },
          },
        },
      },
      orderBy: [
        { submitted_at: 'desc' },
        { evaluation_id: 'desc' },
      ],
    });

    return evaluations;
  }

  async publish(evaluationId: number, publishedBy: number) {
    const evaluation = await this.prisma.evaluation.update({
      where: { evaluation_id: evaluationId },
      data: {
        status: 'published',
        published_at: new Date(),
        published_by: publishedBy,
      },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        internship: {
          include: {
            assignment: {
              include: { supervisor: { include: { user: true } } },
            },
          },
        },
      },
    });

    const recipientEmail = evaluation.student?.user?.email || evaluation.student?.email;
    if (recipientEmail) {
      try {
        await this.emailService.sendEvaluationPublishedEmail({
          to: recipientEmail,
          studentName: evaluation.student?.full_name || 'Student',
          grade: evaluation.grade || 'N/A',
          score: evaluation.total_score,
          supervisorName: evaluation.supervisor?.user?.full_name || null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to send evaluation publication email to ${recipientEmail}: ${errorMessage}`);
      }
    }

    // Create notification for student
    try {
      const studentUserId = evaluation.student?.user?.user_id;
      if (studentUserId) {
        await this.notificationService.create(
          studentUserId,
          'Evaluation Published',
          `Your internship evaluation has been published. Score: ${evaluation.total_score || 'N/A'}`,
          'EVALUATION',
        );
      }
    } catch (error) {
      console.error('Failed to create evaluation notification:', error);
      // Don't throw - evaluation was already published
    }

    // Ensure student status is evaluated (idempotent)
    try {
      await this._ensureStudentEvaluated(evaluation.student?.student_id, publishedBy, 'Marked evaluated after admin publish');
    } catch (err) {
      this.logger.warn(`Failed to mark student evaluated during publish flow: ${err}`);
    }

    return evaluation;
  }

  async returnForCorrection(evaluationId: number, reason: string) {
    const evaluation = await this.prisma.evaluation.update({
      where: { evaluation_id: evaluationId },
      data: {
        status: 'returned',
        remarks: reason,
      },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        internship: {
          include: {
            assignment: {
              include: { supervisor: { include: { user: true } } },
            },
          },
        },
      },
    });

    // Create notification for student that evaluation was returned
    try {
      const studentUserId = evaluation.student?.user?.user_id;
      if (studentUserId) {
        await this.notificationService.create(
          studentUserId,
          'Evaluation Returned for Correction',
          `Your evaluation was returned with feedback: ${reason}`,
          'EVALUATION',
        );
      }
    } catch (error) {
      console.error('Failed to create return notification:', error);
      // Don't throw - evaluation was already updated
    }

    // Create notification for supervisor so they can act on the returned evaluation
    try {
      const supervisorUserId = evaluation.supervisor?.user?.user_id;
      if (supervisorUserId) {
        await this.notificationService.create(
          supervisorUserId,
          'Evaluation Returned for Correction',
          `An evaluation for ${evaluation.student?.full_name || 'a student'} was returned for correction. Reason: ${reason}`,
          'EVALUATION',
        );
      }
    } catch (error) {
      console.error('Failed to create supervisor return notification:', error);
      // Don't throw - evaluation was already updated
    }

    return evaluation;
  }

  async getPublished(studentId: number) {
    const evaluation = await this.prisma.evaluation.findFirst({
      where: { student_id: studentId, status: 'published' },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        internship: {
          include: {
            assignment: {
              include: { supervisor: { include: { user: true } } },
            },
          },
        },
      },
    });

    return evaluation || null;
  }

  async getPublishedForUser(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { user_id: userId },
    });

    if (!student) {
      return null;
    }

    return this.getPublished(student.student_id);
  }

  async hasPublishedEvaluation(studentId: number): Promise<boolean> {
    const evaluation = await this.prisma.evaluation.findFirst({
      where: { student_id: studentId, status: 'published' },
    });
    return !!evaluation;
  }

  async hasPublishedEvaluationByUserId(userId: number): Promise<boolean> {
    const student = await this.prisma.student.findUnique({
      where: { user_id: userId },
    });
    if (!student) return false;
    return this.hasPublishedEvaluation(student.student_id);
  }

  async downloadGradeReport(studentId: number, publishedOnly = false) {
    const evaluation = await this.prisma.evaluation.findFirst({
      where: {
        student_id: studentId,
        ...(publishedOnly ? { status: 'published' } : {}),
      },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        internship: true,
      },
    });

    if (!evaluation) {
      if (publishedOnly) {
        throw new BadRequestException('Evaluation has not been approved by admin yet');
      }

      throw new NotFoundException(`No evaluation found for student ${studentId}`);
    }

    return evaluation;
  }

  async downloadConsolidatedReport(cohort: string) {
    const evaluations = await this.prisma.evaluation.findMany({
      where: {
        student: {
          department: cohort,
        },
      },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        internship: true,
      },
    });

    return evaluations;
  }

  async getStats() {
    const total = await this.prisma.evaluation.count();
    const published = await this.prisma.evaluation.count({
      where: { status: 'published' },
    });
    const draft = await this.prisma.evaluation.count({
      where: { status: 'draft' },
    });
    const pending = await this.prisma.evaluation.count({
      where: { status: 'submitted' },
    });

    return {
      total,
      published,
      draft,
      pending,
    };
  }

  // Supervisor: Get own evaluations
  async getForSupervisor(supervisorUserId: number) {
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { user_id: supervisorUserId },
    });

    if (!supervisor) return [];

    const evaluations = await this.prisma.evaluation.findMany({
      where: { supervisor_id: supervisor.supervisor_id },
      include: {
        student: { include: { user: true } },
        supervisor: { include: { user: true } },
        internship: {
          include: {
            assignment: {
              include: { supervisor: { include: { user: true } } },
            },
          },
        },
      },
      orderBy: { submitted_at: 'desc' },
    });

    return evaluations;
  }
}
