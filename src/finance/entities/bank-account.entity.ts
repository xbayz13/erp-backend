import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'bank_accounts' })
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  accountNumber!: string;

  @Column()
  accountName!: string;

  @Column()
  bankName!: string;

  @Column({ nullable: true })
  branch?: string;

  @Column({ length: 3, default: 'IDR' })
  currency!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  balance!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

