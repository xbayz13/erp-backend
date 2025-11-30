import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'two_factor_auth' })
export class TwoFactorAuth {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  userId!: string;

  @Column()
  secret!: string; // TOTP secret

  @Column({ default: false })
  isEnabled!: boolean;

  @Column({ type: 'simple-array', nullable: true })
  backupCodes?: string[]; // Backup codes for recovery

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

