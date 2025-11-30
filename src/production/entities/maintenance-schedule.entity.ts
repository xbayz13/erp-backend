import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  EMERGENCY = 'EMERGENCY',
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'maintenance_schedules' })
export class MaintenanceSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  equipmentId!: string;

  @Column({ type: 'enum', enum: MaintenanceType })
  type!: MaintenanceType;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED })
  status!: MaintenanceStatus;

  @Column({ type: 'timestamptz' })
  scheduledDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedDate?: Date;

  @Column({ type: 'integer', nullable: true })
  intervalDays?: number; // For recurring maintenance

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  estimatedCost?: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  actualCost?: number;

  @Column({ nullable: true })
  technicianId?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

