import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductionController } from './controllers/production.controller';
import { ProductionOrder } from './entities/production-order.entity';
import { BOM } from './entities/bom.entity';
import { WorkCenter } from './entities/work-center.entity';
import { Routing } from './entities/routing.entity';
import { QCInspection } from './entities/qc-inspection.entity';
import { Equipment } from './entities/equipment.entity';
import { MaintenanceSchedule } from './entities/maintenance-schedule.entity';
import { ProductionService } from './services/production.service';
import { BOMService } from './services/bom.service';
import { WorkCenterService } from './services/work-center.service';
import { RoutingService } from './services/routing.service';
import { QCService } from './services/qc.service';
import { MaintenanceService } from './services/maintenance.service';

@Module({
  imports: [
    AuditModule,
    InventoryModule,
    TypeOrmModule.forFeature([
      ProductionOrder,
      BOM,
      WorkCenter,
      Routing,
      QCInspection,
      Equipment,
      MaintenanceSchedule,
    ]),
  ],
  controllers: [ProductionController],
  providers: [
    ProductionService,
    BOMService,
    WorkCenterService,
    RoutingService,
    QCService,
    MaintenanceService,
  ],
  exports: [
    ProductionService,
    BOMService,
    WorkCenterService,
    RoutingService,
    QCService,
    MaintenanceService,
  ],
})
export class ProductionModule {}


