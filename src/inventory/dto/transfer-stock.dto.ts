import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
} from 'class-validator';

export class TransferStockDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsString()
  @IsNotEmpty()
  fromWarehouseId!: string;

  @IsString()
  @IsNotEmpty()
  toWarehouseId!: string;

  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsString()
  @IsNotEmpty()
  performedBy!: string;
}

