import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum FinancialTransactionType {
  EXPENSE = 'EXPENSE',
  REVENUE = 'REVENUE',
  PAYMENT = 'PAYMENT',
}

@Entity({ name: 'financial_transactions' })
export class FinancialTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: FinancialTransactionType })
  type!: FinancialTransactionType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: number;

  @Column()
  currency!: string;

  @Column()
  description!: string;

  @Column({ nullable: true })
  reference?: string;

  @Column({ nullable: true })
  relatedEntityId?: string;

  @Column()
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}


