import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'default_secret'), // Valor por defecto opcional
        });
    }

    async validate(payload: any) {
        console.log('🔍 JWT Strategy - payload:', payload);
        const user = { id: payload.sub, userId: payload.sub, email: payload.email };
        console.log('🔍 JWT Strategy - returning user:', user);
        return user;
    }
}