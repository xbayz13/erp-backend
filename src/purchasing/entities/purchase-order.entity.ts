import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseOrderItem {
  itemId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
}

export interface PurchaseOrderItem {
  itemId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
}

@Entity({ name: 'purchase_orders' })
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  supplierName!: string;

  @Column({ unique: true })
  reference!: string;

  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.DRAFT })
  status!: PurchaseOrderStatus;

  @Column({ type: 'jsonb' })
  items!: PurchaseOrderItem[];

  @Column({ type: 'timestamptz' })
  expectedDate!: Date;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ nullable: true })
  receivedBy?: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  totalCost!: number;

  @Column()
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}


