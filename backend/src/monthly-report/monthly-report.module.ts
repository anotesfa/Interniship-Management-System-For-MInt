import { Module } from '@nestjs/common';
import { MonthlyReportController } from './monthly-report.controller';
import { MonthlyReportService } from './monthly-report.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { StudentGroupModule } from '../student-group/student-group.module';

@Module({
  imports: [PrismaModule, EvaluationModule, StudentGroupModule],
  controllers: [MonthlyReportController],
  providers: [MonthlyReportService],
  exports: [MonthlyReportService],
})
export class MonthlyReportModule {}
