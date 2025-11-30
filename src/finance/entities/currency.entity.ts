import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'currencies' })
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 3 })
  code!: string; // ISO 4217 code (USD, IDR, etc.)

  @Column()
  name!: string;

  @Column({ type: 'varchar', length: 10, default: '1' })
  symbol!: string;

  @Column({ type: 'integer', default: 0 })
  decimalPlaces!: number;

  @Column({ default: false })
  isBaseCurrency!: boolean; // Base currency for the system

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

