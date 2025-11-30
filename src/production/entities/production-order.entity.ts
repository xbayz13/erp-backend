import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductionStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  HALTED = 'HALTED',
}

export interface MaterialRequirement {
  itemId: string;
  warehouseId: string;
  quantity: number;
}

@Entity({ name: 'production_orders' })
export class ProductionOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  productItemId!: string;

  @Column({ type: 'integer' })
  quantityPlanned!: number;

  @Column({ type: 'integer', default: 0 })
  quantityCompleted!: number;

  @Column({ type: 'enum', enum: ProductionStatus, default: ProductionStatus.PLANNED })
  status!: ProductionStatus;

  @Column({ type: 'timestamptz' })
  scheduledStart!: Date;

  @Column({ type: 'timestamptz' })
  scheduledEnd!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  actualStart?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  actualEnd?: Date;

  @Column({ type: 'jsonb' })
  materials!: MaterialRequirement[];

  @Column()
  outputWarehouseId!: string;

  @Column()
  supervisorId!: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}


