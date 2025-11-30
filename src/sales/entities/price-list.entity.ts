import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PriceListType {
  STANDARD = 'STANDARD',
  CUSTOMER_SPECIFIC = 'CUSTOMER_SPECIFIC',
  VOLUME_BASED = 'VOLUME_BASED',
  PROMOTIONAL = 'PROMOTIONAL',
}

export interface PriceListItem {
  itemId: string;
  itemSku: string;
  itemName: string;
  unitPrice: number;
  minQuantity?: number;
  maxQuantity?: number;
  validFrom?: Date;
  validUntil?: Date;
}

@Entity({ name: 'price_lists' })
export class PriceList {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: PriceListType, default: PriceListType.STANDARD })
  type!: PriceListType;

  @Column({ nullable: true })
  customerId?: string; // For customer-specific pricing

  @Column({ type: 'jsonb' })
  items!: PriceListItem[];

  @Column({ type: 'timestamptz', nullable: true })
  validFrom?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

