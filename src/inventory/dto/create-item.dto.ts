import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsNumber()
  @Min(0)
  quantityOnHand!: number;

  @IsNumber()
  @Min(0)
  reorderLevel!: number;

  @IsNumber()
  @IsPositive()
  unitCost!: number;
}


