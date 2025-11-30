import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'suppliers' })
export class Supplier {
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

  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0 })
  rating!: number; // 0-5 rating

  @Column({ type: 'integer', default: 0 })
  onTimeDeliveryRate!: number; // percentage

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  qualityScore!: number; // 0-100

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  priceCompetitiveness?: number; // 0-100

  @Column({ nullable: true })
  paymentTerms?: string; // e.g., "Net 30", "Net 60"

  @Column({ type: 'integer', default: 0 })
  totalOrders!: number;

  @Column({ type: 'integer', default: 0 })
  completedOrders!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

