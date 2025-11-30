import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PurchaseRequisitionStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseRequisitionItem {
  itemId: string;
  itemSku: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  warehouseId: string;
  notes?: string;
}

export interface ApprovalHistory {
  approverId: string;
  approverName: string;
  status: PurchaseRequisitionStatus;
  comments?: string;
  approvedAt: Date;
}

@Entity({ name: 'purchase_requisitions' })
export class PurchaseRequisition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  reference!: string;

  @Column({ type: 'enum', enum: PurchaseRequisitionStatus, default: PurchaseRequisitionStatus.DRAFT })
  status!: PurchaseRequisitionStatus;

  @Column({ type: 'jsonb' })
  items!: PurchaseRequisitionItem[];

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalAmount!: number;

  @Column()
  requestedBy!: string;

  @Column({ nullable: true })
  requestedByName?: string;

  @Column({ nullable: true })
  department?: string;

  @Column({ type: 'jsonb', nullable: true })
  approvalHistory?: ApprovalHistory[];

  @Column({ nullable: true })
  currentApproverId?: string;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

