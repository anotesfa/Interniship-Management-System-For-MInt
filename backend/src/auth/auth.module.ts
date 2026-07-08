import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import * as fs from 'fs';

@Module({
  imports: [
    PrismaModule,
    ActivityLogModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const privateKeyPath = configService.get<string>('JWT_PRIVATE_KEY_PATH');
        const publicKeyPath = configService.get<string>('JWT_PUBLIC_KEY_PATH');
        
        if (!privateKeyPath || !publicKeyPath) {
            throw new Error('CRITICAL SECURITY ERROR: JWT_PRIVATE_KEY_PATH or JWT_PUBLIC_KEY_PATH is missing from .env');
        }

        let privateKey: Buffer;
        let publicKey: Buffer;
        
        try {
            privateKey = fs.readFileSync(privateKeyPath);
            publicKey = fs.readFileSync(publicKeyPath);
        } catch (e) {
            throw new Error(`CRITICAL SECURITY ERROR: Could not read RS256 keys at paths: ${privateKeyPath}, ${publicKeyPath}. Ensure generate-keys.js was run.`);
        }

        return {
          privateKey,
          publicKey,
          signOptions: { 
            expiresIn: (configService.get<string>('JWT_EXPIRY_MINUTES') + 'm') as any,
            algorithm: 'RS256'
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
