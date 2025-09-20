import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    // Valida usuario y contraseña
    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }
        if (!user.password) {
            throw new UnauthorizedException('Usuario registrado solo con Google');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Contraseña incorrecta');
        }
        const { password: _, ...result } = user;
        return result;
    }

    // Genera el JWT
    async login(user: any) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async validateGoogleUser(body: { email: string; googleId: string; firstName?: string; lastName?: string; avatar?: string }) {
        let user = await this.usersService.findByEmail(body.email);

        if (!user) {
            user = await this.usersService.create({
                email: body.email,
                googleId: body.googleId,
                firstName: body.firstName || '',
                lastName: body.lastName || '',
                avatar: body.avatar,
            });
        } else if (user.googleId !== body.googleId) {
            throw new UnauthorizedException('El Google ID no coincide con el usuario registrado');
        }

        const { password, ...result } = user;
        return result;
    }
}
