import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'payment_terms' })
export class PaymentTerm {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'integer' })
  days!: number; // e.g., 30 for Net 30

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  discountPercentage?: number; // Early payment discount

  @Column({ type: 'integer', nullable: true })
  discountDays?: number; // Days to qualify for discount

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

