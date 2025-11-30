import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StocktakeStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface StocktakeItem {
  itemId: string;
  itemSku: string;
  itemName: string;
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  notes?: string;
}

@Entity({ name: 'stocktakes' })
export class Stocktake {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  reference!: string;

  @Column({ name: 'warehouse_id' })
  warehouseId!: string;

  @Column({ type: 'enum', enum: StocktakeStatus, default: StocktakeStatus.PLANNED })
  status!: StocktakeStatus;

  @Column({ type: 'timestamptz' })
  scheduledDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ type: 'jsonb' })
  items!: StocktakeItem[];

  @Column({ nullable: true })
  notes?: string;

  @Column()
  createdBy!: string;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

