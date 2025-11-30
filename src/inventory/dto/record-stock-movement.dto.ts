import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';
import { StockMovementType } from '../entities/stock-movement.entity';

export class RecordStockMovementDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsString()
  @IsNotEmpty()
  performedBy!: string;
}


