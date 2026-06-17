import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserProfile } from '@idx/shared';

@Injectable()
export class AuthService {
  private users = new Map<string, UserProfile>();

  constructor() {
    // Akun demo bawaan
    this.users.set('demo@idxapp.com', {
      email: 'demo@idxapp.com',
      role: 'premium',
      createdAt: new Date().toISOString(),
    });
  }

  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    // Simulasi pengiriman OTP
    console.log(`[AUTH] Mengirim OTP 123456 ke email: ${email}`);
    return { success: true, message: 'OTP terkirim ke email Anda (Gunakan kode: 123456)' };
  }

  async verifyOTP(email: string, code: string): Promise<{ token: string; profile: UserProfile }> {
    if (code !== '123456') {
      throw new UnauthorizedException('Kode OTP salah atau kedaluwarsa');
    }

    let user = this.users.get(email);
    if (!user) {
      user = {
        email,
        role: 'free',
        createdAt: new Date().toISOString(),
      };
      this.users.set(email, user);
    }

    // Buat token sederhana (mock JWT)
    const token = Buffer.from(JSON.stringify({ email: user.email, role: user.role })).toString('base64');

    return { token, profile: user };
  }

  async validateToken(token: string): Promise<UserProfile> {
    try {
      const payloadStr = Buffer.from(token, 'base64').toString('utf8');
      const payload = JSON.parse(payloadStr);
      const user = this.users.get(payload.email);
      if (!user) throw new UnauthorizedException('User tidak ditemukan');
      return user;
    } catch {
      throw new UnauthorizedException('Token tidak valid');
    }
  }
}
