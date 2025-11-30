import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'equipment' })
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  manufacturer?: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ nullable: true })
  serialNumber?: string;

  @Column({ type: 'timestamptz', nullable: true })
  purchaseDate?: Date;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  purchaseCost?: number;

  @Column({ type: 'integer', nullable: true })
  expectedLifespan?: number; // Months

  @Column({ type: 'integer', default: 0 })
  totalOperatingHours!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

