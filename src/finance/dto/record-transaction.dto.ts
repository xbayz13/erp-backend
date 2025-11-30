import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { FinancialTransactionType } from '../entities/financial-transaction.entity';

export class RecordTransactionDto {
  @IsEnum(FinancialTransactionType)
  type!: FinancialTransactionType;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  relatedEntityId?: string;
}


