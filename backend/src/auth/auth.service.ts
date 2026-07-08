import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async login(loginDto: any) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.account_status === 'locked') {
      throw new UnauthorizedException('User locked. Contact admin in person');
    }

    if (user.account_status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      // Logic for failed_login_count would go here
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed login count if successful
    await this.prisma.user.update({
      where: { user_id: user.user_id },
      data: { failed_login_count: 0, last_login: new Date() },
    });

    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role.role_name,
      jti: uuidv4(), // Unique token identifier for Redis denylist
    };

    const accessToken = this.jwtService.sign(payload);

    void this.activityLogService.log(user.user_id, 'LOGIN', 'Auth', user.user_id);

    return {
      accessToken,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.full_name,
        role: user.role.role_name,
      },
    };
  }

  async logout(userId: number, jti: string, exp: number) {
    // Logic to add 'jti' to Redis denylist would go here
    return { success: true };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        role: true,
        student: true,
        supervisor: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.user_id,
      email: user.email,
      name: user.full_name,
      role: user.role.role_name,
      accountStatus: user.account_status,
      createdAt: user.created_at,
      student: user.student || null,
      supervisor: user.supervisor || null,
    };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { user_id: userId },
      data: { password_hash: hashedPassword },
    });

    void this.activityLogService.log(userId, 'CHANGE_PASSWORD', 'Auth', userId);

    return { success: true };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      return null;
    }

    if (user.account_status !== 'active') {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
