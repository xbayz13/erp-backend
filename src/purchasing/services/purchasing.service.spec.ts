import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { PurchaseOrder, PurchaseOrderStatus } from '../entities/purchase-order.entity';
import { PurchasingService } from './purchasing.service';

describe('PurchasingService', () => {
  let service: PurchasingService;
  let purchaseOrderRepository: jest.Mocked<Repository<PurchaseOrder>>;
  let inventoryService: jest.Mocked<InventoryService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasingService,
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: InventoryService,
          useValue: {
            recordStockMovement: jest.fn(),
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

    service = module.get<PurchasingService>(PurchasingService);
    purchaseOrderRepository = module.get(getRepositoryToken(PurchaseOrder));
    inventoryService = module.get(InventoryService);
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new purchase order', async () => {
      const createDto = {
        supplierName: 'Supplier ABC',
        reference: 'PO-001',
        expectedDate: new Date().toISOString(),
        items: [
          {
            itemId: 'item-1',
            warehouseId: 'warehouse-1',
            quantity: 100,
            unitCost: 10000,
          },
        ],
      };

      const mockPO: PurchaseOrder = {
        id: 'po-1',
        supplierName: createDto.supplierName,
        reference: createDto.reference,
        expectedDate: new Date(createDto.expectedDate),
        status: PurchaseOrderStatus.DRAFT,
        totalCost: 1000000,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        items: createDto.items,
      };

      purchaseOrderRepository.create.mockReturnValue(mockPO as any);
      purchaseOrderRepository.save.mockResolvedValue(mockPO);

      const result = await service.create(createDto, 'user-1');

      expect(result).toBeDefined();
      expect(result.supplierName).toBe(createDto.supplierName);
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return an array of purchase orders', async () => {
      const mockPOs: PurchaseOrder[] = [
        {
          id: 'po-1',
          supplierName: 'Supplier ABC',
          reference: 'PO-001',
          expectedDate: new Date(),
          status: PurchaseOrderStatus.DRAFT,
          totalCost: 1000000,
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
        },
      ];

      purchaseOrderRepository.find.mockResolvedValue(mockPOs);

      const result = await service.list();

      expect(result).toEqual(mockPOs);
      expect(purchaseOrderRepository.find).toHaveBeenCalled();
    });
  });
});

