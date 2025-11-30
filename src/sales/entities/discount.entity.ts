import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum DiscountScope {
  ITEM = 'ITEM',
  ORDER = 'ORDER',
  CUSTOMER = 'CUSTOMER',
}

@Entity({ name: 'discounts' })
export class Discount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  code!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: DiscountType })
  type!: DiscountType;

  @Column({ type: 'enum', enum: DiscountScope })
  scope!: DiscountScope;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  value!: number; // Percentage or fixed amount

  @Column({ nullable: true })
  itemId?: string; // For item-specific discount

  @Column({ nullable: true })
  customerId?: string; // For customer-specific discount

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  minOrderAmount?: number;

  @Column({ type: 'integer', nullable: true })
  minQuantity?: number;

  @Column({ type: 'timestamptz' })
  validFrom!: Date;

  @Column({ type: 'timestamptz' })
  validUntil!: Date;

  @Column({ type: 'integer', nullable: true })
  maxUses?: number;

  @Column({ type: 'integer', default: 0 })
  usedCount!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

