import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { InventoryController } from './controllers/inventory.controller';
import { Batch } from './entities/batch.entity';
import { Item } from './entities/item.entity';
import { Location } from './entities/location.entity';
import { SerialNumber } from './entities/serial-number.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { Stocktake } from './entities/stocktake.entity';
import { Warehouse } from './entities/warehouse.entity';
import { BarcodeService } from './services/barcode.service';
import { BatchService } from './services/batch.service';
import { InventoryService } from './services/inventory.service';
import { LocationService } from './services/location.service';
import { SerialNumberService } from './services/serial-number.service';
import { StocktakeService } from './services/stocktake.service';

@Module({
  imports: [
    AuditModule,
    TypeOrmModule.forFeature([
      Item,
      StockMovement,
      Warehouse,
      Batch,
      SerialNumber,
      Location,
      Stocktake,
    ]),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    BarcodeService,
    BatchService,
    SerialNumberService,
    LocationService,
    StocktakeService,
  ],
  exports: [InventoryService],
})
export class InventoryModule {}


