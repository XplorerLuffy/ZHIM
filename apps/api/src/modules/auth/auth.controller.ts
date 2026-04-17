import { Controller, Post, Body, HttpCode, UseGuards, Get, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { IsString, Matches, Length } from 'class-validator';

class RequestOtpDto {
  @IsString()
  @Matches(/^[+]?[0-9]{8,15}$/, { message: 'Invalid phone number' })
  phone: string;
}

class VerifyOtpDto {
  @IsString()
  @Matches(/^[+]?[0-9]{8,15}$/)
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  @Matches(/^[0-9]{6}$/)
  code: string;
}

class RefreshDto {
  @IsString()
  refresh_token: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @HttpCode(200)
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @HttpCode(200)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phone, dto.code);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refreshTokens(dto.refresh_token);
  }
}
