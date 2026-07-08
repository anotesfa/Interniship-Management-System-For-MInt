import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const data = await this.authService.login(body);
    
    // Wrapping response in standard IMS envelope
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data,
      error: null
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: any,
    @Body() body: { current_password: string; new_password: string },
  ) {
    const data = await this.authService.changePassword(
      req.user.userId,
      body.current_password,
      body.new_password,
    );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Password changed successfully',
      data,
      error: null,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    const data = await this.authService.logout(req.user.userId, req.user.jti, req.user.exp);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Logout successful',
      data,
      error: null,
    };
  }

  // Example Protected Route
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Request() req: any) {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Profile retrieved successfully',
      data: req.user,
      error: null
    };
  }
}
