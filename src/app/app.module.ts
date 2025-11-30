import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductionModule } from '../production/production.module';
import { PurchasingModule } from '../purchasing/purchasing.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ReportsModule } from '../reports/reports.module';
import { SalesModule } from '../sales/sales.module';
import { SystemModule } from '../system/system.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      // Load .env first, then env.local (env.local has higher priority and will override .env)
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), 'env.local'),
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: parseInt(config.get<string>('POSTGRES_PORT', '5432'), 10),
        username: config.get<string>('POSTGRES_USER', 'postgres'),
        password: config.get<string>('POSTGRES_PASSWORD', 'postgres'),
        database: config.get<string>('POSTGRES_DB', 'erp'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    AuditModule,
    UsersModule,
    AuthModule,
    InventoryModule,
    PurchasingModule,
    FinanceModule,
    ProductionModule,
    SalesModule,
    ReportsModule,
    RealtimeModule,
    SystemModule,
  ],
})
export class AppModule {}


