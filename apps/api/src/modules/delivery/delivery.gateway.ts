import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { LatLng } from '@zhim/types';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/delivery',
})
export class DeliveryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(DeliveryGateway.name);
  private activeConnections = new Map<string, string>();  // socketId → userId

  constructor(private readonly db: DataSource) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) this.activeConnections.set(client.id, userId);
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.activeConnections.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('order:subscribe')
  handleOrderSubscribe(
    @MessageBody() data: { order_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`order:${data.order_id}`);
    this.logger.log(`Socket ${client.id} joined order room ${data.order_id}`);
  }

  @SubscribeMessage('rider:location_update')
  async handleRiderLocation(
    @MessageBody() data: { order_id: string; location: LatLng; bearing?: number; speed_kmh?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.activeConnections.get(client.id);
    if (!userId) return;

    // Persist location ping
    try {
      await this.db.query(
        `INSERT INTO delivery_pings (order_id, rider_id, location, bearing, speed_kmh)
         SELECT $1, r.id,
                ST_GeomFromText($2, 4326),
                $3, $4
         FROM riders r WHERE r.user_id = $5`,
        [
          data.order_id,
          `POINT(${data.location.lng} ${data.location.lat})`,
          data.bearing ?? null,
          data.speed_kmh ?? null,
          userId,
        ],
      );

      // Update rider's current location
      await this.db.query(
        `UPDATE riders SET current_location = ST_GeomFromText($1, 4326), current_location_updated_at = NOW()
         WHERE user_id = $2`,
        [`POINT(${data.location.lng} ${data.location.lat})`, userId],
      );
    } catch (err) {
      this.logger.error(`Location ping error: ${err.message}`);
    }

    // Broadcast to customer tracking room
    this.server.to(`order:${data.order_id}`).emit('rider:location', {
      rider_id: userId,
      order_id: data.order_id,
      location: data.location,
      bearing: data.bearing,
      speed_kmh: data.speed_kmh,
      recorded_at: new Date().toISOString(),
    });
  }

  emitOrderUpdate(orderId: string, event: string, payload: any) {
    this.server.to(`order:${orderId}`).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: any) {
    // Find socket by userId and emit
    for (const [socketId, uid] of this.activeConnections) {
      if (uid === userId) {
        this.server.to(socketId).emit(event, payload);
      }
    }
  }
}
