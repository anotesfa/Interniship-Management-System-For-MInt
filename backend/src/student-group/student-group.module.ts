import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentGroupService } from './student-group.service';
import { StudentGroupController } from './student-group.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StudentGroupController],
  providers: [StudentGroupService],
  exports: [StudentGroupService],
})
export class StudentGroupModule {}
