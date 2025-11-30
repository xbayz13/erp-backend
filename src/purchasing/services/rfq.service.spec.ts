import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { RFQ, RFQStatus } from '../entities/rfq.entity';
import { RFQService } from './rfq.service';
import { CreateRFQDto } from '../dto/create-rfq.dto';
import { Item } from '../../inventory/entities/item.entity';
import { Quotation, QuotationStatus } from '../entities/quotation.entity';
import { Supplier } from '../entities/supplier.entity';

describe('RFQService', () => {
  let service: RFQService;
  let rfqRepository: jest.Mocked<Repository<RFQ>>;
  let inventoryService: jest.Mocked<InventoryService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RFQService,
        {
          provide: getRepositoryToken(RFQ),
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

    service = module.get<RFQService>(RFQService);
    rfqRepository = module.get(getRepositoryToken(RFQ));
    inventoryService = module.get(InventoryService);
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new RFQ', async () => {
      const dto: CreateRFQDto = {
        reference: 'RFQ-001',
        items: [
          {
            itemId: 'item-1',
            quantity: 100,
            specifications: 'High quality',
          },
        ],
        deadline: '2024-12-31',
        notes: 'Test RFQ',
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

      const mockRFQ: RFQ = {
        id: 'rfq-1',
        reference: dto.reference,
        status: RFQStatus.DRAFT,
        items: [
          {
            itemId: 'item-1',
            itemSku: 'SKU001',
            itemName: 'Test Item',
            quantity: 100,
            specifications: 'High quality',
          },
        ],
        deadline: new Date(dto.deadline),
        createdBy: 'user-1',
        notes: dto.notes,
        quotations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inventoryService.getItemById.mockResolvedValue(mockItem);
      rfqRepository.create.mockReturnValue(mockRFQ as any);
      rfqRepository.save.mockResolvedValue(mockRFQ);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockRFQ);
      expect(inventoryService.getItemById).toHaveBeenCalledWith('item-1');
      expect(rfqRepository.create).toHaveBeenCalled();
      expect(rfqRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('send', () => {
    it('should send an RFQ', async () => {
      const mockRFQ: RFQ = {
        id: 'rfq-1',
        reference: 'RFQ-001',
        status: RFQStatus.DRAFT,
        items: [],
        deadline: new Date(),
        createdBy: 'user-1',
        quotations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedRFQ = {
        ...mockRFQ,
        status: RFQStatus.SENT,
      };

      rfqRepository.findOne.mockResolvedValue(mockRFQ);
      rfqRepository.save.mockResolvedValue(updatedRFQ as RFQ);

      const result = await service.send('rfq-1', 'user-1');

      expect(result.status).toBe(RFQStatus.SENT);
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close an RFQ', async () => {
      const mockRFQ: RFQ = {
        id: 'rfq-1',
        reference: 'RFQ-001',
        status: RFQStatus.SENT,
        items: [],
        deadline: new Date(),
        createdBy: 'user-1',
        quotations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedRFQ = {
        ...mockRFQ,
        status: RFQStatus.CLOSED,
        closedAt: new Date(),
      };

      rfqRepository.findOne.mockResolvedValue(mockRFQ);
      rfqRepository.save.mockResolvedValue(updatedRFQ as RFQ);

      const result = await service.close('rfq-1', 'user-1');

      expect(result.status).toBe(RFQStatus.CLOSED);
      expect(result.closedAt).toBeDefined();
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('getComparisonMatrix', () => {
    it('should return comparison matrix for RFQ', async () => {
      const mockSupplier: Supplier = {
        id: 'supplier-1',
        code: 'SUP-001',
        name: 'Supplier ABC',
        rating: 4.5,
        onTimeDeliveryRate: 0,
        qualityScore: 0,
        totalOrders: 0,
        completedOrders: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRFQForQuotations: RFQ = {
        id: 'rfq-1',
        reference: 'RFQ-001',
        status: RFQStatus.SENT,
        items: [],
        deadline: new Date(),
        createdBy: 'user-1',
        quotations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuotations: Quotation[] = [
        {
          id: 'q1',
          rfqId: 'rfq-1',
          rfq: mockRFQForQuotations,
          supplierId: 'supplier-1',
          supplier: mockSupplier,
          status: QuotationStatus.SUBMITTED,
          items: [
            {
              itemId: 'item-1',
              itemSku: 'SKU001',
              itemName: 'Item 1',
              quantity: 100,
              unitPrice: 10000,
              totalPrice: 1000000,
            },
          ],
          totalAmount: 1000000,
          submittedBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockRFQ: RFQ = {
        id: 'rfq-1',
        reference: 'RFQ-001',
        status: RFQStatus.SENT,
        items: [],
        deadline: new Date(),
        createdBy: 'user-1',
        quotations: mockQuotations,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      rfqRepository.findOne.mockResolvedValue(mockRFQ);

      const result = await service.getComparisonMatrix('rfq-1');

      expect(result).toBeDefined();
      expect(result.rfq).toEqual(mockRFQ);
      expect(result.quotations).toBeDefined();
      expect(result.comparison).toBeDefined();
    });
  });
});

