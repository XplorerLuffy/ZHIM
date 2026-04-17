import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import axios from 'axios';

const LOYVERSE_API = 'https://api.loyverse.com/v1.0';

@Injectable()
export class LoyverseService {
  private readonly logger = new Logger(LoyverseService.name);

  constructor(
    private readonly db: DataSource,
    private readonly cfg: ConfigService,
  ) {}

  // Pull menu from Loyverse → Zhim every N minutes
  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncAllRestaurants(): Promise<void> {
    const restaurants = await this.db.query(
      `SELECT id, loyverse_store_id, loyverse_token
       FROM restaurants
       WHERE status = 'active' AND loyverse_store_id IS NOT NULL`,
    );

    for (const r of restaurants) {
      await this.syncRestaurant(r.id, r.loyverse_store_id, r.loyverse_token);
    }
  }

  async syncRestaurant(restaurantId: string, storeId: string, token: string): Promise<void> {
    const [logEntry] = await this.db.query(
      `INSERT INTO loyverse_sync_logs (restaurant_id, sync_type, status, started_at)
       VALUES ($1, 'menu_pull', 'pending', NOW()) RETURNING id`,
      [restaurantId],
    );

    try {
      const items = await this.fetchLoyverseItems(storeId, token);
      const categories = await this.fetchLoyverseCategories(storeId, token);

      await this.db.transaction(async (manager) => {
        // Upsert categories
        for (const cat of categories) {
          await manager.query(
            `INSERT INTO menu_categories (restaurant_id, name, sort_order)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [restaurantId, cat.name, cat.sort_order ?? 0],
          );
        }

        // Upsert items
        let synced = 0;
        for (const item of items) {
          const [existingCat] = await manager.query(
            `SELECT id FROM menu_categories WHERE restaurant_id = $1 AND name = $2 LIMIT 1`,
            [restaurantId, item.category_name ?? 'General'],
          );

          const categoryId = existingCat?.id;
          if (!categoryId) continue;

          await manager.query(
            `INSERT INTO menu_items
               (restaurant_id, category_id, name, base_price_nu, is_available, loyverse_item_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (loyverse_item_id) DO UPDATE
               SET name = EXCLUDED.name,
                   base_price_nu = EXCLUDED.base_price_nu,
                   is_available = EXCLUDED.is_available,
                   updated_at = NOW()`,
            [restaurantId, categoryId, item.name,
             Math.round(item.price), item.in_stock !== false, item.id],
          );
          synced++;
        }

        await manager.query(
          `UPDATE loyverse_sync_logs
           SET status = 'success', items_synced = $1, completed_at = NOW()
           WHERE id = $2`,
          [synced, logEntry.id],
        );
      });

      this.logger.log(`Loyverse sync: ${restaurantId} — ${items.length} items`);
    } catch (err) {
      this.logger.error(`Loyverse sync failed for ${restaurantId}: ${err.message}`);
      await this.db.query(
        `UPDATE loyverse_sync_logs SET status = 'failed', error_message = $1 WHERE id = $2`,
        [err.message, logEntry.id],
      );
    }
  }

  // Push completed order receipt to Loyverse
  async pushReceipt(orderId: string): Promise<void> {
    const [order] = await this.db.query(
      `SELECT o.*, r.loyverse_store_id, r.loyverse_token
       FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.id = $1`,
      [orderId],
    );
    if (!order?.loyverse_store_id) return;

    const items = await this.db.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId],
    );

    try {
      const receipt = {
        store_id: order.loyverse_store_id,
        source: 'ZHIM_DELIVERY',
        receipt_number: order.order_number,
        total_money: order.total_nu / 100,  // Loyverse uses decimal
        line_items: items.map((i: any) => ({
          item_name: i.name,
          quantity: i.quantity,
          price: i.unit_price_nu / 100,
          total_money: (i.unit_price_nu * i.quantity) / 100,
        })),
        payments: [{
          payment_type_id: order.payment_method === 'cod' ? 'cash' : 'digital',
          money_amount: order.total_nu / 100,
        }],
      };

      const response = await axios.post(
        `${LOYVERSE_API}/receipts`,
        receipt,
        { headers: { Authorization: `Bearer ${order.loyverse_token}` } },
      );

      await this.db.query(
        'UPDATE orders SET loyverse_receipt_id = $1 WHERE id = $2',
        [response.data.receipt_number, orderId],
      );
    } catch (err) {
      this.logger.error(`Loyverse receipt push failed: ${err.message}`);
    }
  }

  private async fetchLoyverseItems(storeId: string, token: string): Promise<any[]> {
    const response = await axios.get(`${LOYVERSE_API}/items`, {
      params: { store_id: storeId },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.items ?? [];
  }

  private async fetchLoyverseCategories(storeId: string, token: string): Promise<any[]> {
    const response = await axios.get(`${LOYVERSE_API}/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.categories ?? [];
  }
}
