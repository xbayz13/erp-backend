import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'customers' })
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  contactPerson?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  creditLimit!: number;

  @Column({ nullable: true })
  paymentTerms?: string; // e.g., "Net 30", "Net 60"

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  outstandingBalance!: number;

  @Column({ type: 'integer', default: 0 })
  totalOrders!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  rating!: number; // 0-5 rating

  @Column({ nullable: true })
  segment?: string; // e.g., "VIP", "Regular", "Wholesale"

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

