import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DocumentType {
  INVOICE = 'INVOICE',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  SALES_ORDER = 'SALES_ORDER',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER',
}

@Entity({ name: 'documents' })
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  filename!: string;

  @Column()
  originalFilename!: string;

  @Column()
  mimeType!: string;

  @Column({ type: 'bigint' })
  size!: number; // Bytes

  @Column({ type: 'enum', enum: DocumentType })
  type!: DocumentType;

  @Column({ nullable: true })
  entityType?: string;

  @Column({ nullable: true })
  entityId?: string;

  @Column()
  storagePath!: string; // Path to file in storage

  @Column({ nullable: true })
  description?: string;

  @Column()
  uploadedBy!: string;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

