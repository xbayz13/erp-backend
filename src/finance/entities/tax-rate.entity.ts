import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TaxType {
  VAT = 'VAT',
  GST = 'GST',
  SALES_TAX = 'SALES_TAX',
  INCOME_TAX = 'INCOME_TAX',
  OTHER = 'OTHER',
}

@Entity({ name: 'tax_rates' })
export class TaxRate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: TaxType })
  type!: TaxType;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  rate!: number; // Percentage (e.g., 10 for 10%)

  @Column({ type: 'timestamptz', nullable: true })
  validFrom?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

