import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import axios from 'axios';
import * as crypto from 'crypto';
import type { PaymentIntent, PaymentMethod } from '@zhim/types';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly db: DataSource,
    private readonly cfg: ConfigService,
  ) {}

  async initiate(orderId: string, method: PaymentMethod): Promise<PaymentIntent> {
    const [order] = await this.db.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId],
    );
    if (!order) throw new BadRequestException('Order not found');

    const [existing] = await this.db.query(
      'SELECT * FROM payments WHERE order_id = $1 AND status NOT IN ($2, $3)',
      [orderId, 'failed', 'refunded'],
    );
    if (existing) throw new BadRequestException('Payment already initiated');

    switch (method) {
      case 'cod':     return this.initiateCod(order);
      case 'mbob':    return this.initiateMBoB(order);
      case 'mypay':   return this.initiateMyPay(order);
      case 'bob_qr':  return this.initiateBoBQR(order);
      case 'bnb_pay': return this.initiateBNBPay(order);
      default:        throw new BadRequestException(`Payment method '${method}' not supported`);
    }
  }

  private async initiateCod(order: any): Promise<PaymentIntent> {
    const [payment] = await this.db.query(
      `INSERT INTO payments (order_id, method, status, amount_nu, currency)
       VALUES ($1, 'cod', 'pending', $2, 'BTN') RETURNING *`,
      [order.id, order.total_nu],
    );
    return {
      payment_id: payment.id,
      order_id: order.id,
      method: 'cod',
      amount_nu: order.total_nu,
      instructions_en: `Keep Nu. ${order.total_nu} ready for the rider.`,
      instructions_dz: `སྐྱིན་པ་ལུ་ Nu. ${order.total_nu} ལྡན།`,
    };
  }

  private async initiateMBoB(order: any): Promise<PaymentIntent> {
    const merchantId = this.cfg.get('MBOB_MERCHANT_ID');
    const apiKey = this.cfg.get('MBOB_API_KEY');

    const [payment] = await this.db.query(
      `INSERT INTO payments (order_id, method, status, amount_nu, currency)
       VALUES ($1, 'mbob', 'initiated', $2, 'BTN') RETURNING *`,
      [order.id, order.total_nu],
    );

    try {
      const response = await axios.post(
        `${this.cfg.get('MBOB_API_URL')}/qr/generate`,
        {
          merchant_id: merchantId,
          amount: order.total_nu,
          currency: 'BTN',
          reference: order.order_number,
          payment_id: payment.id,
          callback_url: `${this.cfg.get('API_URL')}/api/v1/payments/webhook/mbob`,
        },
        { headers: { 'X-API-Key': apiKey } },
      );

      const qrExpiresAt = new Date(Date.now() + 10 * 60 * 1000);  // 10 min

      await this.db.query(
        `UPDATE payments SET provider_ref = $1, qr_code_url = $2, qr_expires_at = $3
         WHERE id = $4`,
        [response.data.txn_id, response.data.qr_url, qrExpiresAt, payment.id],
      );

      return {
        payment_id: payment.id,
        order_id: order.id,
        method: 'mbob',
        amount_nu: order.total_nu,
        qr_code_url: response.data.qr_url,
        deep_link_url: `mbob://pay?ref=${response.data.txn_id}&amount=${order.total_nu}`,
        qr_expires_at: qrExpiresAt.toISOString(),
        instructions_en: 'Scan QR with mBoB or tap "Open mBoB" to pay.',
        instructions_dz: 'མི་བོབ་གིས་ QR ཤིང་རྟགས་ལ་ལྟ། ཡང་ན་མི་བོབ་ཕྱེ།',
      };
    } catch (err) {
      await this.db.query(`UPDATE payments SET status = 'failed' WHERE id = $1`, [payment.id]);
      this.logger.error(`mBoB initiate failed: ${err.message}`);
      throw new BadRequestException('mBoB payment initiation failed. Try another method.');
    }
  }

  private async initiateMyPay(order: any): Promise<PaymentIntent> {
    // MyPay integration — same pattern as mBoB
    const [payment] = await this.db.query(
      `INSERT INTO payments (order_id, method, status, amount_nu, currency)
       VALUES ($1, 'mypay', 'initiated', $2, 'BTN') RETURNING *`,
      [order.id, order.total_nu],
    );
    return {
      payment_id: payment.id,
      order_id: order.id,
      method: 'mypay',
      amount_nu: order.total_nu,
      deep_link_url: `mypay://pay?merchant=${this.cfg.get('MYPAY_MERCHANT_ID')}&amount=${order.total_nu}&ref=${order.order_number}`,
      instructions_en: 'Tap "Open MyPay" to complete payment.',
      instructions_dz: 'མའི་པེ་ཕྱེ་ཞིང་དངུལ་སྤྲད།',
    };
  }

  private async initiateBoBQR(order: any): Promise<PaymentIntent> {
    const [payment] = await this.db.query(
      `INSERT INTO payments (order_id, method, status, amount_nu, currency)
       VALUES ($1, 'bob_qr', 'initiated', $2, 'BTN') RETURNING *`,
      [order.id, order.total_nu],
    );
    return {
      payment_id: payment.id,
      order_id: order.id,
      method: 'bob_qr',
      amount_nu: order.total_nu,
      instructions_en: 'Scan the BoB QR code with any UPI-compatible app.',
      instructions_dz: 'BoB QR ཤིང་རྟགས་ UPI གློག་ཀླད་ཆས་གིས་ལྟ།',
    };
  }

  private async initiateBNBPay(order: any): Promise<PaymentIntent> {
    const [payment] = await this.db.query(
      `INSERT INTO payments (order_id, method, status, amount_nu, currency)
       VALUES ($1, 'bnb_pay', 'initiated', $2, 'BTN') RETURNING *`,
      [order.id, order.total_nu],
    );
    return {
      payment_id: payment.id,
      order_id: order.id,
      method: 'bnb_pay',
      amount_nu: order.total_nu,
      deep_link_url: `bnbpay://pay?amount=${order.total_nu}&ref=${order.order_number}`,
      instructions_en: 'Tap "Open BNB Pay" to complete payment.',
      instructions_dz: 'BNB པེ་ཕྱེ་ཞིང་དངུལ་སྤྲད།',
    };
  }

  async handleWebhook(provider: string, payload: any, signature: string): Promise<void> {
    this.verifyWebhookSignature(provider, payload, signature);

    const { payment_id, status, txn_id } = this.normaliseWebhookPayload(provider, payload);

    await this.db.query(
      `UPDATE payments
       SET status = $1, provider_ref = $2, provider_payload = $3, updated_at = NOW()
       WHERE id = $4`,
      [status, txn_id, JSON.stringify(payload), payment_id],
    );

    if (status === 'completed') {
      const [payment] = await this.db.query('SELECT * FROM payments WHERE id = $1', [payment_id]);
      if (payment) {
        // Trigger order confirmation
        await this.db.query(
          `UPDATE orders SET status = 'confirmed', confirmed_at = NOW() WHERE id = $1`,
          [payment.order_id],
        );
      }
    }
  }

  private verifyWebhookSignature(provider: string, payload: any, signature: string): void {
    const secret = this.cfg.getOrThrow('PAYMENT_WEBHOOK_SECRET');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    if (signature !== expected) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private normaliseWebhookPayload(
    provider: string,
    payload: any,
  ): { payment_id: string; status: string; txn_id: string } {
    // Each provider uses different field names — normalise here
    if (provider === 'mbob') {
      return {
        payment_id: payload.reference_id,
        status: payload.status === 'SUCCESS' ? 'completed' : 'failed',
        txn_id: payload.transaction_id,
      };
    }
    throw new BadRequestException(`Unknown provider: ${provider}`);
  }

  async refund(orderId: string, amountNu: number, reason: string): Promise<void> {
    const [payment] = await this.db.query(
      `SELECT * FROM payments WHERE order_id = $1 AND status = 'completed' LIMIT 1`,
      [orderId],
    );
    if (!payment) throw new BadRequestException('No completed payment to refund');

    // Initiate refund via provider
    if (payment.method === 'mbob') {
      await axios.post(
        `${this.cfg.get('MBOB_API_URL')}/refund`,
        { transaction_id: payment.provider_ref, amount: amountNu, reason },
        { headers: { 'X-API-Key': this.cfg.get('MBOB_API_KEY') } },
      );
    }

    await this.db.query(
      `UPDATE payments
       SET status = 'refunded', refunded_amount_nu = $1, refunded_at = NOW()
       WHERE id = $2`,
      [amountNu, payment.id],
    );

    await this.db.query(
      `UPDATE orders SET status = 'refunded' WHERE id = $1`,
      [orderId],
    );
  }
}
