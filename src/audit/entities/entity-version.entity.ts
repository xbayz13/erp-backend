import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'entity_versions' })
export class EntityVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  entityType!: string;

  @Column()
  entityId!: string;

  @Column({ type: 'integer' })
  version!: number;

  @Column({ type: 'jsonb' })
  data!: Record<string, any>;

  @Column()
  changedBy!: string;

  @Column({ nullable: true })
  reason?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  changedAt!: Date;
}

