import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  actorId!: string;

  @Column()
  action!: string;

  @Column()
  entity!: string;

  @Column({ nullable: true })
  entityId?: string;

  @Column({ type: 'jsonb', nullable: true })
  before?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  after?: Record<string, unknown> | null;

  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}


