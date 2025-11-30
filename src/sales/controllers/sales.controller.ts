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
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CreateCustomerQuotationDto } from '../dto/create-customer-quotation.dto';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { CustomerService } from '../services/customer.service';
import { QuotationPricingService } from '../services/quotation-pricing.service';
import { SalesOrderService } from '../services/sales-order.service';

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly salesOrderService: SalesOrderService,
    private readonly quotationPricingService: QuotationPricingService,
  ) {}

  // Customer endpoints
  @Get('customers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_STAFF)
  listCustomers() {
    return this.customerService.list();
  }

  @Post('customers')
  @Roles(UserRole.ADMIN, UserRole.SALES_STAFF)
  createCustomer(
    @Body() dto: CreateCustomerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.customerService.create(dto, req.user.userId);
  }

  @Get('customers/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_STAFF)
  getCustomer(@Param('id') id: string) {
    return this.customerService.findById(id);
  }

  @Patch('customers/:id/credit-limit')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateCreditLimit(
    @Param('id') id: string,
    @Body('creditLimit') creditLimit: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.customerService.updateCreditLimit(id, creditLimit, req.user.userId);
  }

  @Get('customers/:id/analytics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_STAFF)
  getCustomerAnalytics(@Param('id') id: string) {
    return this.customerService.getCustomerAnalytics(id);
  }

  // Sales Order endpoints
  @Get('orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_STAFF)
  listOrders(@Query('customerId') customerId?: string) {
    return this.salesOrderService.list(customerId);
  }

  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.SALES_STAFF)
  createOrder(
    @Body() dto: CreateSalesOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.salesOrderService.create(dto, req.user.userId);
  }

  @Post('orders/:id/confirm')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_STAFF)
  confirmOrder(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.salesOrderService.confirm(id, req.user.userId);
  }

  @Post('orders/:id/ship')
  @Roles(UserRole.ADMIN, UserRole.SALES_STAFF)
  shipOrder(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.salesOrderService.ship(id, req.user.userId);
  }

  @Post('orders/:id/deliver')
  @Roles(UserRole.ADMIN, UserRole.SALES_STAFF)
  deliverOrder(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.salesOrderService.deliver(id, req.user.userId);
  }

  // Quotation & Pricing endpoints
  @Post('quotations')
  @Roles(UserRole.ADMIN, UserRole.SALES_STAFF)
  createQuotation(
    @Body() dto: CreateCustomerQuotationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.quotationPricingService.createQuotation(dto, req.user.userId);
  }

  @Get('price-lists')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_STAFF)
  listPriceLists(@Query('customerId') customerId?: string) {
    return this.quotationPricingService.listPriceLists(customerId);
  }

  @Get('discounts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_STAFF)
  listDiscounts(@Query('isActive') isActive?: string) {
    return this.quotationPricingService.listDiscounts(
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }
}

