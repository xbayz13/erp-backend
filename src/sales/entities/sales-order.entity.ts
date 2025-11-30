import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface SalesOrderItem {
  itemId: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  warehouseId: string;
  allocatedQuantity?: number;
  notes?: string;
}

@Entity({ name: 'sales_orders' })
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @Column()
  customerId!: string;

  @Column({ type: 'enum', enum: SalesOrderStatus, default: SalesOrderStatus.DRAFT })
  status!: SalesOrderStatus;

  @Column({ type: 'jsonb' })
  items!: SalesOrderItem[];

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  orderDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expectedDeliveryDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  shippedDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredDate?: Date;

  @Column({ nullable: true })
  shippingAddress?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column()
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

