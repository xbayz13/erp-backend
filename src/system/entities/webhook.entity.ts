import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum WebhookEventType {
  ITEM_CREATED = 'ITEM_CREATED',
  ITEM_UPDATED = 'ITEM_UPDATED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  CUSTOM = 'CUSTOM',
}

export enum WebhookStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

@Entity({ name: 'webhooks' })
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  url!: string;

  @Column({ type: 'enum', enum: WebhookEventType })
  eventType!: WebhookEventType;

  @Column({ type: 'enum', enum: WebhookStatus, default: WebhookStatus.PENDING })
  status!: WebhookStatus;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ nullable: true })
  secret?: string;

  @Column({ type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ type: 'integer', default: 3 })
  maxRetries!: number;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  responseCode?: number;

  @Column({ type: 'jsonb', nullable: true })
  responseBody?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;
}

