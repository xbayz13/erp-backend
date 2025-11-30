import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'work_centers' })
export class WorkCenter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  capacity!: number; // Hours per day

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  efficiency!: number; // Percentage (0-100)

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  hourlyRate!: number; // Cost per hour

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

