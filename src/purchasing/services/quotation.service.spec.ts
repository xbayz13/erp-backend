import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { Quotation, QuotationStatus } from '../entities/quotation.entity';
import { QuotationService } from './quotation.service';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { RFQ, RFQStatus } from '../entities/rfq.entity';
import { Supplier } from '../entities/supplier.entity';
import { Item } from '../../inventory/entities/item.entity';

describe('QuotationService', () => {
  let service: QuotationService;
  let quotationRepository: jest.Mocked<Repository<Quotation>>;
  let rfqRepository: jest.Mocked<Repository<RFQ>>;
  let supplierRepository: jest.Mocked<Repository<Supplier>>;
  let inventoryService: jest.Mocked<InventoryService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationService,
        {
          provide: getRepositoryToken(Quotation),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RFQ),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: {
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

    service = module.get<QuotationService>(QuotationService);
    quotationRepository = module.get(getRepositoryToken(Quotation));
    rfqRepository = module.get(getRepositoryToken(RFQ));
    supplierRepository = module.get(getRepositoryToken(Supplier));
    inventoryService = module.get(InventoryService);
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new quotation', async () => {
      const dto: CreateQuotationDto = {
        rfqId: 'rfq-1',
        supplierId: 'supplier-1',
        items: [
          {
            itemId: 'item-1',
            quantity: 100,
            unitPrice: 10000,
            deliveryDays: 7,
          },
        ],
        validUntil: '2024-12-31',
        terms: 'Net 30',
        notes: 'Test quotation',
      };

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

      const mockQuotation: Quotation = {
        id: 'q1',
        rfqId: dto.rfqId,
        rfq: mockRFQ,
        supplierId: dto.supplierId,
        supplier: mockSupplier,
        status: QuotationStatus.DRAFT,
        items: [
          {
            itemId: 'item-1',
            itemSku: 'SKU001',
            itemName: 'Test Item',
            quantity: 100,
            unitPrice: 10000,
            totalPrice: 1000000,
            deliveryDays: 7,
          },
        ],
        totalAmount: 1000000,
        validUntil: new Date(dto.validUntil!),
        terms: dto.terms,
        notes: dto.notes,
        submittedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      rfqRepository.findOne.mockResolvedValue(mockRFQ);
      supplierRepository.findOne.mockResolvedValue(mockSupplier);
      inventoryService.getItemById.mockResolvedValue(mockItem);
      quotationRepository.create.mockReturnValue(mockQuotation as any);
      quotationRepository.save.mockResolvedValue(mockQuotation);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockQuotation);
      expect(rfqRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.rfqId },
      });
      expect(supplierRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.supplierId },
      });
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if RFQ not found', async () => {
      const dto: CreateQuotationDto = {
        rfqId: 'invalid-rfq',
        supplierId: 'supplier-1',
        items: [
          {
            itemId: 'item-1',
            quantity: 100,
            unitPrice: 10000,
          },
        ],
      };

      rfqRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        'RFQ invalid-rfq not found',
      );
    });
  });

  describe('submit', () => {
    it('should submit a quotation', async () => {
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

      const mockQuotation: Quotation = {
        id: 'q1',
        rfqId: 'rfq-1',
        rfq: mockRFQ,
        supplierId: 'supplier-1',
        supplier: mockSupplier,
        status: QuotationStatus.DRAFT,
        items: [],
        totalAmount: 1000,
        submittedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedQuotation = {
        ...mockQuotation,
        status: QuotationStatus.SUBMITTED,
      };

      quotationRepository.findOne.mockResolvedValue(mockQuotation);
      quotationRepository.save.mockResolvedValue(updatedQuotation as Quotation);

      const result = await service.submit('q1', 'user-1');

      expect(result.status).toBe(QuotationStatus.SUBMITTED);
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('accept', () => {
    it('should accept a quotation', async () => {
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

      const mockQuotation: Quotation = {
        id: 'q1',
        rfqId: 'rfq-1',
        rfq: mockRFQ,
        supplierId: 'supplier-1',
        supplier: mockSupplier,
        status: QuotationStatus.SUBMITTED,
        items: [],
        totalAmount: 1000,
        submittedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedQuotation = {
        ...mockQuotation,
        status: QuotationStatus.ACCEPTED,
      };

      quotationRepository.findOne.mockResolvedValue(mockQuotation);
      quotationRepository.save.mockResolvedValue(updatedQuotation as Quotation);

      const result = await service.accept('q1', 'user-1');

      expect(result.status).toBe(QuotationStatus.ACCEPTED);
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('should reject a quotation', async () => {
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

      const mockQuotation: Quotation = {
        id: 'q1',
        rfqId: 'rfq-1',
        rfq: mockRFQ,
        supplierId: 'supplier-1',
        supplier: mockSupplier,
        status: QuotationStatus.SUBMITTED,
        items: [],
        totalAmount: 1000,
        submittedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedQuotation = {
        ...mockQuotation,
        status: QuotationStatus.REJECTED,
      };

      quotationRepository.findOne.mockResolvedValue(mockQuotation);
      quotationRepository.save.mockResolvedValue(updatedQuotation as Quotation);

      const result = await service.reject('q1', 'user-1');

      expect(result.status).toBe(QuotationStatus.REJECTED);
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });
});

