import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Item } from './item.entity';

@Entity({ name: 'batches' })
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  batchNumber!: string;

  @Column({ name: 'item_id' })
  itemId!: string;

  @ManyToOne(() => Item)
  item!: Item;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ type: 'timestamptz', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'timestamptz' })
  productionDate!: Date;

  @Column({ nullable: true })
  supplierBatchNumber?: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

