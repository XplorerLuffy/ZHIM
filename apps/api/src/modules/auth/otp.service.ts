import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const OTP_PREFIX = 'zhim:otp:';
const BLOCK_PREFIX = 'zhim:otp:block:';

@Injectable()
export class OtpService {
  constructor(
    @Inject('REDIS') private readonly redis: Redis,
    private readonly cfg: ConfigService,
  ) {}

  generate(): string {
    // 6-digit OTP
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async store(phone: string, code: string): Promise<void> {
    const hash = await bcrypt.hash(code, 8);
    const expirySeconds = parseInt(this.cfg.get('OTP_EXPIRY_SECONDS', '180'));
    await this.redis.setex(
      `${OTP_PREFIX}${phone}`,
      expirySeconds,
      JSON.stringify({ hash, attempts: 0 }),
    );
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const maxAttempts = parseInt(this.cfg.get('MAX_OTP_ATTEMPTS', '3'));

    // Check block
    const blocked = await this.redis.get(`${BLOCK_PREFIX}${phone}`);
    if (blocked) return false;

    const raw = await this.redis.get(`${OTP_PREFIX}${phone}`);
    if (!raw) return false;

    const { hash, attempts } = JSON.parse(raw);

    if (attempts >= maxAttempts) {
      await this.redis.setex(`${BLOCK_PREFIX}${phone}`, 600, '1');  // 10 min block
      await this.redis.del(`${OTP_PREFIX}${phone}`);
      return false;
    }

    const match = await bcrypt.compare(code, hash);

    if (!match) {
      // Increment attempts
      const remaining = await this.redis.ttl(`${OTP_PREFIX}${phone}`);
      await this.redis.setex(
        `${OTP_PREFIX}${phone}`,
        remaining,
        JSON.stringify({ hash, attempts: attempts + 1 }),
      );
      return false;
    }

    await this.redis.del(`${OTP_PREFIX}${phone}`);
    return true;
  }
}
