import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CustomerQuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface QuotationItem {
  itemId: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
  notes?: string;
}

@Entity({ name: 'customer_quotations' })
export class CustomerQuotation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @Column()
  customerId!: string;

  @Column({ type: 'enum', enum: CustomerQuotationStatus, default: CustomerQuotationStatus.DRAFT })
  status!: CustomerQuotationStatus;

  @Column({ type: 'jsonb' })
  items!: QuotationItem[];

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  discountAmount!: number;

  @Column({ type: 'timestamptz' })
  validUntil!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ nullable: true })
  terms?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column()
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

