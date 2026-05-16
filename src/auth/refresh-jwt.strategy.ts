import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
      passReqToCallback: true,
    });
  }
    
  async validate(req: Request, payload: any) {
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const resolvedUser = await this.prisma.user.findUnique({
        where: { id: payload.sub, email: payload.email, refreshToken: refreshToken }
    });
    if(!resolvedUser) {
        // invalidate user tokens
    }
    else {
        if(resolvedUser.refreshTokenExpiry && new Date()  > resolvedUser.refreshTokenExpiry) {
            // invalidate user tokens and 
        }
        console.log('Refresh token validated for user:', payload.sub);
        return {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
        };
    }
  }
}
