import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MessageService } from './message.service';

@Controller('messages')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // Send a message to another user
  @Post()
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async send(@Body() body: any, @Request() req: any) {
    const message = await this.messageService.send(
      req.user.userId,
      Number(body.receiverId),
      body.messageText,
    );
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Message sent successfully',
      data: message,
      error: null,
    };
  }

  // Get all conversation threads for the current user (sidebar list)
  @Get('threads')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async getThreads(@Request() req: any) {
    const threads = await this.messageService.getThreadsForUser(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Threads retrieved successfully',
      data: threads,
      error: null,
    };
  }

  @Get('contacts')
  @Roles('Admin', 'University Coordinator', 'Supervisor')
  async getContacts(@Request() req: any, @Query('pair') pair?: string) {
    const contacts = await this.messageService.getAvailableContactsForUser(req.user.userId, pair || 'merged');
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Message contacts retrieved successfully',
      data: contacts,
      error: null,
    };
  }

  // Get full conversation thread with a specific user
  @Get('with/:otherUserId')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async getThreadWith(
    @Param('otherUserId') otherUserId: string,
    @Request() req: any,
  ) {
    const thread = await this.messageService.getThreadWith(
      req.user.userId,
      parseInt(otherUserId),
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Thread retrieved successfully',
      data: thread,
      error: null,
    };
  }

  // Get conversation by userId (legacy — kept for compatibility)
  @Get('conversation/:userId')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async getConversation(
    @Param('userId') userId: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Request() req: any,
  ) {
    const result = await this.messageService.getConversation(
      req.user.userId,
      parseInt(userId),
      parseInt(limit) || 50,
      parseInt(offset) || 0,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Conversation retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      error: null,
    };
  }

  @Get('inbox')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async getInbox(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Request() req: any,
  ) {
    const result = await this.messageService.getInbox(
      req.user.userId,
      parseInt(limit) || 50,
      parseInt(offset) || 0,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Inbox retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      error: null,
    };
  }

  @Get('unread')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async getUnread(@Request() req: any) {
    const messages = await this.messageService.getUnread(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Unread messages retrieved successfully',
      data: messages,
      error: null,
    };
  }

  @Post(':id/read')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async markAsRead(@Param('id') id: string) {
    const message = await this.messageService.markAsRead(parseInt(id));
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Message marked as read',
      data: message,
      error: null,
    };
  }

  @Post('read-all')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async markAllAsRead(@Request() req: any) {
    await this.messageService.markAllAsRead(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'All messages marked as read',
      data: null,
      error: null,
    };
  }

  @Delete(':id')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async delete(@Param('id') id: string) {
    await this.messageService.delete(parseInt(id));
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Message deleted successfully',
      data: null,
      error: null,
    };
  }
}
