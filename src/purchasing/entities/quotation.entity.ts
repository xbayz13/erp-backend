import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RFQ } from './rfq.entity';
import { Supplier } from './supplier.entity';

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'quotations' })
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  rfqId!: string;

  @ManyToOne(() => RFQ)
  rfq!: RFQ;

  @Column()
  supplierId!: string;

  @ManyToOne(() => Supplier)
  supplier!: Supplier;

  @Column({ type: 'enum', enum: QuotationStatus, default: QuotationStatus.DRAFT })
  status!: QuotationStatus;

  @Column({ type: 'jsonb' })
  items!: Array<{
    itemId: string;
    itemSku: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    deliveryDays?: number;
    notes?: string;
  }>;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil?: Date;

  @Column({ nullable: true })
  terms?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column()
  submittedBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

