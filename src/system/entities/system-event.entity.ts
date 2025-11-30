import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'system_events' })
export class SystemEventLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventType!: string;

  @Column()
  entityType!: string;

  @Column()
  entityId!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ nullable: true })
  userId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp!: Date;
}

