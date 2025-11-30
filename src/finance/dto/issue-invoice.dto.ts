import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class IssueInvoiceDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsDateString()
  dueDate!: string;

  @IsString()
  notes?: string;
}


