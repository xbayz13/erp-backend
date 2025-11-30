import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'items' })
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  sku!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'warehouse_id' })
  warehouseId!: string;

  @Column({ type: 'integer', default: 0 })
  quantityOnHand!: number;

  @Column({ type: 'integer', default: 0 })
  reorderLevel!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  unitCost!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}


