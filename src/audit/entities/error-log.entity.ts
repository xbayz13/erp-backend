import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'error_logs' })
export class ErrorLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  context!: string;

  @Column()
  message!: string;

  @Column({ nullable: true })
  stack?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}


