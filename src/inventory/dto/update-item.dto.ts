import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class UpdateItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  quantityOnHand?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reorderLevel?: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  unitCost?: number;
}


