import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'invoices' })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'purchase_order_id' })
  purchaseOrderId!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: number;

  @Column()
  currency!: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status!: InvoiceStatus;

  @Column({ type: 'timestamptz' })
  issuedAt!: Date;

  @Column({ type: 'timestamptz' })
  dueDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column()
  createdBy!: string;

  @Column({ nullable: true })
  notes?: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}


