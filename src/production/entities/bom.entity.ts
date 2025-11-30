import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface BOMItem {
  itemId: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  unitOfMeasure: string;
  level: number; // Level in BOM hierarchy
  parentItemId?: string; // For multi-level BOM
  notes?: string;
}

@Entity({ name: 'boms' })
export class BOM {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  code!: string;

  @Column()
  productItemId!: string; // Finished good item

  @Column({ type: 'jsonb' })
  items!: BOMItem[];

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalCost!: number;

  @Column({ type: 'integer', default: 1 })
  quantity!: number; // Quantity of finished good this BOM produces

  @Column({ type: 'integer', default: 1 })
  level!: number; // BOM level (1 = single level, >1 = multi-level)

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

