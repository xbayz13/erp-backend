export enum StockMovementType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  TRANSFER = 'TRANSFER',
}

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'stock_movements' })
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_id' })
  itemId!: string;

  @Column({ name: 'warehouse_id' })
  warehouseId!: string;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'enum', enum: StockMovementType })
  type!: StockMovementType;

  @Column()
  reference!: string;

  @Column()
  performedBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}


