import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSerialNumberDto {
  @IsString()
  @IsNotEmpty()
  serialNumber!: string;

  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsDateString()
  @IsOptional()
  warrantyStartDate?: string;

  @IsDateString()
  @IsOptional()
  warrantyEndDate?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

