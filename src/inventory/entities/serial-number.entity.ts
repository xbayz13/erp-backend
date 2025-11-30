import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Item } from './item.entity';

@Entity({ name: 'serial_numbers' })
export class SerialNumber {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  serialNumber!: string;

  @Column({ name: 'item_id' })
  itemId!: string;

  @ManyToOne(() => Item)
  item!: Item;

  @Column({ name: 'warehouse_id' })
  warehouseId!: string;

  @Column({ type: 'timestamptz', nullable: true })
  warrantyStartDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  warrantyEndDate?: Date;

  @Column({ nullable: true })
  status?: string; // AVAILABLE, IN_USE, SOLD, RETURNED, DEFECTIVE

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

