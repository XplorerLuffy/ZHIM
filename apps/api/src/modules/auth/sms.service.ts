import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly cfg: ConfigService) {}

  async send(phone: string, message: string): Promise<void> {
    // Try TashiCell first, then BT Gateway, then Twilio fallback
    const isTashiCell = phone.startsWith('+97517') || phone.startsWith('+97516');
    const isBT = phone.startsWith('+97577') || phone.startsWith('+97514');

    try {
      if (isTashiCell && this.cfg.get('TASHICELL_API_KEY')) {
        await this.sendViaTashiCell(phone, message);
      } else if (isBT && this.cfg.get('BT_SMS_API_KEY')) {
        await this.sendViaBT(phone, message);
      } else {
        await this.sendViaTwilio(phone, message);
      }
    } catch (err) {
      this.logger.error(`SMS failed for ${phone}: ${err.message}`);
      // In development, just log the OTP
      if (this.cfg.get('NODE_ENV') === 'development') {
        this.logger.log(`[DEV OTP] ${phone}: ${message}`);
      }
    }
  }

  private async sendViaTashiCell(phone: string, message: string): Promise<void> {
    await axios.post(
      this.cfg.get('TASHICELL_API_URL'),
      { to: phone, message, sender_id: 'ZHIM' },
      { headers: { Authorization: `Bearer ${this.cfg.get('TASHICELL_API_KEY')}` } },
    );
  }

  private async sendViaBT(phone: string, message: string): Promise<void> {
    await axios.post(
      this.cfg.get('BT_SMS_API_URL'),
      { msisdn: phone, text: message, from: 'ZHIM' },
      { headers: { 'X-API-Key': this.cfg.get('BT_SMS_API_KEY') } },
    );
  }

  private async sendViaTwilio(phone: string, message: string): Promise<void> {
    const sid = this.cfg.get('TWILIO_ACCOUNT_SID');
    const token = this.cfg.get('TWILIO_AUTH_TOKEN');
    if (!sid || !token) throw new Error('No SMS provider configured');

    await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      new URLSearchParams({
        To: phone,
        From: this.cfg.get('TWILIO_FROM_NUMBER'),
        Body: message,
      }),
      { auth: { username: sid, password: token } },
    );
  }
}
