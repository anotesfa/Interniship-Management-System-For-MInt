import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const publicKeyPath = configService.get<string>('JWT_PUBLIC_KEY_PATH');
    
    if (!publicKeyPath) {
        throw new Error('CRITICAL SECURITY ERROR: JWT_PUBLIC_KEY_PATH is missing from .env');
    }

    let publicKey: Buffer;
    try {
        publicKey = fs.readFileSync(publicKeyPath);
    } catch (e) {
        throw new Error(`CRITICAL SECURITY ERROR: Could not read RS256 public key at path: ${publicKeyPath}. Ensure generate-keys.js was run.`);
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'] as any,
    });
  }

  async validate(payload: any) {
    // Check Redis Denylist for payload.jti here
    
    // Return the user object (attached to req.user)
    const userId = Number(payload.sub);

    return {
      sub: userId,
      userId,
      role: payload.role,
      email: payload.email,
    };
  }
}
