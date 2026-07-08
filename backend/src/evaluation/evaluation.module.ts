import { Module } from '@nestjs/common';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../common/email.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [EvaluationController],
  providers: [EvaluationService, EmailService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
