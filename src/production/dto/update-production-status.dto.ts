import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ProductionStatus } from '../entities/production-order.entity';

export class UpdateProductionStatusDto {
  @IsEnum(ProductionStatus)
  status!: ProductionStatus;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  quantityCompleted?: number;

  @IsDateString()
  @IsOptional()
  actualStart?: string;

  @IsDateString()
  @IsOptional()
  actualEnd?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}


