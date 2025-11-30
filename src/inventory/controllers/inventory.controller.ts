import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateItemDto } from '../dto/create-item.dto';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { RecordStockMovementDto } from '../dto/record-stock-movement.dto';
import { TransferStockDto } from '../dto/transfer-stock.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { CreateSerialNumberDto } from '../dto/create-serial-number.dto';
import { CreateLocationDto } from '../dto/create-location.dto';
import { CreateStocktakeDto } from '../dto/create-stocktake.dto';
import { InventoryService } from '../services/inventory.service';
import { BarcodeService } from '../services/barcode.service';
import { BatchService } from '../services/batch.service';
import { SerialNumberService } from '../services/serial-number.service';
import { LocationService } from '../services/location.service';
import { StocktakeService } from '../services/stocktake.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly barcodeService: BarcodeService,
    private readonly batchService: BatchService,
    private readonly serialNumberService: SerialNumberService,
    private readonly locationService: LocationService,
    private readonly stocktakeService: StocktakeService,
  ) {}

  @Get('items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER)
  listItems() {
    return this.inventoryService.listItems();
  }

  @Post('items')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  createItem(@Body() dto: CreateItemDto, @Req() req: AuthenticatedRequest) {
    return this.inventoryService.createItem(dto, req.user.userId);
  }

  @Patch('items/:id')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.inventoryService.updateItem(id, dto, req.user.userId);
  }

  @Get('movements')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER)
  listMovements() {
    return this.inventoryService.listMovements();
  }

  @Post('movements')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER, UserRole.PURCHASING_STAFF)
  recordMovement(
    @Body() dto: RecordStockMovementDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.inventoryService.recordStockMovement(dto, req.user.userId);
  }

  @Get('warehouses')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listWarehouses() {
    return this.inventoryService.listWarehouses();
  }

  @Post('warehouses')
  @Roles(UserRole.ADMIN)
  createWarehouse(
    @Body() dto: CreateWarehouseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.inventoryService.createWarehouse(dto, req.user.userId);
  }

  @Post('transfer')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  transferStock(
    @Body() dto: TransferStockDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.inventoryService.transferStock(
      { ...dto, performedBy: req.user.userId },
      req.user.userId,
    );
  }

  // Barcode/QR Code endpoints
  @Get('items/:id/barcode')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  async getBarcode(@Param('id') id: string) {
    const item = await this.inventoryService.getItemById(id);
    if (!item) {
      throw new Error('Item not found');
    }
    return {
      barcode: this.barcodeService.generateBarcodeData(item.sku),
      sku: item.sku,
    };
  }

  @Get('items/:id/qrcode')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  async getQRCode(@Param('id') id: string, @Res() res: Response) {
    const item = await this.inventoryService.getItemById(id);
    if (!item) {
      throw new Error('Item not found');
    }
    const qrCode = await this.barcodeService.generateQRCode(
      JSON.stringify({ id: item.id, sku: item.sku, name: item.name }),
    );
    res.setHeader('Content-Type', 'image/png');
    res.send(qrCode);
  }

  // Batch endpoints
  @Get('batches')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  listBatches(@Query('itemId') itemId?: string) {
    return this.batchService.list(itemId);
  }

  @Post('batches')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  createBatch(
    @Body() dto: CreateBatchDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.batchService.create(dto, req.user.userId);
  }

  @Get('batches/expiring')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  getExpiringBatches(@Query('days') days?: string) {
    return this.batchService.getExpiringBatches(
      days ? parseInt(days, 10) : 30,
    );
  }

  // Serial Number endpoints
  @Get('serial-numbers')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  listSerialNumbers(
    @Query('itemId') itemId?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.serialNumberService.list(itemId, warehouseId);
  }

  @Post('serial-numbers')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  createSerialNumber(
    @Body() dto: CreateSerialNumberDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serialNumberService.create(dto, req.user.userId);
  }

  @Get('serial-numbers/:serialNumber')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  findBySerialNumber(@Param('serialNumber') serialNumber: string) {
    return this.serialNumberService.findBySerialNumber(serialNumber);
  }

  @Patch('serial-numbers/:id/status')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  updateSerialNumberStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serialNumberService.updateStatus(id, status, req.user.userId);
  }

  // Location endpoints
  @Get('locations')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  listLocations(@Query('warehouseId') warehouseId?: string) {
    return this.locationService.list(warehouseId);
  }

  @Get('locations/hierarchy')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  getLocationHierarchy(@Query('warehouseId') warehouseId: string) {
    return this.locationService.getHierarchy(warehouseId);
  }

  @Post('locations')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  createLocation(
    @Body() dto: CreateLocationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.locationService.create(dto, req.user.userId);
  }

  // Stocktake endpoints
  @Get('stocktakes')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  listStocktakes(@Query('warehouseId') warehouseId?: string) {
    return this.stocktakeService.list(warehouseId);
  }

  @Post('stocktakes')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  createStocktake(
    @Body() dto: CreateStocktakeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.stocktakeService.create(dto, req.user.userId);
  }

  @Post('stocktakes/:id/start')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  startStocktake(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.stocktakeService.start(id, req.user.userId);
  }

  @Post('stocktakes/:id/complete')
  @Roles(UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER)
  completeStocktake(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.stocktakeService.complete(id, req.user.userId);
  }
}


