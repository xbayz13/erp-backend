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

class MaterialRequirementDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;
}

export class CreateProductionOrderDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  productItemId!: string;

  @IsNumber()
  @IsPositive()
  quantityPlanned!: number;

  @IsDateString()
  scheduledStart!: string;

  @IsDateString()
  scheduledEnd!: string;

  @IsString()
  @IsNotEmpty()
  supervisorId!: string;

  @IsString()
  @IsNotEmpty()
  outputWarehouseId!: string;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => MaterialRequirementDto)
  materials!: MaterialRequirementDto[];

  @IsString()
  notes?: string;
}


