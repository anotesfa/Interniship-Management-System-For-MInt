import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { StudentGroupModule } from '../student-group/student-group.module';

@Module({
  imports: [PrismaModule, EvaluationModule, StudentGroupModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
