import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WorkflowStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface WorkflowStep {
  stepNumber: number;
  approverRole: string;
  approverId?: string;
  status: WorkflowStatus;
  action?: 'APPROVE' | 'REJECT';
  comments?: string;
  actionDate?: Date;
}

@Entity({ name: 'workflow_instances' })
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  workflowId!: string;

  @Column()
  entityType!: string;

  @Column()
  entityId!: string;

  @Column({ type: 'enum', enum: WorkflowStatus, default: WorkflowStatus.PENDING })
  status!: WorkflowStatus;

  @Column({ type: 'jsonb' })
  steps!: WorkflowStep[];

  @Column({ type: 'integer' })
  currentStep!: number;

  @Column()
  initiatedBy!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

