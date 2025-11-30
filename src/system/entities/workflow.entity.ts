import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface WorkflowStepDefinition {
  stepNumber: number;
  approverRole: string;
  required: boolean;
}

@Entity({ name: 'workflows' })
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  entityType!: string;

  @Column({ type: 'jsonb' })
  steps!: WorkflowStepDefinition[];

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

