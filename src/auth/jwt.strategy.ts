import 'dotenv/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request) => {
        return req?.cookies?.['accessToken'] ?? null;
      },
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    if (!payload) {
      throw new UnauthorizedException();
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
