import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';

export class UpdatePurchaseOrderStatusDto {
  @IsEnum(PurchaseOrderStatus)
  status!: PurchaseOrderStatus;

  @IsString()
  @IsOptional()
  remark?: string;
}


