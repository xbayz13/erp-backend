import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RFQItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsNumber()
  quantity!: number;

  @IsString()
  @IsOptional()
  specifications?: string;
}

export class CreateRFQDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RFQItemDto)
  items!: RFQItemDto[];

  @IsDateString()
  deadline!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

