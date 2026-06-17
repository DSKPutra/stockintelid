import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  async sendOTP(@Body() body: { email: string }) {
    return this.authService.sendOTP(body.email);
  }

  @Post('verify-otp')
  async verifyOTP(@Body() body: { email: string; code: string }) {
    return this.authService.verifyOTP(body.email, body.code);
  }

  @Get('profile')
  async getProfile(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token otorisasi diperlukan');
    }
    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Token kosong');
    return this.authService.validateToken(token);
  }
}
