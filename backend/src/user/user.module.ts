import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../common/email.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [PrismaModule, ActivityLogModule],
  controllers: [UserController],
  providers: [UserService, EmailService],
  exports: [UserService],
})
export class UserModule {}
