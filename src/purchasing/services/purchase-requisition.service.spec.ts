import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import {
  PurchaseRequisition,
  PurchaseRequisitionStatus,
} from '../entities/purchase-requisition.entity';
import { PurchaseRequisitionService } from './purchase-requisition.service';
import { CreatePurchaseRequisitionDto } from '../dto/create-purchase-requisition.dto';
import { Item } from '../../inventory/entities/item.entity';

describe('PurchaseRequisitionService', () => {
  let service: PurchaseRequisitionService;
  let prRepository: jest.Mocked<Repository<PurchaseRequisition>>;
  let inventoryService: jest.Mocked<InventoryService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequisitionService,
        {
          provide: getRepositoryToken(PurchaseRequisition),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: InventoryService,
          useValue: {
            getItemById: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            record: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PurchaseRequisitionService>(PurchaseRequisitionService);
    prRepository = module.get(getRepositoryToken(PurchaseRequisition));
    inventoryService = module.get(InventoryService);
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new purchase requisition', async () => {
      const dto: CreatePurchaseRequisitionDto = {
        reference: 'PR-001',
        items: [
          {
            itemId: 'item-1',
            quantity: 100,
            unitCost: 10000,
            warehouseId: 'warehouse-1',
          },
        ],
        department: 'IT',
        notes: 'Test PR',
      };

      const mockItem: Item = {
        id: 'item-1',
        sku: 'SKU001',
        name: 'Test Item',
        warehouseId: 'warehouse-1',
        quantityOnHand: 50,
        reorderLevel: 20,
        unitCost: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPR: PurchaseRequisition = {
        id: 'pr-1',
        reference: dto.reference,
        status: PurchaseRequisitionStatus.DRAFT,
        items: [
          {
            itemId: 'item-1',
            itemSku: 'SKU001',
            itemName: 'Test Item',
            quantity: 100,
            unitCost: 10000,
            warehouseId: 'warehouse-1',
          },
        ],
        totalAmount: 1000000,
        requestedBy: 'user-1',
        department: dto.department,
        notes: dto.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inventoryService.getItemById.mockResolvedValue(mockItem);
      prRepository.create.mockReturnValue(mockPR as any);
      prRepository.save.mockResolvedValue(mockPR);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockPR);
      expect(inventoryService.getItemById).toHaveBeenCalledWith('item-1');
      expect(prRepository.create).toHaveBeenCalled();
      expect(prRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if item not found', async () => {
      const dto: CreatePurchaseRequisitionDto = {
        reference: 'PR-001',
        items: [
          {
            itemId: 'invalid-item',
            quantity: 100,
            unitCost: 10000,
            warehouseId: 'warehouse-1',
          },
        ],
      };

      inventoryService.getItemById.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        'Item invalid-item not found',
      );
    });
  });

  describe('submit', () => {
    it('should submit a purchase requisition', async () => {
      const mockPR: PurchaseRequisition = {
        id: 'pr-1',
        reference: 'PR-001',
        status: PurchaseRequisitionStatus.DRAFT,
        items: [],
        totalAmount: 1000,
        requestedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedPR = {
        ...mockPR,
        status: PurchaseRequisitionStatus.PENDING_APPROVAL,
      };

      prRepository.findOne.mockResolvedValue(mockPR);
      prRepository.save.mockResolvedValue(updatedPR as PurchaseRequisition);

      const result = await service.submit('pr-1', 'user-1');

      expect(result.status).toBe(PurchaseRequisitionStatus.PENDING_APPROVAL);
      expect(prRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if PR not found', async () => {
      prRepository.findOne.mockResolvedValue(null);

      await expect(service.submit('invalid-id', 'user-1')).rejects.toThrow(
        'Purchase Requisition invalid-id not found',
      );
    });
  });

  describe('approve', () => {
    it('should approve a purchase requisition', async () => {
      const mockPR: PurchaseRequisition = {
        id: 'pr-1',
        reference: 'PR-001',
        status: PurchaseRequisitionStatus.PENDING_APPROVAL,
        items: [],
        totalAmount: 1000,
        requestedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedPR = {
        ...mockPR,
        status: PurchaseRequisitionStatus.APPROVED,
        approvalHistory: [
          {
            approverId: 'approver-1',
            approverName: 'Manager',
            status: PurchaseRequisitionStatus.APPROVED,
            comments: 'Approved',
            approvedAt: new Date(),
          },
        ],
      };

      prRepository.findOne.mockResolvedValue(mockPR);
      prRepository.save.mockResolvedValue(updatedPR as PurchaseRequisition);

      const result = await service.approve('pr-1', 'approver-1', 'Manager', 'Approved');

      expect(result.status).toBe(PurchaseRequisitionStatus.APPROVED);
      expect(result.approvalHistory).toBeDefined();
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('should reject a purchase requisition', async () => {
      const mockPR: PurchaseRequisition = {
        id: 'pr-1',
        reference: 'PR-001',
        status: PurchaseRequisitionStatus.PENDING_APPROVAL,
        items: [],
        totalAmount: 1000,
        requestedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedPR = {
        ...mockPR,
        status: PurchaseRequisitionStatus.REJECTED,
        rejectionReason: 'Budget exceeded',
        approvalHistory: [
          {
            approverId: 'approver-1',
            approverName: 'Manager',
            status: PurchaseRequisitionStatus.REJECTED,
            comments: 'Budget exceeded',
            approvedAt: new Date(),
          },
        ],
      };

      prRepository.findOne.mockResolvedValue(mockPR);
      prRepository.save.mockResolvedValue(updatedPR as PurchaseRequisition);

      const result = await service.reject('pr-1', 'approver-1', 'Manager', 'Budget exceeded');

      expect(result.status).toBe(PurchaseRequisitionStatus.REJECTED);
      expect(result.rejectionReason).toBe('Budget exceeded');
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return all purchase requisitions', async () => {
      const mockPRs: PurchaseRequisition[] = [
        {
          id: 'pr-1',
          reference: 'PR-001',
          status: PurchaseRequisitionStatus.DRAFT,
          items: [],
          totalAmount: 1000,
          requestedBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prRepository.find.mockResolvedValue(mockPRs);

      const result = await service.list();

      expect(result).toEqual(mockPRs);
    });

    it('should filter by status', async () => {
      const mockPRs: PurchaseRequisition[] = [
        {
          id: 'pr-1',
          reference: 'PR-001',
          status: PurchaseRequisitionStatus.PENDING_APPROVAL,
          items: [],
          totalAmount: 1000,
          requestedBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prRepository.find.mockResolvedValue(mockPRs);

      const result = await service.list(PurchaseRequisitionStatus.PENDING_APPROVAL);

      expect(result).toEqual(mockPRs);
      expect(prRepository.find).toHaveBeenCalledWith({
        where: { status: PurchaseRequisitionStatus.PENDING_APPROVAL },
        order: { createdAt: 'DESC' },
      });
    });
  });
});

