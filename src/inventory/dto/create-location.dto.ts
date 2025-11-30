import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  warehouseId!: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsEnum(['WAREHOUSE', 'ZONE', 'BIN', 'SHELF'])
  type!: 'WAREHOUSE' | 'ZONE' | 'BIN' | 'SHELF';

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;
}

