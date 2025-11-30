import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface Operation {
  operationNumber: number;
  workCenterId: string;
  workCenterName: string;
  operationName: string;
  setupTime: number; // Minutes
  runTime: number; // Minutes per unit
  queueTime: number; // Minutes
  moveTime: number; // Minutes
  notes?: string;
}

@Entity({ name: 'routings' })
export class Routing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  code!: string;

  @Column()
  productItemId!: string; // Finished good item

  @Column({ type: 'jsonb' })
  operations!: Operation[];

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  totalTime!: number; // Total time in minutes

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  totalCost!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  version?: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

