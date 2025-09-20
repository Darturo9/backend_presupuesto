import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authService.login(user);
  }

  @Post('google')
  async googleLogin(@Body() body: { email: string; googleId: string; firstName?: string; lastName?: string; avatar?: string }) {
    const user = await this.authService.validateGoogleUser(body);
    if (!user) {
      throw new UnauthorizedException('No se pudo autenticar con Google');
    }
    return this.authService.login(user);
  }
}
