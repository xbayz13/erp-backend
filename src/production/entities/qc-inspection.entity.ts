import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum QCStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

export interface QualityCheck {
  checkName: string;
  standard: string;
  actual: string;
  result: 'PASS' | 'FAIL';
  notes?: string;
}

@Entity({ name: 'qc_inspections' })
export class QCInspection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @Column()
  productionOrderId!: string;

  @Column()
  itemId!: string;

  @Column({ type: 'integer' })
  quantityInspected!: number;

  @Column({ type: 'integer', default: 0 })
  quantityPassed!: number;

  @Column({ type: 'integer', default: 0 })
  quantityFailed!: number;

  @Column({ type: 'enum', enum: QCStatus, default: QCStatus.PENDING })
  status!: QCStatus;

  @Column({ type: 'jsonb' })
  checks!: QualityCheck[];

  @Column({ nullable: true })
  inspectorId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  inspectedAt?: Date;

  @Column({ nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

