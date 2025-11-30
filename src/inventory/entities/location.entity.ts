import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';

@Entity({ name: 'locations' })
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ name: 'warehouse_id' })
  warehouseId!: string;

  @ManyToOne(() => Warehouse)
  warehouse!: Warehouse;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne(() => Location, (location) => location.children, { nullable: true })
  parent?: Location;

  @OneToMany(() => Location, (location) => location.parent)
  children!: Location[];

  @Column({ type: 'enum', enum: ['WAREHOUSE', 'ZONE', 'BIN', 'SHELF'], default: 'BIN' })
  type!: 'WAREHOUSE' | 'ZONE' | 'BIN' | 'SHELF';

  @Column({ nullable: true })
  code?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  capacity?: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

