import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BankTransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
}

export enum ReconciliationStatus {
  PENDING = 'PENDING',
  MATCHED = 'MATCHED',
  RECONCILED = 'RECONCILED',
}

@Entity({ name: 'bank_transactions' })
export class BankTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  bankAccountId!: string;

  @Column({ type: 'enum', enum: BankTransactionType })
  type!: BankTransactionType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount!: number;

  @Column({ type: 'timestamptz' })
  transactionDate!: Date;

  @Column({ nullable: true })
  reference?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ReconciliationStatus, default: ReconciliationStatus.PENDING })
  reconciliationStatus!: ReconciliationStatus;

  @Column({ nullable: true })
  matchedTransactionId?: string; // Link to financial transaction

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

