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

export class QuotationItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsNumber()
  @IsOptional()
  deliveryDays?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateQuotationDto {
  @IsString()
  @IsNotEmpty()
  rfqId!: string;

  @IsString()
  @IsNotEmpty()
  supplierId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items!: QuotationItemDto[];

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

