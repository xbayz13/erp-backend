import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  batchNumber!: string;

  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsDateString()
  productionDate!: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  supplierBatchNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

