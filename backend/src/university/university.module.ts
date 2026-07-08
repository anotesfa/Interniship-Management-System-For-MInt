import { Module } from '@nestjs/common';
import { UniversityService } from './university.service';
import { UniversityController } from './university.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../common/email.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [UniversityController],
  providers: [UniversityService, EmailService],
  exports: [UniversityService],
})
export class UniversityModule {}
