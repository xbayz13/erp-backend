import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IntegrationType {
  WEBHOOK = 'WEBHOOK',
  REST_API = 'REST_API',
  SOAP = 'SOAP',
  CUSTOM = 'CUSTOM',
}

export enum IntegrationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
}

@Entity({ name: 'integrations' })
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({ type: 'enum', enum: IntegrationType })
  type!: IntegrationType;

  @Column({ type: 'enum', enum: IntegrationStatus, default: IntegrationStatus.INACTIVE })
  status!: IntegrationStatus;

  @Column({ type: 'jsonb' })
  configuration!: Record<string, any>;

  @Column({ nullable: true })
  endpoint?: string;

  @Column({ nullable: true })
  apiKey?: string;

  @Column({ type: 'jsonb', nullable: true })
  headers?: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  mappings?: Record<string, string>;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  lastSyncAt?: Date;

  @Column({ nullable: true })
  lastError?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

