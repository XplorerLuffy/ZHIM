import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { assertValidTransition, getStatusMessage } from './order-state-machine';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateOrderDto, Order, OrderStatus, UserRole } from '@zhim/types';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DataSource,
    private readonly notifications: NotificationsService,
  ) {}

  async create(customerId: string, dto: CreateOrderDto): Promise<Order> {
    return this.db.transaction(async (manager) => {
      // 1. Validate restaurant is open and in an active zone
      const [restaurant] = await manager.query(
        `SELECT r.*, z.base_delivery_fee_nu, z.min_order_nu, z.status as zone_status
         FROM restaurants r
         JOIN zones z ON z.id = r.zone_id
         WHERE r.id = $1`,
        [dto.restaurant_id],
      );
      if (!restaurant) throw new NotFoundException('Restaurant not found');
      if (restaurant.status !== 'active') throw new BadRequestException('Restaurant is not accepting orders');
      if (!restaurant.is_open) throw new BadRequestException('Restaurant is currently closed');
      if (restaurant.zone_status !== 'active') throw new BadRequestException('Delivery not available in this zone');

      // 2. Validate delivery address belongs to customer and is in zone
      const [address] = await manager.query(
        'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
        [dto.delivery_address_id, customerId],
      );
      if (!address) throw new BadRequestException('Delivery address not found');

      // 3. Build order items, resolve prices from DB (never trust client prices)
      let subtotal = 0;
      const resolvedItems: any[] = [];

      for (const item of dto.items) {
        const [dbItem] = await manager.query(
          'SELECT * FROM menu_items WHERE id = $1 AND restaurant_id = $2 AND is_available = true',
          [item.menu_item_id, dto.restaurant_id],
        );
        if (!dbItem) throw new BadRequestException(`Item ${item.menu_item_id} is not available`);

        let unitPrice = dbItem.base_price_nu;

        if (item.variant_id) {
          const [variant] = await manager.query(
            'SELECT * FROM menu_item_variants WHERE id = $1 AND item_id = $2',
            [item.variant_id, item.menu_item_id],
          );
          if (!variant) throw new BadRequestException('Invalid variant');
          unitPrice = variant.price_nu;
        }

        const resolvedAddons: any[] = [];
        if (item.addons?.length) {
          for (const addonReq of item.addons) {
            const [addon] = await manager.query(
              'SELECT * FROM menu_item_addons WHERE id = $1 AND item_id = $2',
              [addonReq.addon_id, item.menu_item_id],
            );
            if (!addon) throw new BadRequestException(`Invalid addon ${addonReq.addon_id}`);
            resolvedAddons.push({ ...addon, qty: addonReq.quantity });
            unitPrice += addon.price_nu * addonReq.quantity;
          }
        }

        subtotal += unitPrice * item.quantity;
        resolvedItems.push({
          ...item,
          name: dbItem.name,
          name_dz: dbItem.name_dz,
          unit_price_nu: unitPrice,
          addons: resolvedAddons,
        });
      }

      if (subtotal < restaurant.min_order_nu) {
        throw new BadRequestException(
          `Minimum order is Nu. ${restaurant.min_order_nu}`,
        );
      }

      // 4. Resolve surge
      const [activeSurge] = await manager.query(
        `SELECT * FROM surge_rules
         WHERE is_active = true AND (zone_id = $1 OR zone_id IS NULL)
         ORDER BY zone_id NULLS LAST
         LIMIT 1`,
        [restaurant.zone_id],
      );
      const surgeMultiplier = activeSurge?.multiplier ?? 1.0;
      const surgeFeeNu = activeSurge?.extra_fee_nu ?? 0;
      const deliveryFeeNu = Math.round(restaurant.base_delivery_fee_nu * surgeMultiplier) + surgeFeeNu;

      // 5. Karma points
      let discountNu = 0;
      const karmaUsed = dto.karma_points_used ?? 0;
      if (karmaUsed > 0) {
        const [user] = await manager.query('SELECT karma_points FROM users WHERE id = $1', [customerId]);
        if (user.karma_points < karmaUsed) throw new BadRequestException('Insufficient Karma Points');
        discountNu = Math.floor(karmaUsed * 0.5);  // 1 point = Nu. 0.50
      }

      const totalNu = subtotal + deliveryFeeNu - discountNu;
      const karmaEarned = Math.floor(totalNu / 10);  // 1 point per Nu. 10

      // 6. Insert order
      const [order] = await manager.query(
        `INSERT INTO orders (
          customer_id, restaurant_id, delivery_address_id,
          delivery_type, scheduled_for,
          subtotal_nu, delivery_fee_nu, surge_fee_nu, discount_nu, total_nu,
          coupon_code, karma_points_used, karma_points_earned,
          estimated_prep_min,
          pickup_location, dropoff_location,
          surge_multiplier, surge_message_en, surge_message_dz,
          customer_note, change_required_nu
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
          ST_GeomFromText($15, 4326),
          ST_GeomFromText($16, 4326),
          $17,$18,$19,$20,$21
        ) RETURNING *`,
        [
          customerId, dto.restaurant_id, dto.delivery_address_id,
          dto.delivery_type, dto.scheduled_for ?? null,
          subtotal, deliveryFeeNu, surgeFeeNu, discountNu, totalNu,
          dto.coupon_code ?? null, karmaUsed, karmaEarned,
          restaurant.avg_prep_time_min,
          `POINT(${restaurant.location.x} ${restaurant.location.y})`,
          `POINT(${address.location.x} ${address.location.y})`,
          surgeMultiplier, activeSurge?.message_en ?? null, activeSurge?.message_dz ?? null,
          dto.customer_note ?? null, dto.change_required_nu ?? null,
        ],
      );

      // 7. Insert order items
      for (const item of resolvedItems) {
        const [orderItem] = await manager.query(
          `INSERT INTO order_items (order_id, menu_item_id, variant_id, name, name_dz, quantity, unit_price_nu, spice_level, special_note)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          [order.id, item.menu_item_id, item.variant_id ?? null,
           item.name, item.name_dz ?? null, item.quantity,
           item.unit_price_nu, item.spice_level ?? null, item.special_note ?? null],
        );
        for (const addon of item.addons) {
          await manager.query(
            `INSERT INTO order_item_addons (order_item_id, addon_id, name, name_dz, quantity, unit_price_nu)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [orderItem.id, addon.id, addon.name, addon.name_dz ?? null, addon.qty, addon.price_nu],
          );
        }
      }

      // 8. Deduct karma, credit karma earned
      if (karmaUsed > 0) {
        await manager.query(
          'UPDATE users SET karma_points = karma_points - $1 WHERE id = $2',
          [karmaUsed, customerId],
        );
      }
      await manager.query(
        'UPDATE users SET karma_points = karma_points + $1 WHERE id = $2',
        [karmaEarned, customerId],
      );

      // 9. Notify restaurant (FCM + socket via event)
      await this.notifications.notifyRestaurant(restaurant.id, {
        title_en: 'New order!',
        title_dz: 'བཀོད་གསར་།',
        body_en: `Order #${order.order_number} — Nu. ${totalNu}`,
        type: 'new_order',
        data: { order_id: order.id },
      });

      return this.findById(order.id);
    });
  }

  async transitionStatus(
    orderId: string,
    to: OrderStatus,
    actor: UserRole | 'system',
    actorId: string,
    reason?: string,
  ): Promise<Order> {
    const [order] = await this.db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) throw new NotFoundException('Order not found');

    assertValidTransition(order.status, to, actor);

    const tsField = `${to}_at`;
    const updateFields: string[] = ['status = $2', 'updated_at = NOW()'];
    const params: any[] = [orderId, to];

    // Timestamp field for this status
    const statusTimestamps: Record<string, string> = {
      confirmed: 'confirmed_at',
      preparing: 'preparing_at',
      ready:     'ready_at',
      picked_up: 'picked_up_at',
      delivered: 'delivered_at',
      cancelled: 'cancelled_at',
    };
    if (statusTimestamps[to]) {
      updateFields.push(`${statusTimestamps[to]} = NOW()`);
    }
    if (to === 'cancelled' && reason) {
      updateFields.push(`cancellation_reason = $${params.length + 1}`);
      params.push(reason);
      updateFields.push(`cancelled_by = $${params.length + 1}`);
      params.push(actor);
    }

    await this.db.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $1`,
      params,
    );

    const { en, dz } = getStatusMessage(to);
    await this.notifications.notifyCustomer(order.customer_id, {
      title_en: 'Order update',
      title_dz: 'བཀོད་གནས་ཚུལ།',
      body_en: en,
      body_dz: dz,
      type: 'order_update',
      data: { order_id: orderId, status: to },
    });

    return this.findById(orderId);
  }

  async findById(id: string): Promise<Order> {
    const [order] = await this.db.query(
      `SELECT o.*,
        json_build_object('id', r.id, 'name', r.name, 'name_dz', r.name_dz, 'logo_url', r.logo_url, 'phone', r.phone) as restaurant
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.id = $1`,
      [id],
    );
    if (!order) throw new NotFoundException('Order not found');

    order.items = await this.db.query(
      `SELECT oi.*,
        json_agg(json_build_object('name', oia.name, 'name_dz', oia.name_dz, 'quantity', oia.quantity, 'unit_price_nu', oia.unit_price_nu)) as addons
       FROM order_items oi
       LEFT JOIN order_item_addons oia ON oia.order_item_id = oi.id
       WHERE oi.order_id = $1
       GROUP BY oi.id`,
      [id],
    );

    return order;
  }

  async listForCustomer(customerId: string, page = 1, limit = 20): Promise<{ data: Order[]; total: number }> {
    const offset = (page - 1) * limit;
    const [{ count }] = await this.db.query(
      'SELECT COUNT(*) FROM orders WHERE customer_id = $1',
      [customerId],
    );
    const data = await this.db.query(
      `SELECT o.*, r.name as restaurant_name, r.logo_url
       FROM orders o JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset],
    );
    return { data, total: parseInt(count) };
  }
}
