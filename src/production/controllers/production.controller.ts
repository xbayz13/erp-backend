import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { CreateProductionOrderDto } from '../dto/create-production-order.dto';
import { UpdateProductionStatusDto } from '../dto/update-production-status.dto';
import { ProductionService } from '../services/production.service';

@Controller('production')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('orders')
  @Roles(
    UserRole.ADMIN,
    UserRole.PRODUCTION_MANAGER,
    UserRole.PRODUCTION_SUPERVISOR,
  )
  listOrders() {
    return this.productionService.list();
  }

  @Post('orders')
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_MANAGER)
  createOrder(
    @Body() dto: CreateProductionOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productionService.create(dto, req.user.userId);
  }

  @Patch('orders/:id/status')
  @Roles(
    UserRole.ADMIN,
    UserRole.PRODUCTION_MANAGER,
    UserRole.PRODUCTION_SUPERVISOR,
  )
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductionStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.productionService.updateStatus(id, dto, req.user.userId);
  }
}


