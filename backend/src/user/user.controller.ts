import {
  Controller,
  Get,
  Post,
  Put,
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
import { UserService } from './user.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('Admin')
  async create(@Body() body: any) {
    const user = await this.userService.create(body);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'User created successfully',
      data: user,
      error: null,
    };
  }

  @Get()
  @Roles('Admin')
  async getAll(@Query('limit') limit: string, @Query('offset') offset: string) {
    const result = await this.userService.getAll(
      parseInt(limit) || 50,
      parseInt(offset) || 0,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      error: null,
    };
  }

  @Get('students')
  @Roles('Admin', 'University Coordinator')
  async getStudents(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
  ) {
    const result = await this.userService.getStudents(
      parseInt(limit) || 50,
      parseInt(offset) || 0,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Students retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      error: null,
    };
  }

  @Get('supervisors')
  @Roles('Admin', 'University Coordinator')
  async getSupervisors(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
  ) {
    const result = await this.userService.getSupervisors(
      parseInt(limit) || 50,
      parseInt(offset) || 0,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Supervisors retrieved successfully',
      data: result.data,
      pagination: result.pagination,
      error: null,
    };
  }

  @Get(':id')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async findById(@Param('id') id: string, @Request() req: any) {
    const userId = parseInt(id);

    // Students can only view their own profile
    if (req.user.role === 'Student' && req.user.sub !== userId) {
      return {
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Access denied',
        data: null,
        error: 'You can only view your own profile',
      };
    }

    const user = await this.userService.findById(userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data: user,
      error: null,
    };
  }

  @Put(':id')
  @Roles('Admin')
  async update(@Param('id') id: string, @Body() body: any) {
    const user = await this.userService.update(parseInt(id), body);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: user,
      error: null,
    };
  }

  @Delete(':id')
  @Roles('Admin')
  async delete(@Param('id') id: string) {
    await this.userService.delete(parseInt(id));
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User deleted successfully',
      data: null,
      error: null,
    };
  }

  @Post(':id/reset-password')
  @Roles('Admin')
  async resetPassword(@Param('id') id: string) {
    const user = await this.userService.resetPassword(parseInt(id));
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Password reset successfully. A new temporary password was emailed to the user.',
      data: user,
      error: null,
    };
  }

  @Post(':id/lock')
  @Roles('Admin')
  async lockAccount(@Param('id') id: string) {
    const result = await this.userService.lockAccount(parseInt(id));
    return {
      success: result.success,
      statusCode: HttpStatus.OK,
      message: 'Account locked successfully',
      data: null,
      error: null,
    };
  }

  @Post(':id/unlock')
  @Roles('Admin')
  async unlockAccount(@Param('id') id: string) {
    const result = await this.userService.unlockAccount(parseInt(id));
    return {
      success: result.success,
      statusCode: HttpStatus.OK,
      message: 'Account unlocked successfully',
      data: null,
      error: null,
    };
  }
}
