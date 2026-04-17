import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService, private readonly db: DataSource) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const [user] = await this.db.query(
      'SELECT id, phone, name, role, is_active, language_pref FROM users WHERE id = $1',
      [payload.sub],
    );
    if (!user || !user.is_active) throw new UnauthorizedException();
    return user;
  }
}
