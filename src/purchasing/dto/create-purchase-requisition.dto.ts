import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseRequisitionItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitCost!: number;

  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreatePurchaseRequisitionDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequisitionItemDto)
  items!: PurchaseRequisitionItemDto[];

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

