import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { BulkApplicationService } from './bulk-application.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentModule } from '../document/document.module';
import { EmailService } from '../common/email.service';
import { UniversityModule } from '../university/university.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, DocumentModule, UniversityModule, NotificationModule],
  controllers: [ApplicationController],
  providers: [ApplicationService, BulkApplicationService, EmailService],
  exports: [ApplicationService, BulkApplicationService],
})
export class ApplicationModule {}
