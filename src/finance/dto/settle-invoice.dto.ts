import { IsDateString, IsOptional, IsString } from 'class-validator';

export class SettleInvoiceDto {
  @IsDateString()
  paymentDate!: string;

  @IsString()
  @IsOptional()
  reference?: string;
}


