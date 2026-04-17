import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { RidersModule } from './modules/riders/riders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LoyverseModule } from './modules/loyverse/loyverse.module';
import { ZonesModule } from './modules/zones/zones.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 60000, limit: 100 },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,  // use schema.sql migrations
        logging: cfg.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    OrdersModule,
    RestaurantsModule,
    RidersModule,
    PaymentsModule,
    DeliveryModule,
    NotificationsModule,
    LoyverseModule,
    ZonesModule,
    SearchModule,
  ],
})
export class AppModule {}
