import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Supplier } from '../entities/supplier.entity';
import { PurchaseOrder, PurchaseOrderStatus } from '../entities/purchase-order.entity';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';

describe('SupplierService', () => {
  let service: SupplierService;
  let supplierRepository: jest.Mocked<Repository<Supplier>>;
  let purchaseOrderRepository: jest.Mocked<Repository<PurchaseOrder>>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: {
            find: jest.fn(),
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

    service = module.get<SupplierService>(SupplierService);
    supplierRepository = module.get(getRepositoryToken(Supplier));
    purchaseOrderRepository = module.get(getRepositoryToken(PurchaseOrder));
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new supplier', async () => {
      const dto: CreateSupplierDto = {
        code: 'SUP-001',
        name: 'Supplier ABC',
        contactPerson: 'John Doe',
        email: 'john@supplier.com',
        phone: '123456789',
        address: '123 Main St',
        rating: 4.5,
        paymentTerms: 'Net 30',
        notes: 'Test supplier',
      };

      const mockSupplier: Supplier = {
        id: 'supplier-1',
        code: dto.code,
        name: dto.name,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        rating: dto.rating!,
        paymentTerms: dto.paymentTerms,
        notes: dto.notes,
        onTimeDeliveryRate: 0,
        qualityScore: 0,
        totalOrders: 0,
        completedOrders: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      supplierRepository.findOne.mockResolvedValue(null);
      supplierRepository.create.mockReturnValue(mockSupplier as any);
      supplierRepository.save.mockResolvedValue(mockSupplier);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockSupplier);
      expect(supplierRepository.findOne).toHaveBeenCalledWith({
        where: { code: dto.code },
      });
      expect(supplierRepository.create).toHaveBeenCalled();
      expect(supplierRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if supplier code already exists', async () => {
      const dto: CreateSupplierDto = {
        code: 'SUP-001',
        name: 'Supplier ABC',
      };

      const existing: Supplier = {
        id: 'existing',
        code: 'SUP-001',
        name: 'Existing Supplier',
        rating: 0,
        onTimeDeliveryRate: 0,
        qualityScore: 0,
        totalOrders: 0,
        completedOrders: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      supplierRepository.findOne.mockResolvedValue(existing);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        'Supplier with code SUP-001 already exists',
      );
    });
  });

  describe('list', () => {
    it('should return all suppliers', async () => {
      const mockSuppliers: Supplier[] = [
        {
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
        },
      ];

      supplierRepository.find.mockResolvedValue(mockSuppliers);

      const result = await service.list();

      expect(result).toEqual(mockSuppliers);
      expect(supplierRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('updatePerformanceMetrics', () => {
    it('should update supplier performance metrics', async () => {
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

      const mockOrders: PurchaseOrder[] = [
        {
          id: 'po-1',
          supplierName: 'Supplier ABC',
          reference: 'PO-001',
          status: PurchaseOrderStatus.RECEIVED,
          expectedDate: new Date('2024-01-01'),
          items: [],
          totalCost: 1000,
          createdBy: 'user-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'po-2',
          supplierName: 'Supplier ABC',
          reference: 'PO-002',
          status: PurchaseOrderStatus.RECEIVED,
          expectedDate: new Date('2024-01-02'),
          items: [],
          totalCost: 2000,
          createdBy: 'user-1',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-01'), // On time
        },
      ];

      supplierRepository.findOne.mockResolvedValue(mockSupplier);
      purchaseOrderRepository.find.mockResolvedValue(mockOrders);
      supplierRepository.save.mockResolvedValue({
        ...mockSupplier,
        totalOrders: 2,
        completedOrders: 2,
        onTimeDeliveryRate: 50,
      } as Supplier);

      const result = await service.updatePerformanceMetrics('supplier-1');

      expect(result.totalOrders).toBe(2);
      expect(result.completedOrders).toBe(2);
      expect(result.onTimeDeliveryRate).toBe(50);
    });
  });

  describe('getPerformanceAnalytics', () => {
    it('should return supplier performance analytics', async () => {
      const mockSupplier: Supplier = {
        id: 'supplier-1',
        code: 'SUP-001',
        name: 'Supplier ABC',
        rating: 4.5,
        onTimeDeliveryRate: 80,
        qualityScore: 85,
        priceCompetitiveness: 75,
        totalOrders: 10,
        completedOrders: 8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedSupplier = {
        ...mockSupplier,
        onTimeDeliveryRate: 80,
        qualityScore: 85,
        priceCompetitiveness: 75,
        totalOrders: 10,
        completedOrders: 8,
      };

      supplierRepository.findOne.mockResolvedValue(mockSupplier);
      purchaseOrderRepository.find.mockResolvedValue([]);
      supplierRepository.save.mockResolvedValue(updatedSupplier);

      const result = await service.getPerformanceAnalytics('supplier-1');

      expect(result.supplier).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.onTimeDeliveryRate).toBe(80);
      expect(result.metrics.qualityScore).toBe(85);
      expect(result.metrics.completionRate).toBe(80);
    });
  });

  describe('getRankings', () => {
    it('should return supplier rankings', async () => {
      const mockSuppliers: Supplier[] = [
        {
          id: 'supplier-1',
          code: 'SUP-001',
          name: 'Supplier ABC',
          rating: 4.5,
          onTimeDeliveryRate: 80,
          qualityScore: 85,
          priceCompetitiveness: 75,
          totalOrders: 10,
          completedOrders: 8,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      supplierRepository.find.mockResolvedValue(mockSuppliers);
      supplierRepository.findOne.mockResolvedValue(mockSuppliers[0]);
      purchaseOrderRepository.find.mockResolvedValue([]);
      supplierRepository.save.mockResolvedValue(mockSuppliers[0]);

      const result = await service.getRankings();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

