import { Module } from '@nestjs/common';
import { MilestoneController } from './milestone.controller';
import { MilestoneService } from './milestone.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { DocumentService } from '../document/document.service';
import { StudentGroupModule } from '../student-group/student-group.module';

@Module({
  imports: [PrismaModule, EvaluationModule, StudentGroupModule],
  controllers: [MilestoneController],
  providers: [MilestoneService, DocumentService],
  exports: [MilestoneService],
})
export class MilestoneModule {}
