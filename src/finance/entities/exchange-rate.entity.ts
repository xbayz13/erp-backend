import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'exchange_rates' })
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 3 })
  fromCurrency!: string; // Base currency code

  @Column({ length: 3 })
  toCurrency!: string; // Target currency code

  @Column({ type: 'numeric', precision: 18, scale: 6 })
  rate!: number; // Exchange rate

  @Column({ type: 'timestamptz' })
  effectiveDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiryDate?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

