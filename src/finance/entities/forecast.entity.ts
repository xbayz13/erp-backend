import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ForecastType {
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  CASH_FLOW = 'CASH_FLOW',
}

@Entity({ name: 'forecasts' })
export class Forecast {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: ForecastType })
  type!: ForecastType;

  @Column({ type: 'timestamptz' })
  forecastDate!: Date; // Date being forecasted

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  forecastedAmount!: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  actualAmount?: number; // Actual amount when available

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  confidenceLevel?: number; // 0-100 percentage

  @Column({ nullable: true })
  method?: string; // Forecasting method used

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

