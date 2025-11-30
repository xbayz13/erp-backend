import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { UpdatePurchaseOrderStatusDto } from '../dto/update-purchase-order-status.dto';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { CreatePurchaseRequisitionDto } from '../dto/create-purchase-requisition.dto';
import { CreateRFQDto } from '../dto/create-rfq.dto';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { PurchasingService } from '../services/purchasing.service';
import { SupplierService } from '../services/supplier.service';
import { PurchaseRequisitionService } from '../services/purchase-requisition.service';
import { RFQService } from '../services/rfq.service';
import { QuotationService } from '../services/quotation.service';
import { PurchaseRequisitionStatus } from '../entities/purchase-requisition.entity';
import { RFQStatus } from '../entities/rfq.entity';

@Controller('purchasing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchasingController {
  constructor(
    private readonly purchasingService: PurchasingService,
    private readonly supplierService: SupplierService,
    private readonly purchaseRequisitionService: PurchaseRequisitionService,
    private readonly rfqService: RFQService,
    private readonly quotationService: QuotationService,
  ) {}

  @Get('orders')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PURCHASING_STAFF,
    UserRole.WAREHOUSE_MANAGER,
  )
  listOrders() {
    return this.purchasingService.list();
  }

  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.PURCHASING_STAFF)
  createOrder(
    @Body() dto: CreatePurchaseOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchasingService.create(dto, req.user.userId);
  }

  @Patch('orders/:id/status')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.PURCHASING_STAFF,
    UserRole.WAREHOUSE_MANAGER,
  )
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchasingService.updateStatus(id, dto, req.user.userId);
  }

  // Supplier endpoints
  @Get('suppliers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PURCHASING_STAFF)
  listSuppliers() {
    return this.supplierService.list();
  }

  @Post('suppliers')
  @Roles(UserRole.ADMIN, UserRole.PURCHASING_STAFF)
  createSupplier(
    @Body() dto: CreateSupplierDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.supplierService.create(dto, req.user.userId);
  }

  @Get('suppliers/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PURCHASING_STAFF)
  getSupplier(@Param('id') id: string) {
    return this.supplierService.findById(id);
  }

  @Get('suppliers/:id/performance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PURCHASING_STAFF)
  getSupplierPerformance(@Param('id') id: string) {
    return this.supplierService.getPerformanceAnalytics(id);
  }

  @Get('suppliers/rankings')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PURCHASING_STAFF)
  getSupplierRankings() {
    return this.supplierService.getRankings();
  }

  // Purchase Requisition endpoints
  @Get('requisitions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PURCHASING_STAFF)
  listRequisitions(@Query('status') status?: PurchaseRequisitionStatus) {
    return this.purchaseRequisitionService.list(status);
  }

  @Post('requisitions')
  @Roles(UserRole.ADMIN, UserRole.PURCHASING_STAFF)
  createRequisition(
    @Body() dto: CreatePurchaseRequisitionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseRequisitionService.create(dto, req.user.userId);
  }

  @Post('requisitions/:id/submit')
  @Roles(UserRole.ADMIN, UserRole.PURCHASING_STAFF)
  submitRequisition(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.purchaseRequisitionService.submit(id, req.user.userId);
  }

  @Post('requisitions/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  approveRequisition(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseRequisitionService.approve(
      id,
      req.user.userId,
      req.user.email || 'Manager',
      comments,
    );
  }

  @Post('requisitions/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  rejectRequisition(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.purchaseRequisitionService.reject(
      id,
      req.user.userId,
      req.user.email || 'Manager',
      reason,
    );
  }

  // RFQ endpoints
  @Get('rfqs')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PURCHASING_STAFF)
  listRFQs(@Query('status') status?: RFQStatus) {
    return this.rfqService.list(status);
  }

  @Post('rfqs')
  @Roles(UserRole.ADMIN, UserRole.PURCHASING_STAFF)
  createRFQ(@Body() dto: CreateRFQDto, @Req() req: AuthenticatedRequest) {
    return this.rfqService.create(dto, req.user.userId);
  }

  @Post('rfqs/:id/send')
  @Roles(UserRole.ADMIN, UserRole.PURCHASING_STAFF)
  sendRFQ(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.rfqService.send(id, req.user.userId);
  }

  @Post('rfqs/:id/close')
  @Roles(UserRole.ADMIN, UserRole.PURCHASING_STAFF)
  closeRFQ(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.rfqService.close(id, req.user.userId);
  }

  @Get('rfqs/:id/comparison')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PURCHASING_STAFF)
  getRFQComparison(@Param('id') id: string) {
    return this.rfqService.getComparisonMatrix(id);
  }

  // Quotation endpoints
  @Get('quotations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.PURCHASING_STAFF)
  listQuotations(
    @Query('rfqId') rfqId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.quotationService.list(rfqId, supplierId);
  }

  @Post('quotations')
  @Roles(UserRole.ADMIN, UserRole.PURCHASING_STAFF)
  createQuotation(
    @Body() dto: CreateQuotationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.quotationService.create(dto, req.user.userId);
  }

  @Post('quotations/:id/submit')
  @Roles(UserRole.ADMIN, UserRole.PURCHASING_STAFF)
  submitQuotation(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.quotationService.submit(id, req.user.userId);
  }

  @Post('quotations/:id/accept')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  acceptQuotation(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.quotationService.accept(id, req.user.userId);
  }

  @Post('quotations/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  rejectQuotation(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.quotationService.reject(id, req.user.userId);
  }
}


