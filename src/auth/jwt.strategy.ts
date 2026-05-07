import "dotenv/config";
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_ACCESS_SECRET!,
        });
    }

    async validate(payload: any) {
        console.log("Access token validated for user:", payload.sub);
        return {
            sub: payload.sub,
            email: payload.email,
            role: payload.role
        }
    }
}
