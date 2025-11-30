import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Quotation } from './quotation.entity';

export enum RFQStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'rfqs' })
export class RFQ {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @Column({ type: 'enum', enum: RFQStatus, default: RFQStatus.DRAFT })
  status!: RFQStatus;

  @Column({ type: 'jsonb' })
  items!: Array<{
    itemId: string;
    itemSku: string;
    itemName: string;
    quantity: number;
    specifications?: string;
  }>;

  @Column({ type: 'timestamptz' })
  deadline!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closedAt?: Date;

  @Column()
  createdBy!: string;

  @Column({ nullable: true })
  notes?: string;

  @OneToMany(() => Quotation, (quotation) => quotation.rfq)
  quotations!: Quotation[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

