import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';
import type { AuthTokens, User } from '@zhim/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
    private readonly otp: OtpService,
    private readonly sms: SmsService,
    private readonly db: DataSource,
  ) {}

  async requestOtp(phone: string): Promise<{ message: string; expires_in: number }> {
    const normalised = this.normalisePhone(phone);
    const code = this.otp.generate();
    await this.otp.store(normalised, code);
    await this.sms.send(normalised, `Your Zhim OTP is: ${code}. Valid for 3 minutes.`);
    return { message: 'OTP sent', expires_in: 180 };
  }

  async verifyOtp(phone: string, code: string): Promise<AuthTokens & { user: User; is_new: boolean }> {
    const normalised = this.normalisePhone(phone);
    const valid = await this.otp.verify(normalised, code);
    if (!valid) throw new UnauthorizedException('Invalid or expired OTP');

    let user = await this.db.query(
      'SELECT * FROM users WHERE phone = $1 LIMIT 1',
      [normalised],
    );

    let isNew = false;
    if (!user.length) {
      const referralCode = this.generateReferralCode();
      const result = await this.db.query(
        `INSERT INTO users (phone, referral_code) VALUES ($1, $2)
         RETURNING *`,
        [normalised, referralCode],
      );
      user = result;
      isNew = true;
    }

    const tokens = await this.issueTokens(user[0]);
    return { ...tokens, user: user[0], is_new: isNew };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.cfg.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') throw new UnauthorizedException('Wrong token type');

    const user = await this.db.query('SELECT id, is_active FROM users WHERE id = $1', [payload.sub]);
    if (!user.length || !user[0].is_active) throw new UnauthorizedException('User not found or inactive');

    return this.issueTokens(user[0]);
  }

  private async issueTokens(user: { id: string; role: string }): Promise<AuthTokens> {
    const access_token = this.jwt.sign(
      { sub: user.id, role: user.role },
      { expiresIn: this.cfg.get('JWT_EXPIRES_IN', '15m') },
    );
    const refresh_token = this.jwt.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.cfg.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.cfg.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      },
    );
    return { access_token, refresh_token, expires_in: 900 };
  }

  private normalisePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('975')) return `+${digits}`;
    if (digits.length === 8) return `+975${digits}`;
    if (digits.startsWith('0')) return `+975${digits.slice(1)}`;
    throw new BadRequestException('Invalid Bhutanese phone number');
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
