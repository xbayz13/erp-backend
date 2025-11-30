import {
  ArrayMinSize,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsNumber()
  @IsPositive()
  unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @IsString()
  @IsNotEmpty()
  supplierName!: string;

  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsDateString()
  expectedDate!: string;

  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  @ArrayMinSize(1)
  items!: PurchaseOrderItemDto[];
}


