import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ApplicationModule } from './application/application.module';
import { AssignmentModule } from './assignment/assignment.module';
import { UserModule } from './user/user.module';
import { SupervisorModule } from './supervisor/supervisor.module';
import { UniversityModule } from './university/university.module';
import { MilestoneModule } from './milestone/milestone.module';
import { AttendanceModule } from './attendance/attendance.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { DocumentModule } from './document/document.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { MonthlyReportModule } from './monthly-report/monthly-report.module';
import { ReportModule } from './report/report.module';
import { PrismaModule } from './prisma/prisma.module';
import { StudentGroupModule } from './student-group/student-group.module';
import { TemplateModule } from './template/template.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        JWT_PRIVATE_KEY_PATH: Joi.string().required(),
        JWT_PUBLIC_KEY_PATH: Joi.string().required(),
        JWT_EXPIRY_MINUTES: Joi.number().default(60),
        FRONTEND_URL: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: 1000,
      limit: 9999,
    }]),
    AuthModule,
    ApplicationModule,
    AssignmentModule,
    UserModule,
    SupervisorModule,
    UniversityModule,
    MilestoneModule,
    AttendanceModule,
    EvaluationModule,
    MessageModule,
    NotificationModule,
    DocumentModule,
    ActivityLogModule,
    MonthlyReportModule,
    ReportModule,
    StudentGroupModule,
    TemplateModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}



