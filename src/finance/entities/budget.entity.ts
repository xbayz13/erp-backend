import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BudgetType {
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  CAPITAL = 'CAPITAL',
}

export enum BudgetPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

@Entity({ name: 'budgets' })
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: BudgetType })
  type!: BudgetType;

  @Column({ type: 'enum', enum: BudgetPeriod })
  period!: BudgetPeriod;

  @Column({ type: 'timestamptz' })
  startDate!: Date;

  @Column({ type: 'timestamptz' })
  endDate!: Date;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  allocatedAmount!: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  actualAmount!: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  committedAmount!: number; // Amount committed but not yet spent

  @Column({ nullable: true })
  department?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

