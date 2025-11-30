import {
  ArrayMinSize,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StocktakeItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsNumber()
  expectedQuantity!: number;

  @IsNumber()
  countedQuantity!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateStocktakeDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsDateString()
  scheduledDate!: string;

  @ValidateNested({ each: true })
  @Type(() => StocktakeItemDto)
  @ArrayMinSize(1)
  items!: StocktakeItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

